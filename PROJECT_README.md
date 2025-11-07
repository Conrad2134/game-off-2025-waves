# Who Ate Valentin's Erdbeerstrudel?

A 2D pixel art mystery game built with Phaser 3, TypeScript, and Vite.

## Project Status

**Current Feature**: 001-phaser-project-init  
**Branch**: `001-phaser-project-init`

### Completed
- ✅ Complete Phaser 3 project setup with TypeScript
- ✅ Vite build tooling configured
- ✅ ESLint and Prettier for code quality
- ✅ Home screen with title and start button (non-functional)
- ✅ Pixel-perfect rendering configuration
- ✅ Project structure following game framework

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
│   └── start-scene.ts      # Home screen
├── entities/               # Game objects
├── systems/                # Core game systems
├── components/             # UI components
├── data/                   # JSON game content
├── types/                  # TypeScript definitions
└── utils/                  # Helper utilities

public/
└── assets/                 # Game assets (sprites, audio, etc.)

specs/
└── 001-phaser-project-init/  # Feature specifications
    ├── spec.md
    └── checklists/
        └── requirements.md
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

See the specification in `specs/001-phaser-project-init/spec.md` for implementation details.

Future features will include:
- Investigation scene with player movement
- NPC interactions and dialogue system
- Clue discovery and notebook UI
- Mystery progression logic

## License

TBD
