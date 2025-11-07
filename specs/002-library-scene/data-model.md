# Data Model: Library/Study Game Scene

**Feature**: Library Scene Implementation  
**Branch**: `002-library-scene`  
**Date**: November 7, 2025  

## Overview

This document defines the data structures, entities, and relationships for the library scene feature. All models are designed to support the cozy pixel art mystery game's locked-room investigation environment.

---

## Core Entities

### 1. LibraryScene

The primary Phaser scene representing the library/study game environment.

**Type Definition**:
```typescript
// src/scenes/library-scene.ts
export class LibraryScene extends Phaser.Scene {
  private player!: PlayerCharacter;
  private furnitureGroup!: Phaser.Physics.Arcade.StaticGroup;
  private wallsGroup!: Phaser.Physics.Arcade.StaticGroup;
  private sceneLayout!: LibraryLayoutConfig;
  private assetErrors: Map<string, boolean> = new Map();
}
```

**Configuration**:
```typescript
// src/types/scenes.ts
export interface LibrarySceneConfig {
  key: string;              // 'library-scene'
  worldSize: Size;          // { width: 2400, height: 1600 }
  playerSpawn: Position;    // { x: 1200, y: 800 }
  cameraConfig: CameraConfig;
}

export interface CameraConfig {
  followLerp: number;       // 0.1 (smooth following)
  bounds: Rectangle;        // { x: 0, y: 0, width: 2400, height: 1600 }
  zoom: number;             // 1.0 (no zoom)
}
```

**Lifecycle**:
- `preload()`: Load all furniture sprites, layout JSON, player sprite
- `create()`: Instantiate furniture, walls, player, configure camera
- `update(delta)`: Update player movement, check interactions

**State**:
- No persistent state in this feature (future: investigation progress)
- Camera position follows player
- Player position tracked in real-time

**Relationships**:
- Contains 1 PlayerCharacter
- Contains N FurnitureObjects (10-15 expected)
- Contains M WallSegments (4 outer walls + interior boundaries)
- Receives data from LibraryLayoutConfig

---

### 2. PlayerCharacter

The controllable player entity for scene navigation.

**Type Definition**:
```typescript
// src/entities/player-character.ts
export interface PlayerCharacterConfig {
  scene: Phaser.Scene;
  x: number;
  y: number;
  spriteKey: string;        // 'player' or 'player-idle'
  speed?: number;           // Default: 150
}

export class PlayerCharacter extends Phaser.GameObjects.Container {
  private sprite: Phaser.GameObjects.Sprite;
  private speed: number;
  private movementLocked: boolean;
  private cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasdKeys: WASDKeys;
  
  constructor(config: PlayerCharacterConfig);
  
  public update(delta: number): void;
  public lockMovement(): void;
  public unlockMovement(): void;
  public getPosition(): Position;
  public setPosition(x: number, y: number): void;
}

interface WASDKeys {
  up: Phaser.Input.Keyboard.Key;
  down: Phaser.Input.Keyboard.Key;
  left: Phaser.Input.Keyboard.Key;
  right: Phaser.Input.Keyboard.Key;
}
```

**Fields**:
- `sprite`: Visual representation (32x32 or 48x48 pixel art)
- `speed`: Movement speed in pixels/second (default 150)
- `movementLocked`: Whether player can currently move (for dialogues)
- `cursors`: Arrow key input handlers
- `wasdKeys`: WASD key input handlers

**Physics**:
- Physics body enabled (Arcade Physics)
- Body size: 28x28 (slightly smaller than sprite for better feel)
- Body offset: -14, -14 (centered on container)
- Collision enabled with furniture and walls
- `collideWorldBounds: false` (camera bounds handle this)

**Movement Validation**:
- Diagonal movement normalized (divide by √2)
- Velocity clamped to speed value
- Movement disabled when `movementLocked === true`

**State Transitions**:
```
Idle → Moving (key pressed)
Moving → Idle (key released)
Moving → Locked (dialogue starts)
Locked → Idle (dialogue ends)
```

**Relationships**:
- Contained by LibraryScene
- Collides with FurnitureObjects
- Collides with WallSegments
- Followed by Camera

---

### 3. FurnitureObject

Static environmental objects that define the library layout.

**Type Definition**:
```typescript
// src/types/scenes.ts
export interface FurnitureConfig {
  id: string;               // Unique identifier (e.g., 'desk-valentin')
  type: FurnitureType;      // Category for grouping
  sprite: string;           // Asset key (e.g., 'desk', 'bookshelf-tall')
  position: Position;       // World coordinates
  collisionBox: Size;       // Collision dimensions (may differ from sprite)
  layer: number;            // Z-index (0 = behind player, 1 = in front)
  interactable?: boolean;   // Future: can player interact? (default: false)
}

export enum FurnitureType {
  Bookshelf = 'bookshelf',
  Desk = 'desk',
  Seating = 'seating',
  Table = 'table',
  Fireplace = 'fireplace',
  Window = 'window',
  Door = 'door',
  Decoration = 'decoration'
}
```

