/**
 * Extensions to Existing Dialog System
 * 
 * These interfaces extend the existing dialog system contracts
 * from specs/003-dialog-system/contracts/ to support phase-based
 * dialog selection and clue unlocking.
 */

import type { DialogData, DialogMessage } from '../../../src/types/dialog';
import type { DialogTier, GamePhase } from './progression-types';
import type { IGameProgressionManager } from './progression-manager';
import type { IClueTracker } from './clue-tracker';

/**
 * Extended DialogManager interface (additions only)
 * 
 * Existing methods from 003-dialog-system remain unchanged.
 * These are NEW methods added for progression support.
 */
export interface IDialogManagerExtensions {
  /**
   * Set reference to GameProgressionManager
   * Must be called during LibraryScene initialization
   * @param manager - Progression manager instance
   */
  setProgressionManager(manager: IGameProgressionManager): void;
  
  /**
   * Set reference to ClueTracker
   * Must be called during LibraryScene initialization
   * @param tracker - Clue tracker instance
   */
  setClueTracker(tracker: IClueTracker): void;
  
  /**
   * Select appropriate dialog content for an NPC based on phase and progress
   * @param characterId - NPC character ID
   * @param phase - Current game phase
   * @param dialogTier - Current dialog tier (based on clue count)
   * @returns Dialog data to display
   */
  selectDialog(
    characterId: string,
    phase: GamePhase,
    dialogTier: number
  ): DialogData;
  
  /**
   * Handle post-dialog actions (clue unlocking, notebook recording)
   * Called automatically after dialog closes
   * @param characterId - NPC who was just in conversation
   * @param dialogTier - Tier of dialog that was shown
   */
  handlePostDialogActions(characterId: string, dialogTier: number): void;
}

/**
 * Extended InteractionDetector interface (additions only)
 * 
 * Existing methods from 003-dialog-system remain unchanged.
 * These are NEW methods added for clue state filtering.
 */
export interface IInteractionDetectorExtensions {
  /**
   * Set reference to ClueTracker
   * Must be called during LibraryScene initialization
   * @param tracker - Clue tracker instance
   */
  setClueTracker(tracker: IClueTracker): void;
  
  /**
   * Check if an entity can be interacted with based on progression state
   * Overrides base canInteract() for clue objects
   * @param entityId - Entity to check
   * @returns True if interaction allowed
   */
  canInteractWithEntity(entityId: string): boolean;
}

/**
 * Extended DialogData for phase-based content
 * 
 * This extends the existing DialogData interface to support
 * multi-phase dialog selection.
 */
export interface PhaseBasedDialogData extends DialogData {
  /** Introduction dialog (pre-incident phase) */
  introduction?: {
    lines: string[];
    recordInNotebook: boolean;
    notebookNote?: string;
  };
  
  /** Post-incident dialog tiers */
  postIncident?: DialogTier[];
}

/**
 * Dialog selection result
 */
export interface DialogSelectionResult {
  /** Selected dialog tier */
  tier: DialogTier | null;
  
  /** Whether this is a follow-up conversation (not first time) */
  isFollowUp: boolean;
  
  /** Conversation count at this tier */
  conversationCount: number;
  
  /** Lines to display (either tier.lines or tier.followUpLines) */
  linesToDisplay: string[];
}

/**
 * Conversation history entry
 */
export interface ConversationHistoryEntry {
  /** NPC character ID */
  npcId: string;
  
  /** Dialog tier */
  tier: number;
  
  /** Game phase when conversation occurred */
  phase: GamePhase;
  
  /** Timestamp */
  timestamp: number;
}
