<!--
Sync Impact Report:
Version change: N/A → 1.0.0 (Initial constitution)
Modified principles: N/A (initial creation)
Added sections: All sections (initial constitution)
Removed sections: N/A
Templates requiring updates:
  ✅ .specify/templates/plan-template.md - Reviewed and aligned
  ✅ .specify/templates/spec-template.md - Reviewed and aligned
  ✅ .specify/templates/tasks-template.md - Reviewed and aligned
Follow-up TODOs: None
-->

# Who Ate Valentin's Erdbeerstrudel? Constitution

## Core Principles

### I. Phaser 3 Architecture First
Every game feature must follow Phaser 3's scene-entity-system architecture. Components are organized as:
- **Scenes**: Self-contained game states with preload, create, update lifecycle
- **Entities**: Game objects using Containers or Sprites with physics bodies
- **Systems**: Reusable game logic (collision, state management, spawning)
- **Components**: UI elements and reusable visual components

**Rationale**: This architecture ensures clean separation of concerns, testability, and maintainability throughout the game's lifecycle.

### II. Pixel Art Rendering Standards (NON-NEGOTIABLE)
All visual rendering MUST maintain pixel-perfect quality:
- Game config MUST set `pixelArt: true` and `antialias: false`
- Sprites MUST use integer coordinates
- Scaling MUST use integer multiples when possible
- Asset loading MUST handle SVG sizing explicitly

**Rationale**: Pixel art games require crisp, non-blurred rendering. Any violation destroys the visual aesthetic and player experience.

### III. Data-Driven Design
Game content (dialogues, characters, clues, interactions) MUST be externalized as JSON data files:
- Character dialogues in `src/data/dialogues.json`
- Entity definitions in `src/data/entities.json`
- Mystery clues and progression in `src/data/mystery.json`
- Asset manifests in `src/data/assets.json`

**Rationale**: Separating content from code enables rapid iteration, easier testing, and potential localization without touching game logic.

### IV. Robust Error Handling
Asset loading and game operations MUST handle failures gracefully:
- Asset load errors captured via `load.on('loaderror')`
- Fallback textures/sounds for missing assets
- LocalStorage operations wrapped in try-catch with fallbacks
- User-facing error messages for critical failures

**Rationale**: Players should never see a broken game. Graceful degradation ensures playability even when assets fail to load or browser storage is unavailable.

### V. Performance Through Pooling
Frequently created/destroyed game objects MUST use object pooling:
- Phaser Groups for dialogue boxes, UI elements, interactive objects
- `spawn()` and `despawn()` pattern for pool management
- Maximum pool sizes defined based on expected concurrent objects
- Spatial grids for collision optimization when needed

**Rationale**: Mystery games involve lots of interaction prompts, dialogue boxes, and UI updates. Pooling prevents performance degradation and garbage collection spikes.

### VI. TypeScript Type Safety
All game code MUST leverage TypeScript's type system:
- Interfaces for all configuration objects (`EntityConfig`, `DialogueConfig`, etc.)
- Type definitions for data file structures (`types/dialogues.ts`, `types/mystery.ts`)
- Strict null checks and no implicit any
- Type guards for Phaser object discrimination

**Rationale**: Type safety prevents runtime errors, improves IDE support, and makes refactoring safer as the mystery game grows in complexity.

### VII. Scene State Management
Game state (investigation progress, clues discovered, character interactions) MUST be managed through:
- `GameStateManager` singleton via Phaser Registry
- Event-driven updates (`scene.events.emit/on`)
- Debounced LocalStorage persistence
- State validation on load with version migration support

**Rationale**: Mystery games require tracking complex state (who was questioned, what clues were found, what combinations were tried). Centralized state management prevents bugs and enables save/load functionality.

## Mystery Game Specific Constraints

### Investigation Mechanics
- All interactions (talking to characters, examining objects) MUST provide immediate visual/audio feedback
- Dialogue system MUST support branching conversations based on discovered clues
- Clue discovery MUST update player's notebook/inventory UI immediately
- Red herrings and true clues MUST be indistinguishable in presentation

### Dialogue System Requirements
- Multi-line dialogue with speaker names
- Continue indicator with animation
- Keyboard and click input support
- Dialogue history tracking for revisiting conversations
- Integration with clue discovery system

### Player Interaction
- Clear visual indicators for interactable objects (within distance threshold)
- Keyboard shortcuts displayed consistently (`E` to interact, `TAB` for notebook, etc.)
- Top-down movement with diagonal normalization
- Movement locking during dialogues and cutscenes

## Technical Standards

### File Organization
```
src/
├── main.ts                      # Phaser game initialization
├── scenes/                      # Game scenes (title, investigation, victory)
│   ├── start-scene.ts
│   ├── investigation-scene.ts
│   └── conclusion-scene.ts
├── entities/                    # Interactive game objects
│   ├── player.ts
│   ├── npc.ts
│   └── clue-object.ts
├── components/                  # UI components
│   ├── dialog-box.ts
│   ├── clue-notebook.ts
│   └── interaction-prompt.ts
├── systems/                     # Core game systems
│   ├── dialogue-manager.ts
│   ├── investigation-tracker.ts
│   └── game-state-manager.ts
├── data/                        # JSON game content
│   ├── characters.json
│   ├── dialogues.json
│   ├── clues.json
│   └── assets.json
└── types/                       # TypeScript definitions
    ├── character.ts
    ├── dialogue.ts
    └── clue.ts
```

### Asset Management
- All assets in `public/assets/` directory
- Sprites organized by category (`characters/`, `objects/`, `ui/`)
- Asset manifest with metadata (dimensions, fallbacks)
- Error handling for missing assets with visual placeholders
- Cache busting during development via query parameters

### Testing Approach
While full test coverage is not required for game code, critical systems MUST be verified:
- State management save/load cycles
- Dialogue progression logic
- Clue discovery and combination logic
- Manual playtesting of all investigation paths

## Governance

This constitution establishes the architectural and quality standards for "Who Ate Valentin's Erdbeerstrudel?". All feature specifications, implementation plans, and code must align with these principles.

### Amendment Process
1. Proposed changes must be documented with rationale
2. Impact assessment on existing game code
3. Update affected data structures and systems
4. Update this constitution file with new version number

### Versioning Policy
- **MAJOR**: Breaking changes to core architecture or data formats
- **MINOR**: New principles added, existing principles expanded
- **PATCH**: Clarifications, typo fixes, non-semantic refinements

### Compliance
- All pull requests must verify alignment with these principles
- Violations must be justified in implementation plan's "Complexity Tracking" section
- Data-driven design takes precedence over code-based solutions

**Version**: 1.0.0 | **Ratified**: 2025-11-06 | **Last Amended**: 2025-11-06
