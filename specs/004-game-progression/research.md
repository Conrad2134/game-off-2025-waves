# Research: Game Progression System

**Feature**: 004-game-progression  
**Date**: 2025-11-09  
**Status**: Complete

## Overview

This document captures the research and design decisions for implementing the game progression system in "Who Ate Valentin's Erdbeerstrudel?". All technical context was resolved through analysis of existing codebase and established patterns.

---

## Research Questions & Resolutions

### 1. State Management Architecture

**Question**: How should we track game progression state (phase, clues discovered, NPCs introduced) in a way that persists across browser sessions and integrates with existing Phaser Registry pattern?

**Decision**: Extend existing GameStateManager pattern with GameProgressionManager singleton

**Rationale**:
- Existing codebase already uses Phaser Registry for scene-level state
- Dialog and Notebook systems demonstrate event-driven updates (`scene.events.emit/on`)
- LocalStorage persistence already implemented in similar patterns
- Singleton pattern via Registry ensures single source of truth

**Implementation Pattern**:
```typescript
// Stored in Phaser Registry
const progressionManager = scene.registry.get('progressionManager') as GameProgressionManager;

// Event-driven updates
progressionManager.on('phase-changed', (newPhase) => { /* ... */ });
progressionManager.on('clue-discovered', (clue) => { /* ... */ });

// LocalStorage persistence (debounced)
progressionManager.save(); // Auto-called on state changes
```

**Alternatives Considered**:
1. **Vuex/Redux-style store**: Rejected - too heavyweight for Phaser game, adds unnecessary dependency
2. **Scene data passing**: Rejected - doesn't persist across sessions, loses state on reload
3. **Global singleton outside Phaser**: Rejected - breaks existing Registry pattern, harder to test

---

### 2. Phase-Based Dialog Selection

**Question**: How should NPCs determine which dialog content to show based on game phase (pre-incident vs post-incident) and investigation progress (0, 1-2, 3-4, 5+ clues)?

**Decision**: Hierarchical JSON structure with tier-based selection logic in DialogManager

**Rationale**:
- Existing character metadata already loads JSON from `assets/sprites/characters/{name}/metadata.json`
- DialogManager already handles dialog display, natural place for selection logic
- JSON structure allows easy content authoring without code changes
- Tier-based selection (0, 1-2, 3-4, 5+) maps cleanly to array indices

**JSON Structure**:
```json
{
  "characterId": "valentin",
  "dialogs": {
    "introduction": {
      "lines": ["Welcome to my party!", "..."],
      "recordInNotebook": true,
      "notebookNote": "Valentin loves his erdbeerstrudel"
    },
    "post-incident": [
      {
        "tier": 0,
        "requiredClues": 0,
        "lines": ["Someone ate my strudel!", "..."],
        "recordInNotebook": true
      },
      {
        "tier": 1,
        "requiredClues": 1,
        "lines": ["You found something? Tell me more...", "..."],
        "recordInNotebook": true
      }
    ]
  }
}
```

**Selection Logic**:
```typescript
// In DialogManager
const clueCount = progressionManager.getDiscoveredClueCount();
const phase = progressionManager.getCurrentPhase();

if (phase === 'pre-incident') {
  return dialogData.introduction;
} else {
  // Find highest tier the player qualifies for
  const tier = clueCount >= 5 ? 3 : clueCount >= 3 ? 2 : clueCount >= 1 ? 1 : 0;
  return dialogData['post-incident'][tier];
}
```

**Alternatives Considered**:
1. **Separate files per tier**: Rejected - too many files, harder to see progression flow
2. **Condition strings evaluated at runtime**: Rejected - less type-safe, harder to validate
3. **Code-based dialog trees**: Rejected - violates Data-Driven Design principle

---

### 3. Clue Unlock Mechanism

**Question**: How should clues transition from "locked" (requiring NPC conversation) to "unlocked" (investigable) state, with appropriate visual feedback?

