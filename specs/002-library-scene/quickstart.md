# Quickstart Guide: Library Scene Implementation

**Feature**: Library/Study Game Scene  
**Branch**: `002-library-scene`  
**Estimated Time**: 4-6 hours for core implementation  
**Prerequisites**: Phaser 3 and TypeScript knowledge

---

## Overview

This guide walks you through implementing the library scene feature step-by-step. By the end, you'll have a fully navigable 2400x1600 pixel library environment with player movement, collision detection, and smooth camera following.

---

## Implementation Checklist

### Phase 1: Setup & Configuration (30 min)
- [ ] Create TypeScript type definitions
- [ ] Create scene layout JSON configuration
- [ ] Update asset manifest
- [ ] Create placeholder assets (or final pixel art)

### Phase 2: Player Character (1 hour)
- [ ] Implement PlayerCharacter entity class
- [ ] Add WASD/Arrow key movement
- [ ] Add diagonal movement normalization
- [ ] Add movement locking capability
- [ ] Configure physics body

### Phase 3: Library Scene (2 hours)
- [ ] Create LibraryScene class skeleton
- [ ] Implement asset preloading with error handling
- [ ] Implement furniture spawning from config
- [ ] Implement wall segment creation
- [ ] Setup player spawn and camera
- [ ] Add scene validation

### Phase 4: Collision System (45 min)
- [ ] Setup physics groups for furniture and walls
- [ ] Configure collision detection
- [ ] Test collision with all furniture pieces
- [ ] Adjust collision boxes for feel

### Phase 5: Integration & Polish (1 hour)
- [ ] Connect StartScene transition to LibraryScene
- [ ] Add fade-in/fade-out effects
- [ ] Test traversal time (should be 10-15 seconds)
- [ ] Verify pixel-perfect rendering
- [ ] Add debug visualization (optional)

### Phase 6: Testing & Validation (30 min)
- [ ] Test all navigation paths
- [ ] Verify collision on all furniture
- [ ] Test scene transitions
- [ ] Verify layout matches spec requirements
- [ ] Check FPS performance (30+ target)

---

## Step-by-Step Implementation

### Step 1: Create Type Definitions

Create `src/types/scenes.ts`:

```typescript
// Copy type definitions from contracts/scene-api.ts
export interface LibrarySceneConfig { /* ... */ }
export interface PlayerCharacterConfig { /* ... */ }
export interface FurnitureConfig { /* ... */ }
export interface LibraryLayoutConfig { /* ... */ }
// ... all other types
```

**Why**: Type safety prevents runtime errors and provides IDE autocomplete.

---

### Step 2: Create Scene Layout Configuration

Create `src/data/library-layout.json`:

