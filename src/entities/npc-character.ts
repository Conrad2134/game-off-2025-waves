import Phaser from 'phaser';
import type { Interactable, DialogData, CharacterMetadata } from '../types/dialog';

export interface NPCCharacterConfig {
  scene: Phaser.Scene;
  x: number;
  y: number;
  characterName: string; // e.g., 'valentin', 'sebastian'
  metadata?: CharacterMetadata; // Character metadata including dialog
  speed?: number;
  wanderRadius?: number;
  startPaused?: boolean; // Start with movement paused (for cutscenes)
}

/**
 * NPCCharacter entity - autonomous NPC with wandering behavior
 * 
 * Features:
 * - Automatic wandering within a radius
 * - 8-directional movement and animations
 * - Idle periods between movements
 * - Collision detection
 * - Interactable dialog system
 */
export class NPCCharacter extends Phaser.GameObjects.Container implements Interactable {
  private sprite: Phaser.GameObjects.Sprite;
  private characterName: string;
  private speed: number;
  private wanderRadius: number;
  private homePosition: { x: number; y: number };
  private currentDirection: string = 'south';
  private isMoving: boolean = false;
  private targetPosition: { x: number; y: number } | null = null;
  private idleTimer: number = 0;
  private moveTimer: number = 0;
  private isPaused: boolean = false; // Pause movement during dialog

  // Interactable interface properties
  public readonly id: string;
  public readonly interactionRange: number = 80; // Increased from 50 for easier interaction
  public readonly interactable: boolean = true;
  public readonly dialogData: DialogData;
  public readonly metadata: CharacterMetadata | null = null;

  constructor(config: NPCCharacterConfig) {
    super(config.scene, config.x, config.y);

    this.characterName = config.characterName;
    this.speed = config.speed ?? 80;
    this.wanderRadius = config.wanderRadius ?? 200;
    this.homePosition = { x: config.x, y: config.y };

    // Interactable interface initialization
    this.id = config.characterName;
    this.metadata = config.metadata ?? null;
    
    // Initialize dialog data with fallback
    if (this.metadata && this.metadata.dialog) {
      this.dialogData = this.metadata.dialog;
    } else {
      // Fallback dialog if metadata not provided
      this.dialogData = {
        introduction: `Hello, I'm ${config.characterName}.`
      };
      console.warn(`NPCCharacter: No metadata provided for ${config.characterName}, using fallback dialog`);
    }

    // Create sprite
    const spriteKey = `${config.characterName}-idle-south`;
    this.sprite = config.scene.add.sprite(0, 0, spriteKey);
    this.sprite.setScale(2);
    this.add(this.sprite);

    // Add to scene
    config.scene.add.existing(this);
    this.setDepth(10); // Above floor (5) and objects (5)
    
    // Add debug visual for interaction range
    const debugCircle = config.scene.add.graphics();
    debugCircle.lineStyle(2, 0x00ff00, 0.3);
    debugCircle.strokeCircle(0, 0, this.interactionRange);
    this.add(debugCircle);

    // Enable physics
    config.scene.physics.add.existing(this);
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setCollideWorldBounds(true);
    body.setSize(56, 56);
    body.setOffset(-28, -28);
    body.setImmovable(true); // NPCs can't be pushed by the player

    // Start with a random idle period (unless startPaused)
    if (config.startPaused) {
      this.isPaused = true;
      this.idleTimer = 0;
    } else {
      this.idleTimer = Phaser.Math.Between(1000, 3000);
    }
  }

  /**
   * Update NPC behavior - wandering AI
   */
  public update(delta: number): void {
    // Skip update if paused (e.g., during dialog)
    if (this.isPaused) {
      // Debug: Log paused state for Valentin
      if (this.characterName === 'valentin' && Math.random() < 0.01) {
        console.log(`[${this.characterName}] Still paused, not updating`);
      }
      return;
    }

    const body = this.body as Phaser.Physics.Arcade.Body;

    if (this.isMoving && this.targetPosition) {
      // Log first frame of movement
      if (Math.random() < 0.005) { // 0.5% chance to reduce spam
        console.log(`[${this.characterName}] Moving to (${Math.round(this.targetPosition.x)}, ${Math.round(this.targetPosition.y)}), currently at (${Math.round(this.x)}, ${Math.round(this.y)})`);
      }
      // Check if we've reached the target
      const distance = Phaser.Math.Distance.Between(
        this.x,
        this.y,
        this.targetPosition.x,
        this.targetPosition.y
      );

      if (distance < 5) {
        // Reached target, stop and idle
        this.stopMoving();
        this.idleTimer = Phaser.Math.Between(2000, 5000);
      } else {
        // Continue moving toward target
        const angle = Phaser.Math.Angle.Between(
          this.x,
          this.y,
          this.targetPosition.x,
          this.targetPosition.y
        );
        
        const velocityX = Math.cos(angle) * this.speed;
        const velocityY = Math.sin(angle) * this.speed;
        
        body.setVelocity(velocityX, velocityY);

        // Update animation
        const direction = this.getDirectionFromVelocity(velocityX, velocityY);
        this.updateAnimation(direction);

        // Timeout if taking too long
        this.moveTimer -= delta;
        if (this.moveTimer <= 0) {
          this.stopMoving();
          this.idleTimer = Phaser.Math.Between(1000, 3000);
        }
      }
    } else {
      // Idle state
      this.idleTimer -= delta;
      if (this.idleTimer <= 0) {
        // Pick a new random destination
        this.pickNewDestination();
      }
    }
  }

