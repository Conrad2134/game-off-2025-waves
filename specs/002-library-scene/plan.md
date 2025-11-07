# Implementation Plan: Library/Study Game Scene

**Branch**: `002-library-scene` | **Date**: November 7, 2025 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-library-scene/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Create a fully-rendered, explorable library/study scene (2400x1600 pixels) as the primary game environment for the locked-room mystery. The scene will feature cozy pixel art aesthetics with all required furniture elements (bookshelves, desk, fireplace, seating areas, etc.), collision detection, smooth camera following, and seamless navigation. Player character spawns at center and can freely explore using WASD/arrow keys. Scene transitions from the existing start scene via start button.

## Technical Context

**Language/Version**: TypeScript 5.0+  
**Primary Dependencies**: Phaser 3.80.0, Vite 5.0.0  
**Storage**: LocalStorage for game state persistence (existing GameStateManager)  
**Testing**: Manual playtesting, no automated tests required for this feature  
**Target Platform**: Modern desktop web browsers (Chrome, Firefox, Safari)  
**Project Type**: Single-page web game with Phaser 3 scene architecture  
**Performance Goals**: 30+ FPS, smooth camera following, instant scene transitions  
**Constraints**: Pixel-perfect rendering (pixelArt: true, antialias: false), 2400x1600 scene world size, top-down perspective  
**Scale/Scope**: Single large scene with 10+ furniture elements, collision boxes for all objects, custom pixel art assets

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

[Gates determined based on constitution file]

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### I. Phaser 3 Architecture First ✅
- Scene will be implemented as `LibraryScene` extending `Phaser.Scene`
- Follows standard preload, create, update lifecycle
- Environmental elements as Phaser Sprites/Images with physics bodies
- Collision system as reusable game logic
- Aligns with existing `StartScene` pattern

**Status**: PASS - Feature follows Phaser scene-entity-system architecture

### II. Pixel Art Rendering Standards ✅
- Game config already has `pixelArt: true` and `antialias: false`
- All furniture sprites will use integer coordinates
- Assets will be loaded as SVG or PNG with explicit dimensions
- Camera positioning will maintain pixel-perfect rendering

**Status**: PASS - Rendering standards already established in main.ts

### III. Data-Driven Design ⚠️
- Scene layout should be defined in `src/data/scenes.json` or similar
- Furniture positions, collision boxes, and spawn points externalized
- Currently: Scene layout may be hardcoded in LibraryScene class

**Status**: ADVISORY - Recommend externalizing scene configuration to JSON for easier iteration, but not blocking for V1.0

### IV. Robust Error Handling ✅
- Asset loading will use existing error handler pattern (`load.on('loaderror')`)
- Fallback textures for missing furniture sprites
- Graceful degradation if scene cannot load

**Status**: PASS - Will implement error handling per existing patterns

### V. Performance Through Pooling ⚠️
- Static furniture objects do not require pooling
- Future interactive objects (! indicators) should use pooling when added
- No performance concerns for single static scene

**Status**: PASS - Pooling not required for static scene elements

### VI. TypeScript Type Safety ✅
- Interfaces for `LibrarySceneConfig`, `FurnitureConfig`, `CollisionBoxConfig`
- Type definitions for scene data structures
- Strict null checks and no implicit any

**Status**: PASS - Will maintain type safety throughout implementation

### VII. Scene State Management ✅
- Player spawn position tracked via GameStateManager
- Scene transition state managed through Phaser scene system
- No complex investigation state needed for this feature (added later)

**Status**: PASS - State management appropriate for feature scope

### Mystery Game Specific Constraints
- Interaction mechanics: OUT OF SCOPE (future feature)
- Dialogue system: OUT OF SCOPE (future feature)
- Player movement: Must implement or verify existing
- Visual indicators: OUT OF SCOPE (future feature)

**Status**: PASS - Feature correctly scoped to environment only

### Overall Constitution Compliance: PASS ✅
All critical principles satisfied. Advisory recommendation to externalize scene layout to JSON but not blocking.

---

## Post-Phase-1 Re-evaluation

After completing Phase 1 design (research, data models, contracts, quickstart):

### I. Phaser 3 Architecture First ✅
**Re-evaluated**: Design confirms proper scene-entity-system architecture
- `LibraryScene` class properly extends `Phaser.Scene`
- `PlayerCharacter` entity follows Container pattern from framework
- Static groups used for furniture and walls
- All lifecycle methods properly structured

**Status**: PASS - Architecture confirmed in detailed design

### III. Data-Driven Design ✅ (UPGRADED)
**Re-evaluated**: Design includes `library-layout.json` configuration
- Complete JSON structure defined in `data-model.md`
- All furniture positions externalized
- Wall configurations externalized
- Scene validation implemented

**Status**: PASS - Advisory recommendation implemented in design

### Overall Re-evaluation: PASS ✅
All constitution principles satisfied with improved data-driven design implementation.
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
src/
├── main.ts                      # Game initialization (already exists)
├── scenes/
│   ├── start-scene.ts           # Existing title/start scene
│   └── library-scene.ts         # NEW: Library/study investigation scene
├── entities/
│   └── player-character.ts      # NEW or UPDATE: Player movement entity
├── systems/
│   └── collision-manager.ts     # NEW: Collision detection for furniture/walls
├── data/
│   ├── assets.json              # UPDATE: Add library scene assets
│   └── library-layout.json      # NEW: Scene layout configuration
├── types/
│   └── scenes.ts                # NEW: Scene configuration types
└── utils/                       # Existing utility functions

public/assets/sprites/
├── environment/                 # NEW: Furniture and scene elements
│   ├── bookshelf.svg
│   ├── desk.svg
│   ├── fireplace.svg
│   ├── chair.svg
│   ├── couch.svg
│   ├── dining-table.svg
│   ├── window.svg
│   ├── trophy-wall.svg
│   ├── bar-cart.svg
│   ├── locked-door.svg
│   └── floor-tiles.svg
└── characters/
    └── player.svg               # NEW or UPDATE: Player sprite
```

**Structure Decision**: Single project structure maintained. Library scene added as new Phaser scene within existing `src/scenes/` directory. All furniture assets organized under `public/assets/sprites/environment/`. Scene configuration externalized to `src/data/library-layout.json` following data-driven design principle.

## Complexity Tracking

> **No violations identified - this section intentionally left empty**

All constitution principles are satisfied or have advisory recommendations that do not block implementation. No complexity justifications required.
