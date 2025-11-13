/**
 * EndingSequence Component
 * 
 * Manages victory and bad ending cutscene sequences, including confession dialogs,
 * reactions, door unlock animations, and summary/failure screens.
 */

import Phaser from 'phaser';
import type {
  VictorySequenceData,
  BadEndingSequenceData
} from '../types/accusation';
import type { DialogBox } from './dialog-box';
import type { SaveManager } from '../systems/save-manager';

/**
 * Victory sequence phase
 */
export enum VictoryPhase {
  CONFESSION = 'confession',
  REACTION = 'reaction',
  DOOR_UNLOCK = 'door_unlock',
  SUMMARY = 'summary'
}

/**
 * Bad ending sequence phase
 */
export enum BadEndingPhase {
  DESPAIR = 'despair',
  DOOR_UNLOCK = 'door_unlock',
  FAILURE_SCREEN = 'failure_screen'
}

/**
 * EndingSequence handles victory and bad ending cutscene flow
 */
export class EndingSequence extends Phaser.GameObjects.Container {
  private dialogBox: DialogBox;
  private summaryScreen?: Phaser.GameObjects.Container;
  private failureScreen?: Phaser.GameObjects.Container;
  private isSkippable: boolean = true;
  private isSequencePlaying: boolean = false;
  
  // Input keys
  private spaceKey?: Phaser.Input.Keyboard.Key;
  private enterKey?: Phaser.Input.Keyboard.Key;
  
  constructor(scene: Phaser.Scene, dialogBox: DialogBox) {
    super(scene);
    
    this.dialogBox = dialogBox;
    
    // Add to scene
    scene.add.existing(this);
    this.setDepth(3000); // Above everything
    
    // Setup input keys
    const keyboard = scene.input.keyboard;
    if (keyboard) {
      this.spaceKey = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
      this.enterKey = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
    }
    
    console.log('✓ EndingSequence initialized');
  }
  
  /**
   * Initialize the ending sequence component
   */
  initialize(): void {
    console.log('EndingSequence: Initialized');
  }
  
  /**
   * Play the victory ending sequence
   */
  async playVictory(data: VictorySequenceData): Promise<void> {
    this.isSequencePlaying = true;
    this.scene.events.emit('ending:victory-started');
    console.log('EndingSequence: Starting victory sequence');
    
    try {
      // Phase 1: Confession (10-15s)
      await this.showConfession(data.confession, data.culpritId);
      
      // Phase 2: Valentin Reaction (5-10s)
      await this.showReaction(data.valentinReaction);
      
      // Phase 3: Door Unlock (3-5s)
      await this.playDoorUnlock();
      
      // Phase 4: Summary Screen (dismissible)
      await this.showSummaryScreen(data);
      
      this.scene.events.emit('ending:victory-completed');
      console.log('EndingSequence: Victory sequence completed');
      
      this.returnToTitle();
    } catch (error) {
      console.error('Error in victory sequence:', error);
      this.isSequencePlaying = false;
    }
  }
  
  /**
   * Play the bad ending sequence
   */
  async playBadEnding(data: BadEndingSequenceData): Promise<void> {
    this.isSequencePlaying = true;
    this.scene.events.emit('ending:bad-ending-started');
    console.log('EndingSequence: Starting bad ending sequence');
    
    try {
      // Phase 1: Despair Speech (10-15s)
      await this.showDespair(data.despairSpeech);
      
      // Phase 2: Door Unlock (3-5s)
      await this.playDoorUnlock();
      
      // Phase 3: Failure Screen (dismissible)
      await this.showFailureScreen(data);
      
      this.scene.events.emit('ending:bad-ending-completed');
      console.log('EndingSequence: Bad ending sequence completed');
      
      this.returnToTitle();
    } catch (error) {
      console.error('Error in bad ending sequence:', error);
      this.isSequencePlaying = false;
    }
  }
  
