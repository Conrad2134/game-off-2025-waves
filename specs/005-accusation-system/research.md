# Research: Accusation System

**Feature**: 005-accusation-system  
**Date**: 2025-11-12  
**Phase**: 0 (Research)

## Overview

This document consolidates research findings for implementing the Phoenix Wright-style accusation and confrontation system, including UI patterns, evidence validation approaches, ending sequences, and state persistence strategies.

## Research Areas

### 1. Confrontation UI Patterns (Phoenix Wright Style)

**Decision**: Implement confrontation UI as modal overlay within LibraryScene using Phaser Containers

**Rationale**: 
- Phoenix Wright games use a fixed camera with character portraits and dialog boxes
- Phaser Containers provide efficient grouping and positioning of UI elements
- Rendering inline (no scene transition) maintains game flow continuity
- Existing dialog-box.ts and notebook-ui.ts components provide proven patterns to follow

**Implementation Pattern**:
```typescript
// AccusationUI extends Phaser.GameObjects.Container
// - Portrait sprite (accused character)
// - Statement text box (similar to dialog-box.ts)
// - Action buttons ("Present Evidence", "Listen")
// - Mistake counter visual indicator
// - Penalty dialog overlay (when wrong evidence presented)
```

**Best Practices**:
- Use z-index layering: background dim → portrait → statement box → buttons → penalty overlay
- Implement fade-in/fade-out transitions for professional feel
- Ensure text remains readable with background dimming
- Add keyboard shortcuts (`E` for Present Evidence, `Space` for Continue)

**Alternatives Considered**:
- Separate confrontation scene: Rejected due to added complexity and scene transition overhead
- Full-screen takeover: Rejected to maintain connection to library environment
- Side-by-side split screen: Rejected as it doesn't match Phoenix Wright aesthetic

### 2. Evidence Presentation Validation

**Decision**: Statement-based validation with JSON-configured evidence mapping

**Rationale**:
- Each confrontation statement maps to one or more valid evidence clues
- JSON configuration allows changing culprit and evidence without code changes
- Supports both "best answer" and "acceptable answers" for flexibility
- Integrates cleanly with existing clue-tracker system

**Implementation Pattern**:
```json
{
  "confrontations": {
    "emma": {
      "statements": [
        {
          "id": "alibi-claim",
          "text": "I was reading in the corner the whole time!",
          "requiredEvidence": "bookshelf-hiding-spot",
          "acceptableEvidence": ["bookshelf-hiding-spot"],
          "correctResponse": "But this hiding spot shows you could have slipped away...",
          "incorrectResponse": "That evidence doesn't contradict Emma's statement."
        }
      ]
    }
  }
}
```

**Best Practices**:
- Show only discovered clues in evidence selection notebook
- Highlight statements that require contradiction vs. informational statements
- Provide clear feedback on correct vs. incorrect presentations
- Track mistake count per confrontation (max 3 before failure)

**Alternatives Considered**:
- Free-form evidence submission: Rejected as too difficult to validate programmatically
- Multiple choice answers: Rejected as less engaging than notebook-based evidence selection
- Time-limited evidence selection: Rejected to keep game relaxed and cozy

### 3. Ending Sequence Design

**Decision**: Two-phase ending sequences (dialog + door unlock + summary screen)

**Rationale**:
- Victory: Confession (10-15s) → Valentin reaction (5-10s) → Door unlock animation (3-5s) → Summary screen (10-15s) = 30-45s total
- Bad Ending: Despair speech (10-15s) → Door unlock (3-5s) → Failure screen (5-10s) = 20-30s total
- Provides satisfying narrative closure without being too long
- Door unlock serves as symbolic "release" moment in both endings

**Implementation Pattern**:
```typescript
// EndingSequence component manages phased transitions
class EndingSequence extends Phaser.GameObjects.Container {
  async playVictory(culpritId: string) {
    await this.playConfession(culpritId);      // 10-15s
    await this.playValentinReaction(culpritId); // 5-10s
    await this.playDoorUnlock();               // 3-5s
    this.showVictoryScreen(culpritId);         // 10-15s (dismissible)
  }
  
  async playBadEnding() {
    await this.playDespairSpeech();            // 10-15s
    await this.playDoorUnlock();               // 3-5s
    this.showFailureScreen();                  // 5-10s (dismissible)
  }
}
```

