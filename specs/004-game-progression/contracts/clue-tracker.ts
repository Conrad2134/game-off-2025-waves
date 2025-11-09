/**
 * API Contract: ClueTracker
 * 
 * Manages clue discovery state, unlock conditions, and visual representations.
 * Works closely with InteractionDetector and GameProgressionManager.
 */

import type Phaser from 'phaser';
import type { ClueData, ClueState } from './clue-types';

export interface ClueTrackerConfig {
  /** Parent Phaser scene */
  scene: Phaser.Scene;
  
  /** Registry key for singleton access (default: 'clueTracker') */
  registryKey?: string;
  
  /** Path to clues.json data file (default: 'src/data/clues.json') */
  cluesDataPath?: string;
}

export interface IClueTracker extends Phaser.Events.EventEmitter {
  /**
   * Initialize the tracker, load clues from JSON, spawn visual representations
   * @throws Error if clues.json is malformed or validation fails
   */
  initialize(): void;
  
  /**
   * Get all clues (returns defensive copy)
   * @returns Array of all clue data
   */
  getAllClues(): ClueData[];
  
  /**
   * Get a specific clue by ID
   * @param clueId - Clue identifier
   * @returns Clue data or null if not found
   */
  getClueById(clueId: string): ClueData | null;
  
  /**
   * Get all clues in a specific state
   * @param state - Target clue state
   * @returns Array of clues in that state
   */
  getCluesByState(state: ClueState): ClueData[];
  
  /**
   * Get IDs of all discovered clues
   * @returns Array of clue IDs
   */
  getDiscoveredIds(): string[];
  
  /**
   * Get IDs of all unlocked (investigable) clues
   * @returns Array of clue IDs
   */
  getUnlockedIds(): string[];
  
  /**
   * Unlock a clue (transition from locked to unlocked)
   * Called by DialogManager after certain NPC conversations
   * @param clueId - Clue identifier
   * @emits 'clue-unlocked' with { clueId }
   * @throws Error if clue already unlocked or doesn't exist
   */
  unlockClue(clueId: string): void;
  
  /**
   * Discover a clue (transition from unlocked to discovered)
   * Called by InteractionDetector when player examines clue
   * @param clueId - Clue identifier
   * @emits 'clue-discovered' with { clueId, clue: ClueData }
   * @throws Error if clue is locked or already discovered
   */
  discoverClue(clueId: string): void;
  
  /**
   * Check if a clue can be interacted with
   * @param clueId - Clue identifier
   * @returns True if clue is unlocked (not locked or discovered)
   */
  canInteract(clueId: string): boolean;
  
  /**
   * Restore clue states from saved data
   * Called during game load
   * @param unlockedIds - IDs of clues that should be unlocked
   * @param discoveredIds - IDs of clues that should be discovered
   */
  restoreState(unlockedIds: string[], discoveredIds: string[]): void;
  
  /**
   * Update visual representations (called every frame)
   * Handles highlight animations for locked/unlocked states
   * @param delta - Frame delta time in ms
   */
  update(delta: number): void;
  
  /**
   * Destroy the tracker and clean up all clue sprites
   */
  destroy(): void;
}

/**
 * Events emitted by ClueTracker
 */
export interface ClueTrackerEvents {
  /**
   * Emitted when a clue is unlocked (becomes investigable)
   * @param data - { clueId: string, clue: ClueData }
   */
  'clue-unlocked': (data: { clueId: string; clue: ClueData }) => void;
  
  /**
   * Emitted when a clue is discovered (player examines it)
   * @param data - { clueId: string, clue: ClueData }
   */
  'clue-discovered': (data: { clueId: string; clue: ClueData }) => void;
  
  /**
   * Emitted when clue state is restored from save data
   * @param data - { unlockedCount: number, discoveredCount: number }
   */
  'state-restored': (data: { unlockedCount: number; discoveredCount: number }) => void;
}

/**
 * Factory function to create ClueTracker
 * Ensures singleton via scene registry
 */
export function createClueTracker(config: ClueTrackerConfig): IClueTracker {
  throw new Error('Implementation required');
}

/**
 * Retrieve existing ClueTracker from scene registry
 * @param scene - Phaser scene
 * @param registryKey - Registry key (default: 'clueTracker')
 * @returns Tracker instance or null if not initialized
 */
export function getClueTracker(
  scene: Phaser.Scene,
  registryKey?: string
): IClueTracker | null {
  return scene.registry.get(registryKey ?? 'clueTracker') ?? null;
}
