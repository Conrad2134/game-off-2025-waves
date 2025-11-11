/**
 * Save System Type Definitions
 * 
 * Defines the complete game state structure for save/load functionality.
 */

import type { NotebookEntry } from './notebook';

/**
 * Character position and state
 */
export interface CharacterSaveState {
  /** Character ID */
  id: string;
  
  /** World position X */
  x: number;
  
  /** World position Y */
  y: number;
  
  /** Facing direction (for sprite) */
  direction: string;
  
  /** Whether character has been introduced */
  introduced: boolean;
}

/**
 * Player-specific state
 */
export interface PlayerSaveState {
  /** World position X */
  x: number;
  
  /** World position Y */
  y: number;
  
  /** Facing direction */
  direction: string;
}

/**
 * Complete game save data
 */
export interface GameSaveData {
  /** Save data version for migration */
  version: string;
  
  /** Save timestamp */
  timestamp: number;
  
  /** Player state */
  player: PlayerSaveState;
  
  /** NPC states */
  npcs: CharacterSaveState[];
  
  /** Current game phase */
  currentPhase: 'pre-incident' | 'post-incident';
  
  /** Set of NPC IDs the player has been introduced to */
  introducedNPCs: string[];
  
  /** Set of clue IDs the player has discovered */
  discoveredClues: string[];
  
  /** Set of clue IDs that are unlocked (investigable) */
  unlockedClues: string[];
  
  /** Conversation counters per NPC per tier */
  conversationHistory: Record<string, Record<number, number>>;
  
  /** Whether the opening scene has been played */
  hasPlayedOpeningScene: boolean;
  
  /** Whether the incident cutscene has been played */
  hasPlayedIncident: boolean;
  
  /** Notebook entries that have been added */
  notebookEntries: NotebookEntry[];
}

/**
 * Save/load result
 */
export interface SaveResult {
  success: boolean;
  error?: string;
}
