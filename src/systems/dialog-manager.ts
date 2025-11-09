import Phaser from 'phaser';
import type { DialogManagerConfig, DialogMessage, DialogData } from '../types/dialog';
import type { DialogBox } from '../components/dialog-box';

/**
 * DialogManager system - Manages dialog state and flow
 * 
 * Features:
 * - Open/close dialog boxes
 * - Player movement locking during dialog
 * - Dialog history tracking
 * - Input handling for dialog interactions
 */
export class DialogManager {
  private scene: Phaser.Scene;
  private player: any; // PlayerCharacter type
  private dialogBox: DialogBox;
  private dialogHistory: DialogMessage[] = [];
  private maxHistorySize: number;
  private activeEntity: any | null = null; // The entity currently in conversation
  private keys: {
    interact: Phaser.Input.Keyboard.Key[];
    close: Phaser.Input.Keyboard.Key;
  };

  constructor(config: DialogManagerConfig) {
    this.scene = config.scene;
    this.player = config.player;
    this.dialogBox = config.dialogBox;
    this.maxHistorySize = config.maxHistorySize ?? 50;

    // Setup input keys
    const keyboard = this.scene.input.keyboard;
    if (keyboard) {
      this.keys = {
        interact: [
          keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE),
          keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER),
        ],
        close: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC),
      };
    } else {
      throw new Error('DialogManager: Keyboard input not available');
    }
  }

  /**
   * Open dialog with content from an entity
   */
  public open(
    dialogData: DialogData,
    sourceType: 'npc' | 'object',
    sourceId: string,
    speakerName?: string | null,
    entity?: any
  ): void {
    if (this.isOpen()) {
      return;
    }

    const message = this.createMessage(dialogData, sourceType, sourceId, speakerName);
    this.dialogBox.show(message);
    this.lockPlayerMovement();
    this.addToHistory(message);

    // Store active entity and pause NPC movement if applicable
    this.activeEntity = entity ?? null;
    if (this.activeEntity && typeof this.activeEntity.pauseMovement === 'function') {
      this.activeEntity.pauseMovement();
      
      // Make NPC face the player
      if (typeof this.activeEntity.faceTowards === 'function') {
        this.activeEntity.faceTowards(this.player.x, this.player.y);
      }
    }
  }

  /**
   * Close the current dialog
   */
  public close(): void {
    if (!this.isOpen()) {
      return;
    }

    this.dialogBox.hide();
    this.unlockPlayerMovement();

    // Resume NPC movement if applicable
    if (this.activeEntity && typeof this.activeEntity.resumeMovement === 'function') {
      this.activeEntity.resumeMovement();
    }
    this.activeEntity = null;
  }

  /**
   * Check if dialog is currently open
   */
  public isOpen(): boolean {
    return this.dialogBox.isVisible();
  }

  /**
   * Handle input for dialog interactions
   */
  public handleInput(): void {
    if (this.isOpen()) {
      // Check for close keys
      if (this.isCloseKeyPressed() || this.isInteractKeyPressed()) {
        this.close();
      }
    }
  }

  /**
   * Get dialog history
   */
  public getHistory(): DialogMessage[] {
    return [...this.dialogHistory];
  }

  /**
   * Clear dialog history
   */
  public clearHistory(): void {
    this.dialogHistory = [];
  }

  /**
   * Create a dialog message from dialog data
   */
  private createMessage(
    dialogData: DialogData,
    sourceType: 'npc' | 'object',
    sourceId: string,
    speakerName?: string | null
  ): DialogMessage {
    let message: string;

    if (sourceType === 'npc' && dialogData.introduction) {
      message = dialogData.introduction;
    } else if (sourceType === 'object' && dialogData.description) {
      message = dialogData.description;
    } else {
      message = 'No dialog available.'; // Fallback
      console.warn(`DialogManager: No dialog content for ${sourceType} ${sourceId}`);
    }

    return {
      speaker: speakerName ?? null,
      message,
      type: sourceType,
      characterId: sourceType === 'npc' ? sourceId : null,
      objectId: sourceType === 'object' ? sourceId : null,
    };
  }

  /**
   * Lock player movement
   */
  private lockPlayerMovement(): void {
    if (this.player && typeof this.player.lockMovement === 'function') {
      this.player.lockMovement();
    } else {
      console.warn('DialogManager: Player does not have lockMovement method');
    }
  }

  /**
   * Unlock player movement
   */
  private unlockPlayerMovement(): void {
    if (this.player && typeof this.player.unlockMovement === 'function') {
      this.player.unlockMovement();
    }
  }

  /**
   * Add message to history
   */
  private addToHistory(message: DialogMessage): void {
    this.dialogHistory.push(message);
    
    // Trim history if it exceeds max size
    if (this.dialogHistory.length > this.maxHistorySize) {
      this.dialogHistory.shift();
    }
  }

  /**
   * Check if any interact key was just pressed
   */
  private isInteractKeyPressed(): boolean {
    return this.keys.interact.some(key => Phaser.Input.Keyboard.JustDown(key));
  }

  /**
   * Check if close key was just pressed
   */
  private isCloseKeyPressed(): boolean {
    return Phaser.Input.Keyboard.JustDown(this.keys.close);
  }

  /**
   * Destroy and clean up
   */
  public destroy(): void {
    this.dialogHistory = [];
  }
}