**Decision**: Two-state visual system with InteractionDetector filtering + ClueHighlight component

**Rationale**:
- Existing InteractionDetector already filters interactables by range and state
- Sprite tinting provides clear visual distinction without new assets
- Event system allows NPCs to unlock clues during dialog
- Maintains pixel-perfect rendering (tint doesn't affect coordinates)

**Visual States**:
- **Locked**: Sprite with 50% opacity tint (0xaaaaaa), subtle pulse animation
- **Unlocked**: Sprite with 100% opacity, brighter pulse (0xffff00), shows interaction indicator

**Unlock Flow**:
```typescript
// In DialogManager, after certain NPC dialogs complete
scene.events.emit('clue-unlocked', { clueId: 'desk-papers' });

// ClueTracker listens and updates state
clueTracker.on('clue-unlocked', (data) => {
  const clue = this.getClueById(data.clueId);
  clue.state = 'unlocked';
  clue.setTint(0xffff00); // Bright highlight
  this.save(); // Persist state
});

// InteractionDetector filters based on state
if (clue.state === 'locked') {
  return false; // Don't show interaction indicator
}
```

**Alternatives Considered**:
1. **Separate sprites for locked/unlocked**: Rejected - requires duplicate assets, wastes memory
2. **Completely invisible when locked**: Rejected - players don't know what they're missing
3. **Text labels**: Rejected - breaks immersion, not pixel art aesthetic
4. **Distance-based gradual unlock**: Rejected - too complex, unclear to players

---

### 4. Incident Trigger Timing

**Question**: When and how should Valentin's return (the incident) be triggered after all NPCs are introduced?

**Decision**: Automatic trigger after final introduction dialog completes, with 2-second cinematic delay

**Rationale**:
- Clear cause-and-effect (talk to everyone → incident happens)
- Cinematic delay prevents jarring instant transition
- Event system allows scene orchestration (lock door, spawn Valentin, play animation)
- Matches game design goal of "after player has talked to all NPCs"

**Trigger Logic**:
```typescript
// In DialogManager, after dialog closes
dialogManager.on('dialog-closed', (data) => {
  const npcId = data.sourceId;
  progressionManager.markNPCIntroduced(npcId);
  
  if (progressionManager.areAllNPCsIntroduced()) {
    // Delay for cinematic effect
    scene.time.delayedCall(2000, () => {
      progressionManager.triggerIncident();
    });
  }
});

// In GameProgressionManager
triggerIncident() {
  this.currentPhase = 'post-incident';
  this.events.emit('incident-triggered');
  this.save();
}

// In LibraryScene
progressionManager.on('incident-triggered', () => {
  this.playIncidentCutscene(); // Valentin enters, speech, door lock
});
```

**Alternatives Considered**:
1. **Manual trigger (talk to Valentin)**: Rejected - players might miss it, less dramatic
2. **Time-based trigger**: Rejected - punishes slow/exploratory players
3. **Instant trigger**: Rejected - too jarring, no buildup
4. **Location-based (enter specific area)**: Rejected - unclear, might trigger accidentally

---

### 5. Dialog Repetition & Variation

**Question**: What should NPCs say when talked to multiple times within the same tier (same clue count)?

**Decision**: Contextual follow-up lines array with round-robin selection

**Rationale**:
- Prevents "broken record" feeling from identical repeated lines
- Doesn't require complex branching logic
- Easy to author (just add more lines to array)
- Matches mystery game convention (ask again for clarification)

**JSON Structure**:
```json
{
  "tier": 2,
  "requiredClues": 3,
  "lines": ["You found the crumbs! Interesting...", "..."],
  "followUpLines": [
    "I already told you what I know.",
    "Have you talked to the others?",
    "Check near the bookshelf, I heard something earlier."
  ],
  "recordInNotebook": true
}
```

**Selection Logic**:
```typescript
// In DialogManager
const conversationHistory = this.getConversationHistory(npcId, tier);

if (conversationHistory.count === 0) {
  return tier.lines; // First time at this tier
} else {
  const index = (conversationHistory.count - 1) % tier.followUpLines.length;
  return tier.followUpLines[index]; // Cycle through follow-ups
}
```

**Alternatives Considered**:
1. **Identical repeat**: Rejected - feels robotic, breaks immersion
2. **Random selection**: Rejected - could repeat same line back-to-back
3. **Procedural generation**: Rejected - too complex, quality concerns
4. **Single generic "nothing new" line**: Rejected - boring after multiple conversations

---

### 6. Notebook Integration

**Question**: How should investigation progress (clues, phase changes) be recorded in the existing notebook system?

**Decision**: Extend NotebookManager with new entry categories, automatic recording via events

**Rationale**:
- NotebookManager already handles entry creation and deduplication
- Event system provides clean integration point
- Category-based organization already implemented
- No changes needed to NotebookUI (already handles dynamic sections)

**Integration Pattern**:
```typescript
// In ClueTracker
clueTracker.on('clue-discovered', (clue) => {
  notebookManager.addEntry({
    id: notebookManager.generateId(),
    category: 'clue',
    sourceId: clue.id,
    sourceName: clue.name,
    text: clue.description,
    timestamp: Date.now(),
  });
});

// In GameProgressionManager
progressionManager.on('incident-triggered', () => {
  notebookManager.addEntry({
    id: notebookManager.generateId(),
    category: 'event',
    sourceId: 'incident',
    sourceName: 'The Incident',
    text: "Valentin's erdbeerstrudel has been eaten! He locked the door and won't let anyone leave.",
    timestamp: Date.now(),
  });
});
```

**New Notebook Categories**:
- `npc`: Character introductions (existing)
- `clue`: Physical evidence discovered (new)
- `event`: Major plot moments (new)

**Alternatives Considered**:
1. **Manual recording only**: Rejected - players will forget to check notebook
2. **Separate clue UI**: Rejected - duplicates functionality, more UI clutter
3. **Real-time popup notifications**: Rejected - breaks immersion, too gamey

---

### 7. Save/Load State Persistence

**Question**: Which progression data should persist across browser sessions, and how should version migration handle data structure changes?

**Decision**: Full state serialization to LocalStorage with version-tagged migration system

**Rationale**:
- Players expect mystery game progress to persist
- Version tags allow graceful migration as game updates
- LocalStorage sufficient for small state object (<10KB)
- Existing patterns already use debounced saves

**Persisted State**:
```typescript
interface ProgressionSaveData {
  version: string; // e.g., "1.0.0"
  currentPhase: GamePhase;
  introducedNPCs: string[];
  discoveredClues: string[];
  unlockedClues: string[];
  conversationHistory: Record<string, number>; // npcId -> count
  timestamp: number;
}
```

**Save/Load Pattern**:
```typescript
// Save (debounced 2 seconds after state change)
save() {
  const data: ProgressionSaveData = {
    version: '1.0.0',
    currentPhase: this.currentPhase,
    introducedNPCs: [...this.introducedNPCs],
    discoveredClues: this.clueTracker.getDiscoveredIds(),
    unlockedClues: this.clueTracker.getUnlockedIds(),
    conversationHistory: { ...this.conversationHistory },
    timestamp: Date.now(),
  };
  
  try {
    localStorage.setItem('erdbeerstrudel-progression', JSON.stringify(data));
  } catch (error) {
    console.warn('Failed to save progression:', error);
  }
}

// Load with migration
load(): ProgressionSaveData | null {
  try {
    const json = localStorage.getItem('erdbeerstrudel-progression');
    if (!json) return null;
    
    const data = JSON.parse(json) as ProgressionSaveData;
    
    // Version migration
    if (data.version !== '1.0.0') {
      return this.migrateData(data);
    }
    
    return data;
  } catch (error) {
    console.error('Failed to load progression:', error);
    return null;
  }
}
```

**Alternatives Considered**:
1. **No persistence**: Rejected - terrible UX for mystery game
2. **Session storage**: Rejected - lost on browser close
3. **IndexedDB**: Rejected - overkill for small state object
4. **Server-side storage**: Rejected - adds backend complexity, privacy concerns

---

### 8. Performance Optimization

**Question**: How do we ensure 60fps with dynamic dialog selection, clue state checks, and event emissions happening every frame?

**Decision**: Cached computed values + event throttling + spatial partitioning for clue checks

**Rationale**:
- Dialog tier calculation happens only when dialog opens (not every frame)
- Clue state checks use spatial grid (existing InteractionDetector pattern)
- Events debounced where appropriate (save operations)
- 6 NPCs + 5 clues = tiny state space, no optimization needed

**Performance Budget**:
- Dialog tier calculation: <1ms (only on dialog open)
- Clue state check: <0.1ms per clue (spatial grid lookup)
- Save operation: <5ms (debounced to max 1/2sec)
- Total overhead: <0.5ms per frame (negligible at 60fps = 16.67ms budget)

**Measurement Strategy**:
```typescript
// Debug mode performance tracking
if (DEBUG_MODE) {
  const start = performance.now();
  progressionManager.update();
  const elapsed = performance.now() - start;
  if (elapsed > 1.0) {
    console.warn(`ProgressionManager update took ${elapsed.toFixed(2)}ms`);
  }
}
```

**Alternatives Considered**:
1. **Aggressive caching with invalidation**: Rejected - premature optimization, adds complexity
2. **Web Worker for state management**: Rejected - overkill, adds latency
3. **Batch updates**: Rejected - not needed for this scale

---

## Technology Stack Confirmation

All technologies specified in Technical Context are confirmed and already integrated:

| Technology | Version | Usage | Status |
|------------|---------|-------|--------|
| TypeScript | 5.0+ | All game code | ✅ Confirmed |
| Phaser | 3.80.0 | Game engine | ✅ Confirmed |
| Vite | 5.0.0 | Build tool | ✅ Confirmed |
| LocalStorage | Browser API | State persistence | ✅ Confirmed |
| JSON | Native | Data files | ✅ Confirmed |

No additional dependencies required. All patterns follow existing codebase conventions.

---

## Best Practices Applied

### Phaser 3 Patterns
- **Registry for Managers**: GameProgressionManager, ClueTracker registered in `scene.registry`
- **Event-driven Architecture**: `scene.events.emit/on` for phase changes, clue discoveries
- **Groups for Pooling**: ClueHighlight sprites managed in Phaser Group
- **Time.delayedCall**: Cinematic timing for incident trigger

### TypeScript Patterns
- **Strict Interfaces**: All state objects fully typed (GamePhase, ClueData, ProgressionConfig)
- **Type Guards**: Runtime validation for loaded JSON data
- **Readonly Where Appropriate**: Config objects marked readonly to prevent mutation
- **Null Safety**: Explicit null checks, no implicit any

### Data-Driven Patterns
- **JSON Schemas**: Documented structure for all data files
- **Validation on Load**: Throw errors early for malformed data
- **Separation of Concerns**: Dialog content separate from game logic
- **Version Tagging**: All save data includes version for migration

---

## Open Questions (None)

All technical questions resolved. Ready to proceed to Phase 1 (data model and contracts).

---

## References

- Existing codebase: `/src/scenes/library-scene.ts`, `/src/systems/dialog-manager.ts`
- Phaser 3 documentation: https://photonstorm.github.io/phaser3-docs/
- TypeScript handbook: https://www.typescriptlang.org/docs/handbook/
- Constitution: `.specify/memory/constitution.md`
- Feature spec: `./spec.md`

---

**Research Complete**: 2025-11-09  
**Next Phase**: Data Model Design (Phase 1)
