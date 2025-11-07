# Research: Library/Study Game Scene

**Feature**: Library Scene Implementation  
**Branch**: `002-library-scene`  
**Date**: November 7, 2025  

## Overview

This document consolidates research findings for implementing the library/study scene. All technical unknowns have been resolved through analysis of existing project code, Phaser 3 best practices, and the game framework documentation.

## Research Findings

### 1. Player Character Movement System

**Question**: Does player character movement already exist, or must it be implemented?

**Finding**: Player movement system needs to be implemented as part of this feature.

**Decision**: Implement `PlayerCharacter` entity with top-down WASD/Arrow key movement

**Rationale**: 
- Current project has only `StartScene` implemented
- No existing player entity found in `src/entities/`
- Movement is fundamental to scene navigation (FR-002, FR-009)
- Required for testing scene traversal time (SC-002)

**Implementation Approach**:
```typescript
// src/entities/player-character.ts
export class PlayerCharacter extends Phaser.GameObjects.Container {
  private sprite: Phaser.GameObjects.Sprite;
  private speed: number = 150;
  private movementLocked: boolean = false;
  
  update(delta: number): void {
    if (this.movementLocked) return;
    
    const cursors = this.scene.input.keyboard.createCursorKeys();
    const velocityX = cursors.left.isDown ? -this.speed : cursors.right.isDown ? this.speed : 0;
    const velocityY = cursors.up.isDown ? -this.speed : cursors.down.isDown ? this.speed : 0;
    
    // Normalize diagonal movement
    if (velocityX !== 0 && velocityY !== 0) {
      const factor = Math.sqrt(2) / 2;
      body.setVelocity(velocityX * factor, velocityY * factor);
    } else {
      body.setVelocity(velocityX, velocityY);
    }
  }
}
```

**Alternatives Considered**:
- **Grid-based movement**: Rejected - doesn't fit cozy exploration feel
- **Point-and-click**: Rejected - spec explicitly requires WASD/arrow controls
- **Physics-based with acceleration**: Rejected - adds complexity without benefit for V1.0

---

### 2. Camera System Configuration

**Question**: How should camera boundaries and following behavior be configured?

**Finding**: Phaser 3 provides built-in camera following with customizable lerp and bounds

**Decision**: Use `camera.startFollow()` with smooth lerp and world bounds

**Rationale**:
- Prevents camera from showing empty space beyond scene edges (FR-011)
- Keeps player centered or near-center during movement (FR-011)
- Built-in Phaser feature, no custom implementation needed
- Smooth following prevents jarring camera movement

**Implementation Approach**:
```typescript
// In LibraryScene.create()
this.cameras.main.setBounds(0, 0, 2400, 1600); // Scene world size
this.cameras.main.startFollow(this.player, true, 0.1, 0.1); // Smooth lerp
this.cameras.main.setZoom(1.0);
```

**Configuration Parameters**:
- `roundPixels: true` - Maintains pixel-perfect rendering
- `lerp: 0.1` - Smooth following speed (adjustable)
- `bounds: [0, 0, 2400, 1600]` - Prevents showing beyond scene

**Alternatives Considered**:
- **Fixed camera**: Rejected - scene is larger than viewport
- **Manual camera control**: Rejected - automatic following is more intuitive
- **Deadzone camera**: Considered for future if needed, but centered following is simpler

---

### 3. Collision Detection Implementation

**Question**: Should collision use Phaser's physics system or manual distance checks?

**Finding**: Phaser Arcade Physics provides efficient overlap detection for static objects

**Decision**: Use Arcade Physics bodies with `immovable: true` for furniture, `collider` for walls

**Rationale**:
- Spec requires "invisible collision boxes/rectangles" separate from sprites (FR-005)
- Arcade Physics bodies can be sized independently of sprite visuals
- Built-in collision resolution prevents walking through objects
- More performant than manual distance checking for multiple objects

**Implementation Approach**:
```typescript
// For each furniture piece
const desk = this.physics.add.sprite(x, y, 'desk');
desk.body.setImmovable(true);
desk.body.setSize(120, 80); // Collision box size
desk.body.setOffset(-60, -40); // Center offset

// For player collision
this.physics.add.collider(this.player, furnitureGroup);
this.physics.add.collider(this.player, wallGroup);
```

**Best Practices from Framework**:
- Group furniture objects by type for performance
- Set `immovable: true` on all static objects
- Use slightly smaller collision boxes than visual sprites for better feel
- Debug mode available: `this.physics.world.createDebugGraphic()`

