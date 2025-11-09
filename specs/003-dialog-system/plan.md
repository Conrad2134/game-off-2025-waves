# Implementation Plan: Dialog System

**Branch**: `003-dialog-system` | **Date**: November 8, 2025 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/003-dialog-system/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

The dialog system introduces the core interaction mechanic for the mystery game, enabling players to talk with NPC characters and examine environmental objects. When the player approaches an NPC within interaction range (45-60 pixels), a visual indicator appears, and pressing spacebar/enter opens a dialog box displaying the character's name and introduction text. The system uses Phaser 3's scene architecture with reusable dialog UI components, integrates with the existing character entity system, and stores dialog content in JSON metadata files following the data-driven design principle.

## Technical Context

**Language/Version**: TypeScript 5.0+ (ES2020 target, strict mode enabled)  
**Primary Dependencies**: Phaser 3.80.0 (game framework), Vite 5.0.0 (build tool)  
**Storage**: JSON files for dialog content (character metadata.json files), no persistent storage needed  
**Testing**: Manual playtesting (no automated test framework currently configured)  
**Target Platform**: Web browsers (modern ES2020-compatible browsers), resolution 1024x768, 60 FPS target
**Project Type**: Single-page web game application  
**Performance Goals**: 60 FPS maintained during dialog display, <100ms input response time, smooth animations  
**Constraints**: Pixel-perfect rendering (pixelArt: true, antialias: false), integer coordinates only, dialog must not block game loop  
**Scale/Scope**: 6 playable characters with unique dialog, ~10 NPCs, multiple interactive objects, branching conversations (future)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### ✅ Principle I: Phaser 3 Architecture First
**Status**: PASS  
**Compliance**: Dialog system will be organized as a reusable component (`DialogBox`), integrated into the existing `LibraryScene`, with dialog management as a system (`DialogManager`). Follows scene-entity-system architecture.

### ✅ Principle II: Pixel Art Rendering Standards
**Status**: PASS  
**Compliance**: Game config already enforces `pixelArt: true` and `antialias: false`. Dialog UI will use integer coordinates and pixel-aligned positioning. Text rendering will use bitmap fonts or web fonts rendered at integer scales.

### ✅ Principle III: Data-Driven Design
**Status**: PASS  
**Compliance**: Dialog content (character introductions) will be stored in JSON files within each character's `metadata.json` file at `public/assets/sprites/characters/{characterName}/metadata.json`. No hardcoded dialog strings in game logic.

### ✅ Principle IV: Robust Error Handling
**Status**: PASS  
**Compliance**: Dialog system will handle missing dialog data gracefully with fallback messages. Asset loading already has error handlers in place (`load.on('loaderror')`). Will validate JSON structure on load.

### ✅ Principle V: Performance Through Pooling
**Status**: PASS  
**Compliance**: Dialog boxes will use Phaser Groups for pooling since they're frequently created/destroyed. Interaction indicators will also be pooled for each NPC.

### ✅ Principle VI: TypeScript Type Safety
**Status**: PASS  
**Compliance**: Will define interfaces for `DialogConfig`, `DialogMessage`, `InteractionConfig` in `types/dialog.ts`. Strict null checks already enabled in tsconfig.json.

### ✅ Principle VII: Scene State Management
**Status**: PASS  
**Compliance**: Dialog state (currently open, active speaker) will be managed through scene events (`scene.events.emit/on`). No persistent state needed for initial implementation (character introductions only).

### ✅ Principle VIII: AI-Assisted Asset Generation
**Status**: N/A (Optional principle, not applicable to dialog system)  
**Compliance**: Dialog system uses UI rendering, not pixel art assets. Character sprites already generated.

**Overall Gate Status**: ✅ PASS - All mandatory principles satisfied, ready for Phase 0 research.

## Project Structure

### Documentation (this feature)

```text
specs/003-dialog-system/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
│   ├── README.md        # Overview of dialog system contracts
│   ├── dialog-box.ts    # DialogBox component interface
│   ├── dialog-manager.ts # DialogManager system interface
│   └── interaction-detector.ts # Interaction detection interface
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
src/
├── main.ts                      # Phaser game initialization (existing)
├── scenes/                      # Game scenes
│   ├── start-scene.ts           # (existing)
│   └── library-scene.ts         # (existing - will integrate dialog system)
├── entities/                    # Interactive game objects
│   ├── player-character.ts      # (existing)
│   └── npc-character.ts         # (existing - will add interaction detection)
├── components/                  # UI components
│   ├── dialog-box.ts            # NEW - Dialog UI component with text rendering
│   └── interaction-indicator.ts # NEW - Visual indicator above NPCs
├── systems/                     # Core game systems
│   ├── dialog-manager.ts        # NEW - Dialog state and flow management
│   └── interaction-detector.ts  # NEW - Proximity detection for interactions
├── data/                        # JSON game content
│   ├── assets.json              # (existing)
│   └── library-layout.json      # (existing)
└── types/                       # TypeScript definitions
    ├── scenes.ts                # (existing)
    └── dialog.ts                # NEW - Dialog system type definitions

public/assets/sprites/characters/
├── emma/
│   └── metadata.json            # (existing - will add dialog field)
├── klaus/
│   └── metadata.json            # (existing - will add dialog field)
├── luca/
│   └── metadata.json            # (existing - will add dialog field)
├── marianne/
│   └── metadata.json            # (existing - will add dialog field)
├── sebastian/
│   └── metadata.json            # (existing - will add dialog field)
└── valentin/
    └── metadata.json            # (existing - will add dialog field)

tests/                           # Manual playtesting (no automated tests)
└── (no changes for this feature)
```

**Structure Decision**: Single project structure is appropriate for this Phaser 3 web game. Dialog system components integrate directly into the existing `src/` structure following the scene-entity-system architecture. Character dialog data extends existing metadata.json files in the `public/assets/` directory.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No violations detected. All constitution principles are satisfied by the dialog system design.