  /**
   * Show confession dialog phase
   */
  private async showConfession(text: string, culpritId: string): Promise<void> {
    console.log(`EndingSequence: Showing confession from ${culpritId}`);
    
    // Show dialog with confession
    this.dialogBox.show({
      speaker: this.capitalize(culpritId),
      message: text,
      type: 'npc',
      characterId: culpritId,
      objectId: null,
    });
    
    // Wait for dialog to be dismissed (10-15 seconds or player advances)
    await this.waitForDialogOrTime(12000);
    
    this.dialogBox.hide();
  }
  
  /**
   * Show Valentin reaction dialog phase
   */
  private async showReaction(text: string): Promise<void> {
    console.log('EndingSequence: Showing Valentin reaction');
    
    // Show dialog with Valentin's reaction
    this.dialogBox.show({
      speaker: 'Valentin',
      message: text,
      type: 'npc',
      characterId: 'valentin',
      objectId: null,
    });
    
    // Wait for dialog (5-10 seconds)
    await this.waitForDialogOrTime(7000);
    
    this.dialogBox.hide();
  }
  
  /**
   * Show despair speech dialog phase
   */
  private async showDespair(text: string): Promise<void> {
    console.log('EndingSequence: Showing despair speech');
    
    // Show dialog with Valentin's despair
    this.dialogBox.show({
      speaker: 'Valentin',
      message: text,
      type: 'npc',
      characterId: 'valentin',
      objectId: null,
    });
    
    // Wait for dialog (10-15 seconds)
    await this.waitForDialogOrTime(12000);
    
    this.dialogBox.hide();
  }
  
  /**
   * Play door unlock animation phase
   */
  private async playDoorUnlock(): Promise<void> {
    console.log('EndingSequence: Playing door unlock animation');
    
    // TODO: Trigger door sprite animation if exists
    // For now, just wait
    await this.wait(3000); // 3 seconds
    
    console.log('EndingSequence: Door unlocked');
  }
  
