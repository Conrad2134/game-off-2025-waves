# Data Model: Accusation System

**Feature**: 005-accusation-system  
**Date**: 2025-11-12  
**Phase**: 1 (Design)

## Overview

This document defines the data structures and relationships for the accusation system, including state management, confrontation sequences, evidence validation, and ending flows.

## Entities

### 1. AccusationState

**Purpose**: Tracks player's progress through accusation attempts and confrontations

**Fields**:
```typescript
interface AccusationState {
  failedAccusations: number;           // 0-2, triggers bad ending at 2
  currentConfrontation: ConfrontationProgress | null;  // Active confrontation state
  accusedSuspects: string[];           // IDs of suspects already accused
  lastAccusationTimestamp?: number;    // For debugging/analytics
}
```

**Relationships**:
- References `ConfrontationProgress` when active confrontation is in progress
- Persisted via `SaveManager` to LocalStorage
- Updated by `AccusationManager` system

**Validation Rules**:
- `failedAccusations` must be 0-2 (inclusive)
- `accusedSuspects` contains valid NPC IDs only
- `currentConfrontation` null when no active confrontation
- Bad ending triggers when `failedAccusations === 2`

**State Transitions**:
```
IDLE (failedAccusations: 0)
  → START_CONFRONTATION → ACTIVE (currentConfrontation set)
    → CONFRONTATION_SUCCESS → VICTORY
    → CONFRONTATION_FAILED → IDLE (failedAccusations++)
      → [if failedAccusations === 2] → BAD_ENDING
```

### 2. ConfrontationProgress

**Purpose**: Tracks progress through a specific confrontation sequence

**Fields**:
```typescript
interface ConfrontationProgress {
  suspectId: string;                   // NPC being accused
  currentStatementIndex: number;       // Position in statement sequence (0-based)
  mistakeCount: number;                // 0-3, fails at 3
  presentedEvidence: string[];         // Clue IDs already presented
  startedAt: number;                   // Timestamp for duration tracking
}
```

**Relationships**:
- References `ConfrontationSequence` via `suspectId`
- Part of `AccusationState`
- Updated on each evidence presentation attempt

**Validation Rules**:
- `mistakeCount` must be 0-3 (confrontation fails at 3)
- `currentStatementIndex` must be within statement sequence bounds
- `presentedEvidence` contains valid clue IDs only
- `suspectId` must reference an existing NPC

**State Transitions**:
```
START (mistakeCount: 0, currentStatementIndex: 0)
  → PRESENT_EVIDENCE
    → [correct] → ADVANCE_STATEMENT (currentStatementIndex++)
    → [incorrect] → INCREMENT_MISTAKES (mistakeCount++)
      → [if mistakeCount === 3] → FAIL_CONFRONTATION
  → [currentStatementIndex === sequence.length] → SUCCESS_CONFRONTATION
```

### 3. ConfrontationSequence

**Purpose**: Defines the scripted dialog flow and evidence requirements for accusing a specific suspect

**Fields**:
```typescript
interface ConfrontationSequence {
  suspectId: string;                   // NPC this sequence is for
  motive: string;                      // Why they did it (for victory screen)
  confession: string;                  // Confession dialog on success
  statements: ConfrontationStatement[];  // Ordered sequence of statements
}
```

**Relationships**:
- Each suspect has exactly one `ConfrontationSequence`
- Contains multiple `ConfrontationStatement` objects
- Referenced by `ConfrontationProgress` during active confrontation

**Validation Rules**:
- `suspectId` must reference an existing NPC
- `statements` array must not be empty
- At least one statement must require evidence (`requiredEvidence` set)

**Data Source**: `src/data/accusation.json`

### 4. ConfrontationStatement

**Purpose**: A single statement in a confrontation that may require evidence to contradict

**Fields**:
```typescript
interface ConfrontationStatement {
  id: string;                          // Unique statement identifier
  text: string;                        // Statement dialog text
  speaker: 'suspect' | 'valentin';     // Who makes this statement
  requiredEvidence?: string;           // Primary clue ID that contradicts this
  acceptableEvidence?: string[];       // Alternative valid clue IDs
  correctResponse: string;             // Dialog shown when correct evidence presented
  incorrectResponse: string;           // Dialog shown when wrong evidence presented
  requiresPresentation: boolean;       // If false, auto-advances (informational)
}
```

**Relationships**:
- Part of `ConfrontationSequence.statements`
- References clue IDs from `clues.json`
- Validated against player's discovered clues

**Validation Rules**:
- If `requiresPresentation === true`, `requiredEvidence` must be set
- `acceptableEvidence` must include `requiredEvidence` if both are set
- All evidence IDs must reference valid clues in `clues.json`
- `text`, `correctResponse`, `incorrectResponse` must not be empty

**Evidence Validation Logic**:
```typescript
function isEvidenceCorrect(
  statement: ConfrontationStatement,
  presentedClueId: string
): boolean {
  if (!statement.requiresPresentation) return true; // Auto-advance
  
  if (statement.acceptableEvidence) {
    return statement.acceptableEvidence.includes(presentedClueId);
  }
  
  return statement.requiredEvidence === presentedClueId;
}
```

