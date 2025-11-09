# Quickstart Guide: Game Progression System

**Feature**: 004-game-progression  
**For**: Developers implementing or extending the progression system  
**Time**: 10 minutes to understand, 2-4 hours to implement

## What You'll Build

A complete game progression system that:
1. Tracks player's journey from party introduction to active investigation
2. Adapts NPC dialog based on clues discovered
3. Unlocks new clues through conversations
4. Persists progress across browser sessions
5. Orchestrates the dramatic incident cutscene

## Prerequisites

- ✅ LibraryScene implemented (from 002-library-scene)
- ✅ Dialog system working (from 003-dialog-system)
- ✅ Notebook system functional
- ✅ NPCs spawned and wandering
- ✅ Player character controllable

## Architecture Overview

```
GameProgressionManager (singleton)
  ├── Manages game phase (pre/post-incident)
  ├── Tracks NPC introductions
  ├── Calculates dialog tiers
  └── Persists to LocalStorage

ClueTracker (singleton)
  ├── Manages clue states (locked/unlocked/discovered)
  ├── Spawns clue visual representations
  ├── Handles unlock triggers from NPCs
  └── Emits discovery events

DialogManager (extended)
  ├── Selects dialog based on phase + tier
  ├── Triggers clue unlocks post-conversation
  └── Records in notebook

InteractionDetector (extended)
  ├── Filters interactions by clue state
  └── Shows indicators only for valid targets
```

## Step-by-Step Implementation

### Phase 0: Create Data Files (30 minutes)

**1. Create progression.json**

```bash
# Create file at src/data/progression.json
```

Copy the schema from `data-model.md` → "Data File Schemas" → progression.json

**Key points**:
- Set `requiresNPCsIntroduced` to exact 5 NPCs: `["emma", "luca", "marianne", "sebastian", "valentin"]`
- Set `delayMs` to 2000 for cinematic timing
- Position `entryPosition` at top-center of library (e.g., x: 600, y: 100)
- Write 3-5 impactful `speechLines` for Valentin

**2. Create clues.json**

```bash
# Create file at src/data/clues.json
```

Copy the schema from `data-model.md` → "Data File Schemas" → clues.json

**Key points**:
- Define exactly 5 clues (per FR-012)
- Set 2 clues with `initiallyUnlocked: true` (immediately investigable)
- Set 3+ clues with `unlockedBy` references to NPCs
- Position clues at valid world coordinates (within 0-1200 x, 0-800 y)
- Use existing sprite keys or placeholders

**3. Create dialog files**

```bash
# Create directory and files
mkdir -p src/data/dialogs
touch src/data/dialogs/{valentin,emma,klaus,luca,marianne,sebastian}.json
```

For each NPC:
- Write 1 introduction (3-5 lines)
- Write 4 post-incident tiers (tiers 0-3)
- Each tier has 2-4 initial lines + 2-3 follow-up lines
- Mark which conversations unlock clues (via `unlocksClues` array)

**Example structure** (see `data-model.md` for full example):
```json
{
  "characterId": "emma",
  "characterName": "Emma",
  "introduction": { "lines": [...], "recordInNotebook": true, "notebookNote": "..." },
  "postIncident": [
    { "tier": 0, "requiredClues": 0, "lines": [...], "followUpLines": [...] },
    { "tier": 1, "requiredClues": 1, "lines": [...], "followUpLines": [...], "unlocksClues": ["desk-papers"] },
    { "tier": 2, "requiredClues": 3, "lines": [...], "followUpLines": [...] },
    { "tier": 3, "requiredClues": 5, "lines": [...], "followUpLines": [...] }
  ]
}
```

---

### Phase 1: Implement Type Definitions (15 minutes)

**1. Create src/types/progression.ts**

Copy interfaces from `contracts/progression-types.ts`:
- GamePhase
- InvestigationProgress
- ProgressionSaveData
- ProgressionConfig
- PhaseConfig
- DialogTier
- CharacterDialogData

**2. Create src/types/clue.ts**

Copy interfaces from `contracts/clue-types.ts`:
- ClueState
- ClueData
- CluesConfig
- ClueDefinition
- ClueHighlightState

**3. Extend src/types/dialog.ts**

Add:
```typescript
export interface PhaseBasedDialogData extends DialogData {
  introduction?: {
    lines: string[];
    recordInNotebook: boolean;
    notebookNote?: string;
  };
  postIncident?: DialogTier[];
}
```

---

