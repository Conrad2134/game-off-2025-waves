# Implementation Plan: Game Progression System

**Branch**: `004-game-progression` | **Date**: 2025-11-09 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/004-game-progression/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

The game progression system implements the narrative flow for the locked-room mystery, enabling the transition from social introduction phase to active investigation. The system tracks player progress through NPC conversations, triggers the inciting incident, manages clue discovery, and adapts dialog content based on investigation advancement. This creates a dynamic narrative experience where discovering clues progressively unlocks deeper NPC insights.

## Technical Context

**Language/Version**: TypeScript 5.0+ (ES2020 target, strict mode enabled)  
**Primary Dependencies**: Phaser 3.80.0 (game framework), Vite 5.0.0 (build tool)  
**Storage**: JSON data files for dialog/clues, browser LocalStorage for state persistence  
**Testing**: Manual playtesting with debug mode (D key) + automated validation on data load  
**Target Platform**: Web browsers (desktop/laptop, 1024x768 minimum resolution)  
**Project Type**: Single web project (frontend only, no backend)  
**Performance Goals**: Stable 60 fps during all phases, dialog changes <50ms, scene transitions <500ms  
**Constraints**: Pixel-perfect rendering (pixelArt: true, antialias: false), integer coordinates for sprites  
**Scale/Scope**: 6 NPCs, 5+ clues, 4 dialog progression tiers, single scene (1200x800 world)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Principle I: Phaser 3 Architecture First ✅
- **Status**: COMPLIANT
- **Rationale**: Feature extends existing LibraryScene with systems (GameProgressionManager, ClueTracker) following Phaser's scene-entity-system pattern. NPC and clue entities already use proper Phaser Containers/Sprites.

### Principle II: Pixel Art Rendering Standards ✅
- **Status**: COMPLIANT
- **Rationale**: All rendering continues to use existing config (pixelArt: true, antialias: false). New clue highlight sprites will use integer coordinates. No rendering changes required.

### Principle III: Data-Driven Design ✅
- **Status**: COMPLIANT
- **Rationale**: All progression logic (dialog trees, clue data, phase triggers) will be externalized as JSON. New files: `src/data/progression.json`, `src/data/clues.json`. Dialog content already follows this pattern in character metadata.

### Principle IV: Robust Error Handling ✅
- **Status**: COMPLIANT
- **Rationale**: Existing asset loading error handlers remain. Will add validation for progression data on load with fallbacks for missing/malformed data. State persistence will wrap LocalStorage in try-catch.

### Principle V: Performance Through Pooling ✅
- **Status**: COMPLIANT
- **Rationale**: Existing dialog box system already pooled. Will add clue highlight sprites to Phaser Group with pool management. No performance concerns for 5 clues + 6 NPCs.

### Principle VI: TypeScript Type Safety ✅
- **Status**: COMPLIANT
- **Rationale**: Will create new interfaces: `GamePhase`, `ClueData`, `ProgressionConfig`, `DialogTier`. All state management will use strict types with proper type guards.

### Principle VII: Scene State Management ✅
- **Status**: COMPLIANT
- **Rationale**: Will extend existing pattern: GameProgressionManager singleton via Phaser Registry, event-driven updates for phase transitions, debounced LocalStorage persistence for investigation progress.

### Principle VIII: AI-Assisted Asset Generation ✅
- **Status**: COMPLIANT (Optional principle, marked as "SHOULD")
- **Rationale**: Not required for this feature. Clue highlights use simple colored overlays. Character sprites and animations already exist from previous features.

**GATE RESULT**: ✅ PASS - All applicable principles compliant. No violations to justify.

## Project Structure

### Documentation (this feature)