```json
{
  "sceneId": "library-v1",
  "version": "1.0.0",
  "worldSize": {
    "width": 2400,
    "height": 1600
  },
  "playerSpawn": {
    "x": 1200,
    "y": 800
  },
  "furniture": [
    {
      "id": "desk-valentin",
      "type": "desk",
      "sprite": "desk",
      "position": { "x": 400, "y": 300 },
      "collisionBox": { "width": 120, "height": 80 },
      "layer": 0
    },
    {
      "id": "bookshelf-north-1",
      "type": "bookshelf",
      "sprite": "bookshelf-tall",
      "position": { "x": 200, "y": 150 },
      "collisionBox": { "width": 60, "height": 180 },
      "layer": 0
    },
    {
      "id": "fireplace-center",
      "type": "fireplace",
      "sprite": "fireplace",
      "position": { "x": 1200, "y": 300 },
      "collisionBox": { "width": 100, "height": 60 },
      "layer": 0
    },
    {
      "id": "couch-south",
      "type": "seating",
      "sprite": "couch",
      "position": { "x": 1200, "y": 1300 },
      "collisionBox": { "width": 120, "height": 50 },
      "layer": 0
    },
    {
      "id": "dining-table-east",
      "type": "table",
      "sprite": "dining-table",
      "position": { "x": 2000, "y": 800 },
      "collisionBox": { "width": 160, "height": 80 },
      "layer": 0
    },
    {
      "id": "window-north",
      "type": "window",
      "sprite": "window",
      "position": { "x": 800, "y": 100 },
      "collisionBox": { "width": 80, "height": 40 },
      "layer": 0
    },
    {
      "id": "trophy-wall-west",
      "type": "decoration",
      "sprite": "trophy-wall",
      "position": { "x": 150, "y": 600 },
      "collisionBox": { "width": 0, "height": 0 },
      "layer": 1
    },
    {
      "id": "bar-cart-southeast",
      "type": "decoration",
      "sprite": "bar-cart",
      "position": { "x": 1800, "y": 1400 },
      "collisionBox": { "width": 40, "height": 60 },
      "layer": 0
    },
    {
      "id": "locked-door-south",
      "type": "door",
      "sprite": "locked-door",
      "position": { "x": 1200, "y": 1500 },
      "collisionBox": { "width": 80, "height": 40 },
      "layer": 0
    },
    {
      "id": "chair-1",
      "type": "seating",
      "sprite": "chair",
      "position": { "x": 500, "y": 800 },
      "collisionBox": { "width": 32, "height": 32 },
      "layer": 0
    }
  ],
  "walls": [
    { "x": 0, "y": 0, "width": 2400, "height": 50 },
    { "x": 0, "y": 1550, "width": 2400, "height": 50 },
    { "x": 0, "y": 0, "width": 50, "height": 1600 },
    { "x": 2350, "y": 0, "width": 50, "height": 1600 }
  ]
}
```

**Tip**: Add more furniture to reach 10-15 pieces total. Vary positions to create distinct areas.

---

### Step 3: Update Asset Manifest

Update `src/data/assets.json`:

```json
{
  "sprites": {
    "player": {
      "path": "assets/sprites/characters/player.svg",
      "width": 48,
      "height": 48,
      "type": "svg"
    },
    "desk": {
      "path": "assets/sprites/environment/desk.svg",
      "width": 64,
      "height": 64,
      "type": "svg"
    },
    "bookshelf-tall": {
      "path": "assets/sprites/environment/bookshelf-tall.svg",
      "width": 64,
      "height": 128,
      "type": "svg"
    },
    "fireplace": {
      "path": "assets/sprites/environment/fireplace.svg",
      "width": 128,
      "height": 128,
      "type": "svg"
    },
    "couch": {
      "path": "assets/sprites/environment/couch.svg",
      "width": 96,
      "height": 48,
      "type": "svg"
    },
    "chair": {
      "path": "assets/sprites/environment/chair.svg",
      "width": 32,
      "height": 32,
      "type": "svg"
    },
    "dining-table": {
      "path": "assets/sprites/environment/dining-table.svg",
      "width": 128,
      "height": 64,
      "type": "svg"
    },
    "window": {
      "path": "assets/sprites/environment/window.svg",
      "width": 64,
      "height": 96,
      "type": "svg"
    },
    "trophy-wall": {
      "path": "assets/sprites/environment/trophy-wall.svg",
      "width": 128,
      "height": 64,
      "type": "svg"
    },
    "bar-cart": {
      "path": "assets/sprites/environment/bar-cart.svg",
      "width": 48,
      "height": 64,
      "type": "svg"
    },
    "locked-door": {
      "path": "assets/sprites/environment/locked-door.svg",
      "width": 96,
      "height": 128,
      "type": "svg"
    }
  }
}
```

---

### Step 4: Create Placeholder Assets (if needed)

If pixel art isn't ready, create colored SVG placeholders:

```bash
mkdir -p public/assets/sprites/environment
mkdir -p public/assets/sprites/characters
```

Create simple colored rectangles as SVG files. Example `desk.svg`:

```svg
<svg width="64" height="64" xmlns="http://www.w3.org/2000/svg">
  <rect width="64" height="64" fill="#8B4513" stroke="#5C2E0A" stroke-width="2"/>
</svg>
```

**Tip**: Use distinct colors for each furniture type to aid testing.

---

### Step 5: Implement PlayerCharacter Entity

Create `src/entities/player-character.ts`:

