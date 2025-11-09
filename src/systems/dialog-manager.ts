import Phaser from 'phaser';
import type { DialogManagerConfig, DialogMessage, DialogData, DialogTier } from '../types/dialog';
import type { DialogBox } from '../components/dialog-box';
import type { NotebookManager } from './notebook-manager';
import type { GameProgressionManager } from './game-progression-manager';
import type { CharacterDialogData, GamePhase } from '../types/progression';
import { validateCharacterDialogData, logValidationResult } from '../utils/validation';

/**
 * DialogManager system - Manages dialog state and flow
 * 
 * Features:
 * - Open/close dialog boxes
 * - Player movement locking during dialog
 * - Dialog history tracking
 * - Input handling for dialog interactions
 * - Automatic notebook recording for marked dialogs
 */
export class DialogManager {
  private scene: Phaser.Scene;
  private player: any; // PlayerCharacter type
  private dialogBox: DialogBox;
  private dialogHistory: DialogMessage[] = [];
  private maxHistorySize: number;
  private activeEntity: any | null = null; // The entity currently in conversation
  private notebookManager: NotebookManager | null = null;
  private progressionManager: GameProgressionManager | null = null;
  private dialogCache: Map<string, CharacterDialogData> = new Map();
  private currentNPCId: string | null = null;
  private currentTier: number = 0;
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
   * Set the notebook manager for automatic recording
   */
  public setNotebookManager(notebookManager: NotebookManager): void {
    this.notebookManager = notebookManager;
  }

  /**
   * Set the progression manager for phase-based dialog selection
   */
  public setProgressionManager(manager: GameProgressionManager): void {
    this.progressionManager = manager;
  }

  /**
   * Load character dialog data from JSON files
   */
  public loadCharacterDialogs(): void {
    const characters = ['valentin', 'emma', 'klaus', 'luca', 'marianne', 'sebastian'];
    
    characters.forEach(id => {
      try {
        const data = this.scene.cache.json.get(`dialog-${id}`);
        if (!data) {
          console.warn(`Dialog data not found for ${id}`);
          return;
        }

        const validationResult = validateCharacterDialogData(data, id);
        logValidationResult(`dialog-${id}.json`, validationResult);

        if (validationResult.valid) {
          this.dialogCache.set(id, data as CharacterDialogData);
        } else {
          console.error(`Failed to load dialog for ${id}:`, validationResult.errors);
        }
      } catch (error) {
        console.error(`Error loading dialog for ${id}:`, error);
      }
    });

    console.log(`✓ Loaded dialog data for ${this.dialogCache.size} characters`);
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

    // Use phase-based selection for NPCs if progression manager available
    let messageData = dialogData;
    if (sourceType === 'npc' && this.progressionManager) {
      const phase = this.progressionManager.getCurrentPhase();
      const tier = this.progressionManager.getDialogTier();
      messageData = this.selectDialog(sourceId, phase, tier);
      this.currentNPCId = sourceId;
      this.currentTier = tier;
      
      // Record conversation for follow-up tracking
      this.progressionManager.recordConversation(sourceId, tier);
    }

    const message = this.createMessage(messageData, sourceType, sourceId, speakerName);
    this.dialogBox.show(message);
    this.lockPlayerMovement();
    this.addToHistory(message);

    // Record in notebook if marked
    if (this.notebookManager && message.recordInNotebook) {
      this.notebookManager.recordDialog(message);
    }

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

    // Handle post-dialog actions (clue unlocking)
    if (this.currentNPCId && this.progressionManager) {
      this.handlePostDialogActions(this.currentNPCId, this.currentTier);
    }

    // Emit dialog-closed event for progression tracking
    if (this.currentNPCId) {
      this.scene.events.emit('dialog-closed', { sourceId: this.currentNPCId });
    }

    this.dialogBox.hide();
    this.unlockPlayerMovement();

    // Resume NPC movement if applicable
    if (this.activeEntity && typeof this.activeEntity.resumeMovement === 'function') {
      this.activeEntity.resumeMovement();
    }
    
    this.activeEntity = null;
    this.currentNPCId = null;
    this.currentTier = 0;
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
      // Check for interact keys (advance page or close)
      if (this.isInteractKeyPressed()) {
        // Try to advance to next page
        if (!this.dialogBox.nextPage()) {
          // No more pages, close the dialog
          this.close();
        }
      } else if (this.isCloseKeyPressed()) {
        // ESC always closes immediately
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

    // Handle new lines array format (for phase-based system)
    if (dialogData.lines && dialogData.lines.length > 0) {
      message = dialogData.lines.join('\n\n');
    } else if (sourceType === 'npc' && dialogData.introduction) {
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
      recordInNotebook: dialogData.recordInNotebook ?? false,
      notebookNote: dialogData.notebookNote,
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
   * Select appropriate dialog content based on phase and tier
   */
  private selectDialog(characterId: string, phase: GamePhase, tier: number): DialogData {
    const charData = this.dialogCache.get(characterId);
    if (!charData) {
      console.warn(`No dialog data for character: ${characterId}`);
      return this.fallbackDialog();
    }

    if (phase === 'pre-incident') {
      // Return introduction dialog
      return {
        lines: charData.introduction.lines,
        recordInNotebook: charData.introduction.recordInNotebook,
        notebookNote: charData.introduction.notebookNote,
      };
    } else {
      // Post-incident: select tier
      if (!charData.postIncident || tier >= charData.postIncident.length) {
        console.warn(`No tier ${tier} dialog for ${characterId}`);
        return this.fallbackDialog();
      }

      const tierData = charData.postIncident[tier];
      const conversationCount = this.progressionManager?.getConversationCount(characterId, tier) ?? 0;

      // First conversation at this tier: use initial lines
      if (conversationCount === 0) {
        return {
          lines: tierData.lines,
          recordInNotebook: tierData.recordInNotebook,
          notebookNote: tierData.notebookNote,
        };
      } else {
        // Follow-up conversation: cycle through follow-up lines
        const index = (conversationCount - 1) % tierData.followUpLines.length;
        return {
          lines: [tierData.followUpLines[index]],
          recordInNotebook: false, // Don't record follow-ups
        };
      }
    }
  }

  /**
   * Fallback dialog when data is missing
   */
  private fallbackDialog(): DialogData {
    return {
      lines: ['...'],
      recordInNotebook: false,
    };
  }

  /**
   * Handle post-dialog actions (clue unlocking)
   */
  private handlePostDialogActions(characterId: string, tier: number): void {
    const charData = this.dialogCache.get(characterId);
    if (!charData || !charData.postIncident) return;

    const tierData = charData.postIncident[tier];
    if (!tierData || !tierData.unlocksClues || tierData.unlocksClues.length === 0) {
      return;
    }

    // Emit clue unlock events
    tierData.unlocksClues.forEach(clueId => {
      console.log(`Dialog unlocking clue: ${clueId}`);
      this.scene.events.emit('clue-unlock-requested', clueId);
    });
  }

  /**
   * Destroy and clean up
   */
  public destroy(): void {
    this.dialogHistory = [];
    this.dialogCache.clear();
  }
}
