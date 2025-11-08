import Phaser from 'phaser';
import { PlayerCharacter } from '../entities/player-character';
import type {
  LibraryLayoutConfig,
  FurnitureConfig,
  WallConfig,
  LibrarySceneData,
} from '../types/scenes';

/**
 * LibraryScene - Main game environment for the locked-room mystery
 * 
 * Features:
 * - Complete library environment with furniture (1200x800 world)
 * - Player character with WASD/arrow navigation
 * - Collision detection with furniture and walls
 * - Smooth camera following
 * - Graceful error handling with fallback textures
 */
export class LibraryScene extends Phaser.Scene {
  private player!: PlayerCharacter;
  private furnitureGroup!: Phaser.Physics.Arcade.StaticGroup;
  private wallsGroup!: Phaser.Physics.Arcade.StaticGroup;
  private sceneLayout!: LibraryLayoutConfig;
  private assetErrors: Map<string, boolean> = new Map();
  private debugMode: boolean = false;
  private debugGraphics?: Phaser.GameObjects.Graphics;

  constructor() {
    super({ key: 'library-scene' });
  }

  /**
   * Preload all assets needed for the library scene
   */
  preload(): void {
    // Register error handler for graceful degradation
    this.load.on('loaderror', (file: any) => {
      console.warn(`Asset load failed: ${file.key}`);
      this.assetErrors.set(file.key, true);
    });

    // Load layout configuration
    this.load.json('library-layout', 'src/data/library-layout.json');

    // Load Klaus character animations and idle sprites
    const directions = ['south', 'south-east', 'east', 'north-east', 'north', 'north-west', 'west', 'south-west'];
    
    // Load walking animation frames
    directions.forEach(direction => {
      for (let i = 0; i < 4; i++) {
        this.load.image(`klaus-walk-${direction}-${i}`, 
          `assets/sprites/characters/klaus/animations/walking-4-frames/${direction}/frame_00${i}.png`
        );
      }
    });

    // Load idle rotations
    directions.forEach(direction => {
      this.load.image(`klaus-idle-${direction}`, 
        `assets/sprites/characters/klaus/rotations/${direction}.png`
      );
    });

    // Load castle floor tileset
    this.load.image('castle-floor-tileset', 'assets/tilesets/castle-floor-tileset.png');

    // Load environment sprites - use PNGs where available, SVG as fallback
    this.load.image('desk', 'assets/sprites/environment/desk.png');
    this.load.image('bookshelf-tall', 'assets/sprites/environment/bookcase.png');
    this.load.image('dining-table', 'assets/sprites/environment/table.png');
    
    // SVG fallbacks
    this.load.svg('fireplace', 'assets/sprites/environment/fireplace.svg', { width: 128, height: 128 });
    this.load.svg('couch', 'assets/sprites/environment/couch.svg', { width: 96, height: 48 });
    this.load.svg('chair', 'assets/sprites/environment/chair.svg', { width: 32, height: 32 });
    this.load.svg('window', 'assets/sprites/environment/window.svg', { width: 64, height: 96 });
    this.load.svg('trophy-wall', 'assets/sprites/environment/trophy-wall.svg', { width: 128, height: 64 });
    this.load.svg('bar-cart', 'assets/sprites/environment/bar-cart.svg', { width: 48, height: 64 });
    this.load.svg('locked-door', 'assets/sprites/environment/locked-door.svg', { width: 96, height: 128 });
  }

  /**
   * Create the library scene with furniture, player, and camera setup
   */
  create(data?: LibrarySceneData): void {
    // Load scene layout
    this.sceneLayout = this.cache.json.get('library-layout') as LibraryLayoutConfig;
    this.validateLayout(this.sceneLayout);

    // Create tilemap background using castle floor tileset
    this.createTileBackground();

    // Setup world bounds
    this.physics.world.setBounds(
      0,
      0,
      this.sceneLayout.worldSize.width,
      this.sceneLayout.worldSize.height
    );

    // Setup physics groups
    this.furnitureGroup = this.physics.add.staticGroup();
    this.wallsGroup = this.physics.add.staticGroup();

    // Spawn environment
    this.spawnFurniture(this.sceneLayout.furniture);
    this.createWalls(this.sceneLayout.walls);

    // Create Klaus character animations
    this.createKlausAnimations();

    // Spawn player (Klaus)
    const spawnPos = data?.spawnPosition ?? this.sceneLayout.playerSpawn;
    const playerSpriteKey = this.assetErrors.has('klaus-idle-south')
      ? this.createFallbackTexture('klaus', 64, 64)
      : 'klaus-idle-south';

    this.player = new PlayerCharacter({
      scene: this,
      x: spawnPos.x,
      y: spawnPos.y,
      spriteKey: playerSpriteKey,
    });

    // Setup camera
    this.cameras.main.setBounds(
      0,
      0,
      this.sceneLayout.worldSize.width,
      this.sceneLayout.worldSize.height
    );
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    this.cameras.main.setZoom(1.0);
    this.cameras.main.setRoundPixels(true); // Pixel-perfect rendering

    // Setup collisions
    this.physics.add.collider(this.player, this.furnitureGroup);
    this.physics.add.collider(this.player, this.wallsGroup);

    // Setup debug mode toggle (D key)
    this.input.keyboard?.on('keydown-D', () => {
      this.toggleDebugMode();
    });

    // Fade in
    this.cameras.main.fadeIn(500);

    // Emit ready events
    this.events.emit('scene-loaded');
    this.events.emit('scene-ready');
    this.events.emit('player-spawned', { position: this.player.getPosition() });

    console.log('✓ LibraryScene initialized successfully');
  }