**Best Practices**:
- Use tweens for smooth transitions between phases
- Add skip option for replaying players (`Hold Space to Skip`)
- Play appropriate background music for each ending
- Auto-return to title screen after 30s on summary/failure screen (with manual option to continue)

**Alternatives Considered**:
- Single dialog ending: Rejected as anticlimactic for mystery resolution
- Longer cinematic sequences (60s+): Rejected to maintain game's cozy pace
- Separate ending scenes: Rejected to maintain continuity with library setting

### 4. Accusation State Persistence

**Decision**: Extend existing SaveManager with accusation-specific state in LocalStorage

**Rationale**:
- Game already uses LocalStorage for save state (save-manager.ts)
- Failed accusation count must persist across sessions per spec (FR-035)
- Confrontation state should NOT persist (if player closes mid-confrontation, they restart that accusation attempt)
- Simple key-value storage sufficient for accusation data

**Implementation Pattern**:
```typescript
interface AccusationSaveState {
  failedAccusations: number;          // 0-2
  accusedSuspects: string[];          // IDs of suspects already accused
  lastAccusationTimestamp?: number;   // For debugging/analytics
}

// In SaveManager
saveAccusationState(state: AccusationSaveState): void {
  try {
    const save = this.loadSaveState();
    save.accusation = state;
    localStorage.setItem('erdbeerstrudel_save', JSON.stringify(save));
  } catch (e) {
    console.error('Failed to save accusation state', e);
    // Graceful degradation: continue without persistence
  }
}
```

**Best Practices**:
- Wrap all LocalStorage operations in try-catch (browser may disable storage)
- Provide fallback in-memory state if LocalStorage unavailable
- Clear accusation state when player completes ending (victory or bad ending)
- Version the save state format for future migrations

**Alternatives Considered**:
- Session storage: Rejected as it doesn't persist across browser sessions
- IndexedDB: Rejected as overkill for simple key-value state
- Server-side storage: Rejected as game is fully offline-capable

### 5. Failed Accusation Feedback System

**Decision**: Layered feedback approach (immediate penalty dialog + persistent NPC reactions + Valentin frustration)

**Rationale**:
- Immediate: Penalty dialog on each incorrect evidence presentation emphasizes consequences
- Short-term: Failed accusation increments counter and shows rejection dialog
- Long-term: NPCs and Valentin have special dialog after failed accusations
- Creates increasing tension and stakes as player approaches bad ending threshold

**Implementation Pattern**:
```typescript
// Three feedback layers:

// 1. Immediate (wrong evidence during confrontation)
showPenaltyDialog(mistakeCount: number) {
  const messages = [
    "That evidence doesn't support your claim. Think carefully! (Mistakes: 1/3)",
    "Another mistake... You're running out of chances. (Mistakes: 2/3)",
    "One more wrong move and this accusation will fail! (Mistakes: 3/3)"
  ];
  this.displayDialog(messages[mistakeCount - 1], true); // must dismiss
}

// 2. Post-accusation (failed confrontation)
onAccusationFailed() {
  this.failedAccusationCount++;
  if (this.failedAccusationCount === 1) {
    this.showValentinFrustration("first-failure");
  } else if (this.failedAccusationCount === 2) {
    this.triggerBadEnding();
  }
}

// 3. Persistent (NPC dialog updates)
getNPCDialog(npcId: string): DialogLine[] {
  const base = this.loadNPCDialog(npcId);
  if (this.failedAccusationCount > 0) {
    return base.failureVariant; // "You already tried accusing someone..."
  }
  return base.normal;
}
```

**Best Practices**:
- Make penalty dialogs require explicit dismissal (forces acknowledgment)
- Use color coding (red tint) for penalty feedback
- Update Valentin's idle dialog immediately after first failed accusation
- Provide subtle audio cues for mistakes vs. correct presentations

