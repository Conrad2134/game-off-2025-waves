/**
 * AccusationUI Component
 * 
 * Visual component rendering the accusation/confrontation interface inline
 * within the library scene. Manages suspect selection, statement display,
 * and evidence presentation UI.
 */

import Phaser from 'phaser';
import type {
  AccusationUIState,
  ConfrontationStatement,
  ConfrontationProgress,
  AccusationUIConfig
} from '../types/accusation';

/**
 * Default UI configuration
 */
const DEFAULT_CONFIG: AccusationUIConfig = {
  dimOpacity: 0.7,
  portraitSize: { width: 128, height: 128 },
  statementBox: {
    width: 600,
    height: 150,
    backgroundColor: 0x2c1810,
    textColor: '#f5e6d3',
    fontSize: 16,
  },
  buttons: {
    width: 200,
    height: 40,
    fontSize: 16,
    normalColor: 0x4a3020,
    hoverColor: 0x6a4830,
  },
  mistakeIndicator: {
    iconSize: 24,
    spacing: 8,
    emptyIcon: '⬜',
    filledIcon: '❌',
  },
  animations: {
    fadeIn: 300,
    fadeOut: 300,
    statementTransition: 400,
  },
};

/**
 * AccusationUI renders the accusation interface as a Phaser Container
 */
export class AccusationUI extends Phaser.GameObjects.Container {
  private config: AccusationUIConfig;
  private uiState: AccusationUIState;
  
  // UI Components
  private backgroundDim!: Phaser.GameObjects.Rectangle;
  private contentContainer!: Phaser.GameObjects.Container;
  // private portraitSprite?: Phaser.GameObjects.Sprite; // TODO: Implement portrait display
  private statementBox!: Phaser.GameObjects.Container;
  private statementText!: Phaser.GameObjects.Text;
  private buttonContainer!: Phaser.GameObjects.Container;
  private mistakeCounterText!: Phaser.GameObjects.Text;
  private penaltyDialogContainer?: Phaser.GameObjects.Container;
  
  // Suspect selection components
  private suspectListContainer?: Phaser.GameObjects.Container;
  
  constructor(scene: Phaser.Scene, config?: Partial<AccusationUIConfig>) {
    super(scene);
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.uiState = this.getDefaultState();
    
    // Add to scene
    this.scene.add.existing(this);
    
    // Start hidden
    this.setVisible(false);
    this.setDepth(1000); // High z-index for overlay
  }
  
  /**
   * Initialize the UI component
   */
  initialize(x: number, y: number): void {
    this.setPosition(Math.round(x), Math.round(y));
    this.createBackgroundDim();
    this.createContentContainer();
    this.createStatementBox();
    this.createButtons();
    this.createMistakeCounter();
    this.setupKeyboardShortcuts();
    
    console.log('✓ AccusationUI initialized');
  }
  
  /**
   * Show the suspect selection screen
   */
  showSuspectSelection(suspects: string[], excludeAccused: boolean = false): void {
    this.uiState.phase = 'suspect-selection';
    this.uiState.isVisible = true;
    
    // Clear existing content
    this.clearContent();
    
    // Hide confrontation UI elements
    this.statementBox.setVisible(false);
    this.buttonContainer.setVisible(false);
    this.mistakeCounterText.setVisible(false);
    
    // Create suspect list
    this.createSuspectList(suspects, excludeAccused);
    
    // Show UI with fade-in
    this.show();
    
    console.log('AccusationUI: Showing suspect selection');
  }
  
  /**
   * Hide suspect selection and show confrontation interface
   */
  startConfrontation(suspectId: string, statement: ConfrontationStatement): void {
    this.uiState.phase = 'confrontation';
    this.uiState.selectedSuspect = suspectId;
    this.uiState.currentStatement = statement;
    
    // Clear suspect list
    if (this.suspectListContainer) {
      this.suspectListContainer.destroy();
      this.suspectListContainer = undefined;
    }
    
    // Make sure confrontation UI elements are visible
    this.statementBox.setVisible(true);
    this.buttonContainer.setVisible(true);
    this.mistakeCounterText.setVisible(true);
    
    // Show confrontation UI
    this.showStatement(statement, { 
      suspectId, 
      currentStatementIndex: 0, 
      mistakeCount: 0, 
      presentedEvidence: [], 
      startedAt: Date.now() 
    });
    
    console.log(`AccusationUI: Confrontation started with ${suspectId}`);
  }
  