**Common Furniture Pieces** (from spec):
1. **Bookshelves**: Floor-to-ceiling, multiple units
   - Collision: 60x180 (tall and narrow)
   - Visual: 64x192
   - Layer: 0

2. **Valentin's Desk**: Central workspace
   - Collision: 120x80
   - Visual: 128x96
   - Layer: 0

3. **Fireplace**: With mantle
   - Collision: 100x60 (front only)
   - Visual: 128x128
   - Layer: 0

4. **Seating**: Chairs/couches (multiple)
   - Collision: 40x40 per chair
   - Visual: 48x48
   - Layer: 0

5. **Dining Table**: Large table
   - Collision: 160x80
   - Visual: 176x96
   - Layer: 0

6. **Windows**: Locked, decorative
   - Collision: 80x40 (sill only)
   - Visual: 96x128
   - Layer: 0

7. **Trophy Wall**: Valentin's achievements
   - Collision: None (wall-mounted)
   - Visual: 128x64
   - Layer: 1 (in front of player)

8. **Bar Cart**: Drinks and glasses
   - Collision: 40x60
   - Visual: 48x64
   - Layer: 0

9. **Locked Door**: Exit (prominently featured)
   - Collision: 80x40 (threshold)
   - Visual: 96x128
   - Layer: 0

**Physics Configuration**:
```typescript
const furniture = this.physics.add.sprite(config.position.x, config.position.y, config.sprite);
furniture.body.setImmovable(true);
furniture.body.setSize(config.collisionBox.width, config.collisionBox.height);
furniture.body.setOffset(
  -config.collisionBox.width / 2,
  -config.collisionBox.height / 2
);
furniture.setDepth(config.layer);
```

**Validation Rules**:
- All furniture must have unique `id`
- Position must be within world bounds (0-2400, 0-1600)
- Collision box must be positive dimensions
- Layer must be 0 or 1 (future: more layers if needed)

**Relationships**:
- Defined by LibraryLayoutConfig
- Spawned by LibraryScene
- Collides with PlayerCharacter
- Grouped in furnitureGroup for organization

---

### 4. WallSegment

Invisible collision boundaries that define the room perimeter.

**Type Definition**:
```typescript
// src/types/scenes.ts
export interface WallConfig {
  x: number;                // Top-left corner X
  y: number;                // Top-left corner Y
  width: number;            // Width of wall segment
  height: number;           // Height of wall segment
}
```

**Standard Wall Definitions**:
```json
{
  "walls": [
    { "x": 0, "y": 0, "width": 2400, "height": 50 },        // North wall
    { "x": 0, "y": 1550, "width": 2400, "height": 50 },     // South wall
    { "x": 0, "y": 0, "width": 50, "height": 1600 },        // West wall
    { "x": 2350, "y": 0, "width": 50, "height": 1600 }      // East wall
  ]
}
```

**Physics Configuration**:
```typescript
const wall = this.physics.add.sprite(
  config.x + config.width / 2,
  config.y + config.height / 2,
  null // No texture (invisible)
);
wall.body.setImmovable(true);
wall.body.setSize(config.width, config.height);
wall.setVisible(false); // Invisible in game
```

**Debug Visualization** (development only):
```typescript
if (this.debugMode) {
  const debugGraphics = this.add.graphics();
  debugGraphics.lineStyle(2, 0xff0000, 1);
  debugGraphics.strokeRect(config.x, config.y, config.width, config.height);
}
```

**Validation Rules**:
- Walls must fully enclose scene (no gaps)
- Minimum thickness: 50 pixels
- Must align with world bounds

**Relationships**:
- Defined by LibraryLayoutConfig
- Spawned by LibraryScene
- Collides with PlayerCharacter
- Grouped in wallsGroup

---

### 5. LibraryLayoutConfig

JSON data structure defining the complete scene layout.

**Type Definition**:
```typescript
// src/types/scenes.ts
export interface LibraryLayoutConfig {
  sceneId: string;          // 'library-v1'
  version: string;          // '1.0.0' (for future migrations)
  worldSize: Size;
  playerSpawn: Position;
  furniture: FurnitureConfig[];
  walls: WallConfig[];
  ambiance?: AmbianceConfig;  // Future: lighting, particles
}

export interface Size {
  width: number;
  height: number;
}

export interface Position {
  x: number;
  y: number;
}

export interface Rectangle extends Position, Size {}
```

