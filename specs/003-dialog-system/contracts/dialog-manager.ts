/**
 * DialogManager System Contract
 * 
 * Manages dialog state, coordinates dialog display, and handles input routing.
 * Central orchestrator for all dialog-related functionality.
 */

import type { DialogMessage, DialogData } from './types';
import type { IDialogBox } from './dialog-box';

/**
 * DialogManager system interface
 * 
 * Responsibilities:
 * - Manage dialog open/close state
 * - Control player movement locking
 * - Route input when dialog is active
 * - Maintain dialog history
 * - Coordinate DialogBox display
 */
export interface IDialogManager {
  /**
   * Parent Phaser scene reference
   */
  readonly scene: Phaser.Scene;
  
  /**
   * Current dialog open state
   */
  readonly isDialogOpen: boolean;
  
  /**
   * Currently displayed message (null when closed)
   */
  readonly currentMessage: DialogMessage | null;
  
  /**
   * Dialog history (up to 50 messages)
   */
  readonly dialogHistory: ReadonlyArray<DialogMessage>;
  
  /**
   * Open dialog with message
   * 
   * Creates DialogMessage from DialogData and displays it.
   * Locks player movement.
   * 
   * @param dialogData - Dialog content from character/object
   * @param sourceType - Type of source ('npc' or 'object')
   * @param sourceId - Character ID or object ID
   * @param speakerName - Character name (null for objects)
   * @throws Error if dialog is already open
   */
  open(
    dialogData: DialogData,
    sourceType: 'npc' | 'object',
    sourceId: string,
    speakerName?: string | null
  ): void;
  
  /**
   * Close current dialog
   * 
   * Hides dialog box and unlocks player movement.
   * No-op if dialog is already closed.
   */
  close(): void;
  
  /**
   * Check if dialog is currently open
   * 
   * @returns True if dialog is open
   */
  isOpen(): boolean;
  
  /**
   * Get dialog history
   * 
   * @returns Array of previously displayed messages
   */
  getHistory(): DialogMessage[];
  
  /**
   * Clear dialog history
   */
  clearHistory(): void;
  
  /**
   * Handle input for dialog system
   * 
   * Called from scene's update loop.
   * Routes input based on dialog state.
   */
  handleInput(): void;
  
  /**
   * Destroy dialog manager and clean up resources
   */
  destroy(): void;
}

/**
 * DialogManager configuration
 */
export interface DialogManagerConfig {
  /** Parent Phaser scene */
  scene: Phaser.Scene;
  
  /** Player character reference (for movement locking) */
  player: any; // PlayerCharacter type (avoid circular dependency)
  
  /** Dialog box instance */
  dialogBox: IDialogBox;
  
  /** Interaction keys configuration */
  keys?: {
    /** Open/close dialog keys (default: SPACE, ENTER) */
    interact?: Phaser.Input.Keyboard.Key[];
    
    /** Close-only key (default: ESC) */
    close?: Phaser.Input.Keyboard.Key;
  };
  
  /** Maximum dialog history size (default: 50) */
  maxHistorySize?: number;
}

/**
 * Internal methods (not part of public API, documented for implementation)
 */
export interface IDialogManagerInternal extends IDialogManager {
  /**
   * Create DialogMessage from DialogData
   * 
   * @param dialogData - Dialog content
   * @param sourceType - Source type
   * @param sourceId - Source identifier
   * @param speakerName - Speaker name (optional)
   * @returns Constructed DialogMessage
   */
  createMessage(
    dialogData: DialogData,
    sourceType: 'npc' | 'object',
    sourceId: string,
    speakerName?: string | null
  ): DialogMessage;
  
  /**
   * Add message to history
   * 
   * @param message - Message to add
   */
  addToHistory(message: DialogMessage): void;
  
  /**
   * Lock player movement
   */
  lockPlayerMovement(): void;
  
  /**
   * Unlock player movement
   */
  unlockPlayerMovement(): void;
  
  /**
   * Check if interact key was just pressed
   * 
   * @returns True if interact key pressed this frame
   */
  isInteractKeyPressed(): boolean;
  
  /**
   * Check if close key was just pressed
   * 
   * @returns True if close key pressed this frame
   */
  isCloseKeyPressed(): boolean;
}

/**
 * Expected behavior specifications
 */
export const DialogManagerBehavior = {
  /**
   * State management rules
   */
  state: {
    /** Only one dialog can be open at a time */
    singleDialogOnly: true,
    
    /** Ignore interact key presses when dialog is open */
    ignoreOpenWhileOpen: true,
    
    /** Auto-close handled by scene (distance check) */
    autoCloseOnDistance: true,
  },
  
  /**
   * History management
   */
  history: {
    /** Maximum history size */
    maxSize: 50,
    
    /** Eviction policy when full */
    evictionPolicy: 'FIFO', // Remove oldest
  },
  
  /**
   * Input handling
   */
  input: {
    /** Keys that open/close dialog */
    interactKeys: ['SPACE', 'ENTER'],
    
    /** Key that only closes dialog */
    closeKey: 'ESC',
    
    /** Use JustDown to prevent repeated triggers */
    useJustDown: true,
  },
};

/**
 * Example usage:
 * 
 * ```typescript
 * const dialogManager = new DialogManager({
 *   scene: this,
 *   player: this.player,
 *   dialogBox: this.dialogBox,
 * });
 * 
 * // In scene.update()
 * dialogManager.handleInput();
 * 
 * // When player interacts with NPC
 * const npc = this.closestNPC;
 * dialogManager.open(
 *   npc.metadata.dialog,
 *   'npc',
 *   npc.id,
 *   npc.metadata.name
 * );
 * 
 * // Auto-close on distance (in scene.update())
 * if (dialogManager.isOpen() && distance > threshold) {
 *   dialogManager.close();
 * }
 * ```
 */