**Alternatives Considered**:
- Silent failure: Rejected as players need clear feedback on mistakes
- Permanent consequences (can't retry clues): Rejected as too punishing
- No distinction between mistake types: Rejected as less educational for players

### 6. Evidence Requirement Configuration

**Decision**: Configurable culprit system with minimum clue threshold and required evidence sequence

**Rationale**:
- Spec requires culprit to be configurable via JSON (FR-034)
- Minimum 4 clues discovered before successful accusation (FR-030)
- Each culprit has unique confrontation sequence with specific evidence requirements
- Allows game designers to change mystery solution without touching code

**Implementation Pattern**:
```json
{
  "config": {
    "guiltyParty": "emma",
    "minimumCluesRequired": 4,
    "allowPartialEvidence": false
  },
  "culprits": {
    "emma": {
      "motive": "She thought Valentin's recipe needed improvement",
      "confession": "I couldn't help myself! I knew I could make it better...",
      "evidenceSequence": [
        {
          "statement": "I was reading in the corner the whole time!",
          "required": "bookshelf-hiding-spot",
          "acceptable": ["bookshelf-hiding-spot"]
        },
        {
          "statement": "I never touched the strudel!",
          "required": "desk-papers",
          "acceptable": ["desk-papers", "strudel-crumbs"]
        }
      ]
    },
    "klaus": {
      // ... similar structure for Klaus
    }
  }
}
```

**Best Practices**:
- Validate accusation.json at game startup
- Provide clear error messages if configuration is invalid
- Support "acceptable" evidence list for statements with multiple valid answers
- Include motive and confession in culprit data for victory sequence

**Alternatives Considered**:
- Hardcoded culprit: Rejected as spec requires configurability
- Multiple simultaneous culprits: Rejected as out of scope for MVP
- Procedurally generated evidence: Rejected as too complex for mystery narrative

## Integration Points

### With Existing Systems

1. **DialogManager**: Accusation initiation dialog with Valentin uses existing dialog system
2. **NotebookManager**: Evidence selection reuses notebook UI overlay
3. **ClueTracker**: Validates minimum clues discovered before allowing successful accusation
4. **GameProgressionManager**: Coordinates phase transitions and ending triggers
5. **SaveManager**: Extended with accusation state persistence

### New Components Required

1. **AccusationManager** (system): Core accusation logic, state tracking, confrontation flow
2. **AccusationUI** (component): Confrontation interface with portraits and statement boxes
3. **EndingSequence** (component): Victory and bad ending cutscene management
4. **EvidenceValidator** (utility): Validates presented evidence against confrontation requirements

### Data Files

1. **src/data/accusation.json**: Confrontation sequences, evidence requirements, endings
2. **src/data/dialogs/valentin.json**: Extended with accusation initiation options
3. **src/types/accusation.ts**: TypeScript interfaces for accusation system

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|------------|---------|------------|
| LocalStorage unavailable in browser | Low | Medium | In-memory fallback, graceful degradation |
| Confrontation UI performance issues | Low | Medium | Use object pooling for UI elements, test on low-end devices |
| Evidence validation edge cases | Medium | High | Comprehensive test coverage, support "acceptable" evidence list |
| Ending sequences feel too long/short | Medium | Medium | Implement skip option, gather playtester feedback |
| Players don't understand penalty system | Low | Medium | Clear visual feedback, tutorial hints |

## Open Questions (Resolved in Spec)

All clarifying questions were resolved during spec creation:
- ✅ Culprit identity: Configurable via JSON (balanced approach)
- ✅ Mistake counter communication: Penalty dialog that must be dismissed
- ✅ Failed accusation persistence: Saved in LocalStorage across sessions
- ✅ Accusation initiation: Walk up to Valentin, inline UI opens
- ✅ Ending sequence length: Victory 30-45s, Bad ending 20-30s

## Conclusion

The accusation system builds on established Phaser 3 patterns and existing game systems (dialog, notebook, clue tracking) while introducing new confrontation mechanics. The Phoenix Wright-style evidence presentation provides an engaging climax, and the configurable culprit system via JSON maintains data-driven design principles. Failed accusation persistence and layered feedback create meaningful stakes without being punishing. Implementation should proceed to Phase 1 (data modeling and contracts).