  /**
   * Pick a random destination within wander radius
   */
  private pickNewDestination(): void {
    const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
    const distance = Phaser.Math.FloatBetween(50, this.wanderRadius);
    
    this.targetPosition = {
      x: this.homePosition.x + Math.cos(angle) * distance,
      y: this.homePosition.y + Math.sin(angle) * distance
    };

    // Clamp to world bounds
    const worldBounds = this.scene.physics.world.bounds;
    this.targetPosition.x = Phaser.Math.Clamp(
      this.targetPosition.x,
      worldBounds.x + 50,
      worldBounds.x + worldBounds.width - 50
    );
    this.targetPosition.y = Phaser.Math.Clamp(
      this.targetPosition.y,
      worldBounds.y + 50,
      worldBounds.y + worldBounds.height - 50
    );

    this.isMoving = true;
    this.moveTimer = 5000; // 5 second timeout
  }

  /**
   * Stop moving and return to idle
   */
  private stopMoving(): void {
    this.isMoving = false;
    this.targetPosition = null;
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(0, 0);
    this.stopAnimation();
  }

  /**
   * Get the 8-directional direction string from velocity
   */
  private getDirectionFromVelocity(vx: number, vy: number): string {
    const angle = Math.atan2(vy, vx);
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

  /**
   * Update the character animation based on direction
   */
  private updateAnimation(direction: string): void {
    if (direction === this.currentDirection) {
      if (!this.sprite.anims.isPlaying) {
        this.sprite.play(`${this.characterName}-walk-${direction}`, true);
      }
      return;
    }

    this.currentDirection = direction;
    const animKey = `${this.characterName}-walk-${direction}`;
    
    if (this.scene.anims.exists(animKey)) {
      this.sprite.play(animKey, true);
    } else {
      const idleKey = `${this.characterName}-idle-${direction}`;
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
    const idleKey = `${this.characterName}-idle-${this.currentDirection}`;
    if (this.scene.textures.exists(idleKey)) {
      this.sprite.setTexture(idleKey);
    }
  }

  /**
   * Get character name
   */
  public getCharacterName(): string {
    return this.characterName;
  }

  /**
   * Get display height (required by Interactable interface)
   * Uses sprite's displayHeight since Container's displayHeight may not be accurate
   */
  public getDisplayHeight(): number {
    return this.sprite.displayHeight;
  }

  /**
   * Pause NPC movement (e.g., during dialog)
   */
  public pauseMovement(): void {
    this.isPaused = true;
    this.stopMoving();
  }

  /**
   * Resume NPC movement
   */
  public resumeMovement(): void {
    this.isPaused = false;
    // Start with a new idle period
    this.idleTimer = Phaser.Math.Between(500, 2000);
  }

  /**
   * Make NPC face towards a specific position (e.g., the player)
   */
  public faceTowards(targetX: number, targetY: number): void {
    const angle = Phaser.Math.Angle.Between(this.x, this.y, targetX, targetY);
    const direction = this.getDirectionFromAngle(angle);
    this.currentDirection = direction;
    
    // Update sprite to idle frame in that direction
    const idleKey = `${this.characterName}-idle-${direction}`;
    if (this.scene.textures.exists(idleKey)) {
      this.sprite.setTexture(idleKey);
    }
  }

  /**
   * Set the home position for wandering behavior
   */
  public setHomePosition(x: number, y: number): void {
    this.homePosition = { x, y };
    // Note: Does NOT move the NPC, just sets the wander center
  }

  /**
   * Walk to a specific position (scripted movement)
   * @param x Target x position
   * @param y Target y position
   * @param onComplete Optional callback when destination is reached
   */
  public walkToPosition(x: number, y: number, onComplete?: () => void): void {
    // CRITICAL: Unpause for scripted movement
    this.isPaused = false;
    
    this.targetPosition = { x, y };
    this.isMoving = true;
    this.moveTimer = 10000; // 10 second timeout for scripted movement
    
    console.log(`[${this.characterName}] Walking to (${x}, ${y}) from (${Math.round(this.x)}, ${Math.round(this.y)})`);
    
    // Store callback if provided
    if (onComplete) {
      const checkArrival = () => {
        if (!this.isMoving) {
          // Arrived at destination
          this.scene.events.off('update', checkArrival);
          console.log(`[${this.characterName}] Arrived at destination`);
          onComplete();
        }
      };
      this.scene.events.on('update', checkArrival);
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

  /**
   * Handle dialog actions (e.g., 'initiate-accusation')
   * Called by dialog system when player selects an action option
   */
  public handleDialogAction(action: string): void {
    console.log(`[${this.characterName}] Handling dialog action: ${action}`);
    
    if (action === 'initiate-accusation') {
      // Get accusation manager from registry
      const accusationManager = this.scene.registry.get('accusationManager');
      
      if (!accusationManager) {
        console.error('AccusationManager not found in registry');
        return;
      }
      
      // Validate player can make accusation
      const validation = accusationManager.canInitiateAccusation();
      
      if (!validation.canAccuse) {
        // Show warning dialog through dialog system
        console.log(`[${this.characterName}] Accusation blocked: ${validation.reason}`);
        this.scene.events.emit('show-dialog-message', {
          speaker: 'Valentin',
          message: validation.reason || 'Not enough evidence yet!',
          type: 'npc',
        });
        return;
      }
      
      // Start suspect selection
      console.log(`[${this.characterName}] Calling startSuspectSelection()...`);
      accusationManager.startSuspectSelection();
      console.log(`[${this.characterName}] startSuspectSelection() called - suspect selection should now be visible`);
    } else if (action === 'continue-investigation') {
      // Just close dialog and let player continue investigating
      console.log(`[${this.characterName}] Player chose to continue investigating`);
    } else {
      console.warn(`[${this.characterName}] Unknown dialog action: ${action}`);
    }
  }
}
