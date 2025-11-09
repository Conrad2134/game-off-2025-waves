# Data Model: Game Progression System

**Feature**: 004-game-progression  
**Date**: 2025-11-09  
**Status**: Complete

## Overview

This document defines all data entities, their relationships, validation rules, and state transitions for the game progression system. All entities follow TypeScript strict typing and are serializable to JSON for data-driven design.

---

## Core Entities

### 1. GamePhase

**Description**: Represents the current narrative phase of the game, determining which content and mechanics are available.

**Fields**:
```typescript
type GamePhase = 'pre-incident' | 'post-incident';
```

**Validation Rules**:
- Must be one of the two defined string literals
- Cannot be null or undefined
- Default value: `'pre-incident'`

**State Transitions**:
```
pre-incident → post-incident  (triggered when all NPCs introduced)
post-incident → (end of game)  (out of scope for this feature)
```

**Usage Context**:
- Stored in GameProgressionManager
- Determines which dialog sets NPCs use
- Controls clue visibility and interaction availability
- Persisted to LocalStorage

---

### 2. DialogTier

**Description**: Categorizes NPC dialog content based on investigation progress (number of clues discovered).

**Fields**:
```typescript
interface DialogTier {
  /** Tier identifier (0-3 for 4 tiers) */
  tier: number;
  
  /** Minimum clues required to unlock this tier */
  requiredClues: number;
  
  /** Dialog lines for first conversation at this tier */
  lines: string[];
  
  /** Dialog lines for repeated conversations at this tier */
  followUpLines: string[];
  
  /** Whether this dialog should be recorded in notebook */
  recordInNotebook: boolean;
  
  /** Summarized note for notebook (if recordInNotebook is true) */
  notebookNote?: string;
  
  /** Clue IDs unlocked after this conversation completes */
  unlocksClues?: string[];
}
```

**Validation Rules**:
- `tier`: Must be 0-3 (exactly 4 tiers as per spec)
- `requiredClues`: Must match tier (0→0, 1→1, 2→3, 3→5)
- `lines`: Must have at least 1 line, max 500 chars per line
- `followUpLines`: Must have at least 1 line, max 500 chars per line
- `notebookNote`: Required if `recordInNotebook` is true
- `unlocksClues`: All clue IDs must exist in clues.json

**Tier Mapping** (as per FR-016):
| Tier | Required Clues | Description |
|------|----------------|-------------|
| 0    | 0              | Initial post-incident dialog |
| 1    | 1              | 1-2 clues discovered |
| 2    | 3              | 3-4 clues discovered |
| 3    | 5              | 5+ clues discovered |

**Relationships**:
- Belongs to a single NPC character
- Referenced by DialogManager for tier selection
- May unlock multiple Clues

---

### 3. ClueData

**Description**: Represents a discoverable piece of evidence in the game world.

**Fields**:
```typescript
interface ClueData {
  /** Unique clue identifier */
  id: string;
  
  /** Display name for UI/notebook */
  name: string;
  
  /** Detailed description shown when examined */
  description: string;
  
  /** World position */
  position: {
    x: number;
    y: number;
  };
  
  /** Sprite key for visual representation */
  spriteKey: string;
  
  /** Display width/height for sprite sizing */
  displaySize: {
    width: number;
    height: number;
  };
  
  /** Interaction proximity threshold (pixels) */
  interactionRange: number;
  
  /** Current clue state */
  state: ClueState;
  
  /** Whether clue is immediately accessible after incident */
  initiallyUnlocked: boolean;
  
  /** NPC conversation required to unlock (if not initiallyUnlocked) */
  unlockedBy?: {
    npcId: string;
    tier: number;
  };
  
  /** Summarized notebook entry */
  notebookNote: string;
}

type ClueState = 'locked' | 'unlocked' | 'discovered';
```

**Validation Rules**:
- `id`: Must be unique across all clues, lowercase-kebab-case
- `name`: 3-50 characters
- `description`: 20-500 characters
- `position`: Must be within world bounds (0-1200 x, 0-800 y)
- `spriteKey`: Must reference valid sprite in assets
- `displaySize`: width/height must be positive integers
- `interactionRange`: 30-100 pixels (reasonable proximity)
- `state`: Must be one of ClueState values
- `initiallyUnlocked`: Exactly 2 clues must be true (per spec)
- `unlockedBy`: Required if `initiallyUnlocked` is false
- `notebookNote`: 10-200 characters, shorter than description