### Phase 2: Implement GameProgressionManager (45 minutes)

**1. Create src/systems/game-progression-manager.ts**

Implement `IGameProgressionManager` from `contracts/progression-manager.ts`

**Key methods**:
```typescript
export class GameProgressionManager extends Phaser.Events.EventEmitter {
  private scene: Phaser.Scene;
  private currentPhase: GamePhase = 'pre-incident';
  private introducedNPCs: Set<string> = new Set();
  private conversationHistory: Map<string, Map<number, number>> = new Map();
  private config: ProgressionConfig;
  private saveDebounceTimer?: Phaser.Time.TimerEvent;
  
  constructor(config: GameProgressionManagerConfig) {
    super();
    this.scene = config.scene;
    this.load(); // Load saved state if exists
    this.loadConfig(); // Load progression.json
  }
  
  initialize() {
    // Register in scene registry
    this.scene.registry.set(this.config.registryKey, this);
    
    // Listen for relevant events
    this.scene.events.on('dialog-closed', this.handleDialogClosed, this);
  }
  
  markNPCIntroduced(npcId: string) {
    if (this.introducedNPCs.has(npcId)) return;
    
    this.introducedNPCs.add(npcId);
    this.emit('npc-introduced', { npcId });
    this.debouncedSave();
    
    // Check if all NPCs introduced
    if (this.areAllNPCsIntroduced()) {
      this.scene.time.delayedCall(this.config.incidentTrigger.delayMs, () => {
        this.triggerIncident();
      });
    }
  }
  
  triggerIncident() {
    const previousPhase = this.currentPhase;
    this.currentPhase = 'post-incident';
    this.emit('phase-changed', { phase: this.currentPhase, previousPhase });
    this.emit('incident-triggered', { timestamp: Date.now() });
    this.save();
  }
  
  getDialogTier(): number {
    const clueCount = this.getDiscoveredClueCount();
    if (clueCount >= 5) return 3;
    if (clueCount >= 3) return 2;
    if (clueCount >= 1) return 1;
    return 0;
  }
  
  // ... implement remaining methods from contract
}
```

**2. Implement save/load**

```typescript
save() {
  const data: ProgressionSaveData = {
    version: '1.0.0',
    currentPhase: this.currentPhase,
    introducedNPCs: Array.from(this.introducedNPCs),
    discoveredClues: this.getDiscoveredClueIds(),
    unlockedClues: this.getUnlockedClueIds(),
    conversationHistory: this.serializeConversationHistory(),
    timestamp: Date.now(),
  };
  
  try {
    localStorage.setItem(this.storageKey, JSON.stringify(data));
    this.emit('save-complete', { success: true });
  } catch (error) {
    console.error('Failed to save progression:', error);
    this.emit('save-complete', { success: false, error: String(error) });
  }
}

load(): ProgressionSaveData | null {
  try {
    const json = localStorage.getItem(this.storageKey);
    if (!json) return null;
    
    const data = JSON.parse(json) as ProgressionSaveData;
    
    // Validate and migrate if needed
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

---

### Phase 3: Implement ClueTracker (60 minutes)

**1. Create src/systems/clue-tracker.ts**

Implement `IClueTracker` from `contracts/clue-tracker.ts`

**Key methods**:
```typescript
export class ClueTracker extends Phaser.Events.EventEmitter {
  private scene: Phaser.Scene;
  private clues: Map<string, ClueData> = new Map();
  private clueSprites: Phaser.GameObjects.Group;
  
  initialize() {
    this.loadClues(); // Load clues.json
    this.spawnClueSprites();
    this.scene.registry.set(this.registryKey, this);
    
    // Listen for unlock events from dialog manager
    this.scene.events.on('clue-unlock-requested', this.unlockClue, this);
  }
  
  private loadClues() {
    const config: CluesConfig = this.scene.cache.json.get('clues-data');
    
    config.clues.forEach(def => {
      const clue: ClueData = {
        ...def,
        sprite: undefined, // Will be set in spawnClueSprites
      };
      this.clues.set(def.id, clue);
    });
  }
  
  private spawnClueSprites() {
    this.clueSprites = this.scene.add.group();
    
    this.clues.forEach(clue => {
      const sprite = this.scene.add.sprite(
        clue.position.x,
        clue.position.y,
        clue.spriteKey
      );
      
      sprite.setDisplaySize(clue.displaySize.width, clue.displaySize.height);
      sprite.setDepth(3); // Above floor, below NPCs
      
      // Set initial visual state
      this.updateClueVisual(clue, sprite);
      
      clue.sprite = sprite;
      this.clueSprites.add(sprite);
    });
  }
  