### 5. AccusationConfig

**Purpose**: Top-level configuration defining the guilty party and evidence requirements

**Fields**:
```typescript
interface AccusationConfig {
  guiltyParty: string;                 // NPC ID of the actual culprit
  minimumCluesRequired: number;        // Min clues discovered before success (default: 4)
  allowPartialEvidence: boolean;       // If true, some evidence can be skipped
  confrontations: Record<string, ConfrontationSequence>;  // Keyed by suspectId
}
```

**Relationships**:
- Root object in `src/data/accusation.json`
- Contains all `ConfrontationSequence` definitions
- Referenced by `AccusationManager` for validation

**Validation Rules**:
- `guiltyParty` must reference a suspect with a defined confrontation sequence
- `minimumCluesRequired` must be ≥ 1 and ≤ total clues in game
- `confrontations` must include entries for all suspects

**Data Source**: `src/data/accusation.json`

### 6. EndingSequenceData

**Purpose**: Defines the victory or bad ending sequence content

**Fields**:
```typescript
interface VictorySequenceData {
  culpritId: string;                   // Who was guilty
  confession: string;                  // Culprit's confession dialog
  valentinReaction: string;            // Valentin's response to this specific culprit
  summary: {
    motive: string;                    // Why they did it
    keyEvidence: string[];             // Clue IDs that were critical
    bonusAcknowledgment?: string;      // If player found all clues
  };
}

interface BadEndingSequenceData {
  despairSpeech: string;               // Valentin gives up dialog
  failureExplanation: string;          // What went wrong (for failure screen)
  actualCulprit?: string;              // Optional reveal of who it was
}
```

**Relationships**:
- `VictorySequenceData` references the guilty `ConfrontationSequence`
- Both types used by `EndingSequence` component
- Data embedded in `AccusationConfig`

**Validation Rules**:
- `culpritId` must match a valid suspect
- `keyEvidence` IDs must reference valid clues
- All text fields must not be empty

**State Flow**:
```
SUCCESS_CONFRONTATION 
  → Load VictorySequenceData for guiltyParty
  → Play confession → valentinReaction → doorUnlock → summaryScreen

FAILED_ACCUSATION (count === 2)
  → Load BadEndingSequenceData
  → Play despairSpeech → doorUnlock → failureScreen
```

### 7. AccusationUIState

**Purpose**: Manages the visual state of the confrontation interface

**Fields**:
```typescript
interface AccusationUIState {
  isVisible: boolean;                  // UI active
  phase: 'suspect-selection' | 'confrontation' | 'ending';
  selectedSuspect: string | null;      // During suspect selection
  currentStatement: ConfrontationStatement | null;  // Active statement
  notebookOpen: boolean;               // Evidence selection overlay
  animationPlaying: boolean;           // Disable input during animations
}
```

**Relationships**:
- Managed by `AccusationUI` component
- Reflects current `ConfrontationProgress` state
- Controls `NotebookUI` visibility for evidence selection

**Validation Rules**:
- When `phase === 'suspect-selection'`, `currentStatement` must be null
- When `phase === 'confrontation'`, `currentStatement` must be set
- When `notebookOpen === true`, `phase` must be 'confrontation'

**UI Rendering Logic**:
```typescript
function renderAccusationUI(state: AccusationUIState) {
  if (!state.isVisible) return;
  
  switch (state.phase) {
    case 'suspect-selection':
      renderSuspectList();
      break;
    case 'confrontation':
      renderConfrontationScreen(state.currentStatement);
      if (state.notebookOpen) renderNotebookOverlay();
      break;
    case 'ending':
      renderEndingSequence();
      break;
  }
}
```

## Data Relationships Diagram

```
AccusationConfig (accusation.json)
  │
  ├─ guiltyParty: string
  ├─ minimumCluesRequired: number
  │
  └─ confrontations: Record<string, ConfrontationSequence>
       │
       └─ ConfrontationSequence (per suspect)
            ├─ suspectId: string
            ├─ motive: string
            ├─ confession: string
            │
            └─ statements: ConfrontationStatement[]
                 ├─ requiredEvidence: string → references clues.json
                 └─ acceptableEvidence: string[] → references clues.json

AccusationState (in SaveState)
  │
  ├─ failedAccusations: number (0-2)
  ├─ accusedSuspects: string[]
  │
  └─ currentConfrontation: ConfrontationProgress?
       ├─ suspectId: string → references ConfrontationSequence
       ├─ currentStatementIndex: number
       ├─ mistakeCount: number (0-3)
       └─ presentedEvidence: string[] → references clues.json

EndingSequenceData
  ├─ VictorySequenceData
  │    ├─ culpritId: string → references guiltyParty
  │    └─ keyEvidence: string[] → references clues.json
  │
  └─ BadEndingSequenceData
       └─ actualCulprit: string → references guiltyParty
```

## Integration with Existing Systems

### ClueTracker Integration

