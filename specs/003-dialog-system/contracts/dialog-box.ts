/**
 * DialogBox Component Contract
 * 
 * Visual container that displays character speech or object descriptions.
 * Handles text rendering, word wrapping, and visual presentation.
 */

import type { DialogBoxConfig, DialogMessage } from './types';

/**
 * DialogBox component interface
 * 
 * Responsibilities:
 * - Render dialog box background and border
 * - Display speaker name (if present)
 * - Render and wrap message text
 * - Handle show/hide animations
 * - Maintain pixel-perfect positioning
 */
export interface IDialogBox {
  /**
   * Parent Phaser scene reference
   */
  readonly scene: Phaser.Scene;
  
  /**
   * Container for all dialog box visual elements
   */
  readonly container: Phaser.GameObjects.Container;
  
  /**
   * Current visibility state
   */
  readonly visible: boolean;
  
  /**
   * Currently displayed message (null when hidden)
   */
  readonly currentMessage: DialogMessage | null;
  
  /**
   * Show dialog box with message content
   * 
   * @param message - Dialog message to display
   * @throws Error if message validation fails
   */
  show(message: DialogMessage): void;
  
  /**
   * Hide dialog box
   */
  hide(): void;
  
  /**
   * Update text content without hiding/showing
   * 
   * @param message - New dialog message
   */
  updateContent(message: DialogMessage): void;
  
  /**
   * Set dialog box position (screen coordinates)
   * 
   * @param x - Screen X position
   * @param y - Screen Y position
   */
  setPosition(x: number, y: number): void;
  
  /**
   * Destroy dialog box and clean up resources
   */
  destroy(): void;
}

/**
 * DialogBox factory function signature
 * 
 * @param config - Dialog box configuration
 * @returns Initialized dialog box instance
 */
export type CreateDialogBox = (config: DialogBoxConfig) => IDialogBox;

/**
 * Internal methods (not part of public API, documented for implementation)
 */
export interface IDialogBoxInternal extends IDialogBox {
  /**
   * Create background graphics (rectangle with border)
   */
  createBackground(): void;
  
  /**
   * Create text objects (speaker name and message)
   */
  createTextObjects(): void;
  
  /**
   * Validate message content
   * 
   * @param message - Message to validate
   * @returns True if valid, false otherwise
   */
  validateMessage(message: DialogMessage): boolean;
  
  /**
   * Calculate wrapped text lines
   * 
   * @param text - Text to wrap
   * @param maxWidth - Maximum width in pixels
   * @returns Array of text lines
   */
  wrapText(text: string, maxWidth: number): string[];
  
  /**
   * Apply pixel-perfect positioning (round to integers)
   */
  snapToPixelGrid(): void;
}

/**
 * Expected behavior specifications
 */
export const DialogBoxBehavior = {
  /**
   * Text rendering requirements
   */
  text: {
    /** Maximum message length in characters */
    maxLength: 500,
    
    /** Font family (web font or bitmap font) */
    fontFamily: 'Arial, sans-serif',
    
    /** Font size in pixels */
    fontSize: 16,
    
    /** Line height multiplier */
    lineHeight: 1.2,
    
    /** Text color (hex) */
    color: '#ffffff',
    
    /** Text resolution for crisp rendering */
    resolution: 2,
  },
  
  /**
   * Layout specifications
   */
  layout: {
    /** Default width in pixels */
    defaultWidth: 900,
    
    /** Default height in pixels */
    defaultHeight: 150,
    
    /** Default padding in pixels */
    defaultPadding: 20,
    
    /** Speaker name area height in pixels */
    speakerHeight: 30,
    
    /** Message area top offset in pixels */
    messageTopOffset: 40,
  },
  
  /**
   * Visual styling
   */
  style: {
    /** Default background color */
    backgroundColor: 0x000000,
    
    /** Default border color */
    borderColor: 0xffffff,
    
    /** Default border width */
    borderWidth: 4,
    
    /** Background alpha (0-1) */
    backgroundAlpha: 0.85,
  },
  
  /**
   * Animation specifications
   */
  animation: {
    /** Fade in duration (ms) */
    fadeInDuration: 200,
    
    /** Fade out duration (ms) */
    fadeOutDuration: 150,
  },
};

/**
 * Example usage:
 * 
 * ```typescript
 * const dialogBox = createDialogBox({
 *   scene: this,
 *   x: 512,
 *   y: 680,
 *   width: 900,
 *   height: 150,
 * });
 * 
 * dialogBox.show({
 *   speaker: "Valentin",
 *   message: "Guten Tag! I am Valentin...",
 *   type: "npc",
 *   characterId: "valentin",
 *   objectId: null,
 * });
 * 
 * // Later...
 * dialogBox.hide();
 * ```
 */
