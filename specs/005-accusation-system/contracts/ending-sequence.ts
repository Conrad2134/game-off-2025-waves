/**
 * EndingSequence Component API
 * 
 * Manages victory and bad ending cutscene sequences, including confession dialogs,
 * reactions, door unlock animations, and summary/failure screens.
 */

import type {
  VictorySequenceData,
  BadEndingSequenceData
} from './types';

/**
 * EndingSequence handles victory and bad ending cutscene flow
 * 
 * Responsibilities:
 * - Play multi-phase ending sequences with proper timing
 * - Manage dialog display during endings
 * - Trigger door unlock animation
 * - Display summary/failure screens
 * - Handle skip functionality (Hold Space)
 * - Return to title screen after completion
 * 
 * Sequence Timing:
 * - Victory: 30-45s total
 *   - Confession: 10-15s
 *   - Valentin reaction: 5-10s
 *   - Door unlock: 3-5s
 *   - Summary screen: 10-15s (dismissible)
 * 
 * - Bad Ending: 20-30s total
 *   - Despair speech: 10-15s
 *   - Door unlock: 3-5s
 *   - Failure screen: 5-10s (dismissible)
 * 
 * Usage:
 * ```typescript
 * const ending = new EndingSequence(scene);
 * await ending.playVictory(victoryData);
 * ```
 */
export interface IEndingSequence {
  /**
   * Initialize the ending sequence component
   * Preloads assets and sets up UI elements
   */
  initialize(): void;
  
  /**
   * Play the victory ending sequence
   * Multi-phase sequence for successful mystery solving
   * 
   * @param data - Victory sequence data (culprit, confession, etc.)
   * @returns Promise that resolves when sequence completes
   * @emits ending:victory-started
   * @emits ending:victory-completed
   */
  playVictory(data: VictorySequenceData): Promise<void>;
  
  /**
   * Play the bad ending sequence
   * Shorter sequence for failed accusations
   * 
   * @param data - Bad ending sequence data (despair speech, etc.)
   * @returns Promise that resolves when sequence completes
   * @emits ending:bad-ending-started
   * @emits ending:bad-ending-completed
   */
  playBadEnding(data: BadEndingSequenceData): Promise<void>;
  
  /**
   * Skip the current ending sequence
   * Advances immediately to summary/failure screen
   * Requires holding Space key (not just tapping)
   */
  skipSequence(): void;
  
  /**
   * Check if an ending sequence is currently playing
   * 
   * @returns True if ending is active
   */
  isPlaying(): boolean;
  
  /**
   * Clean up and return to title screen
   * Called after summary/failure screen is dismissed
   * 
   * @emits ending:return-to-title
   */
  returnToTitle(): void;
  
