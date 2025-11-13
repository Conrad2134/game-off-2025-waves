# Who Ate Valentin's Erdbeerstrudel?

A 2D pixel art mystery game built with Phaser 3, TypeScript, and Vite.

## Project Status

**Current Feature**: 005-accusation-system  
**Branch**: `005-accusation-system`

### Completed
- ✅ Complete Phaser 3 project setup with TypeScript
- ✅ Vite build tooling configured
- ✅ ESLint and Prettier for code quality
- ✅ Home screen with title and start button (non-functional)
- ✅ Pixel-perfect rendering configuration
- ✅ Project structure following game framework
- ✅ Library scene with player movement and NPCs
- ✅ Complete dialog system with proximity-based interactions
- ✅ Game progression system with phase management and clue unlocking
- ✅ Accusation system with Phoenix Wright-style confrontations

## Quick Start

### Prerequisites
- Node.js 18+ 
- npm 8+

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Open http://localhost:5173/ in your browser to see the game.

### Available Scripts

- `npm run dev` - Start Vite development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Auto-fix ESLint issues
- `npm run format` - Format code with Prettier

## Project Structure

```
src/
├── main.ts                 # Game initialization
├── scenes/                 # Game scenes
│   ├── start-scene.ts      # Home screen
│   └── library-scene.ts    # Main game scene
├── entities/               # Game objects
│   ├── player-character.ts # Playable character (Klaus)
│   ├── npc-character.ts    # Non-player characters
│   └── interactable-object.ts # Examinable objects
├── systems/                # Core game systems
│   ├── dialog-manager.ts   # Dialog state management
│   ├── interaction-detector.ts # Proximity detection
│   ├── clue-tracker.ts     # Clue discovery and state
│   ├── game-progression-manager.ts # Game phases
│   ├── accusation-manager.ts # Accusation logic
│   ├── notebook-manager.ts # Player notebook
│   └── save-manager.ts     # Save/load persistence
├── components/             # UI components
│   ├── dialog-box.ts       # Dialog UI display
│   ├── interaction-indicator.ts # Interaction visual cue
│   ├── notebook-ui.ts      # Notebook display
│   ├── accusation-ui.ts    # Accusation interface
│   └── ending-sequence.ts  # Victory/failure endings
├── data/                   # JSON game content
│   ├── assets.json
│   ├── library-layout.json
│   ├── clues.json          # Clue definitions
│   ├── progression.json    # Phase configuration
│   ├── accusation.json     # Confrontation sequences
│   └── dialogs/            # NPC dialog files
├── types/                  # TypeScript definitions
│   ├── scenes.ts
│   ├── dialog.ts           # Dialog system types
│   ├── clue.ts             # Clue types
│   ├── progression.ts      # Progression types
│   ├── accusation.ts       # Accusation types
│   └── save.ts             # Save state types
└── utils/                  # Helper utilities
    ├── validation.ts
    └── evidence-validator.ts # Evidence validation logic

public/
├── assets/                 # Game assets
│   ├── sprites/
│   │   ├── characters/     # Character sprites & metadata
│   │   └── environment/    # Furniture and objects
│   └── tilesets/           # Floor and wall tiles

specs/
├── 001-phaser-project-init/  # Feature specifications
├── 002-library-scene/
└── 003-dialog-system/
```

## Architecture

This game follows the Phaser 3 architecture outlined in `GAME_FRAMEWORK.md` and adheres to the principles in `.specify/memory/constitution.md`:

- **Pixel Art First**: All rendering uses `pixelArt: true` and `antialias: false`
- **Scene-Entity-System**: Clean separation of game states, objects, and logic
- **Data-Driven Design**: Configuration externalized to JSON files
- **Type Safety**: Strict TypeScript with no implicit any
- **Performance**: Object pooling for frequently created/destroyed objects

## Development Guidelines

- Follow the constitution principles in `.specify/memory/constitution.md`
- Reference the game framework in `GAME_FRAMEWORK.md`
- Use the `/speckit` commands for feature development workflow
- Keep components small and focused
- Test on multiple browsers (Chrome, Firefox, Safari)