**Alternatives Considered**:
- **Matter.js physics**: Rejected - overkill for simple rectangular collision
- **Manual distance checks**: Rejected - less performant, more code
- **Tilemap collision**: Considered but rejected - furniture is sprite-based, not tile-based

---

### 4. Scene Layout Configuration Strategy

**Question**: Should scene layout be hardcoded or data-driven?

**Finding**: Constitution recommends data-driven design (Principle III)

**Decision**: Externalize furniture positions, collision boxes, and spawn points to JSON

**Rationale**:
- Easier iteration without code changes
- Aligns with constitution principle III (data-driven design)
- Enables future procedural or variable layouts
- Separates content from code logic

**Implementation Approach**:
```json
// src/data/library-layout.json
{
  "sceneId": "library-v1",
  "worldSize": { "width": 2400, "height": 1600 },
  "playerSpawn": { "x": 1200, "y": 800 },
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
      "position": { "x": 200, "y": 100 },
      "collisionBox": { "width": 60, "height": 180 },
      "layer": 0
    }
  ],
  "walls": [
    { "x": 0, "y": 0, "width": 2400, "height": 50 },
    { "x": 0, "y": 0, "width": 50, "height": 1600 }
  ]
}
```

**Loading in Scene**:
```typescript
preload() {
  this.load.json('library-layout', 'src/data/library-layout.json');
}

create() {
  const layout = this.cache.json.get('library-layout');
  this.spawnFurniture(layout.furniture);
  this.createWalls(layout.walls);
  this.player.setPosition(layout.playerSpawn.x, layout.playerSpawn.y);
}
```

**Alternatives Considered**:
- **Hardcoded positions**: Simple but violates constitution, hard to iterate
- **Tilemap editor (Tiled)**: Good for tile-based games, but furniture is sprite-based
- **Visual scene editor**: Future enhancement, JSON is sufficient for V1.0

---

### 5. Asset Creation and Sizing Strategy

**Question**: What are best practices for pixel art asset sizing in Phaser 3?

**Finding**: Pixel art requires explicit dimensions and integer scaling

**Decision**: Create assets at target display size (32x32 to 128x128 based on furniture), load with explicit dimensions

**Rationale**:
- Maintains pixel-perfect rendering (Constitution Principle II)
- Consistent with existing `StartScene` asset loading patterns
- SVG assets require explicit width/height for proper rendering
- Integer scaling prevents sub-pixel blurring

**Asset Specifications**:
```typescript
// Standard sizes for furniture categories
const ASSET_SIZES = {
  small: { width: 32, height: 32 },    // Chairs, small items
  medium: { width: 64, height: 64 },   // Desk, tables
  large: { width: 96, height: 128 },   // Bookshelves, fireplace
  xlarge: { width: 128, height: 160 }  // Large furniture pieces
};

// Loading pattern
this.load.svg('desk', 'assets/sprites/environment/desk.svg', { 
  width: 64, 
  height: 64 
});
```

**Color Palette Guidance** (from GAME_INFO.md):
- Cozy/warm pixel art aesthetic
- Inspired by Stardew Valley/Celeste
- German castle atmosphere: stone grays, wood browns, warm lighting
- Accent colors: gold (trophy wall), green (plants), red (fireplace)

**Alternatives Considered**:
- **Tilemap-based scene**: Better for large uniform areas, but furniture is too varied
- **Dynamic asset sizing**: Rejected - leads to inconsistent pixel density
- **Sprite sheets**: Good for animation, but static furniture doesn't need it

---

### 6. Scene Transition Implementation

**Question**: How should transition from StartScene to LibraryScene work?

**Finding**: Phaser provides `scene.start()` with fade transitions

**Decision**: Use camera fade-out/fade-in pattern for seamless transition

**Rationale**:
- Smooth visual transition prevents jarring cut
- Maintains immersion (edge case consideration)
- Consistent with Phaser best practices
- Simple to implement with built-in camera effects

**Implementation Approach**:
```typescript
// In StartScene - on start button click
this.cameras.main.fadeOut(500, 0, 0, 0);
this.cameras.main.once('camerafadeoutcomplete', () => {
  this.scene.stop();
  this.scene.start('library-scene');
});

// In LibraryScene - on scene start
create() {
  // Setup scene
  this.cameras.main.fadeIn(500);
}
```

**Transition Timing**:
- Fade out: 500ms (half second)
- Scene switch: Immediate
- Fade in: 500ms (half second)
- Total transition: ~1 second, feels smooth

**Alternatives Considered**:
- **Instant cut**: Jarring, not recommended
- **Loading screen**: Unnecessary for single scene transition
- **Wipe/slide effects**: More complex, fade is sufficient

