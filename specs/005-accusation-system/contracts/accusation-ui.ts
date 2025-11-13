/**
 * AccusationUI Component API
 * 
 * Visual component rendering the accusation/confrontation interface inline
 * within the library scene. Manages suspect selection, statement display,
 * and evidence presentation UI.
 */

import type {
  AccusationUIState,
  ConfrontationStatement,
  ConfrontationProgress
} from './types';

/**
 * AccusationUI renders the accusation interface as a Phaser Container
 * 
 * Responsibilities:
 * - Render suspect selection screen with NPC portraits
 * - Display confrontation interface (portrait + statement + buttons)
 * - Show mistake counter and progress indicators
 * - Render penalty dialog overlay on incorrect evidence
 * - Coordinate with NotebookUI for evidence selection
 * - Handle user input (clicks, keyboard shortcuts)
 * 
 * UI Layout:
 * ```
 * ┌─────────────────────────────────────┐
 * │  [Background Dim]                   │
 * │  ┌───────────────────────────────┐  │
 * │  │  [Suspect Portrait]           │  │
 * │  │  ┌─────────────────────────┐  │  │
 * │  │  │ Statement Text          │  │  │
 * │  │  │ "I was reading..."      │  │  │
 * │  │  └─────────────────────────┘  │  │
 * │  │  [Present Evidence] [Listen] │  │
 * │  │  Mistakes: ❌❌⬜           │  │
 * │  └───────────────────────────────┘  │
 * └─────────────────────────────────────┘
 * ```
 * 
 * Usage:
 * ```typescript
 * const ui = new AccusationUI(scene);
 * ui.showSuspectSelection(['emma', 'klaus', 'luca']);
 * ```
 */
export interface IAccusationUI {
  /**
   * Initialize the UI component
   * Creates container and child elements
   * Sets up event listeners
   * 
   * @param x - X position in scene (usually centered)
   * @param y - Y position in scene (usually centered)
   */
  initialize(x: number, y: number): void;
  
  /**
   * Show the suspect selection screen
   * Displays list of all suspects with portraits
   * 
   * @param suspects - Array of suspect NPC IDs
   * @param excludeAccused - Whether to gray out already-accused suspects
   * @emits ui:suspect-selected when player selects a suspect
   */
  showSuspectSelection(suspects: string[], excludeAccused?: boolean): void;
  
  /**
   * Hide suspect selection and show confrontation interface
   * Transitions from selection to confrontation phase
   * 
   * @param suspectId - NPC ID being accused
   * @param statement - First statement to display
   */
  startConfrontation(suspectId: string, statement: ConfrontationStatement): void;
  
  /**
   * Display a statement in the confrontation interface
   * Updates statement text and speaker
   * 
   * @param statement - Statement to display
   * @param progress - Current confrontation progress (for mistake counter)
   */
  showStatement(statement: ConfrontationStatement, progress: ConfrontationProgress): void;
  
  /**
   * Open the notebook for evidence selection
   * Shows discovered clues that can be presented
   * 
   * @param discoveredClues - Array of clue IDs player has found
   * @emits ui:evidence-selected when player selects a clue
   * @emits ui:notebook-cancelled when player closes without selecting
   */
  openEvidenceSelection(discoveredClues: string[]): void;
  
  /**
   * Close the evidence selection notebook
   */
  closeEvidenceSelection(): void;
  
  /**
   * Show penalty dialog overlay when incorrect evidence presented
   * Displays mistake count and requires dismissal
   * 
   * @param mistakeCount - Current mistake count (1-3)
   * @param message - Penalty message from statement.incorrectResponse
   */
  showPenaltyDialog(mistakeCount: number, message: string): void;
  
  /**
   * Dismiss the penalty dialog
   * Returns focus to confrontation interface
   */
  dismissPenaltyDialog(): void;
  
  /**
   * Show positive feedback when correct evidence presented
   * Brief visual effect before advancing statement
   * 
   * @param message - Success message from statement.correctResponse
   */
  showCorrectFeedback(message: string): void;
  
  /**
   * Advance to the next statement with transition animation
   * Fades out current statement, fades in next
   * 
   * @param nextStatement - Next statement to display
   * @param progress - Updated confrontation progress
   */
  advanceToNextStatement(nextStatement: ConfrontationStatement, progress: ConfrontationProgress): void;
  
  /**
   * Hide the entire accusation UI
   * Returns to normal library scene view
   * 
   * @param immediate - If true, hide instantly without fade-out
   */
  hide(immediate?: boolean): void;
  
  /**
   * Show the UI after being hidden
   * 
   * @param immediate - If true, show instantly without fade-in
   */
  show(immediate?: boolean): void;
  
  /**
   * Get the current UI state
   * 
   * @returns Current AccusationUIState
   */
  getState(): AccusationUIState;
  
  /**
   * Update the mistake counter display
   * Shows visual indicators (❌⬜⬜) for mistakes
   * 
   * @param mistakeCount - Current mistake count (0-3)
   */
  updateMistakeCounter(mistakeCount: number): void;
  
  /**
   * Enable or disable user input
   * Used during animations and processing
   * 
   * @param enabled - Whether input should be enabled
   */
  setInputEnabled(enabled: boolean): void;
  
  /**
   * Clean up resources
   * Destroys container and removes event listeners
   */
  destroy(): void;
}

/**
 * Concrete implementation extends Phaser.GameObjects.Container
 * 
 * @example
 * ```typescript
 * export class AccusationUI extends Phaser.GameObjects.Container implements IAccusationUI {
 *   private backgroundDim: Phaser.GameObjects.Rectangle;
 *   private portraitSprite: Phaser.GameObjects.Sprite;
 *   private statementBox: Phaser.GameObjects.Container;
 *   private buttonContainer: Phaser.GameObjects.Container;
 *   private mistakeIndicators: Phaser.GameObjects.Text[];
 *   private notebookOverlay: NotebookUI;
 *   private penaltyDialog: Phaser.GameObjects.Container;
 *   
 *   constructor(scene: Phaser.Scene) {
 *     super(scene);
 *     this.scene.add.existing(this);
 *   }
 *   
 *   // ... implement interface methods
 * }
 * ```
 */

/**
 * Configuration for AccusationUI styling
 */
export interface AccusationUIConfig {
  /** Background dim opacity (0-1) */
  dimOpacity: number;
  
  /** Portrait sprite dimensions */
  portraitSize: { width: number; height: number };
  
  /** Statement box styling */
  statementBox: {
    width: number;
    height: number;
    backgroundColor: number;
    textColor: string;
    fontSize: number;
  };
  
  /** Button styling */
  buttons: {
    width: number;
    height: number;
    fontSize: number;
    normalColor: number;
    hoverColor: number;
  };
  
  /** Mistake indicator styling */
  mistakeIndicator: {
    iconSize: number;
    spacing: number;
    emptyIcon: string;
    filledIcon: string;
  };
  
  /** Animation durations (ms) */
  animations: {
    fadeIn: number;
    fadeOut: number;
    statementTransition: number;
  };
}