```text
specs/004-game-progression/
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
├── main.ts                         # Game initialization (no changes)
├── scenes/
│   ├── start-scene.ts              # Title screen (no changes)
│   └── library-scene.ts            # MODIFIED: Add progression integration
├── entities/
│   ├── player-character.ts         # Player controls (no changes)
│   ├── npc-character.ts            # MODIFIED: Multi-tier dialog support
│   └── interactable-object.ts      # MODIFIED: Clue unlock states
├── components/
│   ├── dialog-box.ts               # Dialog UI (no changes)
│   ├── interaction-indicator.ts    # Interaction prompt (no changes)
│   ├── notebook-ui.ts              # Notebook display (no changes)
│   └── clue-highlight.ts           # NEW: Visual clue state indicators
├── systems/
│   ├── dialog-manager.ts           # MODIFIED: Phase-aware dialog selection
│   ├── interaction-detector.ts     # MODIFIED: Locked clue filtering
│   ├── notebook-manager.ts         # Notebook tracking (no changes)
│   ├── game-progression-manager.ts # NEW: Phase & state tracking
│   └── clue-tracker.ts             # NEW: Clue discovery & unlocking
├── data/
│   ├── library-layout.json         # Scene layout (no changes)
│   ├── assets.json                 # Asset manifest (no changes)
│   ├── progression.json            # NEW: Phase definitions & triggers
│   ├── clues.json                  # NEW: Clue locations & unlock conditions
│   └── dialogs/                    # NEW: Organized dialog content
│       ├── valentin.json           # Valentin's phased dialogs
│       ├── emma.json               # Emma's phased dialogs
│       ├── klaus.json              # Klaus reference (player character)
│       ├── luca.json               # Luca's phased dialogs
│       ├── marianne.json           # Marianne's phased dialogs
│       └── sebastian.json          # Sebastian's phased dialogs
├── types/
│   ├── dialog.ts                   # Dialog system types (existing)
│   ├── notebook.ts                 # Notebook types (existing)
│   ├── scenes.ts                   # Scene types (existing)
│   ├── progression.ts              # NEW: Progression state types
│   └── clue.ts                     # NEW: Clue data types
└── utils/
    └── validation.ts               # NEW: JSON data validation helpers

tests/                              # Manual test procedures (no automated tests)
├── progression-playthrough.md      # NEW: Test scenario walkthroughs
└── dialog-verification.md          # NEW: Dialog tier verification checklist

public/
└── assets/
    └── sprites/
        └── characters/             # Existing character sprites (no changes)
```

**Structure Decision**: Extends existing single-project structure. New progression and clue systems follow established patterns (systems/ for managers, data/ for JSON, types/ for TypeScript interfaces). Dialog content moves from embedded character metadata into dedicated JSON files for better organization and phase-based structure.

---

*End of Plan Template Sections - Phase 0 outputs begin below*

---

## Planning Complete ✅

**Date Completed**: 2025-11-09  
**Command**: `/speckit.plan`  
**Status**: Ready for implementation (Phase 2: /speckit.tasks)

### Deliverables

✅ **Phase 0 - Research** (`research.md`)
- Resolved 8 research questions
- Documented all design decisions with rationales
- Confirmed technology stack (no new dependencies)
- Applied Phaser 3 and TypeScript best practices

✅ **Phase 1 - Design** (`data-model.md`, `contracts/`, `quickstart.md`)
- Defined 7 core entities with validation rules
- Created state machine for game progression flow
- Designed 3 JSON data file schemas
- Specified API contracts for 2 new systems
- Extended 2 existing system interfaces
- Wrote comprehensive developer quickstart guide

✅ **Phase 1 - Agent Context** (`.github/copilot-instructions.md`)
- Updated with new technologies from this feature
- Preserved manual additions between markers
- Technology additions:
  - TypeScript 5.0+ (ES2020 target, strict mode enabled)
  - Phaser 3.80.0 (game framework), Vite 5.0.0 (build tool)
  - JSON data files for dialog/clues
  - Browser LocalStorage for state persistence

✅ **Constitution Re-evaluation**
- All 8 principles verified compliant post-design
- No violations introduced
- Enhanced compliance with Principles III & VI
- Gate status: PASS

### Implementation Readiness

The feature is ready for Phase 2 (task breakdown and implementation):

| Aspect | Status | Notes |
|--------|--------|-------|
| Requirements | ✅ Complete | 24 functional requirements defined in spec |
| Architecture | ✅ Defined | 2 new systems, 5 file modifications |
| Data Model | ✅ Specified | 7 entities, 3 JSON schemas |
| Contracts | ✅ Written | 5 TypeScript interface files |
| Integration | ✅ Mapped | Clear extension points in existing code |
| Testing | ✅ Planned | Acceptance scenarios + manual playtest checklist |

### Next Step

Run `/speckit.tasks` to generate the implementation task breakdown (`tasks.md`).
