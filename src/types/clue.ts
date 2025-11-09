/**
 * Clue System Type Definitions
 * 
 * Types for clue discovery and management system.
 */

/**
 * Clue state in progression
 */
export type ClueState = 'locked' | 'unlocked' | 'discovered';

/**
 * Complete clue data (runtime representation)
 */
export interface ClueData {
  /** Unique clue identifier */
  id: string;
  
  /** Display name for UI/notebook */
  name: string;
  
  /** Detailed description shown when examined */
  description: string;
  
  /** World position */
  position: {
    x: number;
    y: number;
  };
  
  /** Sprite key for visual representation */
  spriteKey: string;
  
  /** Display width/height for sprite sizing */
  displaySize: {
    width: number;
    height: number;
  };
  
  /** Interaction proximity threshold (pixels) */
  interactionRange: number;
  
  /** Current clue state */
  state: ClueState;
  
  /** Whether clue is immediately accessible after incident */
  initiallyUnlocked: boolean;
  
  /** NPC conversation required to unlock (if not initiallyUnlocked) */
  unlockedBy?: {
    npcId: string;
    tier: number;
  };
  
  /** Summarized notebook entry */
  notebookNote: string;
  
  /** Reference to Phaser sprite (runtime only) */
  sprite?: Phaser.GameObjects.Sprite;
}

/**
 * Clues configuration file structure (clues.json)
 */
export interface CluesConfig {
  /** Config version */
  version: string;
  
  /** Array of clue definitions */
  clues: ClueDefinition[];
}

/**
 * Clue definition as stored in JSON
 */
export interface ClueDefinition {
  id: string;
  name: string;
  description: string;
  position: { x: number; y: number };
  spriteKey: string;
  displaySize: { width: number; height: number };
  interactionRange: number;
  state: ClueState;
  initiallyUnlocked: boolean;
  unlockedBy?: { npcId: string; tier: number };
  notebookNote: string;
}

/**
 * Clue highlight visual state
 */
export interface ClueHighlightState {
  /** Whether highlight is visible */
  visible: boolean;
  
  /** Tint color (locked: 0xaaaaaa, unlocked: 0xffff00) */
  tint: number;
  
  /** Opacity (locked: 0.5, unlocked: 1.0) */
  opacity: number;
  
  /** Pulse animation phase (0-1) */
  pulsePhase: number;
  
  /** Pulse animation speed (locked: slow, unlocked: fast) */
  pulseSpeed: number;
}
