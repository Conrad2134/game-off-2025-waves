/**
 * AccusationManager System API
 * 
 * Core system managing accusation logic, state transitions, and evidence validation.
 * Singleton instance accessed via Phaser Registry.
 */

import type {
  AccusationState,
  AccusationConfig,
  ConfrontationProgress,
  ConfrontationSequence,
  ConfrontationStatement,
  EvidenceResult,
  AccusationValidation,
  VictorySequenceData,
  BadEndingSequenceData
} from './types';

/**
 * AccusationManager manages the core accusation system logic
 * 
 * Responsibilities:
 * - Load and validate accusation configuration from JSON
 * - Track accusation state (failures, current confrontation)
 * - Validate evidence presentations
 * - Determine accusation outcomes (success/failure/bad ending)
 * - Coordinate with SaveManager for state persistence
 * - Emit events for UI updates
 * 
 * Usage:
 * ```typescript
 * const manager = scene.registry.get('accusationManager') as AccusationManager;
 * manager.startAccusation('emma');
 * ```
 */
export interface IAccusationManager {
  /**
   * Initialize the accusation system
   * Loads configuration from src/data/accusation.json
   * Registers with scene registry
   * 
   * @throws {Error} If configuration is invalid
   */
  initialize(): void;
  
  /**
   * Check if player can initiate an accusation
   * Validates minimum clues discovered
   * 
   * @returns Validation result with reason if not allowed
   */
  canInitiateAccusation(): AccusationValidation;
  
  /**
   * Start the suspect selection phase
   * Opens accusation UI in suspect selection mode
   * 
   * @emits accusation:suspect-selection-opened
   */
  startSuspectSelection(): void;
  
  /**
   * Start a confrontation with the specified suspect
   * Initializes confrontation progress state
   * Loads confrontation sequence from configuration
   * 
   * @param suspectId - NPC ID to accuse
   * @throws {Error} If suspect has no confrontation sequence
   * @emits accusation:started
   */
  startAccusation(suspectId: string): void;
  
  /**
   * Get the current confrontation state
   * 
   * @returns Current confrontation progress or null if not active
   */
  getCurrentConfrontation(): ConfrontationProgress | null;
  
  /**
   * Get the current statement in active confrontation
   * 
   * @returns Current statement or null if not in confrontation
   */
  getCurrentStatement(): ConfrontationStatement | null;
  
  /**
   * Present evidence against the current statement
   * Validates evidence and updates confrontation state
   * 
   * @param clueId - ID of the clue being presented
   * @returns Result indicating correctness and next actions
   * @emits accusation:evidence-presented
   * @emits accusation:success (if confrontation succeeds)
   * @emits accusation:failed (if confrontation fails)
   */
  presentEvidence(clueId: string): EvidenceResult;
  
  /**
   * Advance to the next statement in confrontation
   * Used after correct evidence presentation or informational statements
   * 
   * @returns True if more statements remain, false if confrontation complete
   * @emits accusation:statement-advanced
   */
  advanceStatement(): boolean;
  
  /**
   * Cancel the current confrontation
   * Returns player to investigation without counting as failure
   * 
   * @emits accusation:cancelled
   */
  cancelAccusation(): void;
  
  /**
   * Handle successful confrontation completion
   * Triggers victory sequence if correct culprit
   * 
   * @param suspectId - Suspect who was proven guilty
   * @returns Victory sequence data
   * @emits accusation:victory-triggered
   */
  onConfrontationSuccess(suspectId: string): VictorySequenceData;
  
  /**
   * Handle failed confrontation (3 mistakes)
   * Increments failed accusation count
   * Triggers bad ending if 2 failures reached
   * 
   * @param suspectId - Suspect who was incorrectly accused
   * @emits accusation:failed
   * @emits accusation:bad-ending-triggered (if 2nd failure)
   */
  onConfrontationFailed(suspectId: string): void;
  
  /**
   * Get bad ending sequence data
   * 
   * @returns Bad ending data for display
   */
  getBadEndingData(): BadEndingSequenceData;
  
  /**
   * Get the current accusation state
   * 
   * @returns Current state (failures, accused suspects)
   */
  getState(): AccusationState;
  
  /**
   * Load accusation state from save file
   * Called by SaveManager during game load
   * 
   * @param state - Saved accusation state
   */
  loadState(state: AccusationState): void;
  
  /**
   * Reset accusation state after ending
   * Called when player returns to title screen
   */
  resetState(): void;
  
  /**
   * Get list of all suspects that can be accused
   * 
   * @returns Array of suspect NPC IDs
   */
  getAvailableSuspects(): string[];
  
  /**
   * Check if a suspect has already been accused
   * 
   * @param suspectId - NPC ID to check
   * @returns True if suspect was previously accused
   */
  hasSuspectBeenAccused(suspectId: string): boolean;
  
  /**
   * Get the guilty party ID from configuration
   * 
   * @returns NPC ID of the actual culprit
   */
  getGuiltyParty(): string;
  
  /**
   * Clean up resources
   * Called when scene is destroyed
   */
  destroy(): void;
}

/**
 * Concrete implementation class
 * 
 * @example
 * ```typescript
 * export class AccusationManager implements IAccusationManager {
 *   private scene: Phaser.Scene;
 *   private config!: AccusationConfig;
 *   private state: AccusationState;
 *   
 *   constructor(scene: Phaser.Scene) {
 *     this.scene = scene;
 *     this.state = this.getDefaultState();
 *   }
 *   
 *   // ... implement interface methods
 * }
 * ```
 */