  /**
   * Display a statement in the confrontation interface
   */
  showStatement(statement: ConfrontationStatement, progress: ConfrontationProgress): void {
    this.uiState.currentStatement = statement;
    
    // Update statement text
    this.statementText.setText(statement.text);
    
    // Update mistake counter
    this.updateMistakeCounter(progress.mistakeCount);
    
    // Update portrait if needed
    // TODO: Load and display suspect portrait sprite
    
    // Show/hide buttons based on statement requirements
    if (statement.requiresPresentation) {
      this.showButtons(true);
    } else {
      // Auto-advance informational statements
      this.showButtons(false);
      // TODO: Add auto-advance after delay
    }
  }
  
  /**
   * Open the notebook for evidence selection
   */
  openEvidenceSelection(discoveredClues: string[]): void {
    this.uiState.notebookOpen = true;
    
    // Emit event for NotebookUI to handle
    this.scene.events.emit('accusation:open-evidence-selection', { 
      discoveredClues,
      mode: 'confrontation',
    });
    
    console.log('AccusationUI: Evidence selection opened');
  }
  
  /**
   * Close the evidence selection notebook
   */
  closeEvidenceSelection(): void {
    this.uiState.notebookOpen = false;
    this.scene.events.emit('accusation:close-evidence-selection');
  }
  
  /**
   * Show penalty dialog overlay
   */
  showPenaltyDialog(mistakeCount: number, message: string): void {
    // Create penalty dialog if it doesn't exist
    if (!this.penaltyDialogContainer) {
      this.penaltyDialogContainer = this.scene.add.container(0, 0);
      this.contentContainer.add(this.penaltyDialogContainer);
    }
    
    // Clear existing content
    this.penaltyDialogContainer.removeAll(true);
    
    // Create dialog background
    const dialogBg = this.scene.add.rectangle(
      0, 0,
      500, 200,
      0x8b0000
    );
    this.penaltyDialogContainer.add(dialogBg);
    
    // Create message text
    const messageText = this.scene.add.text(0, -40, message, {
      fontSize: '16px',
      color: '#ffffff',
      align: 'center',
      wordWrap: { width: 450 },
    });
    messageText.setOrigin(0.5);
    this.penaltyDialogContainer.add(messageText);
    
    // Create dismiss button
    const dismissButton = this.createButton(0, 60, 'Dismiss', () => {
      this.dismissPenaltyDialog();
    });
    this.penaltyDialogContainer.add(dismissButton);
    
    // Disable input elsewhere
    this.setInputEnabled(false);
    
    console.log(`AccusationUI: Penalty dialog shown (${mistakeCount}/3 mistakes)`);
  }
  
  /**
   * Dismiss the penalty dialog
   */
  dismissPenaltyDialog(): void {
    if (this.penaltyDialogContainer) {
      this.penaltyDialogContainer.setVisible(false);
    }
    
    this.setInputEnabled(true);
    console.log('AccusationUI: Penalty dialog dismissed');
  }
  
