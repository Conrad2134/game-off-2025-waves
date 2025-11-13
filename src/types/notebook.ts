/**
 * Type definitions for the Notebook System
 * 
 * The notebook tracks important conversations and clues discovered by the player.
 * Entries are automatically added when dialogs/clues are marked as recordInNotebook.
 */

/**
 * Category of notebook entry
 */
export type NotebookCategory = 'npc' | 'clue';

/**
 * A single entry in the notebook
 */
export interface NotebookEntry {
  /** Unique identifier for this entry */
  id: string;
  
  /** Entry category (NPC conversation or clue) */
  category: NotebookCategory;
  
  /** Source identifier (character ID or object ID) */
  sourceId: string;
  
  /** Display name (character name or object name) */
  sourceName: string;
  
  /** The recorded text */
  text: string;
  
  /** Timestamp when this entry was recorded */
  timestamp: number;
  
  /** Clue ID (for clue entries, used in confrontation mode) */
  clueId?: string;
}

/**
 * Notebook entry grouped by source for display
 */
export interface NotebookSection {
  /** Source identifier */
  sourceId: string;
  
  /** Display name */
  sourceName: string;
  
  /** Category */
  category: NotebookCategory;
  
  /** All entries from this source */
  entries: NotebookEntry[];
}

/**
 * Configuration for NotebookUI component
 */
export interface NotebookUIConfig {
  /** Parent Phaser scene */
  scene: Phaser.Scene;
  
  /** Screen X position */
  x?: number;
  
  /** Screen Y position */
  y?: number;
  
  /** Notebook width in pixels (default: 800) */
  width?: number;
  
  /** Notebook height in pixels (default: 600) */
  height?: number;
  
  /** Rendering depth (default: 2000) */
  depth?: number;
  
  /** Background color (default: 0xf5e6d3) */
  backgroundColor?: number;
  
  /** Border color (default: 0x8b4513) */
  borderColor?: number;
}

/**
 * Configuration for NotebookManager system
 */
export interface NotebookManagerConfig {
  /** Parent Phaser scene */
  scene: Phaser.Scene;
  
  /** Maximum entries to store (default: 100) */
  maxEntries?: number;
}
