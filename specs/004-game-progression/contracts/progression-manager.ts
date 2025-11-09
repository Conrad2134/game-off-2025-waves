/**
 * API Contract: GameProgressionManager
 * 
 * Manages the overall game progression state including phases, NPC introductions,
 * and incident triggers. This is the central authority for progression logic.
 */

import type Phaser from 'phaser';
import type { GamePhase, InvestigationProgress, ProgressionSaveData } from './progression-types';

export interface GameProgressionManagerConfig {
  /** Parent Phaser scene */
  scene: Phaser.Scene;
  
  /** Registry key for singleton access (default: 'progressionManager') */
  registryKey?: string;
  
  /** LocalStorage key for persistence (default: 'erdbeerstrudel-progression') */
  storageKey?: string;
  
  /** Auto-save debounce delay in ms (default: 2000) */
  saveDebounceMs?: number;
}

export interface IGameProgressionManager extends Phaser.Events.EventEmitter {
  /**
   * Initialize the manager, load saved state if available
   * @throws Error if progression.json is malformed
   */
  initialize(): void;
  
  /**
   * Get the current game phase
   * @returns Current phase ('pre-incident' or 'post-incident')
   */
  getCurrentPhase(): GamePhase;
  
  /**
   * Get complete investigation progress snapshot
   * @returns Current progress state (not live reference)
   */
  getProgress(): InvestigationProgress;
  
  /**
   * Get count of discovered clues
   * @returns Number of clues discovered (0-5+)
   */
  getDiscoveredClueCount(): number;
  
  /**
   * Get current dialog tier based on clue count
   * @returns Dialog tier (0-3)
   */
  getDialogTier(): number;
  
  /**
   * Mark an NPC as introduced (player has talked to them)
   * @param npcId - NPC character ID
   * @emits 'npc-introduced' with { npcId }
   */
  markNPCIntroduced(npcId: string): void;
  
  /**
   * Check if all required NPCs have been introduced
   * @returns True if incident trigger condition met
   */
  areAllNPCsIntroduced(): boolean;
  
  /**
   * Trigger the incident phase transition
   * Called automatically after all NPCs introduced + delay
   * @emits 'incident-triggered'
   * @emits 'phase-changed' with { phase: 'post-incident' }
   */
  triggerIncident(): void;
  
  /**
   * Increment conversation counter for an NPC at a specific tier
   * Used for follow-up dialog selection
   * @param npcId - NPC character ID
   * @param tier - Dialog tier (0-3)
   */
  recordConversation(npcId: string, tier: number): void;
  
  /**
   * Get conversation count for an NPC at a specific tier
   * @param npcId - NPC character ID
   * @param tier - Dialog tier (0-3)
   * @returns Number of times this conversation has occurred
   */
  getConversationCount(npcId: string, tier: number): number;
  
  /**
   * Manually save current state to LocalStorage
   * Automatically called on state changes (debounced)
   */
  save(): void;
  
  /**
   * Load state from LocalStorage
   * @returns Loaded data or null if not found/invalid
   */
  load(): ProgressionSaveData | null;
  
  /**
   * Clear all progression state (reset to fresh game)
   * @emits 'progression-reset'
   */
  reset(): void;
  
  /**
   * Destroy the manager and clean up resources
   */
  destroy(): void;
}

/**
 * Events emitted by GameProgressionManager
 */
export interface GameProgressionManagerEvents {
  /**
   * Emitted when game phase changes
   * @param data - { phase: GamePhase, previousPhase: GamePhase }
   */
  'phase-changed': (data: { phase: GamePhase; previousPhase: GamePhase }) => void;
  
  /**
   * Emitted when an NPC is marked as introduced
   * @param data - { npcId: string }
   */
  'npc-introduced': (data: { npcId: string }) => void;
  
  /**
   * Emitted when the incident is triggered
   * @param data - { timestamp: number }
   */
  'incident-triggered': (data: { timestamp: number }) => void;
  
  /**
   * Emitted when a conversation is recorded
   * @param data - { npcId: string, tier: number, count: number }
   */
  'conversation-recorded': (data: { npcId: string; tier: number; count: number }) => void;
  
  /**
   * Emitted when progression state is reset
   */
  'progression-reset': () => void;
  
  /**
   * Emitted when state is saved to LocalStorage
   * @param data - { success: boolean, error?: string }
   */
  'save-complete': (data: { success: boolean; error?: string }) => void;
}

/**
 * Factory function to create GameProgressionManager
 * Ensures singleton via scene registry
 */
export function createGameProgressionManager(
  config: GameProgressionManagerConfig
): IGameProgressionManager {
  throw new Error('Implementation required');
}

/**
 * Retrieve existing GameProgressionManager from scene registry
 * @param scene - Phaser scene
 * @param registryKey - Registry key (default: 'progressionManager')
 * @returns Manager instance or null if not initialized
 */
export function getGameProgressionManager(
  scene: Phaser.Scene,
  registryKey?: string
): IGameProgressionManager | null {
  return scene.registry.get(registryKey ?? 'progressionManager') ?? null;
}