  /**
   * Show rejection dialog when 3 mistakes reached
   */
  showRejectionDialog(speaker: string, text: string, onDismiss: () => void): void {
    // Create rejection dialog container if needed
    if (!this.penaltyDialogContainer) {
      this.penaltyDialogContainer = this.scene.add.container(0, 0);
      this.contentContainer.add(this.penaltyDialogContainer);
    }
    
    // Clear existing content
    this.penaltyDialogContainer.removeAll(true);
    
    // Create larger dialog background for rejection
    const dialogBg = this.scene.add.rectangle(
      0, 0,
      600, 250,
      0x8b0000
    );
    this.penaltyDialogContainer.add(dialogBg);
    
    // Speaker label
    const speakerLabel = this.scene.add.text(0, -90, speaker.toUpperCase(), {
      fontSize: '18px',
      color: '#ffffff',
      fontStyle: 'bold',
    });
    speakerLabel.setOrigin(0.5);
    this.penaltyDialogContainer.add(speakerLabel);
    
    // Rejection message text
    const messageText = this.scene.add.text(0, -30, text, {
      fontSize: '16px',
      color: '#ffffff',
      align: 'center',
      wordWrap: { width: 550 },
    });
    messageText.setOrigin(0.5);
    this.penaltyDialogContainer.add(messageText);
    
    // Dismiss button
    const dismissButton = this.createButton(0, 90, 'I understand...', () => {
      this.penaltyDialogContainer?.setVisible(false);
      onDismiss();
    });
    this.penaltyDialogContainer.add(dismissButton);
    
    // Make visible and disable other input
    this.penaltyDialogContainer.setVisible(true);
    this.setInputEnabled(false);
    
    console.log('AccusationUI: Rejection dialog shown (3 mistakes reached)');
  }
  
  /**
   * Show positive feedback when correct evidence presented
   */
  showCorrectFeedback(message: string): void {
    // TODO: Show brief positive visual effect
    console.log(`AccusationUI: Correct evidence! ${message}`);
    
    // Update statement text with response
    this.statementText.setText(message);
  }
  
  /**
   * Advance to the next statement with transition
   */
  advanceToNextStatement(nextStatement: ConfrontationStatement, progress: ConfrontationProgress): void {
    this.uiState.animationPlaying = true;
    this.setInputEnabled(false);
    
    // Fade out current statement
    this.scene.tweens.add({
      targets: this.statementBox,
      alpha: 0,
      duration: this.config.animations.fadeOut,
      onComplete: () => {
        // Update to next statement
        this.showStatement(nextStatement, progress);
        
        // Fade in new statement
        this.scene.tweens.add({
          targets: this.statementBox,
          alpha: 1,
          duration: this.config.animations.fadeIn,
          onComplete: () => {
            this.uiState.animationPlaying = false;
            this.setInputEnabled(true);
          },
        });
      },
    });
  }
  
  /**
   * Hide the entire accusation UI
   */
  hide(immediate: boolean = false): void {
    this.uiState.isVisible = false;
    
    if (immediate) {
      this.setVisible(false);
      this.setAlpha(0);
    } else {
      this.scene.tweens.add({
        targets: this,
        alpha: 0,
        duration: this.config.animations.fadeOut,
        onComplete: () => {
          this.setVisible(false);
        },
      });
    }
  }
  
  /**
   * Show the UI after being hidden
   */
  show(immediate: boolean = false): void {
    this.uiState.isVisible = true;
    this.setVisible(true);
    
    if (immediate) {
      this.setAlpha(1);
    } else {
      this.setAlpha(0);
      this.scene.tweens.add({
        targets: this,
        alpha: 1,
        duration: this.config.animations.fadeIn,
      });
    }
  }
  
  /**
   * Get the current UI state
   */
  getState(): AccusationUIState {
    return { ...this.uiState };
  }
  
  /**
   * Update the mistake counter display
   */
  updateMistakeCounter(mistakeCount: number): void {
    const { emptyIcon, filledIcon } = this.config.mistakeIndicator;
    const icons = [];
    
    for (let i = 0; i < 3; i++) {
      icons.push(i < mistakeCount ? filledIcon : emptyIcon);
    }
    
    this.mistakeCounterText.setText(`Mistakes: ${icons.join(' ')}`);
  }
  
  /**
   * Enable or disable user input
   */
  setInputEnabled(enabled: boolean): void {
    this.uiState.animationPlaying = !enabled;
    // TODO: Disable/enable button interactivity
  }
  