## Next Steps

See the specifications in `specs/` for implementation details of completed features.

### Dialog System Usage

The dialog system is now fully integrated into the library scene:

**Interacting with NPCs:**
1. Walk your character (Klaus) near any NPC
2. An interaction indicator appears above the NPC when you're in range
3. Press **SPACE** or **ENTER** to open the dialog
4. The NPC's introduction message appears in a dialog box at the bottom of the screen
5. Press **SPACE**, **ENTER**, or **ESC** to close the dialog
6. Dialog auto-closes if you walk too far away

**Interacting with Objects:**
- Same controls as NPCs
- Objects display description text without a speaker name
- Currently available objects: bookshelves, dining table, desk

**Extending the Dialog System:**

To add new interactable NPCs:
```typescript
const npc = new NPCCharacter({
  scene: this,
  x: 500, y: 300,
  characterName: 'your-character',
  metadata: characterMetadata, // Load from JSON
});
this.interactionDetector.registerInteractable(npc);
```

To add new interactable objects:
```typescript
const obj = new InteractableObject({
  scene: this,
  x: 400, y: 200,
  spriteKey: 'your-sprite',
  id: 'unique-id',
  description: 'What the player sees when examining this object',
});
this.interactionDetector.registerInteractable(obj);
```

Future features will include:
- Branching conversation trees based on game state
- Dialog history UI (notebook)
- Voice acting and sound effects
- Multi-choice dialog options
- Clue discovery through dialog

### Accusation System Architecture

The accusation system enables the player to accuse suspects and engage in Phoenix Wright-style evidence confrontations.

**Core Components:**

1. **AccusationManager** (`src/systems/accusation-manager.ts`)
   - Manages accusation state and confrontation progress
   - Validates evidence requirements and logical sequencing
   - Tracks failed accusations (max 2 failures triggers bad ending)
   - Emits events for UI coordination
   - Configured via `src/data/accusation.json`

2. **AccusationUI** (`src/components/accusation-ui.ts`)
   - Displays suspect selection screen
   - Shows confrontation statements and mistake counter
   - Integrates with NotebookUI for evidence presentation
   - Handles keyboard shortcuts (E: evidence, Space: continue, Escape: cancel)
   - Pixel-perfect rendering with fade transitions

3. **EvidenceValidator** (`src/utils/evidence-validator.ts`)
   - Pure utility for validating evidence presentations
   - Checks evidence correctness against statements
   - Detects out-of-order evidence (Valentin guidance)
   - Supports bonus evidence for thorough players
   - Generates penalty messages with escalation

4. **EndingSequence** (`src/components/ending-sequence.ts`)
   - Displays victory sequence (confession → reaction → door unlock → summary)
   - Shows bad ending sequence (despair → door unlock → failure screen)
   - Handles return to title screen

**Data Flow:**

```
Player → AccusationUI → AccusationManager → EvidenceValidator → AccusationManager
                ↓                ↓                                       ↓
           NotebookUI      State Persistence                     Event Emissions
                                 ↓                                       ↓
                           SaveManager                         EndingSequence/UI
```

**Key Features:**

- **Minimum Clue Requirement**: Player must discover at least 4 clues before accusing
- **Evidence Sequencing**: Evidence must be presented in logical order (timeline → motive → opportunity)
- **Bonus Evidence**: Optional extra evidence for thorough investigators
- **Mistake Limit**: 3 incorrect evidence presentations fail the confrontation
- **Failed Accusation Tracking**: NPCs react to previous failures, bad ending after 2 failures
- **State Persistence**: Accusation progress saved to LocalStorage
- **Debug Logging**: Event tracking for all major state transitions

**Integration Points:**

- Triggered from Valentin's dialog options (via NPCCharacter)
- Uses ClueTracker to validate discovered clues
- Uses NotebookUI for evidence selection during confrontation
- Uses DialogManager for warning messages
- Uses SaveManager for state persistence

For detailed implementation, see `specs/005-accusation-system/` specifications.

## License

TBD