**State Transitions**:
```
locked → unlocked     (NPC conversation triggers unlock)
unlocked → discovered (player examines the clue)

locked → discovered   (ERROR: Cannot discover locked clues)
discovered → unlocked (ERROR: Cannot un-discover clues)
```

**Relationships**:
- May be unlocked by a specific DialogTier
- Creates NotebookEntry when discovered
- Tracked by ClueTracker system

**As Per Spec Requirements**:
- FR-012: At least 5 clues total (2 initially unlocked, 3+ require NPC unlock)
- FR-013: State tracked throughout game session
- FR-014: Recorded in notebook with description
- FR-022: Unlock triggered by NPC dialog interactions
- FR-023: Visual highlights change based on state (locked vs unlocked)
- FR-024: Cannot be investigated during active dialog

---

### 4. ProgressionConfig

**Description**: Configuration file (`progression.json`) defining phase transitions and incident trigger.

**Fields**:
```typescript
interface ProgressionConfig {
  /** Configuration version for migration */
  version: string;
  
  /** Phase definitions */
  phases: {
    'pre-incident': PhaseConfig;
    'post-incident': PhaseConfig;
  };
  
  /** Incident trigger conditions */
  incidentTrigger: {
    /** All NPCs from this list must be introduced */
    requiresNPCsIntroduced: string[];
    
    /** Delay in milliseconds before incident plays */
    delayMs: number;
  };
  
  /** Valentin's incident cutscene definition */
  incidentCutscene: {
    /** Valentin's entry position */
    entryPosition: { x: number; y: number };
    
    /** Valentin's speech lines */
    speechLines: string[];
    
    /** Door position to lock */
    doorPosition: { x: number; y: number };
    
    /** Total cutscene duration (ms) */
    durationMs: number;
  };
}

interface PhaseConfig {
  /** Phase display name */
  name: string;
  
  /** Whether clues are interactable in this phase */
  cluesEnabled: boolean;
  
  /** Whether notebook is accessible */
  notebookEnabled: boolean;
}
```

**Validation Rules**:
- `version`: Semantic version string (e.g., "1.0.0")
- `requiresNPCsIntroduced`: Must list exactly 5 NPCs (Emma, Klaus, Luca, Marianne, Sebastian)
- `delayMs`: 1000-5000 ms (reasonable cinematic delay)
- `entryPosition`: Must be valid world coordinates
- `speechLines`: 3-10 lines, each 20-200 characters
- `doorPosition`: Must match a wall segment in library-layout.json
- `durationMs`: 3000-15000 ms (reasonable cutscene length)

**Relationships**:
- References NPC character IDs
- Defines GamePhase transition logic
- Used by GameProgressionManager

---

### 5. CharacterDialogData

**Description**: Organizes all dialog content for a single NPC character (stored in `src/data/dialogs/{characterId}.json`).

**Fields**:
```typescript
interface CharacterDialogData {
  /** Character identifier (matches NPC entity ID) */
  characterId: string;
  
  /** Character display name */
  characterName: string;
  
  /** Introduction phase dialog */
  introduction: {
    lines: string[];
    recordInNotebook: boolean;
    notebookNote?: string;
  };
  
  /** Post-incident dialog tiers (exactly 4 tiers) */
  postIncident: DialogTier[];
}
```

**Validation Rules**:
- `characterId`: Must match an NPC entity ID
- `characterName`: 3-30 characters
- `introduction.lines`: 1-10 lines, each 20-500 characters
- `postIncident`: Must have exactly 4 entries (tiers 0-3)
- Tiers must be ordered by `requiredClues` ascending

**Relationships**:
- One file per NPC character
- Referenced by NPCCharacter entity
- Loaded by DialogManager

**File Organization**:
```
src/data/dialogs/
├── valentin.json    (6 dialogs: 1 intro + 4 post-incident tiers + special incident speech)
├── emma.json        (5 dialogs: 1 intro + 4 post-incident tiers)
├── klaus.json       (Reference only - player character)
├── luca.json        (5 dialogs: 1 intro + 4 post-incident tiers)
├── marianne.json    (5 dialogs: 1 intro + 4 post-incident tiers)
└── sebastian.json   (5 dialogs: 1 intro + 4 post-incident tiers)
```

