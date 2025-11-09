import Phaser from 'phaser';
import type { InteractionDetectorConfig, Interactable } from '../types/dialog';
import { InteractionIndicator } from '../components/interaction-indicator';

/**
 * InteractionDetector system - Detects proximity between player and interactable entities
 * 
 * Features:
 * - Distance-based proximity detection
 * - Closest entity selection
 * - Automatic indicator management
 * - Efficient distance calculations (squared distance)
 */
export class InteractionDetector {
  private player: any; // PlayerCharacter type
  private interactables: Interactable[] = [];
  private indicator: InteractionIndicator;
  private closestInteractable: Interactable | null = null;
  private enabled: boolean = true;

  constructor(config: InteractionDetectorConfig) {
    this.player = config.player;

    // Create interaction indicator
    this.indicator = new InteractionIndicator({
      scene: config.scene,
      spriteKey: config.indicatorConfig.spriteKey,
      offsetY: config.indicatorConfig.offsetY,
      animationDuration: config.indicatorConfig.animationDuration,
      animationRange: config.indicatorConfig.animationRange,
    });
  }

  /**
   * Register an interactable entity
   */
  public registerInteractable(entity: Interactable): void {
    if (!this.interactables.includes(entity)) {
      this.interactables.push(entity);
    }
  }

  /**
   * Unregister an interactable entity
   */
  public unregisterInteractable(entity: Interactable): void {
    const index = this.interactables.indexOf(entity);
    if (index !== -1) {
      this.interactables.splice(index, 1);
      
      // Hide indicator if it was showing for this entity
      if (this.closestInteractable === entity) {
        this.hideIndicator();
        this.closestInteractable = null;
      }
    }
  }

  /**
   * Update proximity detection (call every frame)
   */
  public update(): void {
    if (!this.enabled) {
      return;
    }

    const distances = this.calculateDistances();
    const closest = this.findClosest(distances);

    if (closest !== this.closestInteractable) {
      // Closest entity changed
      if (this.closestInteractable) {
        this.hideIndicator();
      }
      this.closestInteractable = closest;
      if (this.closestInteractable) {
        this.showIndicator(this.closestInteractable);
      }
    } else if (this.closestInteractable) {
      // Update indicator position (follow entity)
      this.updateIndicatorPosition();
    }
  }

  /**
   * Get the closest interactable entity (or null if none in range)
   */
  public getClosestInteractable(): Interactable | null {
    return this.closestInteractable;
  }

  /**
   * Check if interaction is possible
   */
  public canInteract(): boolean {
    return this.closestInteractable !== null;
  }

  /**
   * Enable/disable proximity detection
   */
  public setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    
    if (!enabled && this.closestInteractable) {
      this.hideIndicator();
      this.closestInteractable = null;
    }
  }

  /**
   * Calculate distances to all interactable entities
   */
  private calculateDistances(): Array<[Interactable, number]> {
    const results: Array<[Interactable, number]> = [];

    for (const entity of this.interactables) {
      if (!entity.interactable) {
        continue;
      }

      // Use squared distance to avoid expensive sqrt calculation
      const distSq = Phaser.Math.Distance.Squared(
        this.player.x,
        this.player.y,
        entity.x,
        entity.y
      );

      // Only include if within range (use squared distance)
      const rangeSq = entity.interactionRange * entity.interactionRange;
      if (distSq <= rangeSq) {
        results.push([entity, Math.sqrt(distSq)]);
      }
    }

    return results;
  }

  /**
   * Find the closest entity from distance list
   */
  private findClosest(distances: Array<[Interactable, number]>): Interactable | null {
    if (distances.length === 0) {
      return null;
    }

    // Sort by distance (ascending)
    distances.sort((a, b) => a[1] - b[1]);
    return distances[0][0];
  }

  /**
   * Show indicator above entity
   */
  private showIndicator(entity: Interactable): void {
    this.indicator.showAbove(entity);
  }

  /**
   * Hide indicator
   */
  private hideIndicator(): void {
    this.indicator.hide();
  }

  /**
   * Update indicator position to follow target
   */
  private updateIndicatorPosition(): void {
    this.indicator.updatePosition();
  }

  /**
   * Destroy and clean up
   */
  public destroy(): void {
    this.indicator.destroy();
    this.interactables = [];
    this.closestInteractable = null;
  }
}
