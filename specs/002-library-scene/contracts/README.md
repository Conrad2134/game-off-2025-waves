# Library Scene Contracts

This directory contains API contract definitions for the library scene feature.

## Purpose

These contracts define the interfaces and types that:
- Establish clear boundaries between the library scene and other game systems
- Provide type safety for TypeScript implementation
- Document expected inputs, outputs, and behaviors
- Enable independent development and testing

## Files

### `scene-api.ts`
Complete TypeScript interface definitions for:
- Scene configuration and lifecycle
- Player character entity
- Furniture and environment objects
- Scene layout data structures
- Asset manifest extensions
- Validation interfaces
- Error handling types
- Scene events

## Usage

### In Implementation Files

```typescript
import {
  LibrarySceneConfig,
  PlayerCharacterConfig,
  FurnitureConfig,
  LibraryLayoutConfig
} from '../specs/002-library-scene/contracts/scene-api';

export class LibraryScene extends Phaser.Scene {
  private sceneLayout!: LibraryLayoutConfig;
  
  create(data?: LibrarySceneData): void {
    // Implementation uses contract types
  }
}
```

### In Data Files

```typescript
// src/data/library-layout.json should conform to LibraryLayoutConfig
{
  "sceneId": "library-v1",
  "version": "1.0.0",
  "worldSize": { "width": 2400, "height": 1600 },
  "playerSpawn": { "x": 1200, "y": 800 },
  "furniture": [ /* ... */ ],
  "walls": [ /* ... */ ]
}
```

## Contract Guarantees

### Scene Configuration
- ✅ World size: 2400x1600 pixels
- ✅ Player spawns at center (1200, 800) or custom position
- ✅ Camera follows player with smooth lerp
- ✅ Camera bounded to prevent showing beyond scene

### Player Character
- ✅ Movement speed: 150 px/s (configurable)
- ✅ Supports WASD and arrow key input
- ✅ Movement can be locked/unlocked
- ✅ Diagonal movement normalized
- ✅ Collision with furniture and walls

### Furniture Objects
- ✅ Minimum 10 pieces for rich environment
- ✅ Each has unique ID
- ✅ Collision boxes separate from visual sprites
- ✅ Positioned within world bounds
- ✅ Render layers: 0 (behind player), 1 (in front)

### Scene Layout
- ✅ Loaded from JSON data file
- ✅ Validated on scene creation
- ✅ Walls fully enclose scene
- ✅ No furniture overlaps with spawn point

### Asset Loading
- ✅ Sprites loaded with explicit dimensions
- ✅ Error handling with fallback textures
- ✅ SVG support for pixel art
- ✅ Pixel-perfect rendering maintained

### Scene Transitions
- ✅ Smooth fade-out/fade-in (500ms each)
- ✅ Data passed between scenes via SceneData
- ✅ Scene lifecycle events emitted

## Validation

All implementations must pass validation defined by `ISceneValidator`:

```typescript
const validator = new SceneValidator();
const result = validator.validateLibraryLayout(layout);

if (!result.valid) {
  console.error('Layout validation failed:', result.errors);
}
```

## Events

Scenes implementing these contracts emit the following events:

| Event | Data | Description |
|-------|------|-------------|
| `scene-loaded` | void | Assets finished loading |
| `scene-ready` | void | Scene fully initialized |
| `player-spawned` | `{ position: Position }` | Player entity created |
| `player-moved` | `{ position, velocity }` | Player changed position |
| `scene-shutdown` | void | Scene is being destroyed |
| `asset-error` | `{ assetKey, error }` | Asset failed to load |

## Constants

Key constants are exported in `LIBRARY_SCENE_CONSTANTS`:

```typescript
SCENE_KEY: 'library-scene'
WORLD_WIDTH: 2400
WORLD_HEIGHT: 1600
DEFAULT_SPAWN: { x: 1200, y: 800 }
DEFAULT_PLAYER_SPEED: 150
DEFAULT_CAMERA_LERP: 0.1
FADE_OUT_DURATION: 500
FADE_IN_DURATION: 500
MIN_FURNITURE_COUNT: 10
MAX_FURNITURE_COUNT: 30
WALL_THICKNESS: 50
```

## Type Guards

Contracts include type guards for runtime validation:

```typescript
if (isLibraryLayoutConfig(data)) {
  // TypeScript knows data is LibraryLayoutConfig
}

if (isFurnitureConfig(obj)) {
  // TypeScript knows obj is FurnitureConfig
}
```

## Extending Contracts

For future features (interactions, dialogues, etc.), extend base interfaces:

```typescript
export interface InteractiveFurnitureConfig extends FurnitureConfig {
  interactable: true;
  interactionType: 'examine' | 'dialogue' | 'clue';
  interactionRadius: number;
  interactionData: unknown;
}
```

## Contract Versioning

Layout configurations include a version field:

```json
{
  "version": "1.0.0"
}
```

Version increments:
- **MAJOR**: Breaking changes to data structure
- **MINOR**: New optional fields added
- **PATCH**: Documentation or validation refinements
