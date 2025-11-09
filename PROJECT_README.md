# Who Ate Valentin's Erdbeerstrudel?

A 2D pixel art mystery game built with Phaser 3, TypeScript, and Vite.

## Project Status

**Current Feature**: 003-dialog-system  
**Branch**: `003-dialog-system`

### Completed
- ✅ Complete Phaser 3 project setup with TypeScript
- ✅ Vite build tooling configured
- ✅ ESLint and Prettier for code quality
- ✅ Home screen with title and start button (non-functional)
- ✅ Pixel-perfect rendering configuration
- ✅ Project structure following game framework
- ✅ Library scene with player movement and NPCs
- ✅ Complete dialog system with proximity-based interactions

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
│   └── interaction-detector.ts # Proximity detection
├── components/             # UI components
│   ├── dialog-box.ts       # Dialog UI display
│   └── interaction-indicator.ts # Interaction visual cue
├── data/                   # JSON game content
│   ├── assets.json
│   └── library-layout.json
├── types/                  # TypeScript definitions
│   ├── scenes.ts
│   └── dialog.ts           # Dialog system types
└── utils/                  # Helper utilities

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

## License

TBD