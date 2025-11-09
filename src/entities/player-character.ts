import Phaser from 'phaser';
import type { PlayerCharacterConfig, Position, WASDKeys } from '../types/scenes';

/**
 * PlayerCharacter entity - controllable player with WASD/Arrow movement
 * 
 * Features:
 * - Top-down 8-directional movement
 * - Diagonal movement normalization
 * - Movement locking capability (for dialogues)
 * - Physics-based collision detection
 */
export class PlayerCharacter extends Phaser.GameObjects.Container {
  private sprite: Phaser.GameObjects.Sprite;
  private speed: number;
  private movementLocked: boolean = false;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasdKeys!: WASDKeys;
  private currentDirection: string = 'south';
  private isMoving: boolean = false;

  constructor(config: PlayerCharacterConfig) {
    super(config.scene, config.x, config.y);

    this.speed = config.speed ?? 150;

    // Create sprite and make it bigger
    this.sprite = config.scene.add.sprite(0, 0, config.spriteKey);
    this.sprite.setScale(2); // Make character 2x bigger
    this.add(this.sprite);

    // Add to scene
    config.scene.add.existing(this);
    this.setDepth(10); // Same as NPCs

    // Enable physics
    config.scene.physics.add.existing(this);
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setCollideWorldBounds(true); // Prevent walking out of scene edges
    body.setSize(56, 56); // Scaled collision box (28 * 2)
    body.setOffset(-28, -28); // Center on container (14 * 2)
    body.setImmovable(true); // Prevent NPCs from pushing the player

    // Setup input
    this.cursors = config.scene.input.keyboard!.createCursorKeys();
    this.wasdKeys = config.scene.input.keyboard!.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
    }) as WASDKeys;
  }

  /**
   * Update player movement based on input
   * Call this every frame from the scene's update() method
   */
  public update(_delta: number): void {
    if (this.movementLocked) return;

    const body = this.body as Phaser.Physics.Arcade.Body;

    // Check input from both arrow keys and WASD
    const left = this.cursors.left.isDown || this.wasdKeys.left.isDown;
    const right = this.cursors.right.isDown || this.wasdKeys.right.isDown;
    const up = this.cursors.up.isDown || this.wasdKeys.up.isDown;
    const down = this.cursors.down.isDown || this.wasdKeys.down.isDown;

    let velocityX = 0;
    let velocityY = 0;

    if (left) velocityX = -this.speed;
    if (right) velocityX = this.speed;
    if (up) velocityY = -this.speed;
    if (down) velocityY = this.speed;

    // Normalize diagonal movement (prevent faster diagonal speed)
    if (velocityX !== 0 && velocityY !== 0) {
      const factor = Math.sqrt(2) / 2; // ~0.707
      velocityX *= factor;
      velocityY *= factor;
    }

    body.setVelocity(velocityX, velocityY);

    // Update animation based on movement
    const moving = velocityX !== 0 || velocityY !== 0;
    if (moving) {
      this.isMoving = true;
      const direction = this.getDirectionFromVelocity(velocityX, velocityY);
      this.updateAnimation(direction);
    } else if (this.isMoving) {
      // Just stopped moving
      this.isMoving = false;
      this.stopAnimation();
    }
  }

  /**
   * Get the 8-directional direction string from velocity
   */
  private getDirectionFromVelocity(vx: number, vy: number): string {
    // Determine angle in radians
    const angle = Math.atan2(vy, vx);
    // Convert to degrees and normalize to 0-360
    let degrees = (angle * 180 / Math.PI + 360) % 360;
    
    // Map to 8 directions (45 degree segments)
    // East = 0°, South-East = 45°, South = 90°, etc.
    if (degrees >= 337.5 || degrees < 22.5) return 'east';
    if (degrees >= 22.5 && degrees < 67.5) return 'south-east';
    if (degrees >= 67.5 && degrees < 112.5) return 'south';
    if (degrees >= 112.5 && degrees < 157.5) return 'south-west';
    if (degrees >= 157.5 && degrees < 202.5) return 'west';
    if (degrees >= 202.5 && degrees < 247.5) return 'north-west';
    if (degrees >= 247.5 && degrees < 292.5) return 'north';
    return 'north-east'; // 292.5 to 337.5
  }

  /**
   * Update the character animation based on direction
   */
  private updateAnimation(direction: string): void {
    if (direction === this.currentDirection) {
      // Already playing correct animation
      if (!this.sprite.anims.isPlaying) {
        this.sprite.play(`klaus-walk-${direction}`, true);
      }
      return;
    }

    this.currentDirection = direction;
    const animKey = `klaus-walk-${direction}`;
    
    // Check if animation exists
    if (this.scene.anims.exists(animKey)) {
      this.sprite.play(animKey, true);
    } else {
      // Fallback to idle sprite
      const idleKey = `klaus-idle-${direction}`;
      if (this.scene.textures.exists(idleKey)) {
        this.sprite.setTexture(idleKey);
      }
    }
  }

  /**
   * Stop the walk animation and show idle frame
   */
  private stopAnimation(): void {
    this.sprite.stop();
    const idleKey = `klaus-idle-${this.currentDirection}`;
    if (this.scene.textures.exists(idleKey)) {
      this.sprite.setTexture(idleKey);
    }
  }

  /**
   * Disable player movement (e.g., during dialogue or cutscene)
   */
  public lockMovement(): void {
    this.movementLocked = true;
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(0, 0);
    
    // Stop animation and show idle frame
    if (this.isMoving) {
      this.isMoving = false;
      this.stopAnimation();
    }
  }

  /**
   * Re-enable player movement
   */
  public unlockMovement(): void {
    this.movementLocked = false;
  }

  /**
   * Get current player position
   */
  public getPosition(): Position {
    return { x: this.x, y: this.y };
  }

  /**
   * Set player position (for spawn/teleport)
   */
  public setPosition(x: number, y: number): this {
    super.setPosition(x, y);
    return this;
  }

  /**
   * Get player sprite for external access
   */
  public getSprite(): Phaser.GameObjects.Sprite {
    return this.sprite;
  }

  /**
   * Check if player movement is currently locked
   */
  public isMovementLocked(): boolean {
    return this.movementLocked;
  }

  /**
   * Get current movement speed
   */
  public getSpeed(): number {
    return this.speed;
  }

  /**
   * Set movement speed
   */
  public setSpeed(speed: number): void {
    this.speed = speed;
  }

  /**
   * Make player face towards a specific position
   */
  public faceTowards(targetX: number, targetY: number): void {
    const angle = Phaser.Math.Angle.Between(this.x, this.y, targetX, targetY);
    const direction = this.getDirectionFromAngle(angle);
    this.currentDirection = direction;
    
    // Update sprite to idle frame in that direction
    const idleKey = `klaus-idle-${direction}`;
    if (this.scene.textures.exists(idleKey)) {
      this.sprite.setTexture(idleKey);
    }
  }

  /**
   * Get the 8-directional direction string from an angle
   */
  private getDirectionFromAngle(angle: number): string {
    let degrees = (angle * 180 / Math.PI + 360) % 360;
    
    if (degrees >= 337.5 || degrees < 22.5) return 'east';
    if (degrees >= 22.5 && degrees < 67.5) return 'south-east';
    if (degrees >= 67.5 && degrees < 112.5) return 'south';
    if (degrees >= 112.5 && degrees < 157.5) return 'south-west';
    if (degrees >= 157.5 && degrees < 202.5) return 'west';
    if (degrees >= 202.5 && degrees < 247.5) return 'north-west';
    if (degrees >= 247.5 && degrees < 292.5) return 'north';
    return 'north-east';
  }
}
