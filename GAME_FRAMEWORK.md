# Phaser 3 2D Pixel Art Game Framework

A comprehensive guide for building 2D blocky pixel art games with Phaser 3, TypeScript, and Vite. This framework distills patterns, best practices, and architectural decisions from a complete game implementation.

## Table of Contents

1. [Tech Stack & Setup](#tech-stack--setup)
2. [Project Structure](#project-structure)
3. [Core Configuration](#core-configuration)
4. [Scene Architecture](#scene-architecture)
5. [Entity System](#entity-system)
6. [Game Systems](#game-systems)
7. [UI Components](#ui-components)
8. [Asset Management](#asset-management)
9. [State Management & Persistence](#state-management--persistence)
10. [Physics & Collision](#physics--collision)
11. [Performance Optimization](#performance-optimization)
12. [Best Practices](#best-practices)

---

## Tech Stack & Setup

### Dependencies

```json
{
  "dependencies": {
    "phaser": "^3.80.0"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "vite": "^5.0.0",
    "@typescript-eslint/eslint-plugin": "^6.0.0",
    "@typescript-eslint/parser": "^6.0.0",
    "eslint": "^8.0.0",
    "prettier": "^3.0.0"
  }
}
```

### TypeScript Configuration

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "module": "ESNext",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "skipLibCheck": true,
    "strict": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["src"]
}
```

### Vite Configuration

```typescript
import { defineConfig } from 'vite';

export default defineConfig({
  publicDir: 'public',
  build: {
    target: 'es2020',
    outDir: 'dist',
  },
  server: {
    port: 5173,
    open: false,
  },
});
```

### HTML Entry Point

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Your Game Title</title>
    <style>
      body {
        margin: 0;
        padding: 0;
        overflow: hidden;
        background-color: #000;
      }
    </style>
  </head>
  <body>
    <div id="game-container"></div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
```

---

## Project Structure

```
project-root/
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── public/
│   └── assets/
│       ├── audio/
│       │   └── songs/
│       └── sprites/
│           ├── characters/
│           ├── collectibles/
│           ├── hazards/
│           ├── structures/
│           └── ui/
└── src/
    ├── main.ts                 # Game initialization
    ├── components/             # Reusable UI components
    │   ├── dialog-box.ts
    │   └── navigation-hud.ts
    ├── data/                   # JSON data files
    │   ├── assets.json
    │   ├── dialogues.json
    │   ├── entities.json
    │   └── minigames.json
    ├── entities/               # Game objects
    │   ├── player-character.ts
    │   ├── raft.ts
    │   ├── collectible.ts
    │   └── hazard.ts
    ├── scenes/                 # Phaser scenes
    │   ├── start-scene.ts
    │   ├── ocean-scene.ts
    │   └── home-island-scene.ts
    ├── systems/                # Core game systems
    │   ├── collision-detector.ts
    │   ├── difficulty-scaler.ts
    │   ├── game-state-manager.ts
    │   └── procedural-spawner.ts
    ├── types/                  # TypeScript definitions
    │   ├── dialogues.ts
    │   ├── entities.ts
    │   └── game.d.ts
    └── utils/                  # Helper utilities
        ├── distance.ts
        ├── object-pool.ts
        └── storage.ts
```

---

## Core Configuration

### Main Game Setup

```typescript
import Phaser from 'phaser';
import { StartScene } from './scenes/start-scene';
import { GameScene } from './scenes/game-scene';

const GAME_WIDTH = 1024;
const GAME_HEIGHT = 768;
const TARGET_FPS = 60;

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  parent: 'game-container',
  backgroundColor: '#000000',
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  fps: {
    target: TARGET_FPS,
    forceSetTimeOut: false,
  },
  scene: [StartScene, GameScene],
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false
    }
  },
  render: {
    antialias: false,  // Critical for pixel art!
    pixelArt: true,    // Critical for pixel art!
  },
};

const game = new Phaser.Game(config);

// Export for debugging
(window as any).game = game;
```

**Key Settings for Pixel Art:**
- `antialias: false` - Prevents blurry pixels
- `pixelArt: true` - Ensures crisp pixel rendering
- `Phaser.Scale.RESIZE` - Adapts to window size changes
- `gravity: { x: 0, y: 0 }` - For top-down or no-gravity games

---

## Scene Architecture

### Basic Scene Structure

```typescript
import Phaser from 'phaser';

export class GameScene extends Phaser.Scene {
  // Private properties
  private player!: PlayerCharacter;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private assetErrors: Map<string, boolean> = new Map();

  constructor() {
    super({ key: 'game-scene' });
  }

  preload(): void {
    // Register error handler for failed asset loads
    this.load.on('loaderror', (file: any) => {
      console.warn(`Asset load failed: ${file.key}`);
      this.assetErrors.set(file.key, true);
    });

    // Load assets
    this.load.json('config', 'src/data/config.json');
    this.load.image('player', 'assets/sprites/player.svg');
  }

  create(data?: any): void {
    const { width, height } = this.cameras.main;

    // Create game objects
    this.player = new PlayerCharacter({
      scene: this,
      x: width / 2,
      y: height / 2,
      spriteKey: 'player'
    });

    // Setup input
    this.cursors = this.input.keyboard!.createCursorKeys();

    // Setup camera
    this.cameras.main.startFollow(this.player);
    this.cameras.main.fadeIn(500);

    // Handle window events
    this.game.events.on('blur', this.handlePause, this);
    this.game.events.on('focus', this.handleResume, this);
    this.scale.on('resize', this.handleResize, this);
  }

  update(time: number, delta: number): void {
    // Update game objects
    this.player.update(delta);
  }

  private handlePause(): void {
    this.scene.pause();
  }

  private handleResume(): void {
    this.scene.resume();
  }

  private handleResize(gameSize: Phaser.Structs.Size): void {
    const { width, height } = gameSize;
    // Handle responsive layout
  }
}
```

### Scene Transitions

```typescript
// Transition with fade
this.cameras.main.fadeOut(500, 0, 0, 0);
this.cameras.main.once('camerafadeoutcomplete', () => {
  this.scene.stop();
  this.scene.start('next-scene', { dataToPass: value });
});

// Pass data between scenes
create(data?: { shellsCollected?: number }): void {
  if (data?.shellsCollected) {
    this.handleReward(data.shellsCollected);
  }
}
```

---

## Entity System

### Base Entity Pattern (Using Containers)

```typescript
import Phaser from 'phaser';

export interface EntityConfig {
  scene: Phaser.Scene;
  x: number;
  y: number;
  spriteKey: string;
  speed?: number;
}

export class PlayerCharacter extends Phaser.GameObjects.Container {
  private sprite: Phaser.GameObjects.Sprite;
  private speed: number;
  private movementLocked: boolean = false;

  constructor(config: EntityConfig) {
    super(config.scene, config.x, config.y);
    
    this.speed = config.speed || 150;
    
    // Create sprite
    this.sprite = config.scene.add.sprite(0, 0, config.spriteKey);
    this.add(this.sprite);
    
    // Add to scene
    config.scene.add.existing(this);
    
    // Enable physics
    config.scene.physics.add.existing(this);
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setCollideWorldBounds(true);
    
    // Set collision box
    body.setSize(this.sprite.width, this.sprite.height);
    body.setOffset(-this.sprite.width / 2, -this.sprite.height / 2);
  }

  public update(delta: number): void {
    if (this.movementLocked) return;
    
    const body = this.body as Phaser.Physics.Arcade.Body;
    // Update logic here
  }

  public lockMovement(): void {
    this.movementLocked = true;
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(0);
  }

  public unlockMovement(): void {
    this.movementLocked = false;
  }
}
```

### Pooled Entity Pattern (For Performance)

```typescript
export class Hazard extends Phaser.Physics.Arcade.Sprite {
  public damage: number = 1;
  public hasCollided: boolean = false;

  constructor(scene: Phaser.Scene, x: number, y: number, texture: string) {
    super(scene, x, y, texture);
    scene.add.existing(this);
    scene.physics.add.existing(this);
  }

  // Called when retrieved from pool
  public spawn(x: number, y: number, scrollSpeed: number): void {
    this.setPosition(x, y);
    this.setActive(true);
    this.setVisible(true);
    this.hasCollided = false;
    
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.enable = true;
    body.setVelocity(-scrollSpeed, 0);
  }

  // Called when returned to pool
  public despawn(): void {
    this.setActive(false);
    this.setVisible(false);
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.enable = false;
  }

  public onCollide(): void {
    this.hasCollided = true;
    // Visual feedback
    this.setTint(0xff0000);
    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      duration: 200,
      onComplete: () => {
        this.despawn();
      }
    });
  }
}
```

### Using Phaser Groups for Pooling

```typescript
// In scene create()
this.hazards = this.physics.add.group({
  classType: Hazard,
  maxSize: 20,
  runChildUpdate: true
});

// Spawn from pool
const hazard = this.hazards.get(x, y, 'hazard-sprite') as Hazard;
if (hazard) {
  hazard.spawn(x, y, scrollSpeed);
}

// Cleanup off-screen objects
this.hazards.children.entries.forEach((obj: any) => {
  if (obj.active && obj.x < -100) {
    obj.despawn();
  }
});
```

---

## Game Systems

### 1. Collision Detection System

```typescript
export class CollisionDetector {
  private scene: Phaser.Scene;
  private player: PlayerCharacter;
  private hazardGroups: { rocks: Phaser.Physics.Arcade.Group };
  
  constructor(
    scene: Phaser.Scene,
    player: PlayerCharacter,
    hazardGroups: any
  ) {
    this.scene = scene;
    this.player = player;
    this.hazardGroups = hazardGroups;
  }

  initialize(): void {
    const playerSprite = this.player.getSprite();
    
    // Setup overlaps (no physics separation)
    this.scene.physics.add.overlap(
      playerSprite,
      this.hazardGroups.rocks,
      this.handleRockCollision as any,
      undefined,
      this
    );
  }

  private handleRockCollision(_player: any, rock: Hazard): void {
    if (rock.hasCollided) return;
    
    // Apply damage
    this.player.takeDamage(rock.damage);
    rock.onCollide();
    
    // Effects
    this.scene.cameras.main.shake(200, 0.005);
    this.scene.cameras.main.flash(100, 255, 0, 0);
    
    // Sound
    if (this.scene.sound.get('collision')) {
      this.scene.sound.play('collision');
    }
  }
}
```

### 2. Difficulty Scaling System

```typescript
export interface DifficultyConfig {
  spawnRate: { start: number; end: number; exponent: number };
  hazardRatio: { start: number; end: number; exponent: number };
  speedMultiplier: { start: number; end: number; exponent: number };
  milestones: Array<{ progress: number; unlocks: string[] }>;
}

export class DifficultyScaler {
  private config: DifficultyConfig;
  private targetDuration: number;

  constructor(config: DifficultyConfig, targetDuration: number) {
    this.config = config;
    this.targetDuration = targetDuration;
  }

  calculate(elapsedTime: number, distanceTraveled: number): DifficultyParams {
    const progress = Math.min(1.0, elapsedTime / this.targetDuration);
    
    return {
      progress,
      distanceTraveled,
      spawnRate: this.interpolate(this.config.spawnRate, progress),
      hazardRatio: this.interpolate(this.config.hazardRatio, progress),
      scrollSpeedMultiplier: this.interpolate(this.config.speedMultiplier, progress),
      availableHazards: this.getUnlockedTypes('hazards', progress),
      availableCollectibles: this.getUnlockedTypes('collectibles', progress)
    };
  }

  private interpolate(curve: { start: number; end: number; exponent: number }, progress: number): number {
    const normalized = Math.pow(progress, curve.exponent);
    return curve.start + (curve.end - curve.start) * normalized;
  }

  private getUnlockedTypes(category: string, progress: number): string[] {
    const unlocked: string[] = [];
    
    for (const milestone of this.config.milestones) {
      if (progress >= milestone.progress) {
        unlocked.push(...milestone.unlocks);
      }
    }
    
    return [...new Set(unlocked)];
  }
}
```

### 3. Procedural Spawning System

```typescript
export class ProceduralSpawner {
  private scene: Phaser.Scene;
  private config: SpawnConfig;
  private groups: Record<string, Phaser.Physics.Arcade.Group>;
  private nextChunkX: number = 0;
  private spatialGrid: Map<string, any[]> = new Map();
  private lastSpawnTimes: Map<string, number> = new Map();

  update(scrollX: number, delta: number, difficulty: DifficultyParams): void {
    // Check if we need to spawn next chunk
    if (scrollX >= this.nextChunkX - this.scene.cameras.main.width) {
      const spawnX = this.nextChunkX + this.scene.cameras.main.width;
      this.spawnChunk(spawnX, difficulty);
      this.nextChunkX += this.config.chunkWidth;
    }
    
    // Despawn off-screen objects
    this.despawnOffscreen();
  }

  spawnChunk(chunkX: number, difficulty: DifficultyParams): void {
    const objectCount = 2 + Math.floor(difficulty.spawnRate * 3);
    const viewportHeight = this.scene.cameras.main.height;
    
    // Define lanes for organized spawning
    const lanes = [
      { minY: 100, maxY: viewportHeight * 0.4 },
      { minY: viewportHeight * 0.4, maxY: viewportHeight * 0.7 },
      { minY: viewportHeight * 0.7, maxY: viewportHeight - 100 }
    ];
    
    for (let i = 0; i < objectCount; i++) {
      const isHazard = Math.random() < difficulty.hazardRatio;
      const types = isHazard ? difficulty.availableHazards : difficulty.availableCollectibles;
      const type = types[Math.floor(Math.random() * types.length)];
      
      // Try to find valid position (with collision avoidance)
      for (let attempt = 0; attempt < 10; attempt++) {
        const x = chunkX + Math.random() * this.config.chunkWidth;
        const lane = lanes[Math.floor(Math.random() * lanes.length)];
        const y = lane.minY + Math.random() * (lane.maxY - lane.minY);
        
        if (this.canSpawnAt(x, y, type)) {
          this.spawnObject(type, x, y, difficulty);
          break;
        }
      }
    }
  }

  canSpawnAt(x: number, y: number, type: string): boolean {
    // Check cooldown
    const lastSpawn = this.lastSpawnTimes.get(type) || 0;
    const cooldown = this.config.cooldowns[type] || 1000;
    if (Date.now() - lastSpawn < cooldown) {
      return false;
    }
    
    // Check spacing using spatial grid
    const cellX = Math.floor(x / this.config.cellSize);
    const cellY = Math.floor(y / this.config.cellSize);
    
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        const key = `${cellX + dx},${cellY + dy}`;
        const objectsInCell = this.spatialGrid.get(key) || [];
        
        for (const obj of objectsInCell) {
          const dist = Phaser.Math.Distance.Between(x, y, obj.x, obj.y);
          if (dist < this.config.minSpacing) {
            return false;
          }
        }
      }
    }
    
    return true;
  }
}
```

### 4. Game State Management

```typescript
export class GameStateManager {
  private state: GameState;
  private scene: Phaser.Scene;
  private saveTimeout: number | null = null;

  private constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.state = this.loadState();
  }

  // Singleton pattern via Phaser Registry
  public static fromScene(scene: Phaser.Scene): GameStateManager {
    const registry = scene.game.registry;
    
    if (!registry.has('gameStateManager')) {
      const manager = new GameStateManager(scene);
      registry.set('gameStateManager', manager);
    }
    
    return registry.get('gameStateManager') as GameStateManager;
  }

  private loadState(): GameState {
    try {
      const stored = localStorage.getItem('game:state');
      if (stored) {
        const parsed = JSON.parse(stored);
        return this.validateState(parsed);
      }
    } catch (error) {
      console.warn('Failed to load state:', error);
      this.handleStorageError(error);
    }
    
    return this.createDefaultState();
  }

  private save(immediate: boolean = false): void {
    if (this.saveTimeout) {
      window.clearTimeout(this.saveTimeout);
    }
    
    const doSave = () => {
      try {
        this.state.lastSaved = Date.now();
        localStorage.setItem('game:state', JSON.stringify(this.state));
        this.scene.events.emit('state-saved');
      } catch (error) {
        this.handleStorageError(error);
      }
    };
    
    if (immediate) {
      doSave();
    } else {
      this.saveTimeout = window.setTimeout(doSave, 300); // Debounce
    }
  }

  // Public API methods
  public addResource(type: string, amount: number): void {
    this.state.resources[type] = (this.state.resources[type] || 0) + amount;
    this.save();
    this.scene.events.emit('resource-updated', { type, amount });
  }

  public getResource(type: string): number {
    return this.state.resources[type] || 0;
  }
}
```

---

## UI Components

### Dialog Box Component

```typescript
export class DialogBox extends Phaser.GameObjects.Container {
  private background: Phaser.GameObjects.Graphics;
  private nameText: Phaser.GameObjects.Text;
  private messageText: Phaser.GameObjects.Text;
  private continueIndicator: Phaser.GameObjects.Text;
  private currentMessages: string[] = [];
  private currentMessageIndex: number = 0;
  private isVisible: boolean = false;

  constructor(config: DialogBoxConfig) {
    super(config.scene, config.x || 0, config.y || 0);
    
    // Create background
    this.background = config.scene.add.graphics();
    this.drawBackground();
    this.add(this.background);
    
    // Create text elements
    this.nameText = config.scene.add.text(-300, -80, '', {
      fontSize: '20px',
      fontFamily: 'monospace',
      color: '#FFD700',
      fontStyle: 'bold'
    });
    this.add(this.nameText);
    
    this.messageText = config.scene.add.text(-300, -50, '', {
      fontSize: '16px',
      fontFamily: 'monospace',
      color: '#ffffff',
      wordWrap: { width: 560 }
    });
    this.add(this.messageText);
    
    // Continue indicator with animation
    this.continueIndicator = config.scene.add.text(290, 75, '▼', {
      fontSize: '16px',
      color: '#FFD700'
    });
    this.continueIndicator.setOrigin(1, 1);
    this.add(this.continueIndicator);
    
    config.scene.tweens.add({
      targets: this.continueIndicator,
      alpha: 0.3,
      duration: 500,
      yoyo: true,
      repeat: -1
    });
    
    config.scene.add.existing(this);
    this.setVisible(false);
    this.setDepth(100);
    this.setScrollFactor(0);
    
    this.setupInput();
  }

  private drawBackground(): void {
    this.background.clear();
    this.background.fillStyle(0x000000, 0.9);
    this.background.fillRect(-310, -90, 620, 180);
    this.background.fillStyle(0x1a1a1a, 1);
    this.background.fillRect(-306, -86, 612, 172);
  }

  public showDialogue(speakerName: string, messages: string | string[]): void {
    this.currentMessages = Array.isArray(messages) ? messages : [messages];
    this.currentMessageIndex = 0;
    this.isVisible = true;
    
    this.nameText.setText(speakerName);
    this.displayCurrentMessage();
    
    this.setVisible(true);
    this.setAlpha(0);
    
    this.scene.tweens.add({
      targets: this,
      alpha: 1,
      duration: 200
    });
    
    this.scene.events.emit('dialogue-started', { speakerName });
  }

  public hide(): void {
    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      duration: 200,
      onComplete: () => {
        this.setVisible(false);
        this.isVisible = false;
        this.scene.events.emit('dialogue-ended');
      }
    });
  }
}
```

### HUD Component

```typescript
export class NavigationHUD extends Phaser.GameObjects.Container {
  private healthBar: Phaser.GameObjects.Graphics;
  private shellCountText: Phaser.GameObjects.Text;
  private shellIcon: Phaser.GameObjects.Image;

  constructor(scene: Phaser.Scene) {
    super(scene, 0, 0);
    
    // Health bar
    this.healthBar = scene.add.graphics();
    this.add(this.healthBar);
    
    // Shell counter
    this.shellIcon = scene.add.image(scene.cameras.main.width - 80, 30, 'shell-icon');
    this.add(this.shellIcon);
    
    this.shellCountText = scene.add.text(
      scene.cameras.main.width - 40,
      30,
      '0',
      { fontSize: '32px', fontFamily: 'monospace', color: '#fff' }
    );
    this.shellCountText.setOrigin(1, 0.5);
    this.add(this.shellCountText);
    
    scene.add.existing(this);
    this.setScrollFactor(0);
    this.setDepth(1000);
  }

  update(health: number, maxHealth: number, shells: number): void {
    this.drawHealthBar(health, maxHealth);
    this.shellCountText.setText(`${shells}`);
  }

  private drawHealthBar(current: number, max: number): void {
    this.healthBar.clear();
    
    const barWidth = 200;
    const barHeight = 20;
    const x = 20;
    const y = 20;
    
    // Background
    this.healthBar.fillStyle(0x000000, 0.8);
    this.healthBar.fillRect(x, y, barWidth, barHeight);
    
    // Health
    const healthPercent = current / max;
    const healthWidth = barWidth * healthPercent;
    const color = healthPercent > 0.5 ? 0x4CAF50 : healthPercent > 0.25 ? 0xFFC107 : 0xF44336;
    
    this.healthBar.fillStyle(color, 1);
    this.healthBar.fillRect(x, y, healthWidth, barHeight);
    
    // Border
    this.healthBar.lineStyle(2, 0xffffff, 1);
    this.healthBar.strokeRect(x, y, barWidth, barHeight);
  }

  flashDamage(): void {
    this.scene.tweens.add({
      targets: this.healthBar,
      alpha: 0.5,
      duration: 100,
      yoyo: true
    });
  }
}
```

---

## Asset Management

### Asset Manifest Pattern

**src/data/assets.json:**
```json
{
  "sprites": {
    "player": {
      "path": "assets/sprites/player.svg",
      "width": 32,
      "height": 32
    },
    "enemy": {
      "path": "assets/sprites/enemy.png",
      "width": 48,
      "height": 48
    }
  },
  "audio": {
    "music": {
      "path": "assets/audio/music.mp3",
      "volume": 0.5,
      "loop": true
    }
  }
}
```

### Loading Assets with Error Handling

```typescript
preload(): void {
  // Register error handler
  this.load.on('loaderror', (file: any) => {
    console.warn(`Asset load failed: ${file.key}`);
    this.assetErrors.set(file.key, true);
  });

  // Load from manifest
  const manifest = await import('../data/assets.json');
  
  Object.entries(manifest.sprites).forEach(([key, def]) => {
    if (def.path.endsWith('.svg')) {
      this.load.svg(key, def.path, { width: def.width, height: def.height });
    } else {
      this.load.image(key, def.path);
    }
  });

  // Load with timestamp for cache busting (development)
  const timestamp = Date.now();
  this.load.svg('rock', `assets/sprites/rock.svg?t=${timestamp}`, { width: 48, height: 48 });
}

create(): void {
  // Use fallback if asset failed to load
  const texture = this.assetErrors.has('player') ? this.createFallbackTexture() : 'player';
  this.player = new Player(this, 100, 100, texture);
}

private createFallbackTexture(): string {
  const graphics = this.add.graphics();
  graphics.fillStyle(0xff0000, 1);
  graphics.fillRect(0, 0, 32, 32);
  graphics.generateTexture('fallback', 32, 32);
  graphics.destroy();
  return 'fallback';
}
```

---

## State Management & Persistence

### LocalStorage Persistence Pattern

```typescript
const STORAGE_KEY = 'game:state';
const STATE_VERSION = 1;

export interface GameState {
  version: number;
  progress: {
    level: number;
    checkpoints: string[];
  };
  resources: {
    [key: string]: number;
  };
  lastSaved: number;
}

export class StorageUtil {
  static loadState(): GameState {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.version < STATE_VERSION) {
          return this.migrateState(parsed);
        }
        return this.validateState(parsed);
      }
    } catch (error) {
      console.warn('Failed to load state:', error);
      this.handleStorageError(error);
    }
    
    return this.createDefaultState();
  }

  static saveState(state: GameState): void {
    try {
      state.lastSaved = Date.now();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      if (error.name === 'QuotaExceededError') {
        this.pruneOldData();
        this.saveState(state);
      } else {
        console.error('Failed to save state:', error);
      }
    }
  }

  static isAvailable(): boolean {
    try {
      const test = '__test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }

  private static handleStorageError(error: any): void {
    if (error.name === 'SecurityError') {
      console.warn('LocalStorage blocked (private browsing mode?)');
      // Fallback to memory-only mode
    }
  }
}
```

### Event-Driven State Updates

```typescript
// In GameStateManager
public addResource(type: string, amount: number): void {
  this.state.resources[type] = (this.state.resources[type] || 0) + amount;
  this.save();
  this.scene.events.emit('resource-updated', { type, amount });
}

// In UI component
this.scene.events.on('resource-updated', (data: { type: string, amount: number }) => {
  this.updateResourceDisplay(data.type, data.amount);
  this.playCollectionAnimation();
});
```

---

## Physics & Collision

### Setting Up Physics Bodies

```typescript
// Container-based entity
const body = this.body as Phaser.Physics.Arcade.Body;
body.setCollideWorldBounds(true);
body.setSize(32, 32);
body.setOffset(-16, -16); // Center offset for containers

// Sprite-based entity
const sprite = this.physics.add.sprite(x, y, 'player');
sprite.setCollideWorldBounds(true);
sprite.body.setSize(28, 28); // Slightly smaller than sprite for better feel
sprite.body.setOffset(2, 2);
```

### Collision Types

```typescript
// Collider - physics separation + callback
this.physics.add.collider(player, walls, (p, w) => {
  console.log('Player hit wall');
});

// Overlap - no physics separation, just callback
this.physics.add.overlap(player, coins, (p, c) => {
  c.destroy();
  this.addScore(10);
});

// Manual collision check (for custom logic)
if (Phaser.Math.Distance.Between(player.x, player.y, npc.x, npc.y) < 50) {
  this.showInteractionPrompt();
}
```

### Movement Patterns

```typescript
// Top-down movement with diagonal normalization
const velocityX = cursors.left.isDown ? -speed : cursors.right.isDown ? speed : 0;
const velocityY = cursors.up.isDown ? -speed : cursors.down.isDown ? speed : 0;

if (velocityX !== 0 && velocityY !== 0) {
  const factor = Math.sqrt(2) / 2; // Normalize diagonal
  body.setVelocity(velocityX * factor, velocityY * factor);
} else {
  body.setVelocity(velocityX, velocityY);
}

// Side-scrolling with drift
const driftSpeed = -80;
let velocityX = driftSpeed; // Natural left drift
if (cursors.right.isDown) {
  velocityX = speed; // Override drift when moving right
}
body.setVelocityX(velocityX);
```

---

## Performance Optimization

### 1. Object Pooling

```typescript
// Use Phaser Groups (built-in pooling)
this.bullets = this.physics.add.group({
  classType: Bullet,
  maxSize: 50,
  runChildUpdate: true
});

// Get from pool
const bullet = this.bullets.get(x, y, 'bullet') as Bullet;
if (bullet) {
  bullet.fire(x, y, direction);
}

// Return to pool
bullet.despawn(); // Sets active=false, visible=false
```

### 2. Spatial Grid for Collision Optimization

```typescript
private spatialGrid: Map<string, any[]> = new Map();
private cellSize: number = 150;

addToGrid(obj: any): void {
  const cellX = Math.floor(obj.x / this.cellSize);
  const cellY = Math.floor(obj.y / this.cellSize);
  const key = `${cellX},${cellY}`;
  
  if (!this.spatialGrid.has(key)) {
    this.spatialGrid.set(key, []);
  }
  this.spatialGrid.get(key)!.push(obj);
}

getNearbyObjects(x: number, y: number): any[] {
  const cellX = Math.floor(x / this.cellSize);
  const cellY = Math.floor(y / this.cellSize);
  const nearby: any[] = [];
  
  // Check 3x3 surrounding cells
  for (let dx = -1; dx <= 1; dx++) {
    for (let dy = -1; dy <= 1; dy++) {
      const key = `${cellX + dx},${cellY + dy}`;
      const cell = this.spatialGrid.get(key) || [];
      nearby.push(...cell);
    }
  }
  
  return nearby;
}
```

### 3. Debounced State Saving

```typescript
private saveTimeout: number | null = null;

private save(immediate: boolean = false): void {
  if (this.saveTimeout) {
    window.clearTimeout(this.saveTimeout);
  }
  
  const doSave = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
  };
  
  if (immediate) {
    doSave();
  } else {
    this.saveTimeout = window.setTimeout(doSave, 300); // Debounce
  }
}
```

### 4. Efficient Rendering

```typescript
// Set depth layers to minimize draw calls
background.setDepth(-100);
terrain.setDepth(-50);
entities.setDepth(0);
player.setDepth(10);
ui.setDepth(1000);

// Use texture atlases for multiple sprites
this.load.atlas('game-atlas', 'atlas.png', 'atlas.json');

// Limit active objects
const MAX_ACTIVE = 50;
if (this.activeObjects.length >= MAX_ACTIVE) {
  return; // Don't spawn more
}
```

---

## Best Practices

### 1. Input Handling

```typescript
// Setup in create()
this.cursors = this.input.keyboard!.createCursorKeys();
this.wasd = this.input.keyboard!.addKeys({
  up: Phaser.Input.Keyboard.KeyCodes.W,
  down: Phaser.Input.Keyboard.KeyCodes.S,
  left: Phaser.Input.Keyboard.KeyCodes.A,
  right: Phaser.Input.Keyboard.KeyCodes.D
}) as any;

// Check in update()
if (this.cursors.up.isDown || this.wasd.up.isDown) {
  // Move up
}

// Use JustDown for single press actions
if (Phaser.Input.Keyboard.JustDown(this.cursors.space)) {
  this.jump();
}

// Handle focus loss
this.game.events.on('blur', () => {
  this.scene.pause();
  this.player.setVelocity(0, 0);
});
```

### 2. Scene Management

```typescript
// Start new scene (stops current)
this.scene.start('next-scene', { data: value });

// Run scene alongside current (for UI overlays)
this.scene.launch('pause-menu');
this.scene.pause(); // Pause current scene

// Resume from pause
this.scene.resume('game-scene');
this.scene.stop('pause-menu');

// Pass data between scenes
create(data?: { level: number }): void {
  const level = data?.level || 1;
  this.loadLevel(level);
}
```

### 3. Responsive Design

```typescript
// Handle window resize
this.scale.on('resize', (gameSize: Phaser.Structs.Size) => {
  const { width, height } = gameSize;
  
  // Update backgrounds
  this.background.setSize(width, height);
  
  // Reposition UI elements
  this.hud.setPosition(width - 100, 50);
  
  // Update physics bounds
  this.physics.world.setBounds(0, 0, width, height);
});

// Use relative positioning
const centerX = this.cameras.main.width / 2;
const centerY = this.cameras.main.height / 2;
this.player.setPosition(centerX, centerY);
```

### 4. Debug Mode

```typescript
private debugMode: boolean = false;
private debugText?: Phaser.GameObjects.Text;

// Toggle with key
this.input.keyboard?.on('keydown-D', () => {
  this.debugMode = !this.debugMode;
  
  if (this.debugMode) {
    this.createDebugUI();
    this.physics.world.createDebugGraphic();
  } else {
    this.debugText?.destroy();
    this.physics.world.debugGraphic?.destroy();
  }
});

// Update debug display
if (this.debugMode && this.debugText) {
  this.debugText.setText([
    'DEBUG MODE',
    `FPS: ${Math.round(this.game.loop.actualFps)}`,
    `Player: (${Math.round(this.player.x)}, ${Math.round(this.player.y)})`,
    `Active Objects: ${this.getActiveObjectCount()}`
  ].join('\n'));
}
```

### 5. Audio Management

```typescript
// Load audio
this.load.audio('music', 'assets/audio/music.mp3');
this.load.audio('sfx-jump', 'assets/audio/jump.wav');

// Play music with error handling
if (!this.assetErrors.has('music')) {
  this.music = this.sound.add('music', { loop: true, volume: 0.5 });
  this.music.play();
}

// Pause/resume on focus loss
this.game.events.on('blur', () => {
  if (this.music?.isPlaying) {
    this.music.pause();
  }
});

this.game.events.on('focus', () => {
  if (this.music?.isPaused) {
    this.music.resume();
  }
});

// Playlist management
private songKeys: string[] = ['song1', 'song2', 'song3'];
private currentSongIndex: number = 0;

playNextSong(): void {
  const songKey = this.songKeys[this.currentSongIndex];
  this.music = this.sound.add(songKey);
  this.music.play();
  
  this.music.once('complete', () => {
    this.currentSongIndex = (this.currentSongIndex + 1) % this.songKeys.length;
    this.playNextSong();
  });
}
```

### 6. Data-Driven Configuration

```typescript
// Load configuration from JSON
preload(): void {
  this.load.json('config', 'src/data/config.json');
}

create(): void {
  const config = this.cache.json.get('config');
  
  this.spawnEnemies(config.enemies);
  this.setupDifficulty(config.difficulty);
}

// Keep magic numbers in data files, not code
// src/data/config.json
{
  "player": {
    "speed": 150,
    "maxHealth": 100,
    "jumpForce": 300
  },
  "difficulty": {
    "easyMultiplier": 0.7,
    "normalMultiplier": 1.0,
    "hardMultiplier": 1.5
  }
}
```

### 7. Type Safety

```typescript
// Define interfaces for all data structures
export interface PlayerConfig {
  scene: Phaser.Scene;
  x: number;
  y: number;
  spriteKey: string;
  speed?: number;
}

// Use type guards
function isPhysicsBody(body: any): body is Phaser.Physics.Arcade.Body {
  return body && 'velocity' in body;
}

// Type scene data
interface SceneData {
  level: number;
  score: number;
  playerState?: PlayerState;
}

create(data?: SceneData): void {
  const level = data?.level ?? 1;
  // ...
}
```

---

## Common Patterns

### Camera Effects

```typescript
// Fade in/out
this.cameras.main.fadeIn(500);
this.cameras.main.fadeOut(500);

// Flash (damage/success)
this.cameras.main.flash(100, 255, 0, 0); // Red flash
this.cameras.main.flash(200, 0, 255, 0); // Green flash

// Shake (impact)
this.cameras.main.shake(200, 0.005);

// Follow player
this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
this.cameras.main.setBounds(0, 0, worldWidth, worldHeight);

// Zoom
this.cameras.main.setZoom(1.5);
```

### Tweens & Animations

```typescript
// Simple tween
this.tweens.add({
  targets: sprite,
  x: 200,
  y: 300,
  alpha: 0.5,
  duration: 1000,
  ease: 'Power2',
  yoyo: true,
  repeat: -1
});

// Scale pulse
this.tweens.add({
  targets: collectible,
  scale: { from: 1.0, to: 1.2 },
  duration: 500,
  yoyo: true,
  repeat: -1,
  ease: 'Sine.easeInOut'
});

// Bounce to UI
this.tweens.add({
  targets: coin,
  x: uiX,
  y: uiY,
  scale: 0.5,
  duration: 300,
  ease: 'Back.easeOut',
  onComplete: () => {
    coin.destroy();
    this.addScore(10);
  }
});
```

### Interaction System

```typescript
private checkInteractions(): void {
  if (this.dialogBox.isShowing()) return;
  
  const playerPos = this.player.getPosition();
  
  for (const npc of this.npcs) {
    const distance = Phaser.Math.Distance.Between(
      playerPos.x, playerPos.y,
      npc.x, npc.y
    );
    
    if (distance < 80 && npc.isInteractable()) {
      npc.showInteractionIcon();
      
      if (this.input.keyboard) {
        const eKey = this.input.keyboard.addKey('E');
        if (Phaser.Input.Keyboard.JustDown(eKey)) {
          this.interactWith(npc);
        }
      }
    } else {
      npc.hideInteractionIcon();
    }
  }
}
```

---

## Troubleshooting

### Blurry Graphics
- Ensure `pixelArt: true` and `antialias: false` in game config
- Use integer coordinates for sprites
- Scale sprites by integer multiples when possible

### Performance Issues
- Use object pooling for frequently created/destroyed objects
- Limit number of active game objects
- Use spatial partitioning for collision checks
- Disable physics debug mode in production

### LocalStorage Errors
- Always wrap in try-catch
- Check `localStorage.isAvailable()` before use
- Handle QuotaExceededError by pruning old data
- Provide fallback for private browsing mode

### Physics Body Misalignment
- For Containers: use negative offset equal to half sprite size
- For Sprites: offset is relative to top-left
- Call `body.updateFromGameObject()` after position changes

---

## Conclusion

This framework provides a solid foundation for building 2D pixel art games with Phaser 3. Key takeaways:

1. **Architecture**: Separate concerns into scenes, entities, systems, and components
2. **Performance**: Use object pooling, spatial grids, and efficient rendering
3. **Persistence**: Implement robust LocalStorage with error handling
4. **Type Safety**: Leverage TypeScript for better code quality
5. **Data-Driven**: Keep configuration in JSON files for easy tweaking
6. **Player Experience**: Handle edge cases like focus loss, errors, and responsive design

Adapt these patterns to your specific game needs while maintaining clean, maintainable code.