  /**
   * Clean up resources
   */
  destroy(): void;
}

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
 * Concrete implementation extends Phaser.GameObjects.Container
 * 
 * @example
 * ```typescript
 * export class EndingSequence extends Phaser.GameObjects.Container implements IEndingSequence {
 *   private dialogBox: DialogBox;
 *   private summaryScreen: Phaser.GameObjects.Container;
 *   private failureScreen: Phaser.GameObjects.Container;
 *   private currentPhase: VictoryPhase | BadEndingPhase | null = null;
 *   private skipKeyHoldTime: number = 0;
 *   private isSkippable: boolean = true;
 *   
 *   constructor(scene: Phaser.Scene) {
 *     super(scene);
 *     this.scene.add.existing(this);
 *   }
 *   
 *   async playVictory(data: VictorySequenceData): Promise<void> {
 *     this.scene.events.emit('ending:victory-started');
 *     
 *     // Phase 1: Confession (10-15s)
 *     this.currentPhase = VictoryPhase.CONFESSION;
 *     await this.showConfession(data.confession, data.culpritId);
 *     
 *     // Phase 2: Valentin Reaction (5-10s)
 *     this.currentPhase = VictoryPhase.REACTION;
 *     await this.showReaction(data.valentinReaction);
 *     
 *     // Phase 3: Door Unlock (3-5s)
 *     this.currentPhase = VictoryPhase.DOOR_UNLOCK;
 *     await this.playDoorUnlock();
 *     
 *     // Phase 4: Summary Screen (dismissible)
 *     this.currentPhase = VictoryPhase.SUMMARY;
 *     await this.showSummaryScreen(data);
 *     
 *     this.scene.events.emit('ending:victory-completed');
 *     this.returnToTitle();
 *   }
 *   
 *   async playBadEnding(data: BadEndingSequenceData): Promise<void> {
 *     this.scene.events.emit('ending:bad-ending-started');
 *     
 *     // Phase 1: Despair Speech (10-15s)
 *     this.currentPhase = BadEndingPhase.DESPAIR;
 *     await this.showDespair(data.despairSpeech);
 *     
 *     // Phase 2: Door Unlock (3-5s)
 *     this.currentPhase = BadEndingPhase.DOOR_UNLOCK;
 *     await this.playDoorUnlock();
 *     
 *     // Phase 3: Failure Screen (dismissible)
 *     this.currentPhase = BadEndingPhase.FAILURE_SCREEN;
 *     await this.showFailureScreen(data);
 *     
 *     this.scene.events.emit('ending:bad-ending-completed');
 *     this.returnToTitle();
 *   }
 *   
 *   private async showConfession(text: string, culpritId: string): Promise<void> {
 *     // Show culprit portrait and confession dialog
 *     // Wait for dialog to complete or skip
 *   }
 *   
 *   private async showReaction(text: string): Promise<void> {
 *     // Show Valentin portrait and reaction dialog
 *   }
 *   
 *   private async showDespair(text: string): Promise<void> {
 *     // Show Valentin portrait and despair dialog
 *   }
 *   
 *   private async playDoorUnlock(): Promise<void> {
 *     // Play door sprite animation
 *     // Play door unlock sound effect
 *     // Wait for animation to complete
 *   }
 *   
 *   private async showSummaryScreen(data: VictorySequenceData): Promise<void> {
 *     // Display summary with culprit, motive, key evidence
 *     // Show bonus acknowledgment if applicable
 *     // Wait for player to press Continue
 *   }
 *   
 *   private async showFailureScreen(data: BadEndingSequenceData): Promise<void> {
 *     // Display failure explanation
 *     // Optionally reveal actual culprit
 *     // Wait for player to press Try Again
 *   }
 *   
 *   skipSequence(): void {
 *     if (!this.isSkippable) return;
 *     
 *     // Fast-forward to summary/failure screen
 *     // Cancel any running tweens
 *     // Skip current dialog
 *   }
 *   
 *   returnToTitle(): void {
 *     this.scene.events.emit('ending:return-to-title');
 *     // Clear save state
 *     // Transition to title scene
 *   }
 * }
 * ```
 */

/**
 * Summary screen configuration
 */
export interface SummaryScreenConfig {
  /** Background color */
  backgroundColor: number;
  
  /** Title text (e.g., "Mystery Solved!") */
  titleText: string;
  titleFontSize: number;
  titleColor: string;
  
  /** Body text styling */
  bodyFontSize: number;
  bodyColor: string;
  
  /** Continue button */
  buttonText: string;
  buttonWidth: number;
  buttonHeight: number;
}

/**
 * Failure screen configuration
 */
export interface FailureScreenConfig {
  /** Background color */
  backgroundColor: number;
  
  /** Title text (e.g., "Mystery Unsolved") */
  titleText: string;
  titleFontSize: number;
  titleColor: string;
  
  /** Body text styling */
  bodyFontSize: number;
  bodyColor: string;
  
  /** Retry button */
  buttonText: string;
  buttonWidth: number;
  buttonHeight: number;
}
