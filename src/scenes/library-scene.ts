import Phaser from 'phaser';
import { PlayerCharacter } from '../entities/player-character';
import { NPCCharacter } from '../entities/npc-character';
import { InteractableObject } from '../entities/interactable-object';
import { DialogBox } from '../components/dialog-box';
import { DialogManager } from '../systems/dialog-manager';
import { InteractionDetector } from '../systems/interaction-detector';
import { NotebookManager } from '../systems/notebook-manager';
import { NotebookUI } from '../components/notebook-ui';
import { GameProgressionManager } from '../systems/game-progression-manager';
import { ClueTracker } from '../systems/clue-tracker';
import type {
  LibraryLayoutConfig,
  FurnitureConfig,
  WallConfig,
  LibrarySceneData,
} from '../types/scenes';
import type { CharacterMetadata } from '../types/dialog';

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
  private npcs: NPCCharacter[] = [];
  private interactableObjects: InteractableObject[] = [];
  private furnitureGroup!: Phaser.Physics.Arcade.StaticGroup;
  private wallsGroup!: Phaser.Physics.Arcade.StaticGroup;
  private sceneLayout!: LibraryLayoutConfig;
  private assetErrors: Map<string, boolean> = new Map();
  private debugMode: boolean = false;
  private debugGraphics?: Phaser.GameObjects.Graphics;
  private debugText?: Phaser.GameObjects.Text;
  
  // Dialog system
  private dialogBox!: DialogBox;
  private dialogManager!: DialogManager;
  private interactionDetector!: InteractionDetector;
  private interactKey!: Phaser.Input.Keyboard.Key;
  private enterKey!: Phaser.Input.Keyboard.Key;
  
  // Notebook system
  private notebookManager!: NotebookManager;
  private notebookUI!: NotebookUI;
  private notebookKey!: Phaser.Input.Keyboard.Key;
  
  // Progression system
  private progressionManager!: GameProgressionManager;
  private clueTracker!: ClueTracker;

  constructor() {
    super({ key: 'library-scene' });
  }

  /**
   * Preload all assets needed for the library scene
   */
  preload(): void {
    // Register error handler for graceful degradation
    this.load.on('loaderror', (file: any) => {
      console.error('Failed to load asset:', file.key);
    });
    
    // Load layout configuration
    this.load.json('library-layout', 'src/data/library-layout.json');
    
    // Load progression data files
    this.load.json('progression-config', 'src/data/progression.json');
    this.load.json('clues-data', 'src/data/clues.json');

    // Load character metadata for dialog system
    const characterNames = ['klaus', 'valentin', 'sebastian', 'marianne', 'emma', 'luca'];
    characterNames.forEach(charName => {
      this.load.json(`${charName}-metadata`, `assets/sprites/characters/${charName}/metadata.json`);
      // Load character dialog data
      this.load.json(`dialog-${charName}`, `src/data/dialogs/${charName}.json`);
    });

    // Load Klaus character animations and idle sprites
    const directions = ['south', 'south-east', 'east', 'north-east', 'north', 'north-west', 'west', 'south-west'];
    
    // Load all characters (Klaus, Valentin, Sebastian, Marianne, Emma, Luca)
    const characters = ['klaus', 'valentin', 'sebastian', 'marianne', 'emma', 'luca'];
    
    characters.forEach(charName => {
      // Load walking animation frames
      directions.forEach(direction => {
        for (let i = 0; i < 4; i++) {
          this.load.image(`${charName}-walk-${direction}-${i}`, 
            `assets/sprites/characters/${charName}/animations/walking-4-frames/${direction}/frame_00${i}.png`
          );
        }
      });

      // Load idle rotations
      directions.forEach(direction => {
        this.load.image(`${charName}-idle-${direction}`, 
          `assets/sprites/characters/${charName}/rotations/${direction}.png`
        );
      });
    });

    // Load castle floor tileset
    this.load.image('castle-floor-tileset', 'assets/tilesets/castle-floor-tileset.png');

    // Load environment sprites
    this.load.image('desk', 'assets/sprites/environment/desk.png');
    this.load.image('bookshelf-tall', 'assets/sprites/environment/bookcase.png');
    this.load.image('dining-table', 'assets/sprites/environment/table.png');
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

    // Create character animations for all characters
    this.createCharacterAnimations();

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

    // Spawn NPCs
    this.spawnNPCs();

    // Spawn interactable objects
    this.spawnInteractableObjects();

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

    // Initialize progression system FIRST (before dialog system)
    this.initializeProgressionSystem();

    // Initialize dialog system
    this.initializeDialogSystem();

    // Initialize notebook system
    this.initializeNotebookSystem();
    
    // Link all systems together
    this.linkSystems();
    
    // Setup progression event listeners
    this.setupProgressionEvents();

    // Create debug text overlay
    this.debugText = this.add.text(10, 10, '', {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#00ff00',
      backgroundColor: '#000000aa',
      padding: { x: 10, y: 10 }
    });
    this.debugText.setScrollFactor(0);
    this.debugText.setDepth(10000);

    // Setup collisions
    this.physics.add.collider(this.player, this.furnitureGroup);
    this.physics.add.collider(this.player, this.wallsGroup);
    
    // NPC collisions
    this.npcs.forEach(npc => {
      this.physics.add.collider(npc, this.furnitureGroup);
      this.physics.add.collider(npc, this.wallsGroup);
      this.physics.add.collider(npc, this.player);
    });
    
    // NPC to NPC collisions
    for (let i = 0; i < this.npcs.length; i++) {
      for (let j = i + 1; j < this.npcs.length; j++) {
        this.physics.add.collider(this.npcs[i], this.npcs[j]);
      }
    }

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
    
    // Update all NPCs
    this.npcs.forEach(npc => npc.update(delta));

    // Update progression systems
    if (this.clueTracker) {
      this.clueTracker.update(delta);
    }

    // Update dialog system
    this.updateDialogSystem();

    // Update notebook system
    this.updateNotebookSystem();

    // Update debug text
    const closest = this.interactionDetector.getClosestInteractable();
    const playerPos = this.player.getPosition();
    let debugInfo = `Player: (${Math.round(playerPos.x)}, ${Math.round(playerPos.y)})\n`;
    debugInfo += `NPCs: ${this.npcs.length} spawned\n`;
    
    // Show distance to each NPC
    this.npcs.forEach(npc => {
      const dist = Math.round(Phaser.Math.Distance.Between(playerPos.x, playerPos.y, npc.x, npc.y));
      debugInfo += `  ${npc.id}: ${dist}px ${dist <= 80 ? '✓' : ''}\n`;
    });
    
    debugInfo += `Closest: ${closest ? `${closest.id} at ${Math.round(Phaser.Math.Distance.Between(playerPos.x, playerPos.y, closest.x, closest.y))}px` : 'none'}\n`;
    debugInfo += `Can interact: ${this.interactionDetector.canInteract() ? 'YES' : 'NO'}`;
    
    if (this.debugText) {
      this.debugText.setText(debugInfo);
    }

    // Debug info (old)
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
   * Create animations for all characters
   */
  private createCharacterAnimations(): void {
    const directions = ['south', 'south-east', 'east', 'north-east', 'north', 'north-west', 'west', 'south-west'];
    const characters = ['klaus', 'valentin', 'sebastian', 'marianne', 'emma', 'luca'];
    
    characters.forEach(charName => {
      directions.forEach(direction => {
        const animKey = `${charName}-walk-${direction}`;
        
        // Skip if animation already exists
        if (this.anims.exists(animKey)) return;

        // Check if frames are loaded
        if (this.assetErrors.has(`${charName}-walk-${direction}-0`)) {
          console.warn(`${charName} walk animation frames not loaded for ${direction}`);
          return;
        }

        // Create animation from individual frames
        this.anims.create({
          key: animKey,
          frames: [
            { key: `${charName}-walk-${direction}-0` },
            { key: `${charName}-walk-${direction}-1` },
            { key: `${charName}-walk-${direction}-2` },
            { key: `${charName}-walk-${direction}-3` },
          ],
          frameRate: 8,
          repeat: -1
        });
      });
    });

    console.log(`✓ Created walking animations for ${characters.length} characters`);
  }

  /**
   * Spawn NPC characters in the library
   */
  private spawnNPCs(): void {
    const npcConfigs = [
      { name: 'valentin', x: 500, y: 350 },  // Near center-left
      { name: 'sebastian', x: 700, y: 350 }, // Near center-right
      { name: 'marianne', x: 400, y: 500 },  // Bottom-left area
      { name: 'emma', x: 800, y: 500 },      // Bottom-right area
      { name: 'luca', x: 600, y: 250 },      // Top-center area
    ];

    npcConfigs.forEach(config => {
      // Load character metadata from cache
      const metadata = this.cache.json.get(`${config.name}-metadata`) as CharacterMetadata;
      
      const npc = new NPCCharacter({
        scene: this,
        x: config.x,
        y: config.y,
        characterName: config.name,
        metadata: metadata,
        speed: 80,
        wanderRadius: 150,
      });
      this.npcs.push(npc);
    });

    console.log(`✓ Spawned ${this.npcs.length} NPCs with dialog data`);
  }

  /**
   * Spawn interactable objects in the library
   */
  private spawnInteractableObjects(): void {
    // Find existing furniture sprites and make some of them interactable
    const objectConfigs = [
      {
        id: 'bookshelf-north',
        spriteKey: 'bookshelf-tall',
        x: 600,
        y: 100,
        description: 'A tall bookshelf filled with old mystery novels. The books look well-read and dusty.',
        recordInNotebook: false,
      },
      {
        id: 'dining-table',
        spriteKey: 'dining-table',
        x: 600,
        y: 400,
        description: 'A large wooden dining table. This is where the stolen Erdbeerstrudel was last seen!',
        recordInNotebook: true,
        notebookNote: 'Where the strudel was last seen.',
      },
      {
        id: 'desk',
        spriteKey: 'desk',
        x: 200,
        y: 300,
        description: 'A sturdy oak desk with scattered papers and an inkwell. Someone has been taking notes.',
        recordInNotebook: true,
        notebookNote: 'Papers and inkwell. Someone writing notes.',
      },
    ];

    objectConfigs.forEach(config => {
      try {
        const obj = new InteractableObject({
          scene: this,
          x: config.x,
          y: config.y,
          spriteKey: config.spriteKey,
          id: config.id,
          description: config.description,
          interactionRange: 60,
        });
        
        // Set the recordInNotebook flag and note on the dialog data
        obj.dialogData.recordInNotebook = config.recordInNotebook;
        if ('notebookNote' in config) {
          obj.dialogData.notebookNote = config.notebookNote;
        }
        
        obj.setDepth(5); // Above floor, below NPCs
        this.interactableObjects.push(obj);
      } catch (error) {
        console.warn(`Failed to create interactable object ${config.id}:`, error);
      }
    });

    console.log(`✓ Spawned ${this.interactableObjects.length} interactable objects`);
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
   * Initialize dialog system components
   */
  private initializeDialogSystem(): void {
    // Create dialog box
    this.dialogBox = new DialogBox({
      scene: this,
      x: 512, // Center of 1024px screen
      y: 680, // Bottom third
      width: 900,
      height: 150,
      padding: 20,
      backgroundColor: 0x000000,
      borderColor: 0xffffff,
      borderWidth: 4,
      depth: 1000,
    });

    // Create dialog manager
    this.dialogManager = new DialogManager({
      scene: this,
      player: this.player,
      dialogBox: this.dialogBox,
      maxHistorySize: 50,
    });

    // Create interaction detector
    this.interactionDetector = new InteractionDetector({
      scene: this,
      player: this.player,
      indicatorConfig: {
        spriteKey: 'interaction-icon',
        offsetY: -30,
        animationDuration: 800,
        animationRange: 5,
      },
    });

    // Register all NPCs as interactable
    this.npcs.forEach(npc => {
      this.interactionDetector.registerInteractable(npc);
    });

    // Register all interactable objects
    this.interactableObjects.forEach(obj => {
      this.interactionDetector.registerInteractable(obj);
    });

    // Setup interaction keys
    this.interactKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.enterKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);

    console.log('✓ Dialog system initialized');
  }

  /**
   * Initialize notebook system components
   */
  private initializeNotebookSystem(): void {
    // Create notebook manager
    this.notebookManager = new NotebookManager({
      scene: this,
      maxEntries: 100,
    });

    // Link notebook manager to dialog manager
    this.dialogManager.setNotebookManager(this.notebookManager);

    // Create notebook UI
    this.notebookUI = new NotebookUI({
      scene: this,
      width: 800,
      height: 600,
      depth: 2000,
    });

    // Setup notebook key
    this.notebookKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.N);

    // Listen for notebook entry events
    this.events.on('notebook-entry-added', () => {
      // Update UI with latest entries
      const sections = this.notebookManager.generateSections();
      this.notebookUI.updateSections(sections);
    });

    console.log('✓ Notebook system initialized');
  }
  
  /**
   * Initialize progression system (game phases, clue tracking)
   */
  private initializeProgressionSystem(): void {
    // Create GameProgressionManager
    this.progressionManager = new GameProgressionManager({
      scene: this,
      registryKey: 'progressionManager',
      storageKey: 'erdbeerstrudel-progression',
      saveDebounceMs: 2000,
    });
    this.progressionManager.initialize();

    // Create ClueTracker
    this.clueTracker = new ClueTracker({
      scene: this,
      registryKey: 'clueTracker',
    });
    this.clueTracker.initialize();

    console.log('✓ Progression system initialized');
  }
  
  /**
   * Link all systems together with necessary references
   */
  private linkSystems(): void {
    // Link progression manager to dialog manager
    this.dialogManager.setProgressionManager(this.progressionManager);
    this.dialogManager.loadCharacterDialogs();

    // Link clue tracker to notebook manager
    this.clueTracker.on('clue-discovered', (data: { clueId: string; clue: any }) => {
      this.notebookManager.addEntry({
        id: `clue-${Date.now()}`,
        category: 'clue',
        sourceId: data.clueId,
        sourceName: data.clue.name,
        text: data.clue.notebookNote,
        timestamp: Date.now(),
      });
    });

    console.log('✓ All systems linked');
  }
  
  /**
   * Setup progression event listeners
   */
  private setupProgressionEvents(): void {
    // Listen for dialog-closed to mark NPC introduced
    this.events.on('dialog-closed', (data: { sourceId?: string }) => {
      if (data.sourceId) {
        this.progressionManager.markNPCIntroduced(data.sourceId);
      }
    });

    // Listen for incident trigger
    this.progressionManager.on('incident-triggered', () => {
      this.playIncidentCutscene();
    });

    // Listen for phase changes
    this.progressionManager.on('phase-changed', (data: { previousPhase: string; phase: string }) => {
      console.log(`📖 Phase changed: ${data.previousPhase} → ${data.phase}`);
      
      if (data.phase === 'post-incident') {
        // Unlock initially available clues
        this.clueTracker.getAllClues().forEach(clue => {
          if (clue.initiallyUnlocked) {
            this.clueTracker.unlockClue(clue.id);
          }
        });
      }
    });

    console.log('✓ Progression events setup');
  }
  
  /**
   * Play the incident cutscene (Valentin's return)
   */
  private playIncidentCutscene(): void {
    const config = this.progressionManager.getConfig();
    if (!config) return;

    const cutscene = config.incidentCutscene;

    // Lock player movement
    this.player.lockMovement();

    // Find Valentin and move him to entry position
    const valentin = this.npcs.find(npc => npc.id === 'valentin');
    if (valentin) {
      valentin.setPosition(cutscene.entryPosition.x, cutscene.entryPosition.y);
      if (typeof valentin.pauseMovement === 'function') {
        valentin.pauseMovement();
      }
    }

    // Show Valentin's speech
    this.dialogBox.show({
      speaker: 'Valentin',
      message: cutscene.speechLines.join('\n\n'),
      type: 'npc',
      characterId: 'valentin',
      objectId: null,
      recordInNotebook: true,
      notebookNote: "Valentin's erdbeerstrudel has been eaten! He's locked the door!",
    });

    // Record incident in notebook
    this.notebookManager.addEntry({
      id: `incident-${Date.now()}`,
      category: 'clue',
      sourceId: 'incident',
      sourceName: 'The Incident',
      text: "Someone ate Valentin's erdbeerstrudel! The door is locked and no one can leave.",
      timestamp: Date.now(),
    });

    // After cutscene duration, unlock movement
    this.time.delayedCall(cutscene.durationMs, () => {
      this.dialogBox.hide();
      this.player.unlockMovement();
      
      if (valentin && typeof valentin.resumeMovement === 'function') {
        valentin.resumeMovement();
      }
      
      // Visual indicator: lock the door (simplified - just log for now)
      console.log('🚪 Door locked at', cutscene.doorPosition);
    });

    console.log('🎬 Incident cutscene playing');
  }

  /**
   * Update notebook system logic (called every frame)
   */
  private updateNotebookSystem(): void {
    // Toggle notebook visibility with N key
    if (Phaser.Input.Keyboard.JustDown(this.notebookKey)) {
      // Don't open notebook if dialog is open
      if (!this.dialogManager.isOpen()) {
        this.notebookUI.toggle();
        
        // If opening, update with latest entries
        if (this.notebookUI.isVisible()) {
          const sections = this.notebookManager.generateSections();
          this.notebookUI.updateSections(sections);
        }
      }
    }

    // Handle scrolling when notebook is open
    if (this.notebookUI.isVisible()) {
      const upKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.UP);
      const downKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN);
      
      if (upKey.isDown) {
        this.notebookUI.scroll(-5);
      }
      if (downKey.isDown) {
        this.notebookUI.scroll(5);
      }
    }
  }

  /**
   * Update dialog system logic (called every frame)
   */
  private updateDialogSystem(): void {
    // Update interaction detection
    this.interactionDetector.update();

    // Handle interaction trigger (open dialog) - check this FIRST before handleInput consumes the key
    if (!this.dialogManager.isOpen() && this.interactionDetector.canInteract()) {
      if (Phaser.Input.Keyboard.JustDown(this.interactKey) || 
          Phaser.Input.Keyboard.JustDown(this.enterKey)) {
        const entity = this.interactionDetector.getClosestInteractable();
        if (entity) {
          // Determine if it's an NPC or object
          const isNPC = entity instanceof NPCCharacter;
          const sourceType = isNPC ? 'npc' : 'object';
          
          // Get speaker name (only for NPCs)
          let speakerName: string | null = null;
          if (isNPC) {
            const npc = entity as NPCCharacter;
            speakerName = npc.metadata?.character?.name ?? entity.id;
          }
          
          this.dialogManager.open(
            entity.dialogData,
            sourceType,
            entity.id,
            speakerName,
            entity // Pass entity so it can be paused during dialog
          );
        }
      }
    }

    // Handle dialog input (closing) - only when dialog is open
    if (this.dialogManager.isOpen()) {
      this.dialogManager.handleInput();
    }

    // Auto-close dialog if player moves out of range
    if (this.dialogManager.isOpen()) {
      const entity = this.interactionDetector.getClosestInteractable();
      if (!entity) {
        // No entity in range, close dialog
        this.dialogManager.close();
      }
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
