/**
 * Shared type definitions for the Dialog System
 * 
 * These types are used across all dialog system components and define
 * the data structures for dialog messages, configuration, and state.
 */

/**
 * Type of dialog message source
 */
export type DialogMessageType = 'npc' | 'object';

/**
 * Configuration for DialogBox component initialization
 */
export interface DialogBoxConfig {
  /** Parent Phaser scene */
  scene: Phaser.Scene;
  
  /** Screen X position (fixed to camera) */
  x: number;
  
  /** Screen Y position (fixed to camera) */
  y: number;
  
  /** Dialog box width in pixels */
  width: number;
  
  /** Dialog box height in pixels */
  height: number;
  
  /** Internal padding in pixels (default: 20) */
  padding?: number;
  
  /** Background fill color (default: 0x000000) */
  backgroundColor?: number;
  
  /** Border color (default: 0xffffff) */
  borderColor?: number;
  
  /** Border width in pixels (default: 4) */
  borderWidth?: number;
  
  /** Rendering depth (default: 1000) */
  depth?: number;
}

/**
 * A single unit of dialog content
 */
export interface DialogMessage {
  /** Character name (null for objects) */
  speaker: string | null;
  
  /** Dialog text content (max 500 chars) */
  message: string;
  
  /** Message source type */
  type: DialogMessageType;
  
  /** Character identifier (for NPCs) */
  characterId: string | null;
  
  /** Object identifier (for interactables) */
  objectId: string | null;
}

/**
 * Dialog content stored in character metadata or object definitions
 */
export interface DialogData {
  /** Introduction message (for NPCs) */
  introduction?: string;
  
  /** Object description (for interactables) */
  description?: string;
  
  /** Future: Branching conversation trees */
  conversations?: Record<string, ConversationNode>;
}

/**
 * Future: Conversation node for branching dialog
 */
export interface ConversationNode {
  message: string;
  choices?: DialogChoice[];
  nextId?: string | null;
  condition?: string;
}

/**
 * Future: Dialog choice for player responses
 */
export interface DialogChoice {
  text: string;
  nextId: string;
}

/**
 * Shared interface for entities that can be interacted with
 */
export interface Interactable {
  /** Unique entity identifier */
  id: string;
  
  /** World X position */
  x: number;
  
  /** World Y position */
  y: number;
  
  /** Proximity threshold in pixels */
  interactionRange: number;
  
  /** Whether entity can be interacted with */
  interactable: boolean;
  
  /** Dialog content reference */
  dialogData: DialogData;
  
  /** Display height for indicator positioning */
  displayHeight: number;
}

/**
 * Configuration for InteractionIndicator component
 */
export interface InteractionIndicatorConfig {
  /** Parent Phaser scene */
  scene: Phaser.Scene;
  
  /** Icon sprite key */
  spriteKey: string;
  
  /** Vertical offset above entity (default: -30) */
  offsetY?: number;
  
  /** Bob animation duration in ms (default: 800) */
  animationDuration?: number;
  
  /** Bob animation range in pixels (default: 5) */
  animationRange?: number;
}

/**
 * Character metadata JSON structure
 */
export interface CharacterMetadata {
  name: string;
  description: string;
  animations: Record<string, unknown>;
  dialog: DialogData;
}

/**
 * Validation result for dialog content
 */
export interface DialogValidationResult {
  valid: boolean;
  errors: string[];
}