```typescript
// AccusationManager validates minimum clues before allowing success
function canSucceedAccusation(suspectId: string): boolean {
  const discoveredClues = ClueTracker.getDiscoveredClues();
  const config = AccusationConfig.load();
  
  if (discoveredClues.length < config.minimumCluesRequired) {
    return false; // Not enough investigation
  }
  
  if (suspectId !== config.guiltyParty) {
    return false; // Wrong suspect
  }
  
  return true;
}
```

### SaveManager Integration

```typescript
interface SaveState {
  version: string;
  progression: ProgressionState;
  clues: ClueState;
  dialogs: DialogState;
  accusation: AccusationState;  // NEW: Added for accusation system
}

// SaveManager extended with accusation methods
class SaveManager {
  saveAccusationState(state: AccusationState): void {
    const save = this.loadFullState();
    save.accusation = state;
    this.persistToLocalStorage(save);
  }
  
  loadAccusationState(): AccusationState {
    const save = this.loadFullState();
    return save.accusation || this.getDefaultAccusationState();
  }
}
```

### DialogManager Integration

```typescript
// Valentin's dialog extends with accusation options in post-incident phase
// src/data/dialogs/valentin.json extended:
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
      ],
      "after-first-failure": [
        {
          "text": "You already made one wrong accusation. Please be more careful...",
          "options": [/* same as above */]
        }
      ]
    }
  }
}
```

## File Storage Schema

### accusation.json Structure

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
      "confession": "I couldn't help myself! I tasted it and knew I could make it better...",
      "statements": [
        {
          "id": "emma-alibi",
          "text": "I was reading in the corner the whole time!",
          "speaker": "suspect",
          "requiredEvidence": "bookshelf-hiding-spot",
          "acceptableEvidence": ["bookshelf-hiding-spot"],
          "correctResponse": "But this hiding spot shows you could have slipped away unnoticed...",
          "incorrectResponse": "That evidence doesn't contradict Emma's statement.",
          "requiresPresentation": true
        },
        {
          "id": "emma-denial",
          "text": "I never even went near the table!",
          "speaker": "suspect",
          "requiredEvidence": "desk-papers",
          "acceptableEvidence": ["desk-papers", "strudel-crumbs"],
          "correctResponse": "These papers show you had strong opinions about the recipe...",
          "incorrectResponse": "That doesn't prove Emma went to the table.",
          "requiresPresentation": true
        }
      ]
    },
    "klaus": {
      "suspectId": "klaus",
      "motive": "He was hungry and couldn't resist",
      "confession": "I... I was just so hungry! I didn't mean to eat the whole thing...",
      "statements": [
        /* Klaus confrontation sequence */
      ]
    }
    /* ... other suspects */
  },
  "endings": {
    "victory": {
      "valentinReaction": {
        "emma": "Emma?! But you always gave such thoughtful feedback on my baking!",
        "klaus": "Klaus! I should have known you'd be eyeing my desserts...",
        /* ... reactions for each culprit */
      },
      "bonusAcknowledgment": "Impressive detective work! You found every clue in the library."
    },
    "badEnding": {
      "despairSpeech": "I... I give up. I'll never know who did this. Everyone, you may leave.",
      "failureExplanation": "You made too many incorrect accusations. The mystery remains unsolved."
    }
  }
}
```

## Validation Summary

### Runtime Validations

1. **On Game Start**: Validate `accusation.json` structure and references
2. **On Accusation Initiation**: Check minimum clues discovered
3. **On Evidence Presentation**: Validate clue ID exists and is discovered
4. **On Save/Load**: Validate accusation state bounds and references
5. **On Confrontation Advance**: Validate statement index within bounds

### Error Handling

```typescript
class AccusationValidationError extends Error {
  constructor(message: string, public context: any) {
    super(`Accusation Validation Error: ${message}`);
  }
}

// Example validation
function validateAccusationConfig(config: AccusationConfig): void {
  if (!config.confrontations[config.guiltyParty]) {
    throw new AccusationValidationError(
      'Guilty party must have a confrontation sequence',
      { guiltyParty: config.guiltyParty }
    );
  }
  
  // ... more validations
}
```

## Performance Considerations

- **Lazy Loading**: Load confrontation sequences on demand, not all at startup
- **Caching**: Cache parsed `accusation.json` after first load
- **Object Pooling**: Reuse statement text boxes and evidence selectors
- **Event Throttling**: Debounce evidence selection clicks to prevent double-submission

## Migration Path

When updating from a previous save version:

```typescript
function migrateAccusationState(oldSave: any): AccusationState {
  if (!oldSave.accusation) {
    // No accusation state in old save, create default
    return {
      failedAccusations: 0,
      currentConfrontation: null,
      accusedSuspects: []
    };
  }
  
  // Future migrations would go here
  return oldSave.accusation;
}
```

## Conclusion

The accusation system data model builds on existing entity patterns (clues, dialogs, progression) while introducing new structures for confrontation flows and evidence validation. All accusation content is externalized to JSON, maintaining the game's data-driven design principle. The state management integrates cleanly with the existing SaveManager, and validation rules ensure data integrity throughout the accusation lifecycle.