  /**
   * Update loop - called every frame
   */
  update(_time: number, delta: number): void {
    this.player.update(delta);

    // Debug info
    if (this.debugMode) {
      const pos = this.player.getPosition();
      console.log(`Player: (${Math.round(pos.x)}, ${Math.round(pos.y)})`);
    }
  }

  /**
   * Create tiled background using the castle floor tileset
   */
  private createTileBackground(): void {
    if (this.assetErrors.has('castle-floor-tileset')) {
      this.cameras.main.setBackgroundColor('#3d2817');
      console.warn('Castle floor tileset not loaded, using solid background');
      return;
    }

    const tileSize = 16;
    const worldWidth = this.sceneLayout.worldSize.width;
    const worldHeight = this.sceneLayout.worldSize.height;

    // Create a tilemap
    const map = this.make.tilemap({
      tileWidth: tileSize,
      tileHeight: tileSize,
      width: Math.ceil(worldWidth / tileSize),
      height: Math.ceil(worldHeight / tileSize)
    });

    // Add the tileset image
    const tileset = map.addTilesetImage('castle-floor-tileset', 'castle-floor-tileset', tileSize, tileSize, 0, 0);
    
    if (!tileset) {
      console.warn('Failed to create tileset, using fallback');
      this.cameras.main.setBackgroundColor('#3d2817');
      return;
    }

    // Create a layer and fill it with the base tile (tile index 2,1 in the 4x4 grid = index 6)
    const layer = map.createBlankLayer('floor', tileset);
    if (layer) {
      layer.fill(6); // wang_0 is at position (2, 1) in 4x4 grid = index 6
      layer.setDepth(-10);
    }

    console.log('✓ Created tiled floor background');
  }

  /**
   * Create animations for Klaus character
   */
  private createKlausAnimations(): void {
    const directions = ['south', 'south-east', 'east', 'north-east', 'north', 'north-west', 'west', 'south-west'];
    
    directions.forEach(direction => {
      const animKey = `klaus-walk-${direction}`;
      
      // Skip if animation already exists
      if (this.anims.exists(animKey)) return;

      // Check if frames are loaded
      if (this.assetErrors.has(`klaus-walk-${direction}-0`)) {
        console.warn(`Klaus walk animation frames not loaded for ${direction}`);
        return;
      }

      // Create animation from individual frames
      this.anims.create({
        key: animKey,
        frames: [
          { key: `klaus-walk-${direction}-0` },
          { key: `klaus-walk-${direction}-1` },
          { key: `klaus-walk-${direction}-2` },
          { key: `klaus-walk-${direction}-3` },
        ],
        frameRate: 8,
        repeat: -1
      });
    });

    console.log('✓ Created Klaus walking animations');
  }

  /**
   * Spawn all furniture objects from configuration
   */
  private spawnFurniture(furnitureConfigs: FurnitureConfig[]): void {
    furnitureConfigs.forEach((config) => {
      const spriteKey = this.assetErrors.has(config.sprite)
        ? this.createFallbackTexture(
            config.sprite,
            config.collisionBox.width || 64,
            config.collisionBox.height || 64
          )
        : config.sprite;

      try {
        const furniture = this.physics.add.sprite(
          config.position.x,
          config.position.y,
          spriteKey
        );
        furniture.setImmovable(true);
        furniture.setDepth(config.layer);

        // Setup collision box
        const body = furniture.body as Phaser.Physics.Arcade.Body;
        if (config.collisionBox.width > 0 && config.collisionBox.height > 0) {
          body.setSize(config.collisionBox.width, config.collisionBox.height);
          body.setOffset(
            -config.collisionBox.width / 2,
            -config.collisionBox.height / 2
          );
        } else {
          body.enable = false; // No collision for decorations
        }

        this.furnitureGroup.add(furniture);
      } catch (error) {
        console.error(`Failed to spawn furniture ${config.id}:`, error);
      }
    });

    console.log(`✓ Spawned ${furnitureConfigs.length} furniture pieces`);
  }