**Example JSON**:
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
      "position": { "x": 1200, "y": 200 },
      "collisionBox": { "width": 100, "height": 60 },
      "layer": 0
    },
    {
      "id": "couch-south-1",
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
      "id": "window-north-1",
      "type": "window",
      "sprite": "window",
      "position": { "x": 600, "y": 100 },
      "collisionBox": { "width": 80, "height": 40 },
      "layer": 0
    },
    {
      "id": "trophy-wall-west",
      "type": "decoration",
      "sprite": "trophy-wall",
      "position": { "x": 100, "y": 600 },
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

**Loading Pattern**:
```typescript
// In LibraryScene.preload()
this.load.json('library-layout', 'src/data/library-layout.json');

// In LibraryScene.create()
this.sceneLayout = this.cache.json.get('library-layout') as LibraryLayoutConfig;
this.validateLayout(this.sceneLayout);
```

**Validation Rules**:
1. **sceneId** must be unique across scenes
2. **worldSize** must match scene configuration (2400x1600)
3. **playerSpawn** must be within world bounds and not colliding with furniture
4. **furniture** array must contain 10-15 objects (per spec requirements)
5. **walls** must fully enclose scene
6. All furniture IDs must be unique
7. All furniture positions must be within world bounds
8. Collision boxes must be reasonable (0-300 pixels dimension)

**Validation Implementation**:
```typescript
private validateLayout(layout: LibraryLayoutConfig): void {
  // Check world size matches
  if (layout.worldSize.width !== 2400 || layout.worldSize.height !== 1600) {
    console.error('Invalid world size in layout config');
  }
  
  // Check player spawn is within bounds
  if (layout.playerSpawn.x < 0 || layout.playerSpawn.x > layout.worldSize.width ||
      layout.playerSpawn.y < 0 || layout.playerSpawn.y > layout.worldSize.height) {
    console.error('Player spawn out of bounds');
  }
  
  // Check furniture count
  if (layout.furniture.length < 10) {
    console.warn('Scene has fewer than 10 furniture pieces (spec requires 10+)');
  }
  
  // Check for duplicate furniture IDs
  const ids = new Set(layout.furniture.map(f => f.id));
  if (ids.size !== layout.furniture.length) {
    console.error('Duplicate furniture IDs found');
  }
  
  // Validate each furniture piece
  layout.furniture.forEach(furn => {
    if (furn.position.x < 0 || furn.position.x > layout.worldSize.width ||
        furn.position.y < 0 || furn.position.y > layout.worldSize.height) {
      console.error(`Furniture ${furn.id} position out of bounds`);
    }
    
    if (furn.collisionBox.width < 0 || furn.collisionBox.height < 0 ||
        furn.collisionBox.width > 300 || furn.collisionBox.height > 300) {
      console.error(`Furniture ${furn.id} has invalid collision box`);
    }
  });
}
```

**Relationships**:
- Loaded by LibraryScene
- Defines FurnitureObjects
- Defines WallSegments
- Defines PlayerCharacter spawn

---

## Asset Manifest Extension

The existing `src/data/assets.json` must be extended to include library scene assets.

**Type Definition**:
```typescript
// src/types/assets.ts
export interface AssetManifest {
  sprites: Record<string, SpriteAssetDef>;
  audio?: Record<string, AudioAssetDef>;
}

export interface SpriteAssetDef {
  path: string;
  width?: number;
  height?: number;
  type?: 'svg' | 'png' | 'jpg';
}

export interface AudioAssetDef {
  path: string;
  volume?: number;
  loop?: boolean;
}
```

**Extended assets.json**:
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

**Loading Pattern**:
```typescript
preload() {
  const manifest = this.cache.json.get('assets') as AssetManifest;
  
  Object.entries(manifest.sprites).forEach(([key, def]) => {
    if (def.type === 'svg' || def.path.endsWith('.svg')) {
      this.load.svg(key, def.path, { width: def.width, height: def.height });
    } else {
      this.load.image(key, def.path);
    }
  });
}
```

---

## Data Flow Diagram

```
[assets.json] ──load──> [LibraryScene.preload()]
                              │
                              ├──> Load furniture sprites
                              ├──> Load player sprite
                              └──> Load library-layout.json
                                        │
                                        v
[library-layout.json] ──parse──> [LibraryScene.create()]
                                        │
                                        ├──> Spawn furniture objects
                                        ├──> Create wall segments
                                        ├──> Instantiate PlayerCharacter
                                        └──> Configure camera
                                                  │
                                                  v
                                        [LibraryScene.update()]
                                                  │
                                                  ├──> Update player movement
                                                  ├──> Physics collision detection
                                                  └──> Camera follows player
```

---

## State Machine: Scene Lifecycle

```
┌──────────────┐
│   LOADING    │ preload() - Load assets and config
└──────┬───────┘
       │
       v
┌──────────────┐
│   CREATING   │ create() - Instantiate entities, setup physics
└──────┬───────┘
       │
       v
┌──────────────┐
│    ACTIVE    │ update() - Main game loop
│              │ - Player movement
│              │ - Collision detection
│              │ - Camera following
└──────┬───────┘
       │
       v (transition to other scene)
┌──────────────┐
│  SHUTTING    │ Camera fade out, cleanup listeners
│    DOWN      │
└──────────────┘
```

---

## Validation & Constraints

### Scene Configuration Validation

```typescript
export class SceneValidator {
  static validateLibraryLayout(layout: LibraryLayoutConfig): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    // World size validation
    if (layout.worldSize.width !== 2400 || layout.worldSize.height !== 1600) {
      errors.push('World size must be 2400x1600');
    }
    
    // Player spawn validation
    const spawn = layout.playerSpawn;
    if (!this.isWithinBounds(spawn, layout.worldSize)) {
      errors.push('Player spawn is out of bounds');
    }
    
    // Furniture count validation
    if (layout.furniture.length < 10) {
      warnings.push('Spec requires 10+ furniture pieces for rich environment');
    }
    
    // Furniture ID uniqueness
    const ids = layout.furniture.map(f => f.id);
    const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
    if (duplicates.length > 0) {
      errors.push(`Duplicate furniture IDs: ${duplicates.join(', ')}`);
    }
    
    // Furniture position validation
    layout.furniture.forEach(furn => {
      if (!this.isWithinBounds(furn.position, layout.worldSize)) {
        errors.push(`Furniture ${furn.id} position out of bounds`);
      }
      
      if (furn.collisionBox.width <= 0 || furn.collisionBox.height <= 0) {
        errors.push(`Furniture ${furn.id} has invalid collision box dimensions`);
      }
    });
    
    // Wall validation
    if (!this.wallsEncloseScene(layout.walls, layout.worldSize)) {
      errors.push('Walls do not fully enclose the scene');
    }
    
    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }
  
  private static isWithinBounds(pos: Position, size: Size): boolean {
    return pos.x >= 0 && pos.x <= size.width && pos.y >= 0 && pos.y <= size.height;
  }
  
  private static wallsEncloseScene(walls: WallConfig[], worldSize: Size): boolean {
    // Check if there are walls covering all four edges
    const hasNorth = walls.some(w => w.y === 0 && w.width >= worldSize.width);
    const hasSouth = walls.some(w => w.y >= worldSize.height - 100 && w.width >= worldSize.width);
    const hasWest = walls.some(w => w.x === 0 && w.height >= worldSize.height);
    const hasEast = walls.some(w => w.x >= worldSize.width - 100 && w.height >= worldSize.height);
    return hasNorth && hasSouth && hasWest && hasEast;
  }
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}
```

---

## Future Extensions (Out of Scope for V1.0)

### Interactive Object Markers
```typescript
export interface InteractiveObjectConfig extends FurnitureConfig {
  interactable: true;
  interactionType: 'examine' | 'dialogue' | 'clue';
  interactionRadius: number;      // Distance for (!) indicator
  interactionData: {
    dialogueId?: string;
    clueId?: string;
    description?: string;
  };
}
```

### Ambient Effects
```typescript
export interface AmbianceConfig {
  particles?: ParticleConfig[];   // Fireplace smoke, dust motes
  lighting?: LightingConfig;      // Warm fireplace glow
  soundscape?: string;            // Ambient castle sounds
}
```

### Room Variants
```typescript
export interface RoomVariantConfig {
  baseLayout: string;             // Reference to base layout
  modifications: FurnitureConfig[]; // Override specific furniture
  timeOfDay?: 'day' | 'evening' | 'night';
}
```

---

## Summary

### Key Data Structures Created

1. **LibraryScene** - Main Phaser scene class
2. **PlayerCharacter** - Controllable player entity
3. **FurnitureObject** - Static environmental objects
4. **WallSegment** - Invisible collision boundaries
5. **LibraryLayoutConfig** - JSON scene configuration
6. **Asset Manifest Extension** - Sprite definitions

### Data Relationships

```
LibraryLayoutConfig (JSON)
    ├── defines → FurnitureObjects (10-15 instances)
    ├── defines → WallSegments (4+ instances)
    └── defines → PlayerCharacter spawn
    
LibraryScene (Phaser Scene)
    ├── contains → PlayerCharacter (1 instance)
    ├── contains → FurnitureObjects (managed by furnitureGroup)
    ├── contains → WallSegments (managed by wallsGroup)
    └── loads → LibraryLayoutConfig
    
PlayerCharacter
    ├── collides with → FurnitureObjects
    ├── collides with → WallSegments
    └── followed by → Camera
```

### Validation Implemented

✅ Scene configuration structure validation  
✅ Furniture position bounds checking  
✅ Furniture ID uniqueness enforcement  
✅ Collision box dimension validation  
✅ Wall enclosure verification  
✅ Player spawn position validation  

**Status**: Data model complete, ready for contract generation