```typescript
import Phaser from 'phaser';
import type { PlayerCharacterConfig, Position, WASDKeys } from '../types/scenes';

export class PlayerCharacter extends Phaser.GameObjects.Container {
  private sprite: Phaser.GameObjects.Sprite;
  private speed: number;
  private movementLocked: boolean = false;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasdKeys!: WASDKeys;

  constructor(config: PlayerCharacterConfig) {
    super(config.scene, config.x, config.y);

    this.speed = config.speed ?? 150;

    // Create sprite
    this.sprite = config.scene.add.sprite(0, 0, config.spriteKey);
    this.add(this.sprite);

    // Add to scene
    config.scene.add.existing(this);

    // Enable physics
    config.scene.physics.add.existing(this);
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setCollideWorldBounds(false); // Camera handles bounds
    body.setSize(28, 28); // Slightly smaller than sprite
    body.setOffset(-14, -14); // Center on container

    // Setup input
    this.cursors = config.scene.input.keyboard!.createCursorKeys();
    this.wasdKeys = config.scene.input.keyboard!.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
    }) as WASDKeys;
  }

  public update(delta: number): void {
    if (this.movementLocked) return;

    const body = this.body as Phaser.Physics.Arcade.Body;

    // Check input
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

    // Normalize diagonal movement
    if (velocityX !== 0 && velocityY !== 0) {
      const factor = Math.sqrt(2) / 2;
      velocityX *= factor;
      velocityY *= factor;
    }

    body.setVelocity(velocityX, velocityY);
  }

  public lockMovement(): void {
    this.movementLocked = true;
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(0, 0);
  }

  public unlockMovement(): void {
    this.movementLocked = false;
  }

  public getPosition(): Position {
    return { x: this.x, y: this.y };
  }

  public setPosition(x: number, y: number): this {
    super.setPosition(x, y);
    return this;
  }

  public getSprite(): Phaser.GameObjects.Sprite {
    return this.sprite;
  }

  public isMovementLocked(): boolean {
    return this.movementLocked;
  }
}
```

---

### Step 6: Implement LibraryScene

Create `src/scenes/library-scene.ts`:

```typescript
import Phaser from 'phaser';
import { PlayerCharacter } from '../entities/player-character';
import type {
  LibraryLayoutConfig,
  FurnitureConfig,
  WallConfig,
  LibrarySceneData,
} from '../types/scenes';

export class LibraryScene extends Phaser.Scene {
  private player!: PlayerCharacter;
  private furnitureGroup!: Phaser.Physics.Arcade.StaticGroup;
  private wallsGroup!: Phaser.Physics.Arcade.StaticGroup;
  private sceneLayout!: LibraryLayoutConfig;
  private assetErrors: Map<string, boolean> = new Map();

  constructor() {
    super({ key: 'library-scene' });
  }

  preload(): void {
    // Register error handler
    this.load.on('loaderror', (file: any) => {
      console.warn(`Asset load failed: ${file.key}`);
      this.assetErrors.set(file.key, true);
    });

    // Load layout configuration
    this.load.json('library-layout', 'src/data/library-layout.json');

    // Load assets from manifest
    this.load.json('assets', 'src/data/assets.json');

    // After assets manifest loads, load sprites
    this.load.on('complete', () => {
      const assets = this.cache.json.get('assets');
      if (assets && assets.sprites) {
        Object.entries(assets.sprites).forEach(([key, def]: [string, any]) => {
          if (!this.textures.exists(key)) {
            if (def.type === 'svg' || def.path.endsWith('.svg')) {
              this.load.svg(key, def.path, { width: def.width, height: def.height });
            } else {
              this.load.image(key, def.path);
            }
          }
        });
      }
    });
  }

  create(data?: LibrarySceneData): void {
    const { width, height } = this.cameras.main;

    // Load scene layout
    this.sceneLayout = this.cache.json.get('library-layout') as LibraryLayoutConfig;
    this.validateLayout(this.sceneLayout);

    // Setup physics groups
    this.furnitureGroup = this.physics.add.staticGroup();
    this.wallsGroup = this.physics.add.staticGroup();

    // Spawn environment
    this.spawnFurniture(this.sceneLayout.furniture);
    this.createWalls(this.sceneLayout.walls);

    // Spawn player
    const spawnPos = data?.spawnPosition ?? this.sceneLayout.playerSpawn;
    this.player = new PlayerCharacter({
      scene: this,
      x: spawnPos.x,
      y: spawnPos.y,
      spriteKey: this.assetErrors.has('player') ? this.createFallbackTexture('player', 48, 48) : 'player',
    });

    // Setup camera
    this.cameras.main.setBounds(0, 0, this.sceneLayout.worldSize.width, this.sceneLayout.worldSize.height);
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    this.cameras.main.setZoom(1.0);

    // Setup collisions
    this.physics.add.collider(this.player, this.furnitureGroup);
    this.physics.add.collider(this.player, this.wallsGroup);

    // Fade in
    this.cameras.main.fadeIn(500);

    // Emit ready event
    this.events.emit('scene-ready');
    this.events.emit('player-spawned', { position: this.player.getPosition() });
  }

  update(time: number, delta: number): void {
    this.player.update(delta);
  }

  private spawnFurniture(furnitureConfigs: FurnitureConfig[]): void {
    furnitureConfigs.forEach((config) => {
      const spriteKey = this.assetErrors.has(config.sprite)
        ? this.createFallbackTexture(config.sprite, config.collisionBox.width, config.collisionBox.height)
        : config.sprite;

      const furniture = this.physics.add.sprite(config.position.x, config.position.y, spriteKey);
      furniture.setImmovable(true);
      furniture.setDepth(config.layer);

      // Setup collision box
      const body = furniture.body as Phaser.Physics.Arcade.Body;
      if (config.collisionBox.width > 0 && config.collisionBox.height > 0) {
        body.setSize(config.collisionBox.width, config.collisionBox.height);
        body.setOffset(-config.collisionBox.width / 2, -config.collisionBox.height / 2);
      } else {
        body.enable = false; // No collision for decorations
      }

      this.furnitureGroup.add(furniture);
    });
  }

  private createWalls(wallConfigs: WallConfig[]): void {
    wallConfigs.forEach((config) => {
      const wall = this.physics.add.sprite(
        config.x + config.width / 2,
        config.y + config.height / 2,
        null as any
      );
      wall.setImmovable(true);
      wall.setVisible(false);

      const body = wall.body as Phaser.Physics.Arcade.Body;
      body.setSize(config.width, config.height);

      this.wallsGroup.add(wall);
    });
  }

  private validateLayout(layout: LibraryLayoutConfig): void {
    if (layout.worldSize.width !== 2400 || layout.worldSize.height !== 1600) {
      console.warn('Scene world size does not match spec (2400x1600)');
    }

    if (layout.furniture.length < 10) {
      console.warn('Scene has fewer than 10 furniture pieces (spec requires 10+)');
    }

    console.log(`✓ Scene layout loaded: ${layout.furniture.length} furniture pieces`);
  }

  private createFallbackTexture(key: string, width: number, height: number): string {
    const fallbackKey = `fallback-${key}`;
    if (this.textures.exists(fallbackKey)) return fallbackKey;

    const graphics = this.add.graphics();
    graphics.fillStyle(0xff00ff, 1); // Magenta for visibility
    graphics.fillRect(0, 0, width, height);
    graphics.lineStyle(2, 0xffffff, 1);
    graphics.strokeRect(0, 0, width, height);
    graphics.generateTexture(fallbackKey, width, height);
    graphics.destroy();

    return fallbackKey;
  }
}
```

---

### Step 7: Register Scene in Main

Update `src/main.ts` to include LibraryScene:

```typescript
import { StartScene } from './scenes/start-scene';
import { LibraryScene } from './scenes/library-scene';

const config: Phaser.Types.Core.GameConfig = {
  // ... existing config
  scene: [StartScene, LibraryScene],
};
```

---

### Step 8: Connect StartScene Transition

Update `src/scenes/start-scene.ts` to transition to library:

```typescript
// In StartScene, on start button click:
private handleStartClick(): void {
  this.cameras.main.fadeOut(500, 0, 0, 0);
  this.cameras.main.once('camerafadeoutcomplete', () => {
    this.scene.stop();
    this.scene.start('library-scene');
  });
}
```

---

### Step 9: Test & Validate

Run the game:

```bash
npm run dev
```

**Manual Testing Checklist**:

1. **Scene Loads**: Library scene appears after clicking start
2. **Player Spawns**: Player appears at center of room (1200, 800)
3. **Movement Works**: WASD and arrow keys move player
4. **Diagonal Normalized**: Diagonal movement not faster than cardinal
5. **Collision Works**: Cannot walk through furniture or walls
6. **Camera Follows**: Camera smoothly follows player
7. **Camera Bounds**: Camera stops at scene edges, no empty space shown
8. **Traversal Time**: Walking across scene takes 10-15 seconds
9. **Pixel-Perfect**: Graphics are crisp, not blurred
10. **Performance**: 30+ FPS maintained

---

## Troubleshooting

### Problem: Player walks through furniture
**Solution**: Check collision boxes are configured correctly and `setImmovable(true)` is called on furniture.

### Problem: Camera shows empty space beyond scene
**Solution**: Verify `camera.setBounds()` matches world size (2400x1600).

### Problem: Diagonal movement too fast
**Solution**: Ensure diagonal velocity is multiplied by `Math.sqrt(2) / 2`.

### Problem: Graphics are blurry
**Solution**: Confirm `pixelArt: true` and `antialias: false` in game config.

### Problem: Assets fail to load
**Solution**: Check file paths in assets.json and verify files exist. Fallback textures should appear as magenta rectangles.

### Problem: Scene doesn't transition
**Solution**: Verify `scene.start('library-scene')` uses correct scene key.

---

## Performance Optimization Tips

1. **Static Groups**: Use `this.physics.add.staticGroup()` for furniture (they don't move)
2. **Disable Unnecessary Updates**: Furniture doesn't need `runChildUpdate`
3. **Collision Groups**: Group furniture by type for better organization
4. **Debug Mode**: Disable physics debug graphics in production
5. **Asset Loading**: Load only needed assets, not entire manifest

---

## Next Steps

After completing this feature:

1. **Add More Furniture**: Enrich scene with additional pieces (aim for 15+)
2. **Improve Art**: Replace placeholders with final pixel art
3. **Add Ambient Effects**: Particle effects, lighting (future feature)
4. **Interactive Objects**: Add interaction indicators (! markers) in next feature
5. **Character NPCs**: Spawn characters after scene foundation is solid

---

## Debug Helpers

Add to LibraryScene for development:

```typescript
private debugMode: boolean = false;

create() {
  // ... existing code
  
  // Toggle debug with 'D' key
  this.input.keyboard?.on('keydown-D', () => {
    this.debugMode = !this.debugMode;
    if (this.debugMode) {
      this.physics.world.createDebugGraphic();
    } else {
      this.physics.world.debugGraphic?.clear();
    }
  });
}

update() {
  if (this.debugMode) {
    // Display debug info
    console.log(`Player: (${Math.round(this.player.x)}, ${Math.round(this.player.y)})`);
  }
}
```

---

## Estimated Timeline

| Phase | Time | Cumulative |
|-------|------|------------|
| Setup & Config | 30 min | 0:30 |
| Player Character | 1 hour | 1:30 |
| Library Scene | 2 hours | 3:30 |
| Collision System | 45 min | 4:15 |
| Integration & Polish | 1 hour | 5:15 |
| Testing & Validation | 30 min | 5:45 |

**Total**: ~6 hours for complete implementation

---

## Success Criteria Met

✅ Scene renders complete library environment  
✅ 10+ furniture pieces placed  
✅ Player movement with WASD/arrows  
✅ Collision detection prevents walking through objects  
✅ Camera follows player smoothly  
✅ Traversal time: 10-15 seconds  
✅ Scene transitions smoothly from StartScene  
✅ Pixel-perfect rendering maintained  
✅ 30+ FPS performance  

**You're done!** The library scene is now ready for future features (interactions, dialogues, NPCs).
