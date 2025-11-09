/**
 * InteractionDetector System Contract
 * 
 * Detects proximity between player and interactable entities.
 * Manages interaction indicators and determines which entity can be interacted with.
 */

import type { Interactable } from './types';

/**
 * InteractionDetector system interface
 * 
 * Responsibilities:
 * - Check distance between player and all interactables
 * - Determine closest in-range interactable
 * - Show/hide interaction indicators
 * - Provide interaction availability status
 */
export interface IInteractionDetector {
  /**
   * Parent Phaser scene reference
   */
  readonly scene: Phaser.Scene;
  
  /**
   * Player entity reference
   */
  readonly player: any; // PlayerCharacter type
  
  /**
   * List of all interactable entities
   */
  readonly interactables: Interactable[];
  
  /**
   * Currently in-range interactable (null if none)
   */
  readonly closestInteractable: Interactable | null;
  
  /**
   * Update proximity detection
   * 
   * Called every frame from scene's update loop.
   * Checks distances and updates indicator visibility.
   */
  update(): void;
  
  /**
   * Check if player can currently interact
   * 
   * @returns True if an interactable is in range
   */
  canInteract(): boolean;
  
  /**
   * Get closest in-range interactable
   * 
   * @returns Interactable entity or null
   */
  getClosestInteractable(): Interactable | null;
  
  /**
   * Register an interactable entity
   * 
   * @param entity - Entity to register
   */
  registerInteractable(entity: Interactable): void;
  
  /**
   * Unregister an interactable entity
   * 
   * @param entity - Entity to unregister
   */
  unregisterInteractable(entity: Interactable): void;
  
  /**
   * Clear all registered interactables
   */
  clearInteractables(): void;
  
  /**
   * Enable/disable detection system
   * 
   * @param enabled - True to enable, false to disable
   */
  setEnabled(enabled: boolean): void;
  
  /**
   * Destroy detector and clean up resources
   */
  destroy(): void;
}

/**
 * InteractionDetector configuration
 */
export interface InteractionDetectorConfig {
  /** Parent Phaser scene */
  scene: Phaser.Scene;
  
  /** Player character reference */
  player: any; // PlayerCharacter type
  
  /** Initial interactable entities (optional) */
  interactables?: Interactable[];
  
  /** Indicator sprite configuration */
  indicatorConfig?: {
    /** Sprite key for indicator icon */
    spriteKey: string;
    
    /** Vertical offset above entity */
    offsetY?: number;
    
    /** Animation duration in ms */
    animationDuration?: number;
  };
  
  /** Distance check optimization settings */
  optimization?: {
    /** Maximum check radius (ignore entities beyond this) */
    maxCheckRadius?: number;
    
    /** Use squared distance to avoid sqrt */
    useSquaredDistance?: boolean;
  };
}

/**
 * Internal methods (not part of public API, documented for implementation)
 */
export interface IInteractionDetectorInternal extends IInteractionDetector {
  /**
   * Calculate distance to all interactables
   * 
   * @returns Array of [entity, distance] tuples
   */
  calculateDistances(): Array<[Interactable, number]>;
  
  /**
   * Find closest in-range entity
   * 
   * @param distances - Array of [entity, distance] tuples
   * @returns Closest entity or null
   */
  findClosest(distances: Array<[Interactable, number]>): Interactable | null;
  
  /**
   * Show indicator for entity
   * 
   * @param entity - Entity to show indicator for
   */
  showIndicator(entity: Interactable): void;
  
  /**
   * Hide current indicator
   */
  hideIndicator(): void;
  
  /**
   * Update indicator position
   * 
   * Called when entity or camera moves.
   */
  updateIndicatorPosition(): void;
  
  /**
   * Create indicator sprite pool
   */
  createIndicatorPool(): void;
}

/**
 * Expected behavior specifications
 */
export const InteractionDetectorBehavior = {
  /**
   * Proximity detection rules
   */
  detection: {
    /** Check every frame for smooth indicator placement */
    updateFrequency: 'every-frame',
    
    /** Prioritize closest entity when multiple in range */
    priorityRule: 'closest-first',
    
    /** Use entity.interactionRange property for threshold */
    rangeSource: 'entity-property',
    
    /** Buffer to prevent indicator flickering */
    hysteresisBuffer: 5, // pixels
  },
  
  /**
   * Distance calculation
   */
  distance: {
    /** Use Euclidean distance */
    method: 'euclidean',
    
    /** Optimize with squared distance (avoid sqrt) */
    useSquared: true,
    
    /** Maximum check radius (optimization) */
    maxRadius: 200, // pixels
  },
  
  /**
   * Indicator behavior
   */
  indicator: {
    /** Show indicator above closest entity only */
    showOnlyClosest: true,
    
    /** Hide indicator when out of range */
    autoHide: true,
    
    /** Follow entity position every frame */
    followEntity: true,
  },
  
  /**
   * Performance optimization
   */
  optimization: {
    /** Skip entities beyond max radius */
    cullDistantEntities: true,
    
    /** Use object pooling for indicators */
    poolIndicators: true,
    
    /** Cache player position reference */
    cachePlayerPosition: true,
  },
};

/**
 * Example usage:
 * 
 * ```typescript
 * const detector = new InteractionDetector({
 *   scene: this,
 *   player: this.player,
 *   indicatorConfig: {
 *     spriteKey: 'interaction-icon',
 *     offsetY: -30,
 *   },
 * });
 * 
 * // Register NPCs and objects
 * this.npcs.forEach(npc => detector.registerInteractable(npc));
 * this.objects.forEach(obj => detector.registerInteractable(obj));
 * 
 * // In scene.update()
 * detector.update();
 * 
 * // Check if player can interact
 * if (detector.canInteract() && interactKeyPressed) {
 *   const entity = detector.getClosestInteractable();
 *   this.dialogManager.open(
 *     entity.dialogData,
 *     entity.type,
 *     entity.id,
 *     entity.name
 *   );
 * }
 * ```
 */

/**
 * Distance calculation helper (for reference)
 * 
 * Use Phaser's built-in distance functions:
 * - Phaser.Math.Distance.Between(x1, y1, x2, y2) - Euclidean distance
 * - Phaser.Math.Distance.Squared(x1, y1, x2, y2) - Squared distance (faster)
 * 
 * Squared distance comparison:
 * ```typescript
 * const distSq = Phaser.Math.Distance.Squared(player.x, player.y, entity.x, entity.y);
 * const rangeSq = entity.interactionRange * entity.interactionRange;
 * if (distSq <= rangeSq) {
 *   // Entity is in range
 * }
 * ```
 */