  /**
   * Create background dim overlay
   */
  private createBackgroundDim(): void {
    const { width, height } = this.scene.cameras.main;
    this.backgroundDim = this.scene.add.rectangle(
      0, 0,
      width, height,
      0x000000,
      this.config.dimOpacity
    );
    this.backgroundDim.setOrigin(0.5);
    this.backgroundDim.setInteractive();
    this.backgroundDim.disableInteractive(); // Explicitly disable interaction to not block clicks
    this.add(this.backgroundDim);
  }
  
  /**
   * Create main content container
   */
  private createContentContainer(): void {
    this.contentContainer = this.scene.add.container(0, 0);
    this.add(this.contentContainer);
  }
  
  /**
   * Create statement box
   */
  private createStatementBox(): void {
    const { width, height, backgroundColor, textColor, fontSize } = this.config.statementBox;
    
    this.statementBox = this.scene.add.container(Math.round(0), Math.round(-50));
    
    // Background (pixel-perfect)
    const bg = this.scene.add.rectangle(0, 0, width, height, backgroundColor);
    this.ensurePixelPerfect(bg);
    this.statementBox.add(bg);
    
    // Text (pixel-perfect)
    this.statementText = this.scene.add.text(0, 0, '', {
      fontSize: `${fontSize}px`,
      color: textColor,
      align: 'center',
      wordWrap: { width: width - 40 },
    });
    this.statementText.setOrigin(0.5);
    this.ensurePixelPerfect(this.statementText);
    this.statementBox.add(this.statementText);
    
    this.contentContainer.add(this.statementBox);
  }
  
  /**
   * Create action buttons
   */
  private createButtons(): void {
    this.buttonContainer = this.scene.add.container(0, 150);
    this.buttonContainer.setDepth(10); // Ensure buttons are clickable
    
    const presentButton = this.createButton(-110, 0, 'Present Evidence', () => {
      this.onPresentEvidenceClick();
    });
    
    const listenButton = this.createButton(110, 0, 'Listen', () => {
      this.onListenClick();
    });
    
    this.buttonContainer.add([presentButton, listenButton]);
    this.contentContainer.add(this.buttonContainer);
  }
  
  /**
   * Create mistake counter
   */
  private createMistakeCounter(): void {
    this.mistakeCounterText = this.scene.add.text(0, 200, 'Mistakes: ⬜⬜⬜', {
      fontSize: '18px',
      color: '#ffffff',
      align: 'center',
    });
    this.mistakeCounterText.setOrigin(0.5);
    this.contentContainer.add(this.mistakeCounterText);
  }
  
  /**
   * Create suspect list for selection
   */
  private createSuspectList(suspects: string[], _excludeAccused: boolean): void {
    this.suspectListContainer = this.scene.add.container(0, 0);
    
    const title = this.scene.add.text(0, -200, 'Who do you accuse?', {
      fontSize: '24px',
      color: '#ffffff',
      align: 'center',
    });
    title.setOrigin(0.5);
    this.suspectListContainer.add(title);
    
    // Create suspect buttons in grid
    const buttonSpacing = 150;
    const startY = -50;
    
    suspects.forEach((suspectId, index) => {
      const y = startY + (Math.floor(index / 2) * buttonSpacing);
      const x = (index % 2 === 0) ? -120 : 120;
      
      const suspectButton = this.createButton(x, y, suspectId, () => {
        this.onSuspectSelected(suspectId);
      });
      
      this.suspectListContainer!.add(suspectButton);
    });
    
    this.contentContainer.add(this.suspectListContainer);
  }
  
  /**
   * Create a button
   */
  private createButton(x: number, y: number, label: string, onClick: () => void): Phaser.GameObjects.Container {
    const button = this.scene.add.container(x, y);
    
    const { width, height, fontSize, normalColor, hoverColor } = this.config.buttons;
    
    const bg = this.scene.add.rectangle(0, 0, width, height, normalColor);
    bg.setInteractive({ useHandCursor: true });
    bg.setDepth(1); // Ensure button is above other elements
    
    const text = this.scene.add.text(0, 0, label, {
      fontSize: `${fontSize}px`,
      color: '#ffffff',
      align: 'center',
    });
    text.setOrigin(0.5);
    
    button.add([bg, text]);
    
    // Hover effect
    bg.on('pointerover', () => {
      bg.setFillStyle(hoverColor);
    });
    
    bg.on('pointerout', () => {
      bg.setFillStyle(normalColor);
    });
    
    bg.on('pointerdown', () => {
      console.log(`[AccusationUI] Button clicked: ${label}`);
      onClick();
    });
    
    return button;
  }
  