---

### 7. Scene Size and Traversal Time Calculation

**Question**: How to validate 5-15 second traversal time requirement?

**Finding**: Calculate based on player speed and scene dimensions

**Decision**: Player speed of 150 pixels/second, scene diagonal of ~2880 pixels = ~19 seconds diagonal, ~16 seconds horizontal

**Rationale**:
- Scene: 2400x1600 pixels (FR-004)
- Player speed: 150 px/s (standard for top-down games)
- Horizontal traversal: 2400px ÷ 150px/s = 16 seconds
- Diagonal traversal: 2880px ÷ 150px/s = 19.2 seconds
- Edge-to-edge (accounting for spawn center): ~10-15 seconds typical exploration

**Validation Approach**:
```typescript
// Debug tracking (development only)
private startX: number = 0;
private travelTime: number = 0;

// On movement start
if (velocityX !== 0 || velocityY !== 0) {
  if (!this.startX) this.startX = this.player.x;
}

// Update timer
if (this.startX > 0) {
  this.travelTime += delta / 1000;
  const distance = Math.abs(this.player.x - this.startX);
  console.log(`Distance: ${distance}px, Time: ${this.travelTime}s`);
}
```

**Tuning Parameters**:
- If too slow: Increase player speed to 175-200 px/s
- If too fast: Decrease to 125-140 px/s
- Target: 10-15 seconds for typical exploration paths

**Alternatives Considered**:
- **Larger scene (3000x2000)**: Would exceed traversal time target
- **Smaller scene (1600x1200)**: Would feel cramped for investigation
- **Variable speed**: Adds complexity, not needed for V1.0

---

### 8. Responsive Design and Viewport Handling

**Question**: How should the scene adapt to different screen sizes?

**Finding**: Phaser Scale Manager handles viewport sizing, camera shows portion of world

**Decision**: Fixed 2400x1600 world size, camera viewport adapts to browser window

**Rationale**:
- World size is fixed (game world coordinate space)
- Viewport size adapts to browser window (what player sees)
- Camera shows different portions as it follows player
- Standard pattern for exploration games

**Implementation Approach**:
```typescript
// In main.ts (game config)
scale: {
  mode: Phaser.Scale.RESIZE,
  autoCenter: Phaser.Scale.CENTER_BOTH,
  width: 1024,  // Initial viewport
  height: 768
}

// In LibraryScene
this.scale.on('resize', (gameSize: Phaser.Structs.Size) => {
  // Camera automatically adjusts viewport
  // No manual repositioning needed
});
```

**Viewport Considerations**:
- Minimum recommended: 800x600 (desktop)
- Typical: 1024x768 to 1920x1080
- Scene is always larger than viewport (encourages exploration)
- Camera boundaries prevent showing empty space

**Alternatives Considered**:
- **Fixed aspect ratio**: Too restrictive for web platform
- **Zoom to fit entire scene**: Defeats purpose of exploration
- **Multiple scene sizes**: Unnecessary complexity for single scene

---

### 9. Performance Optimization Strategy

**Question**: What performance optimizations are needed for static scene?

**Finding**: Static furniture requires minimal optimization, camera culling is built-in

**Decision**: Use sprite groups for organization, rely on Phaser's built-in culling