---

### 6. ProgressionSaveData

**Description**: Serialized state persisted to LocalStorage for cross-session continuity.

**Fields**:
```typescript
interface ProgressionSaveData {
  /** Save data version for migration */
  version: string;
  
  /** Current game phase */
  currentPhase: GamePhase;
  
  /** Set of NPC IDs the player has been introduced to */
  introducedNPCs: string[];
  
  /** Set of clue IDs the player has discovered */
  discoveredClues: string[];
  
  /** Set of clue IDs that are unlocked (investigable) */
  unlockedClues: string[];
  
  /** Conversation counters per NPC per tier */
  conversationHistory: Record<string, Record<number, number>>;
  
  /** Save timestamp (for debugging/analytics) */
  timestamp: number;
}
```

**Validation Rules**:
- `version`: Must match current game version or be migratable
- `currentPhase`: Must be valid GamePhase value
- `introducedNPCs`: All IDs must reference valid NPCs
- `discoveredClues`: Subset of `unlockedClues` (can't discover locked clues)
- `unlockedClues`: All IDs must reference valid clues
- `conversationHistory`: Keys must be valid NPC IDs, tier keys 0-3, counts >= 0
- `timestamp`: Valid Unix timestamp in milliseconds

**State Transitions**:
- Saved after any progression state change (debounced 2 seconds)
- Loaded on game start before LibraryScene creates
- Migrated if version mismatch detected

**Persistence Strategy**:
- Storage key: `'erdbeerstrudel-progression'`
- Max size: ~10KB (well within LocalStorage limits)
- Graceful fallback: If load fails, start fresh game
- Clear on explicit "New Game" action (out of scope)

---

### 7. InvestigationProgress

**Description**: Runtime tracking object maintained by GameProgressionManager (not directly serialized, computed from ProgressionSaveData).

**Fields**:
```typescript
interface InvestigationProgress {
  /** Current game phase */
  phase: GamePhase;
  
  /** Number of clues discovered (0-5+) */
  clueCount: number;
  
  /** Current dialog tier based on clue count (0-3) */
  dialogTier: number;
  
  /** Whether all NPCs have been introduced */
  allNPCsIntroduced: boolean;
  
  /** Whether the incident has triggered */
  incidentTriggered: boolean;
}
```

**Computed Properties**:
- `clueCount`: `discoveredClues.length`
- `dialogTier`: Calculated from clueCount (0→0, 1-2→1, 3-4→2, 5+→3)
- `allNPCsIntroduced`: `introducedNPCs.size === 5`
- `incidentTriggered`: `phase === 'post-incident'`

**Usage**:
- Queried by DialogManager for tier selection
- Updated by event handlers (clue discovered, NPC introduced)
- Not directly persisted (reconstructed from ProgressionSaveData on load)

---

## Entity Relationships

```
GameProgressionManager
├── manages → InvestigationProgress
├── persists → ProgressionSaveData
├── loads → ProgressionConfig
└── emits events to → DialogManager, ClueTracker, NotebookManager

ClueTracker
├── manages → ClueData[]
├── updates → ClueState transitions
├── listens for → 'clue-unlocked' events from DialogManager
└── emits → 'clue-discovered' events to NotebookManager

DialogManager
├── loads → CharacterDialogData[]
├── selects → DialogTier based on InvestigationProgress
├── emits → 'clue-unlocked' events to ClueTracker
└── records → NotebookEntry via NotebookManager

NPCCharacter
├── references → CharacterDialogData (via characterId)
└── provides → DialogData to DialogManager on interaction

InteractableObject (Clue)
├── instances → ClueData
├── filtered by → InteractionDetector based on ClueState
└── discovered via → DialogManager

NotebookManager
├── creates → NotebookEntry
├── listens for → 'clue-discovered', 'npc-introduced', 'incident-triggered'
└── updates → NotebookUI
```

---

## Validation Rules Summary

| Entity | Critical Validations |
|--------|---------------------|
| GamePhase | Must be 'pre-incident' or 'post-incident' |
| DialogTier | Exactly 4 tiers (0-3), requiredClues match spec |
| ClueData | Exactly 2 initiallyUnlocked, positions in world bounds |
| ProgressionConfig | 5 required NPCs, valid cutscene coordinates |
| CharacterDialogData | 1 intro + 4 post-incident tiers per character |
| ProgressionSaveData | discoveredClues ⊆ unlockedClues, valid IDs |
| InvestigationProgress | dialogTier correctly computed from clueCount |

---

## State Machine: Game Progression Flow

```
[Game Start]
    ↓
[Load ProgressionSaveData from LocalStorage]
    ↓ (if exists)          ↓ (if not)
[Restore State]       [Initialize Fresh]
    ↓                      ↓
[Phase: pre-incident]
    ↓
[Player talks to NPCs] ← (repeatable)
    ↓
[All 5 NPCs introduced?]
    ↓ (yes)
[Wait 2 seconds]
    ↓
[Trigger Incident Cutscene]
    ↓
[Phase: post-incident]
    ↓
[Player investigates clues] ← (repeatable)
    ↓
[Clue discovered → clueCount++]
    ↓
[dialogTier recalculated]
    ↓
[Player talks to NPCs with new tier] ← (repeatable)
    ↓
[Some conversations unlock more clues]
    ↓
[Player continues investigation]
    ↓
(Accusation mechanic - out of scope)
```

---

## Data File Schemas

### src/data/progression.json
```json
{
  "version": "1.0.0",
  "phases": {
    "pre-incident": {
      "name": "The Party",
      "cluesEnabled": false,
      "notebookEnabled": true
    },
    "post-incident": {
      "name": "The Investigation",
      "cluesEnabled": true,
      "notebookEnabled": true
    }
  },
  "incidentTrigger": {
    "requiresNPCsIntroduced": ["emma", "luca", "marianne", "sebastian", "valentin"],
    "delayMs": 2000
  },
  "incidentCutscene": {
    "entryPosition": { "x": 600, "y": 100 },
    "speechLines": [
      "My erdbeerstrudel! It's gone!",
      "Someone in this room ate it!",
      "No one is leaving until I find out who!"
    ],
    "doorPosition": { "x": 600, "y": 750 },
    "durationMs": 8000
  }
}
```

### src/data/clues.json
```json
{
  "version": "1.0.0",
  "clues": [
    {
      "id": "strudel-crumbs",
      "name": "Crumbs",
      "description": "Small pastry crumbs near the dining table. They smell like strawberries and vanilla.",
      "position": { "x": 950, "y": 420 },
      "spriteKey": "clue-crumbs",
      "displaySize": { "width": 32, "height": 32 },
      "interactionRange": 60,
      "state": "locked",
      "initiallyUnlocked": true,
      "notebookNote": "Pastry crumbs near the table"
    },
    {
      "id": "suspicious-napkin",
      "name": "Napkin",
      "description": "A crumpled napkin with red stains. Looks like strawberry jam.",
      "position": { "x": 800, "y": 650 },
      "spriteKey": "clue-napkin",
      "displaySize": { "width": 32, "height": 32 },
      "interactionRange": 60,
      "state": "locked",
      "initiallyUnlocked": true,
      "notebookNote": "Napkin with strawberry stains"
    },
    {
      "id": "desk-papers",
      "name": "Papers",
      "description": "Scattered papers on Valentin's desk. One has a recipe for erdbeerstrudel crossed out.",
      "position": { "x": 200, "y": 300 },
      "spriteKey": "clue-papers",
      "displaySize": { "width": 64, "height": 48 },
      "interactionRange": 70,
      "state": "locked",
      "initiallyUnlocked": false,
      "unlockedBy": { "npcId": "emma", "tier": 1 },
      "notebookNote": "Crossed-out recipe on desk"
    },
    {
      "id": "bookshelf-hiding-spot",
      "name": "Hiding Spot",
      "description": "A gap behind the bookshelf. Perfect for hiding something... or someone.",
      "position": { "x": 100, "y": 350 },
      "spriteKey": "clue-hiding-spot",
      "displaySize": { "width": 48, "height": 64 },
      "interactionRange": 70,
      "state": "locked",
      "initiallyUnlocked": false,
      "unlockedBy": { "npcId": "luca", "tier": 2 },
      "notebookNote": "Gap behind bookshelf"
    },
    {
      "id": "empty-plate",
      "name": "Empty Plate",
      "description": "The plate where Valentin's erdbeerstrudel was. It's completely clean... suspiciously clean.",
      "position": { "x": 1000, "y": 400 },
      "spriteKey": "clue-plate",
      "displaySize": { "width": 48, "height": 48 },
      "interactionRange": 60,
      "state": "locked",
      "initiallyUnlocked": false,
      "unlockedBy": { "npcId": "sebastian", "tier": 1 },
      "notebookNote": "Suspiciously clean plate"
    }
  ]
}
```

### src/data/dialogs/valentin.json (example)
```json
{
  "characterId": "valentin",
  "characterName": "Valentin",
  "introduction": {
    "lines": [
      "Welcome to my party! I'm so glad you could make it.",
      "I've prepared my famous erdbeerstrudel for everyone.",
      "Let me go fetch it from the kitchen. Please, enjoy yourselves!"
    ],
    "recordInNotebook": true,
    "notebookNote": "Valentin is hosting the party and made erdbeerstrudel."
  },
  "postIncident": [
    {
      "tier": 0,
      "requiredClues": 0,
      "lines": [
        "My erdbeerstrudel! It's gone!",
        "I know one of you ate it. No one leaves until I find out who!"
      ],
      "followUpLines": [
        "Have you found anything yet?",
        "Please, help me figure this out."
      ],
      "recordInNotebook": false
    },
    {
      "tier": 1,
      "requiredClues": 1,
      "lines": [
        "You found crumbs? Where exactly?",
        "Hmm, that's interesting. Keep looking."
      ],
      "followUpLines": [
        "Any new discoveries?",
        "The culprit must have left more evidence."
      ],
      "recordInNotebook": true,
      "notebookNote": "Valentin seems genuinely upset about the missing strudel."
    },
    {
      "tier": 2,
      "requiredClues": 3,
      "lines": [
        "Three clues already? You're quite the detective!",
        "Wait... that napkin... I think I saw someone near it earlier."
      ],
      "followUpLines": [
        "Have you talked to everyone again?",
        "Someone's story doesn't add up, I'm sure of it."
      ],
      "recordInNotebook": true,
      "notebookNote": "Valentin mentioned seeing someone near the napkin."
    },
    {
      "tier": 3,
      "requiredClues": 5,
      "lines": [
        "Five clues! You've found them all.",
        "I think I know who did it... but I want to hear your accusation first."
      ],
      "followUpLines": [
        "When you're ready, tell me who you think ate my strudel.",
        "Take your time. Make sure you're certain."
      ],
      "recordInNotebook": true,
      "notebookNote": "Valentin claims to know who the culprit is."
    }
  ]
}
```

---

## Migration Strategy

When save data version doesn't match current version:

```typescript
function migrateData(oldData: any): ProgressionSaveData {
  const currentVersion = '1.0.0';
  
  if (oldData.version === currentVersion) {
    return oldData as ProgressionSaveData;
  }
  
  console.warn(`Migrating save data from ${oldData.version} to ${currentVersion}`);
  
  // Example migration (if we add new fields in future)
  if (oldData.version === '0.9.0') {
    return {
      ...oldData,
      version: '1.0.0',
      conversationHistory: {}, // New field added in 1.0.0
    };
  }
  
  // Unknown version - start fresh
  console.error(`Cannot migrate from version ${oldData.version}, starting fresh`);
  return null;
}
```

---

## Performance Considerations

| Operation | Frequency | Complexity | Max Time |
|-----------|-----------|------------|----------|
| Load save data | Once per game start | O(1) | <10ms |
| Save state | Every 2sec (debounced) | O(n) clues | <5ms |
| Calculate dialog tier | Per dialog open | O(1) | <1ms |
| Check clue state | Per frame per clue | O(1) lookup | <0.1ms |
| Validate JSON | Per file load | O(n) entries | <50ms total |

Total memory footprint: <100KB for all progression data.

---

## Compliance Check

All data models comply with constitution principles:

- ✅ **Principle III (Data-Driven Design)**: All progression logic in JSON files
- ✅ **Principle VI (TypeScript Type Safety)**: All entities fully typed with interfaces
- ✅ **Principle VII (Scene State Management)**: GameProgressionManager follows Registry pattern

---

**Data Model Complete**: 2025-11-09  
**Next Phase**: Contracts & Quickstart (Phase 1 continued)