  /**
   * Create invisible wall collision segments
   */
  private createWalls(wallConfigs: WallConfig[]): void {
    wallConfigs.forEach((config) => {
      try {
        // Create invisible sprite for collision
        const wall = this.add.rectangle(
          config.x + config.width / 2,
          config.y + config.height / 2,
          config.width,
          config.height,
          0x000000,
          0
        );

        this.physics.add.existing(wall, true); // true = static body
        wall.setVisible(false);

        const body = wall.body as Phaser.Physics.Arcade.Body;
        body.setImmovable(true);

        this.wallsGroup.add(wall);
      } catch (error) {
        console.error('Failed to create wall:', error);
      }
    });

    console.log(`✓ Created ${wallConfigs.length} wall segments`);
  }

  /**
   * Validate scene layout configuration
   */
  private validateLayout(layout: LibraryLayoutConfig): void {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check world size
    if (layout.worldSize.width !== 1200 || layout.worldSize.height !== 800) {
      warnings.push(
        `Scene world size is ${layout.worldSize.width}x${layout.worldSize.height}, expected 1200x800`
      );
    }

    // Check player spawn
    const spawn = layout.playerSpawn;
    if (
      spawn.x < 0 ||
      spawn.x > layout.worldSize.width ||
      spawn.y < 0 ||
      spawn.y > layout.worldSize.height
    ) {
      errors.push('Player spawn position is out of bounds');
    }

    // Check furniture count
    if (layout.furniture.length < 10) {
      warnings.push(
        `Scene has ${layout.furniture.length} furniture pieces (spec requires 10+)`
      );
    }

    // Check for duplicate furniture IDs
    const ids = layout.furniture.map((f) => f.id);
    const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
    if (duplicates.length > 0) {
      errors.push(`Duplicate furniture IDs found: ${duplicates.join(', ')}`);
    }

    // Log results
    if (errors.length > 0) {
      console.error('Scene layout validation errors:', errors);
    }
    if (warnings.length > 0) {
      console.warn('Scene layout validation warnings:', warnings);
    }
    if (errors.length === 0 && warnings.length === 0) {
      console.log('✓ Scene layout validation passed');
    }
  }

  /**
   * Create a fallback texture for missing assets
   */
  private createFallbackTexture(
    key: string,
    width: number,
    height: number
  ): string {
    const fallbackKey = `fallback-${key}`;
    if (this.textures.exists(fallbackKey)) return fallbackKey;

    try {
      const graphics = this.add.graphics();
      graphics.fillStyle(0xff00ff, 1); // Magenta for visibility
      graphics.fillRect(0, 0, width, height);
      graphics.lineStyle(2, 0xffffff, 1);
      graphics.strokeRect(0, 0, width, height);
      graphics.generateTexture(fallbackKey, width, height);
      graphics.destroy();

      console.log(`Created fallback texture for ${key} (${width}x${height})`);
      return fallbackKey;
    } catch (error) {
      console.error(`Failed to create fallback texture for ${key}:`, error);
      return key; // Return original key as last resort
    }
  }

  /**
   * Toggle debug mode visualization
   */
  private toggleDebugMode(): void {
    this.debugMode = !this.debugMode;

    if (this.debugMode) {
      // Show physics debug
      this.physics.world.createDebugGraphic();

      // Create debug graphics overlay
      if (!this.debugGraphics) {
        this.debugGraphics = this.add.graphics();
      }

      // Draw collision boxes
      this.furnitureGroup.children.entries.forEach((furniture) => {
        const sprite = furniture as Phaser.Physics.Arcade.Sprite;
        const body = sprite.body as Phaser.Physics.Arcade.Body;
        if (body && body.enable) {
          this.debugGraphics!.lineStyle(2, 0x00ff00, 1);
          this.debugGraphics!.strokeRect(
            body.x,
            body.y,
            body.width,
            body.height
          );
        }
      });

      console.log('Debug mode: ON');
    } else {
      // Hide physics debug
      if (this.physics.world.debugGraphic) {
        this.physics.world.debugGraphic.clear();
        this.physics.world.debugGraphic.destroy();
      }

      // Clear debug graphics
      if (this.debugGraphics) {
        this.debugGraphics.clear();
      }

      console.log('Debug mode: OFF');
    }
  }

  /**
   * Get the player character instance
   */
  public getPlayer(): PlayerCharacter {
    return this.player;
  }

  /**
   * Clean up on scene shutdown
   */
  shutdown(): void {
    this.events.emit('scene-shutdown');
    if (this.debugGraphics) {
      this.debugGraphics.destroy();
    }
  }
}
