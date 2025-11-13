# Quickstart Guide: Accusation System

**Feature**: 005-accusation-system  
**Last Updated**: 2025-11-12

## Overview

This guide helps developers quickly understand and integrate the accusation system into the mystery game. The accusation system provides the climax mechanics, allowing players to accuse suspects and present evidence in Phoenix Wright-style confrontations.

## Quick Reference

### Key Components

- **AccusationManager** (`src/systems/accusation-manager.ts`): Core logic and state management
- **AccusationUI** (`src/components/accusation-ui.ts`): Visual confrontation interface
- **EndingSequence** (`src/components/ending-sequence.ts`): Victory and bad ending cutscenes
- **EvidenceValidator** (`src/utils/evidence-validator.ts`): Evidence validation utility

### Data Files

- **`src/data/accusation.json`**: Confrontation sequences, evidence requirements, endings
- **`src/data/dialogs/valentin.json`**: Extended with accusation initiation dialog
- **`src/types/accusation.ts`**: TypeScript interfaces for accusation system

## Setup

### 1. Install Dependencies

No additional dependencies needed beyond existing project setup:

```bash
npm install  # Already includes Phaser 3.80.0 and TypeScript 5.0+
```

### 2. Create Data File

Create `src/data/accusation.json` with the structure defined in `data-model.md`:

```json
{
  "version": "1.0.0",
  "config": {
    "guiltyParty": "emma",
    "minimumCluesRequired": 4,
    "allowPartialEvidence": false
  },
  "confrontations": {
    "emma": {
      "suspectId": "emma",
      "motive": "She believed she could improve the recipe",
      "confession": "I couldn't help myself...",
      "statements": [
        {
          "id": "emma-alibi",
          "text": "I was reading in the corner the whole time!",
          "speaker": "suspect",
          "requiredEvidence": "bookshelf-hiding-spot",
          "acceptableEvidence": ["bookshelf-hiding-spot"],
          "correctResponse": "But this hiding spot shows...",
          "incorrectResponse": "That evidence doesn't contradict...",
          "requiresPresentation": true
        }
      ]
    }
  },
  "endings": {
    "victory": {
      "valentinReaction": {
        "emma": "Emma?! But you always gave such thoughtful feedback!"
      },
      "bonusAcknowledgment": "Impressive detective work!"
    },
    "badEnding": {
      "despairSpeech": "I... I give up.",
      "failureExplanation": "You made too many incorrect accusations."
    }
  }
}
```

### 3. Extend Valentin Dialog

Update `src/data/dialogs/valentin.json` to add accusation options:

```json
{
  "valentin": {
    "post-incident": {
      "default": [
        {
          "text": "Have you figured out who ate my erdbeerstrudel?",
          "options": [
            {
              "text": "I think I know who did it",
              "action": "initiate-accusation"
            },
            {
              "text": "Not yet, I need more evidence",
              "action": "continue-investigation"
            }
          ]
        }
      ]
    }
  }
}
```

## Integration with Library Scene

### Initialize AccusationManager

In `LibraryScene.create()`:

```typescript
import { AccusationManager } from '@/systems/accusation-manager';
import { AccusationUI } from '@/components/accusation-ui';

export class LibraryScene extends Phaser.Scene {
  private accusationManager!: AccusationManager;
  private accusationUI!: AccusationUI;

  create() {
    // ... existing scene setup
    
    // Initialize accusation system
    this.accusationManager = new AccusationManager(this);
    this.accusationManager.initialize();
    
    // Register with scene registry for global access
    this.registry.set('accusationManager', this.accusationManager);
    
    // Create accusation UI
    this.accusationUI = new AccusationUI(this);
    this.accusationUI.initialize(
      this.cameras.main.centerX,
      this.cameras.main.centerY
    );
    
    // Set up event listeners
    this.setupAccusationEvents();
  }
  
  private setupAccusationEvents(): void {
    // Listen for accusation events
    this.events.on('accusation:started', this.onAccusationStarted, this);
    this.events.on('accusation:victory-triggered', this.onVictory, this);
    this.events.on('accusation:bad-ending-triggered', this.onBadEnding, this);
  }
  
  private onAccusationStarted(data: { suspectId: string }): void {
    console.log(`Accusation started against ${data.suspectId}`);
  }
  
  private onVictory(data: { culpritId: string }): void {
    // Play victory sequence
    const victoryData = this.accusationManager.onConfrontationSuccess(data.culpritId);
    const ending = new EndingSequence(this);
    ending.playVictory(victoryData);
  }
  
  private onBadEnding(): void {
    // Play bad ending sequence
    const badEndingData = this.accusationManager.getBadEndingData();
    const ending = new EndingSequence(this);
    ending.playBadEnding(badEndingData);
  }
}
```

### Connect to Valentin NPC

In `NPCCharacter` or dialog handler:

```typescript
import type { IAccusationManager } from '@/contracts/accusation-manager';

// When player selects "I think I know who did it" option
handleDialogAction(action: string): void {
  if (action === 'initiate-accusation') {
    const manager = this.scene.registry.get('accusationManager') as IAccusationManager;
    
    // Validate player can make accusation
    const validation = manager.canInitiateAccusation();
    
    if (!validation.canAccuse) {
      // Show warning dialog
      this.showDialog(validation.reason || 'Not enough evidence yet!');
      return;
    }
    
    // Start suspect selection
    manager.startSuspectSelection();
  }
}
```

## Testing Scenarios

### Manual Playtesting Checklist

#### 1. Successful Accusation Flow

