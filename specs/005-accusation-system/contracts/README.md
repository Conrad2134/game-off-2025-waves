/**
 * API Contracts: Accusation System
 * 
 * This directory contains TypeScript interface definitions for the accusation system.
 * These contracts define the public APIs for components and systems.
 * 
 * Files:
 * - types.ts: Core data types and interfaces
 * - accusation-manager.ts: AccusationManager system API
 * - accusation-ui.ts: AccusationUI component API
 * - evidence-validator.ts: EvidenceValidator utility API
 * - ending-sequence.ts: EndingSequence component API
 */

# Accusation System Contracts

## Overview

These TypeScript interfaces define the contracts for the accusation system components. They serve as the source of truth for implementation and ensure type safety across the system.

## Usage

```typescript
// Example: Using AccusationManager in a scene
import { AccusationManager } from '@/systems/accusation-manager';
import type { AccusationState } from '@/types/accusation';

class LibraryScene extends Phaser.Scene {
  private accusationManager!: AccusationManager;
  
  create() {
    this.accusationManager = new AccusationManager(this);
    
    // Check if player can make an accusation
    const canAccuse = this.accusationManager.canInitiateAccusation();
    
    if (canAccuse) {
      this.accusationManager.startSuspectSelection();
    }
  }
}
```

## Integration Points

### With Existing Systems

- **DialogManager**: Valentin's post-incident dialog triggers accusation initiation
- **ClueTracker**: Validates minimum clues discovered for successful accusation
- **NotebookManager**: Evidence selection during confrontation reuses notebook UI
- **SaveManager**: Accusation state persisted to LocalStorage
- **GameProgressionManager**: Coordinates ending sequence triggers

### Event System

The accusation system uses Phaser's event system for inter-component communication:

```typescript
// Events emitted by AccusationManager
scene.events.emit('accusation:started', { suspectId: string });
scene.events.emit('accusation:evidence-presented', { clueId: string, correct: boolean });
scene.events.emit('accusation:success', { suspectId: string });
scene.events.emit('accusation:failed', { suspectId: string, failureCount: number });
scene.events.emit('accusation:bad-ending-triggered');
scene.events.emit('accusation:victory-triggered', { culpritId: string });
```

## Testing Approach

Manual playtesting scenarios:

1. **Successful Accusation**: Discover all clues, accuse correct suspect, present all evidence correctly
2. **Failed Confrontation**: Make 3 mistakes during confrontation, verify failure handling
3. **Bad Ending**: Fail 2 accusations, verify bad ending sequence triggers
4. **Cancellation**: Cancel accusation mid-confrontation, verify no state corruption
5. **Save/Load**: Make failed accusation, save, close game, reopen, verify count persists

## Implementation Notes

- All confrontation data must be loaded from `src/data/accusation.json`
- UI components must use integer coordinates for pixel-perfect rendering
- LocalStorage operations must be wrapped in try-catch with fallbacks
- Evidence validation must check both discovered clues and configuration