  unlockClue(clueId: string) {
    const clue = this.clues.get(clueId);
    if (!clue) throw new Error(`Clue not found: ${clueId}`);
    if (clue.state !== 'locked') return; // Already unlocked
    
    clue.state = 'unlocked';
    this.updateClueVisual(clue, clue.sprite!);
    this.emit('clue-unlocked', { clueId, clue });
  }
  
  discoverClue(clueId: string) {
    const clue = this.clues.get(clueId);
    if (!clue) throw new Error(`Clue not found: ${clueId}`);
    if (clue.state === 'locked') throw new Error(`Cannot discover locked clue: ${clueId}`);
    if (clue.state === 'discovered') return; // Already discovered
    
    clue.state = 'discovered';
    this.updateClueVisual(clue, clue.sprite!);
    this.emit('clue-discovered', { clueId, clue });
  }
  
  private updateClueVisual(clue: ClueData, sprite: Phaser.GameObjects.Sprite) {
    switch (clue.state) {
      case 'locked':
        sprite.setTint(0xaaaaaa);
        sprite.setAlpha(0.5);
        // Add subtle pulse animation
        break;
      case 'unlocked':
        sprite.setTint(0xffff00);
        sprite.setAlpha(1.0);
        // Add brighter pulse animation
        break;
      case 'discovered':
        sprite.setTint(0xffffff);
        sprite.setAlpha(0.7);
        // Stop animation
        break;
    }
  }
  
  update(delta: number) {
    // Update pulse animations for locked/unlocked clues
    this.clues.forEach(clue => {
      if (clue.state === 'locked' || clue.state === 'unlocked') {
        // Implement pulse animation logic
      }
    });
  }
}
```

---

### Phase 4: Extend Existing Systems (45 minutes)

**1. Extend DialogManager**

In `src/systems/dialog-manager.ts`, add:

```typescript
export class DialogManager {
  // Existing properties...
  private progressionManager?: IGameProgressionManager;
  private clueTracker?: IClueTracker;
  private dialogCache: Map<string, CharacterDialogData> = new Map();
  
  setProgressionManager(manager: IGameProgressionManager) {
    this.progressionManager = manager;
  }
  
  setClueTracker(tracker: IClueTracker) {
    this.clueTracker = tracker;
  }
  
  // Load dialog data for all characters
  loadCharacterDialogs() {
    const characters = ['valentin', 'emma', 'klaus', 'luca', 'marianne', 'sebastian'];
    characters.forEach(id => {
      const data = this.scene.cache.json.get(`dialog-${id}`) as CharacterDialogData;
      this.dialogCache.set(id, data);
    });
  }
  
  // Override open() to use phase-based selection
  open(dialogData, sourceType, sourceId, speakerName, entity) {
    if (!this.progressionManager) {
      // Fallback to old behavior if progression not initialized
      return super.open(...arguments);
    }
    
    const phase = this.progressionManager.getCurrentPhase();
    const tier = this.progressionManager.getDialogTier();
    
    // Select appropriate dialog
    const selectedDialog = this.selectDialog(sourceId, phase, tier);
    
    // Show dialog
    // ...existing logic...
    
    // Track conversation
    this.progressionManager.recordConversation(sourceId, tier);
  }
  
  selectDialog(characterId, phase, tier): DialogData {
    const charData = this.dialogCache.get(characterId);
    if (!charData) return this.fallbackDialog();
    
    if (phase === 'pre-incident') {
      return charData.introduction;
    } else {
      const tierData = charData.postIncident[tier];
      const count = this.progressionManager.getConversationCount(characterId, tier);
      
      // First time at this tier
      if (count === 0) {
        return { lines: tierData.lines, ...tierData };
      } else {
        // Follow-up conversation
        const index = (count - 1) % tierData.followUpLines.length;
        return { lines: [tierData.followUpLines[index]], ...tierData };
      }
    }
  }
  
  close() {
    // Existing close logic...
    
    // Handle post-dialog actions (clue unlocking)
    if (this.progressionManager && this.currentNPCId) {
      this.handlePostDialogActions(this.currentNPCId, this.currentTier);
    }
  }
  