**Rationale**:
- Static objects (furniture) have no update logic
- Phaser automatically culls off-camera sprites
- No pooling needed (objects don't spawn/despawn)
- Scene has ~10-15 furniture pieces = very low overhead

**Implementation Approach**:
```typescript
// Group furniture by type for organization
this.furnitureGroup = this.physics.add.staticGroup();
this.wallsGroup = this.physics.add.staticGroup();

// Static objects don't need runChildUpdate
// Phaser handles culling automatically
```

**Performance Targets**:
- 60 FPS target, 30+ FPS minimum (FR-SC-007)
- Static scene should easily achieve this
- No intensive calculations or particle effects
- Main performance factor: asset loading time

**Monitoring**:
```typescript
// Debug FPS display (development)
if (this.debugMode) {
  this.debugText.setText(`FPS: ${Math.round(this.game.loop.actualFps)}`);
}
```

**Alternatives Considered**:
- **Spatial partitioning**: Overkill for static scene with few objects
- **LOD (Level of Detail)**: Unnecessary, all furniture always visible
- **Texture atlases**: Good future optimization, but not critical for V1.0

---

### 10. Error Handling for Asset Loading

**Question**: How to handle missing or failed furniture sprite assets?

**Finding**: Existing pattern uses loaderror events with fallback textures

**Decision**: Implement fallback colored rectangles for missing furniture sprites

**Rationale**:
- Graceful degradation (Constitution Principle IV)
- Scene remains navigable even if assets fail to load
- Existing pattern in project (from GAME_FRAMEWORK.md)
- Helpful for development when assets not yet created

**Implementation Approach**:
```typescript
preload() {
  this.load.on('loaderror', (file: any) => {
    console.warn(`Asset load failed: ${file.key}`);
    this.assetErrors.set(file.key, true);
  });
  
  // Load furniture sprites
  this.load.svg('desk', 'assets/sprites/environment/desk.svg', { width: 64, height: 64 });
  // ... other assets
}

create() {
  const layout = this.cache.json.get('library-layout');
  
  layout.furniture.forEach((furn: FurnitureConfig) => {
    const spriteKey = this.assetErrors.has(furn.sprite) 
      ? this.createFallbackTexture(furn.sprite, furn.collisionBox)
      : furn.sprite;
    
    const sprite = this.physics.add.sprite(furn.position.x, furn.position.y, spriteKey);
    // ... configure sprite
  });
}

private createFallbackTexture(key: string, size: {width: number, height: number}): string {
  const fallbackKey = `fallback-${key}`;
  const graphics = this.add.graphics();
  graphics.fillStyle(0xff00ff, 1); // Magenta = missing asset
  graphics.fillRect(0, 0, size.width, size.height);
  graphics.lineStyle(2, 0xffffff, 1);
  graphics.strokeRect(0, 0, size.width, size.height);
  graphics.generateTexture(fallbackKey, size.width, size.height);
  graphics.destroy();
  return fallbackKey;
}
```

**Fallback Colors**:
- Magenta (#FF00FF): Missing furniture asset (very visible)
- White outline: Makes shape distinguishable
- Size matches intended collision box

**Alternatives Considered**:
- **Block scene load**: Too harsh, prevents testing
- **Placeholder images**: More complex to manage
- **Text labels**: Less visually clear than colored shapes

---

## Summary of Decisions

| Topic | Decision | Rationale |
|-------|----------|-----------|
| **Player Movement** | Implement new PlayerCharacter with WASD/arrows | Required for scene navigation, not currently implemented |
| **Camera System** | Use startFollow() with smooth lerp and bounds | Built-in, prevents showing empty space, keeps player centered |
| **Collision Detection** | Arcade Physics with immovable static bodies | Efficient, separates collision from visual, built-in resolution |
| **Scene Layout** | Externalize to library-layout.json | Data-driven design, easier iteration, aligns with constitution |
| **Asset Sizing** | Explicit dimensions, integer scaling, 32-128px | Maintains pixel-perfect rendering, consistent quality |
| **Scene Transition** | Camera fade-out/fade-in (500ms each) | Smooth, immersive, prevents jarring cuts |
| **Traversal Time** | 150 px/s player speed = ~10-15s typical paths | Meets 5-15 second requirement, tunable if needed |
| **Viewport Handling** | Fixed world (2400x1600), adaptive viewport | Standard exploration pattern, responsive to window size |
| **Performance** | Static groups, rely on built-in culling | Sufficient for static scene, no complex optimization needed |
| **Error Handling** | Fallback magenta rectangles for missing assets | Graceful degradation, scene remains functional |

---

## Technology Best Practices

### Phaser 3 Scene Architecture
- **Lifecycle**: preload → create → update pattern
- **Camera**: Use built-in following and bounds
- **Physics**: Arcade Physics sufficient for rectangular collision
- **Assets**: Load with explicit dimensions for SVG/pixel art

### TypeScript Integration
- Define interfaces for all configurations
- Type scene data structures
- Use strict null checks
- Avoid implicit any

### Pixel Art Standards
- `pixelArt: true` and `antialias: false` in config
- Integer coordinates for all sprites
- Integer scaling when resizing
- Explicit asset dimensions

### Data-Driven Design
- Externalize scene layout to JSON
- Separate content from code
- Enable iteration without recompilation
- Future-proof for variable layouts

---

## Resolved Unknowns

All "NEEDS CLARIFICATION" items from Technical Context have been resolved:

✅ Player movement implementation approach defined  
✅ Camera following behavior specified  
✅ Collision detection strategy determined  
✅ Scene layout configuration approach decided  
✅ Asset creation standards established  
✅ Scene transition pattern chosen  
✅ Traversal time validation method defined  
✅ Viewport/responsive design clarified  
✅ Performance optimization strategy outlined  
✅ Error handling approach specified  

**Status**: Ready to proceed to Phase 1 (Design & Contracts)
