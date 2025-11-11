import Phaser from 'phaser';
import type { Interactable, DialogData } from '../types/dialog';

export interface InteractableObjectConfig {
  scene: Phaser.Scene;
  x: number;
  y: number;
  spriteKey: string;
  id: string;
  description: string;
  interactionRange?: number;
  scale?: number;
}

/**
 * InteractableObject entity - Environmental objects that can be examined
 * 
 * Features:
 * - Sprite-based visual representation
 * - Dialog-based examination messages
 * - Implements Interactable interface
 * - No collision (purely for interaction)
 */
export class InteractableObject extends Phaser.GameObjects.Sprite implements Interactable {
  // Interactable interface properties
  public readonly id: string;
  public readonly interactionRange: number;
  public interactable: boolean = true;
  public readonly dialogData: DialogData;

  constructor(config: InteractableObjectConfig) {
    super(config.scene, config.x, config.y, config.spriteKey);

    this.id = config.id;
    this.interactionRange = config.interactionRange ?? 50;
    
    // Initialize dialog data with description
    this.dialogData = {
      description: config.description
    };

    // Setup sprite
    if (config.scale) {
      this.setScale(config.scale);
    }

    // Add to scene
    config.scene.add.existing(this);
    
    // Add debug visual for interaction range
    const debugCircle = config.scene.add.graphics();
    debugCircle.lineStyle(2, 0xffff00, 0.5);
    debugCircle.strokeCircle(this.x, this.y, this.interactionRange);
    debugCircle.setDepth(5);
    config.scene.add.existing(debugCircle);
  }

  /**
   * Get display height (required by Interactable interface)
   */
  public getDisplayHeight(): number {
    return this.displayHeight;
  }

  /**
   * Update description text (for dynamic objects)
   */
  public setDescription(description: string): void {
    this.dialogData.description = description;
  }

  /**
   * Get current description
   */
  public getDescription(): string {
    return this.dialogData.description ?? 'Nothing special about this.';
  }

  /**
   * Set whether this object can be interacted with
   */
  public setInteractable(value: boolean): void {
    this.interactable = value;
  }
}