  handlePostDialogActions(characterId, tier) {
    const charData = this.dialogCache.get(characterId);
    if (!charData) return;
    
    const tierData = charData.postIncident[tier];
    if (tierData.unlocksClues && tierData.unlocksClues.length > 0) {
      tierData.unlocksClues.forEach(clueId => {
        this.scene.events.emit('clue-unlock-requested', clueId);
      });
    }
  }
}
```

**2. Extend InteractionDetector**

In `src/systems/interaction-detector.ts`, add:

```typescript
export class InteractionDetector {
  // Existing properties...
  private clueTracker?: IClueTracker;
  
  setClueTracker(tracker: IClueTracker) {
    this.clueTracker = tracker;
  }
  
  // Override canInteract() to filter by clue state
  canInteract(): boolean {
    const entity = this.getClosestInteractable();
    if (!entity) return false;
    
    // Check if it's a clue
    if (this.isClueEntity(entity)) {
      return this.canInteractWithClue(entity.id);
    }
    
    // Regular NPC/object interaction
    return true;
  }
  
  private canInteractWithClue(clueId: string): boolean {
    if (!this.clueTracker) return true; // Fallback
    
    const clue = this.clueTracker.getClueById(clueId);
    if (!clue) return false;
    
    // Only allow interaction with unlocked clues
    return clue.state === 'unlocked';
  }
}
```

---

### Phase 5: Integrate into LibraryScene (30 minutes)

In `src/scenes/library-scene.ts`:

```typescript
export class LibraryScene extends Phaser.Scene {
  // Existing properties...
  private progressionManager!: GameProgressionManager;
  private clueTracker!: ClueTracker;
  
  preload() {
    // Existing preloads...
    
    // Load progression data files
    this.load.json('progression-config', 'src/data/progression.json');
    this.load.json('clues-data', 'src/data/clues.json');
    
    // Load character dialog files
    const characters = ['valentin', 'emma', 'klaus', 'luca', 'marianne', 'sebastian'];
    characters.forEach(id => {
      this.load.json(`dialog-${id}`, `src/data/dialogs/${id}.json`);
    });
  }
  
  create() {
    // Existing setup...
    
    // Initialize progression systems FIRST
    this.initializeProgressionSystems();
    
    // Then initialize dialog/interaction systems
    this.initializeDialogSystem();
    
    // Link systems together
    this.linkSystems();
    
    // Setup event listeners
    this.setupProgressionEvents();
  }
  
  private initializeProgressionSystems() {
    // Create progression manager
    this.progressionManager = new GameProgressionManager({
      scene: this,
      registryKey: 'progressionManager',
      storageKey: 'erdbeerstrudel-progression',
      saveDebounceMs: 2000,
    });
    this.progressionManager.initialize();
    
    // Create clue tracker
    this.clueTracker = new ClueTracker({
      scene: this,
      registryKey: 'clueTracker',
      cluesDataPath: 'src/data/clues.json',
    });
    this.clueTracker.initialize();
    
    console.log('✓ Progression systems initialized');
  }
  
  private linkSystems() {
    // Link dialog manager
    this.dialogManager.setProgressionManager(this.progressionManager);
    this.dialogManager.setClueTracker(this.clueTracker);
    this.dialogManager.loadCharacterDialogs();
    
    // Link interaction detector
    this.interactionDetector.setClueTracker(this.clueTracker);
    
    // Link clue tracker to notebook
    this.clueTracker.on('clue-discovered', (data) => {
      this.notebookManager.addEntry({
        id: this.notebookManager.generateId(),
        category: 'clue',
        sourceId: data.clueId,
        sourceName: data.clue.name,
        text: data.clue.notebookNote,
        timestamp: Date.now(),
      });
    });
  }
  
  private setupProgressionEvents() {
    // Incident trigger
    this.progressionManager.on('incident-triggered', () => {
      this.playIncidentCutscene();
    });
    
    // Phase change
    this.progressionManager.on('phase-changed', (data) => {
      console.log(`Phase changed: ${data.previousPhase} → ${data.phase}`);
      
      if (data.phase === 'post-incident') {
        // Enable clue interactions
        this.clueTracker.getAllClues().forEach(clue => {
          if (clue.initiallyUnlocked) {
            this.clueTracker.unlockClue(clue.id);
          }
        });
      }
    });
  }
  