  /**
   * Show victory summary screen
   */
  private async showSummaryScreen(data: VictorySequenceData): Promise<void> {
    console.log('EndingSequence: Showing victory summary');
    
    // Create summary screen
    const centerX = this.scene.cameras.main.width / 2;
    const centerY = this.scene.cameras.main.height / 2;
    
    this.summaryScreen = this.scene.add.container(0, 0);
    this.summaryScreen.setDepth(3001);
    
    // Background
    const bg = this.scene.add.rectangle(centerX, centerY, 900, 700, 0x1a1a2e, 0.95);
    this.summaryScreen.add(bg);
    
    // Border
    const border = this.scene.add.rectangle(centerX, centerY, 900, 700);
    border.setStrokeStyle(4, 0xffd700, 1);
    border.setFillStyle(0x000000, 0);
    this.summaryScreen.add(border);
    
    // Title
    const title = this.scene.add.text(centerX, centerY - 300, 'Mystery Solved!', {
      fontFamily: 'Georgia, serif',
      fontSize: '48px',
      color: '#ffd700',
      fontStyle: 'bold',
    });
    title.setOrigin(0.5);
    this.summaryScreen.add(title);
    
    // Culprit name
    const culpritText = this.scene.add.text(
      centerX,
      centerY - 230,
      `The culprit was: ${this.capitalize(data.culpritId)}`,
      {
        fontFamily: 'Georgia, serif',
        fontSize: '32px',
        color: '#ffffff',
      }
    );
    culpritText.setOrigin(0.5);
    this.summaryScreen.add(culpritText);
    
    // Motive
    const motiveLabel = this.scene.add.text(centerX, centerY - 170, 'Motive:', {
      fontFamily: 'Georgia, serif',
      fontSize: '24px',
      color: '#aaaaaa',
      fontStyle: 'italic',
    });
    motiveLabel.setOrigin(0.5);
    this.summaryScreen.add(motiveLabel);
    
    const motiveText = this.scene.add.text(centerX, centerY - 130, data.summary.motive, {
      fontFamily: 'Georgia, serif',
      fontSize: '20px',
      color: '#ffffff',
      wordWrap: { width: 800 },
      align: 'center',
    });
    motiveText.setOrigin(0.5, 0);
    this.summaryScreen.add(motiveText);
    
    // Key evidence
    let yOffset = centerY - 30;
    const evidenceLabel = this.scene.add.text(centerX, yOffset, 'Key Evidence:', {
      fontFamily: 'Georgia, serif',
      fontSize: '22px',
      color: '#aaaaaa',
      fontStyle: 'italic',
    });
    evidenceLabel.setOrigin(0.5);
    this.summaryScreen.add(evidenceLabel);
    
    yOffset += 40;
    data.summary.keyEvidence.forEach((clueId) => {
      const evidenceItem = this.scene.add.text(centerX, yOffset, `• ${clueId}`, {
        fontFamily: 'Arial',
        fontSize: '18px',
        color: '#cccccc',
      });
      evidenceItem.setOrigin(0.5);
      if (this.summaryScreen) {
        this.summaryScreen.add(evidenceItem);
      }
      yOffset += 30;
    });
    
    // Bonus acknowledgment
    if (data.summary.bonusAcknowledgment) {
      yOffset += 20;
      const bonusText = this.scene.add.text(centerX, yOffset, data.summary.bonusAcknowledgment, {
        fontFamily: 'Georgia, serif',
        fontSize: '20px',
        color: '#00ff00',
        fontStyle: 'italic',
        wordWrap: { width: 800 },
        align: 'center',
      });
      bonusText.setOrigin(0.5, 0);
      this.summaryScreen.add(bonusText);
    }
    
    // Continue button
    const button = this.scene.add.text(centerX, centerY + 280, 'Continue', {
      fontFamily: 'Arial',
      fontSize: '28px',
      color: '#ffffff',
      backgroundColor: '#4a4a4a',
      padding: { x: 30, y: 15 },
    });
    button.setOrigin(0.5);
    button.setInteractive({ useHandCursor: true });
    button.on('pointerdown', () => {
      this.dismissSummaryScreen();
    });
    this.summaryScreen.add(button);
    
    // Wait for dismissal
    await new Promise<void>((resolve) => {
      const checkDismissal = () => {
        if (!this.summaryScreen) {
          this.scene.events.off('update', checkDismissal);
          resolve();
        }
      };
      this.scene.events.on('update', checkDismissal);
    });
  }
  
  /**
   * Show failure screen
   */
  private async showFailureScreen(data: BadEndingSequenceData): Promise<void> {
    console.log('EndingSequence: Showing failure screen');
    
    // Create failure screen
    const centerX = this.scene.cameras.main.width / 2;
    const centerY = this.scene.cameras.main.height / 2;
    
    this.failureScreen = this.scene.add.container(0, 0);
    this.failureScreen.setDepth(3001);
    
    // Background
    const bg = this.scene.add.rectangle(centerX, centerY, 900, 600, 0x2e1a1a, 0.95);
    this.failureScreen.add(bg);
    
    // Border
    const border = this.scene.add.rectangle(centerX, centerY, 900, 600);
    border.setStrokeStyle(4, 0xff0000, 1);
    border.setFillStyle(0x000000, 0);
    this.failureScreen.add(border);
    
    // Title
    const title = this.scene.add.text(centerX, centerY - 230, 'Mystery Unsolved', {
      fontFamily: 'Georgia, serif',
      fontSize: '48px',
      color: '#ff0000',
      fontStyle: 'bold',
    });
    title.setOrigin(0.5);
    this.failureScreen.add(title);
    
    // Explanation
    const explanation = this.scene.add.text(centerX, centerY - 140, data.failureExplanation, {
      fontFamily: 'Georgia, serif',
      fontSize: '22px',
      color: '#ffffff',
      wordWrap: { width: 800 },
      align: 'center',
    });
    explanation.setOrigin(0.5, 0);
    this.failureScreen.add(explanation);
    
    // Optional culprit reveal
    if (data.actualCulprit) {
      const revealText = this.scene.add.text(
        centerX,
        centerY + 50,
        `It was actually ${this.capitalize(data.actualCulprit)}...`,
        {
          fontFamily: 'Georgia, serif',
          fontSize: '20px',
          color: '#cccccc',
          fontStyle: 'italic',
        }
      );
      revealText.setOrigin(0.5);
      this.failureScreen.add(revealText);
    }
    
    // Try Again button
    const button = this.scene.add.text(centerX, centerY + 220, 'Try Again', {
      fontFamily: 'Arial',
      fontSize: '28px',
      color: '#ffffff',
      backgroundColor: '#4a4a4a',
      padding: { x: 30, y: 15 },
    });
    button.setOrigin(0.5);
    button.setInteractive({ useHandCursor: true });
    button.on('pointerdown', () => {
      this.dismissFailureScreen();
    });
    this.failureScreen.add(button);
    
    // Wait for dismissal
    await new Promise<void>((resolve) => {
      const checkDismissal = () => {
        if (!this.failureScreen) {
          this.scene.events.off('update', checkDismissal);
          resolve();
        }
      };
      this.scene.events.on('update', checkDismissal);
    });
  }
  