```
✓ Discover at least 4 clues
✓ Talk to Valentin
✓ Select "I think I know who did it"
✓ Choose correct suspect (per accusation.json config.guiltyParty)
✓ Present correct evidence for each statement
✓ Verify confession plays
✓ Verify Valentin reaction plays
✓ Verify door unlock animation
✓ Verify victory screen displays
✓ Return to title screen
```

#### 2. Failed Confrontation

```
✓ Start accusation
✓ Present wrong evidence 3 times
✓ Verify penalty dialog shows on each mistake
✓ Verify mistake counter updates (❌❌❌)
✓ Verify confrontation fails after 3rd mistake
✓ Verify failed accusation count increases
✓ Verify player returns to investigation
```

#### 3. Bad Ending Trigger

```
✓ Fail first accusation (3 mistakes)
✓ Verify Valentin shows frustration dialog
✓ Fail second accusation (3 mistakes)
✓ Verify bad ending sequence triggers
✓ Verify despair speech plays
✓ Verify door unlock plays
✓ Verify failure screen displays
✓ Return to title screen
```

#### 4. Cancellation

```
✓ Start accusation
✓ Press Escape/Cancel during suspect selection
✓ Verify returns to investigation without penalty
✓ Start accusation again
✓ Present 1-2 evidence pieces
✓ Press Escape during confrontation
✓ Verify cancellation doesn't count as failure
✓ Verify can restart accusation
```

#### 5. Save/Load Persistence

```
✓ Fail first accusation
✓ Save game (automatic via LocalStorage)
✓ Close browser/game
✓ Reopen game
✓ Load save
✓ Verify failed accusation count is 1
✓ Verify Valentin shows post-failure dialog
```

## Common Development Tasks

### Adding a New Suspect Confrontation

1. Open `src/data/accusation.json`
2. Add new entry to `confrontations` object:

```json
{
  "confrontations": {
    "klaus": {
      "suspectId": "klaus",
      "motive": "He was hungry and couldn't resist",
      "confession": "I was just so hungry!",
      "statements": [
        // Add statements here
      ]
    }
  }
}
```

3. Add Valentin reaction in `endings.victory.valentinReaction`:

```json
{
  "endings": {
    "victory": {
      "valentinReaction": {
        "klaus": "Klaus! I should have known..."
      }
    }
  }
}
```

### Changing the Guilty Party

Simply update `config.guiltyParty` in `accusation.json`:

```json
{
  "config": {
    "guiltyParty": "luca",  // Changed from "emma"
    "minimumCluesRequired": 4,
    "allowPartialEvidence": false
  }
}
```

No code changes needed - system is fully data-driven.

### Adjusting Evidence Requirements

To require more clues before allowing accusations:

```json
{
  "config": {
    "minimumCluesRequired": 5  // Changed from 4
  }
}
```

### Adding Multiple Acceptable Evidence

For statements where multiple clues could work:

```json
{
  "statements": [
    {
      "id": "alibi-contradiction",
      "requiredEvidence": "suspicious-napkin",
      "acceptableEvidence": [
        "suspicious-napkin",
        "strudel-crumbs",
        "empty-plate"
      ],
      "requiresPresentation": true
    }
  ]
}
```

## Debugging Tips

### Enable Debug Logging

```typescript
// In AccusationManager constructor
if (process.env.NODE_ENV === 'development') {
  this.enableDebugLogging();
}

private enableDebugLogging(): void {
  this.scene.events.on('accusation:*', (event: string, data: any) => {
    console.log(`[Accusation] ${event}`, data);
  });
}
```

### Check Accusation State

```typescript
// In browser console during development
const manager = game.registry.get('accusationManager');
console.log('Current state:', manager.getState());
console.log('Guilty party:', manager.getGuiltyParty());
console.log('Available suspects:', manager.getAvailableSuspects());
```

### Validate Configuration

```typescript
// Add to AccusationManager.initialize()
private validateConfig(): void {
  const { config, confrontations } = this.loadedConfig;
  
  // Check guilty party has confrontation
  if (!confrontations[config.guiltyParty]) {
    throw new Error(`Guilty party "${config.guiltyParty}" has no confrontation defined`);
  }
  
  // Check all evidence IDs are valid
  Object.values(confrontations).forEach(conf => {
    conf.statements.forEach(stmt => {
      if (stmt.requiredEvidence && !this.isValidClueId(stmt.requiredEvidence)) {
        console.warn(`Invalid clue ID: ${stmt.requiredEvidence} in ${conf.suspectId}`);
      }
    });
  });
}
```

## Performance Considerations

- **Lazy Loading**: Confrontation sequences loaded on-demand, not all at startup
- **Object Pooling**: UI elements reused via Phaser Groups
- **Event Cleanup**: Always unregister event listeners in `destroy()` methods
- **LocalStorage Throttling**: Save accusation state debounced (max once per 5s)

## API Reference

See `/contracts` directory for detailed TypeScript interfaces:

- `types.ts`: Core data structures
- `accusation-manager.ts`: System API
- `accusation-ui.ts`: Component API
- `evidence-validator.ts`: Validation utility
- `ending-sequence.ts`: Ending cutscene API

## Next Steps

1. Review `data-model.md` for complete entity definitions
2. Review `research.md` for design rationale and patterns
3. Check `/contracts` for TypeScript interface details
4. Run manual playtesting scenarios above
5. Implement components following contract interfaces

## Support

For questions or issues:
- Review spec at `specs/005-accusation-system/spec.md`
- Check constitution principles in `.specify/memory/constitution.md`
- Refer to existing systems (DialogManager, ClueTracker) for patterns