  private playIncidentCutscene() {
    const config = this.cache.json.get('progression-config') as ProgressionConfig;
    const cutscene = config.incidentCutscene;
    
    // Lock player movement
    this.player.lockMovement();
    
    // Spawn Valentin at entry position
    const valentin = this.npcs.find(npc => npc.id === 'valentin');
    if (valentin) {
      valentin.setPosition(cutscene.entryPosition.x, cutscene.entryPosition.y);
      valentin.pauseMovement();
    }
    
    // Show speech
    this.dialogBox.show({
      speaker: 'Valentin',
      message: cutscene.speechLines.join('\n'),
      type: 'npc',
      characterId: 'valentin',
      objectId: null,
      recordInNotebook: true,
      notebookNote: "Valentin's erdbeerstrudel has been stolen!",
    });
    
    // After cutscene, lock door and resume gameplay
    this.time.delayedCall(cutscene.durationMs, () => {
      this.lockDoor(cutscene.doorPosition);
      this.player.unlockMovement();
      if (valentin) valentin.resumeMovement();
    });
  }
  
  update(time, delta) {
    // Existing updates...
    this.clueTracker.update(delta);
  }
}
```

---

## Testing Checklist

Test each requirement from the spec:

### Pre-Incident Phase
- [ ] Valentin plays opening speech on scene start
- [ ] Player can walk around and talk to 5 NPCs
- [ ] Each NPC shows introduction dialog
- [ ] Introduction dialogs recorded in notebook
- [ ] Interaction indicators appear near NPCs
- [ ] Repeat conversations show varied text

### Incident Trigger
- [ ] After talking to all 5 NPCs, 2-second delay occurs
- [ ] Valentin appears and delivers accusation speech
- [ ] Door lock animation plays
- [ ] Phase changes to 'post-incident'
- [ ] Incident recorded in notebook

### Clue Discovery
- [ ] 2 clues immediately visible with bright highlights
- [ ] 3+ clues show subtle locked highlights
- [ ] Interaction indicators only appear on unlocked clues
- [ ] Examining clue displays description
- [ ] Examined clue recorded in notebook
- [ ] Re-examining shows "already examined" message

### Progressive Dialog
- [ ] NPCs show tier 0 dialog with 0 clues
- [ ] Dialog changes to tier 1 with 1-2 clues
- [ ] Dialog changes to tier 2 with 3-4 clues
- [ ] Dialog changes to tier 3 with 5+ clues
- [ ] Repeat conversations show follow-up lines
- [ ] Specific conversations unlock clues (highlights change)

### State Persistence
- [ ] Refresh browser mid-game → progress restored
- [ ] Discovered clues stay discovered
- [ ] Unlocked clues stay unlocked
- [ ] Phase persists (post-incident stays post-incident)
- [ ] NPC introductions remembered

---

## Debugging Tips

**Enable debug mode**: Press D key in game

**Check progression state**:
```javascript
// In browser console
const pm = window.game.scene.scenes[1].registry.get('progressionManager');
console.log(pm.getProgress());
console.log(pm.getDiscoveredClueCount());
console.log(pm.areAllNPCsIntroduced());
```

**Check clue states**:
```javascript
const ct = window.game.scene.scenes[1].registry.get('clueTracker');
console.log(ct.getAllClues());
console.log(ct.getCluesByState('unlocked'));
```

**Clear save data**:
```javascript
localStorage.removeItem('erdbeerstrudel-progression');
location.reload();
```

---

## Common Issues

**Clues not appearing**: Check sprite keys exist, positions are in bounds

**Incident not triggering**: Verify all 5 NPC IDs match between progression.json and actual NPC entities

**Dialog not changing**: Check tier calculation logic, verify clueCount is updating

**Save not persisting**: Check LocalStorage is enabled, verify JSON serialization

**Clue unlock not working**: Verify `unlocksClues` array in dialog JSON matches clue IDs exactly

---

## Next Steps

After implementing this feature:
1. Write comprehensive dialog content for all NPCs (see `data-model.md` for structure)
2. Create/find sprite assets for clue objects
3. Playtest all dialog tiers and clue unlock sequences
4. Adjust timing values (delays, animation speeds) based on feel
5. Add polish: sound effects, screen shake, particle effects

---

## Further Reading

- **Spec**: `specs/004-game-progression/spec.md` - Full requirements
- **Data Model**: `specs/004-game-progression/data-model.md` - Entity relationships
- **Research**: `specs/004-game-progression/research.md` - Design decisions
- **Contracts**: `specs/004-game-progression/contracts/` - API definitions

---

**Questions?** Check the spec's Edge Cases section or review research.md for design rationale.
