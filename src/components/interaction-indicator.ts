import Phaser from 'phaser';
import type { InteractionIndicatorConfig, Interactable } from '../types/dialog';

/**
 * InteractionIndicator component - Visual cue shown above interactable entities
 * 
 * Features:
 * - Simple sprite-based indicator
 * - Gentle bob animation
 * - Follows target entity position
 * - Show/hide based on proximity
 */
export class InteractionIndicator {
  private scene: Phaser.Scene;
  private sprite: Phaser.GameObjects.Sprite | Phaser.GameObjects.Graphics;
  private targetEntity: Interactable | null = null;
  private offsetY: number;
  private animation: Phaser.Tweens.Tween | null = null;

  constructor(config: InteractionIndicatorConfig) {
    this.scene = config.scene;
    this.offsetY = config.offsetY ?? -20;

    // Try to create sprite from asset, or create a simple placeholder
    if (this.scene.textures.exists(config.spriteKey)) {
      this.sprite = this.scene.add.sprite(0, 0, config.spriteKey);
    } else {
      // Create simple placeholder graphics (speech bubble icon)
      const graphics = this.scene.add.graphics();
      graphics.fillStyle(0xffffff, 1);
      graphics.fillCircle(0, 0, 8);
      graphics.fillStyle(0xffffff, 1);
      graphics.fillTriangle(-4, 8, 4, 8, 0, 12);
      graphics.generateTexture('interaction-icon-placeholder', 16, 16);
      graphics.destroy();

      this.sprite = this.scene.add.sprite(0, 0, 'interaction-icon-placeholder');
      console.log('InteractionIndicator: Using generated placeholder icon');
    }

    this.sprite.setVisible(false);
    this.sprite.setDepth(999); // Just below dialog box

    // Create bob animation
    const animationDuration = config.animationDuration ?? 800;
    const animationRange = config.animationRange ?? 5;

    this.animation = this.scene.tweens.add({
      targets: this.sprite,
      y: `+=${animationRange}`,
      duration: animationDuration,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  /**
   * Show indicator above an entity
   */
  public showAbove(entity: Interactable): void {
    this.targetEntity = entity;
    this.updatePosition();
    this.sprite.setVisible(true);
    
    if (this.animation) {
      this.animation.resume();
    }
  }

  /**
   * Hide the indicator
   */
  public hide(): void {
    this.sprite.setVisible(false);
    this.targetEntity = null;
    
    if (this.animation) {
      this.animation.pause();
    }
  }

  /**
   * Update indicator position to follow target entity
   */
  public updatePosition(): void {
    if (this.targetEntity) {
      this.sprite.setPosition(
        this.targetEntity.x,
        this.targetEntity.y - this.targetEntity.getDisplayHeight() / 2 + this.offsetY
      );
    }
  }

  /**
   * Check if indicator is currently visible
   */
  public isVisible(): boolean {
    return this.sprite.visible;
  }

  /**
   * Get the current target entity
   */
  public getTarget(): Interactable | null {
    return this.targetEntity;
  }

  /**
   * Destroy the indicator and clean up resources
   */
  public destroy(): void {
    if (this.animation) {
      this.animation.remove();
      this.animation = null;
    }
    this.sprite.destroy();
  }
}