  /**
   * Dismiss summary screen
   */
  private dismissSummaryScreen(): void {
    if (this.summaryScreen) {
      this.summaryScreen.destroy();
      this.summaryScreen = undefined;
    }
  }
  
  /**
   * Dismiss failure screen
   */
  private dismissFailureScreen(): void {
    if (this.failureScreen) {
      this.failureScreen.destroy();
      this.failureScreen = undefined;
    }
  }
  
  /**
   * Skip the current ending sequence
   */
  skipSequence(): void {
    if (!this.isSkippable) return;
    
    console.log('EndingSequence: Skipping to summary');
    // TODO: Implement fast-forward to summary/failure screen
  }
  
  /**
   * Check if an ending sequence is currently playing
   */
  isPlaying(): boolean {
    return this.isSequencePlaying;
  }
  
  /**
   * Return to title screen
   */
  returnToTitle(): void {
    console.log('EndingSequence: Returning to title screen');
    this.scene.events.emit('ending:return-to-title');
    
    // Reset save state
    const saveManager = this.scene.registry.get('saveManager') as SaveManager;
    if (saveManager) {
      // Clear the current game state to start fresh
      try {
        localStorage.removeItem('erdbeerstrudel_save');
      } catch (e) {
        console.warn('Failed to clear save:', e);
      }
    }
    
    // Transition to start scene
    this.scene.scene.start('start-scene');
  }
  
  /**
   * Wait for specified time
   */
  private wait(ms: number): Promise<void> {
    return new Promise((resolve) => {
      this.scene.time.delayedCall(ms, resolve);
    });
  }
  
  /**
   * Wait for dialog to be dismissed or timeout
   */
  private waitForDialogOrTime(maxTime: number): Promise<void> {
    return new Promise((resolve) => {
      let resolved = false;
      
      // Timeout
      const timer = this.scene.time.delayedCall(maxTime, () => {
        if (!resolved) {
          resolved = true;
          resolve();
        }
      });
      
      // Listen for dialog advance (Space or Enter)
      const checkInput = () => {
        if (resolved) return;
        
        if (this.spaceKey && Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
          resolved = true;
          timer.remove();
          this.scene.events.off('update', checkInput);
          resolve();
        } else if (this.enterKey && Phaser.Input.Keyboard.JustDown(this.enterKey)) {
          resolved = true;
          timer.remove();
          this.scene.events.off('update', checkInput);
          resolve();
        }
      };
      
      this.scene.events.on('update', checkInput);
    });
  }
  
  /**
   * Capitalize first letter
   */
  private capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
  
  /**
   * Clean up resources
   */
  destroy(): void {
    this.dismissSummaryScreen();
    this.dismissFailureScreen();
    this.isSequencePlaying = false;
    super.destroy();
    console.log('✓ EndingSequence destroyed');
  }
}