  /**
   * Show or hide buttons
   */
  private showButtons(show: boolean): void {
    this.buttonContainer.setVisible(show);
  }
  
  /**
   * Clear all content containers
   */
  private clearContent(): void {
    if (this.suspectListContainer) {
      this.suspectListContainer.destroy();
      this.suspectListContainer = undefined;
    }
  }
  
  /**
   * Handle Present Evidence button click
   */
  private onPresentEvidenceClick(): void {
    console.log('[AccusationUI] Present Evidence clicked');
    // Get discovered clues from ClueTracker
    const clueTracker = this.scene.registry.get('clueTracker');
    if (clueTracker && typeof clueTracker.getDiscoveredIds === 'function') {
      const discoveredClues = clueTracker.getDiscoveredIds();
      console.log('[AccusationUI] Opening evidence selection with clues:', discoveredClues);
      this.openEvidenceSelection(discoveredClues);
    } else {
      console.error('[AccusationUI] ClueTracker not found or invalid');
    }
  }
  
  /**
   * Handle Listen button click
   */
  private onListenClick(): void {
    console.log('[AccusationUI] Listen clicked');
    // TODO: Handle auto-advance for informational statements
  }
  
  /**
   * Handle suspect selection
   */
  private onSuspectSelected(suspectId: string): void {
    this.scene.events.emit('ui:suspect-selected', { suspectId });
    console.log(`AccusationUI: Suspect selected - ${suspectId}`);
  }
  
  /**
   * Get default UI state
   */
  private getDefaultState(): AccusationUIState {
    return {
      isVisible: false,
      phase: 'suspect-selection',
      selectedSuspect: null,
      currentStatement: null,
      notebookOpen: false,
      animationPlaying: false,
    };
  }
  
  /**
   * Setup keyboard shortcuts for accusation UI
   * E - Present Evidence, Space - Continue/Dismiss, Escape - Cancel
   */
  private setupKeyboardShortcuts(): void {
    // E key for Present Evidence
    this.scene.input.keyboard?.on('keydown-E', () => {
      if (this.uiState.isVisible && this.uiState.phase === 'confrontation' && !this.uiState.animationPlaying) {
        this.onPresentEvidenceClick();
      }
    });
    
    // Space key for Continue/Dismiss
    this.scene.input.keyboard?.on('keydown-SPACE', () => {
      if (this.uiState.isVisible && !this.uiState.animationPlaying) {
        if (this.penaltyDialogContainer && this.penaltyDialogContainer.visible) {
          this.dismissPenaltyDialog();
        }
      }
    });
    
    // Escape key for Cancel
    this.scene.input.keyboard?.on('keydown-ESC', () => {
      if (this.uiState.isVisible && !this.uiState.animationPlaying) {
        if (this.uiState.phase === 'suspect-selection' || this.uiState.phase === 'confrontation') {
          this.scene.events.emit('ui:accusation-cancelled');
          this.hide();
        }
      }
    });
  }
  
  /**
   * Ensure pixel-perfect rendering by rounding all positions to integers
   */
  private ensurePixelPerfect(obj: Phaser.GameObjects.GameObject & { x: number; y: number }): void {
    obj.x = Math.round(obj.x);
    obj.y = Math.round(obj.y);
  }
  
  /**
   * Clean up resources
   */
  destroy(fromScene?: boolean): void {
    // Remove keyboard listeners
    this.scene.input.keyboard?.off('keydown-E');
    this.scene.input.keyboard?.off('keydown-SPACE');
    this.scene.input.keyboard?.off('keydown-ESC');
    
    this.removeAll(true);
    super.destroy(fromScene);
    console.log('✓ AccusationUI destroyed');
  }
}
