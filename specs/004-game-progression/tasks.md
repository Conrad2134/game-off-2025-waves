# Tasks: Game Progression System

**Input**: Design documents from `/specs/004-game-progression/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: This feature uses manual playtesting - no automated test tasks included.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and data file creation

- [X] T001 Create src/data/progression.json with phase definitions and incident trigger config
- [X] T002 Create src/data/clues.json with 5 clue definitions (2 initially unlocked, 3 require NPC unlock)
- [X] T003 [P] Create src/data/dialogs/ directory for character dialog files
- [X] T004 [P] Create src/data/dialogs/valentin.json with introduction and 4 post-incident tiers
- [X] T005 [P] Create src/data/dialogs/emma.json with introduction and 4 post-incident tiers
- [X] T006 [P] Create src/data/dialogs/klaus.json with introduction and 4 post-incident tiers
- [X] T007 [P] Create src/data/dialogs/luca.json with introduction and 4 post-incident tiers
- [X] T008 [P] Create src/data/dialogs/marianne.json with introduction and 4 post-incident tiers
- [X] T009 [P] Create src/data/dialogs/sebastian.json with introduction and 4 post-incident tiers

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core type definitions and validation utilities that ALL user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T010 [P] Create src/types/progression.ts with GamePhase, InvestigationProgress, ProgressionSaveData, ProgressionConfig, PhaseConfig interfaces
- [X] T011 [P] Create src/types/clue.ts with ClueState, ClueData, CluesConfig, ClueDefinition interfaces
- [X] T012 [P] Extend src/types/dialog.ts with DialogTier and CharacterDialogData interfaces
- [X] T013 Create src/utils/validation.ts with JSON data validation helpers for progression and clue configs

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Party Introduction Phase (Priority: P1) 🎯 MVP

**Goal**: Implement the opening party scene where Valentin welcomes guests and the player can introduce themselves to all NPCs. Dialog content is recorded in the notebook.

**Independent Test**: Start new game, watch Valentin's opening, talk to all 5 NPCs, verify notebook entries are created for each introduction.

### Implementation for User Story 1

- [X] T014 [US1] Create src/systems/game-progression-manager.ts implementing IGameProgressionManager interface from contracts/progression-manager.ts
- [X] T015 [US1] Implement GameProgressionManager.initialize() method with Registry registration and event listener setup
- [X] T016 [US1] Implement GameProgressionManager.markNPCIntroduced() method to track which NPCs player has talked to
- [X] T017 [US1] Implement GameProgressionManager.areAllNPCsIntroduced() method checking if all 5 required NPCs introduced
- [X] T018 [US1] Implement GameProgressionManager.getCurrentPhase() method returning current game phase
- [X] T019 [US1] Implement GameProgressionManager.save() method persisting state to LocalStorage
- [X] T020 [US1] Implement GameProgressionManager.load() method restoring state from LocalStorage with validation
- [X] T021 [US1] Extend src/systems/dialog-manager.ts to load character dialog data files on initialization
- [X] T022 [US1] Add DialogManager.setProgressionManager() method to receive progression manager reference
- [X] T023 [US1] Add DialogManager.selectDialog() method choosing dialog based on phase (pre-incident shows introduction)
- [X] T024 [US1] Modify DialogManager.open() to use phase-based dialog selection for NPCs
- [X] T025 [US1] Modify DialogManager.close() to emit 'dialog-closed' event with NPC ID
- [X] T026 [US1] Update src/scenes/library-scene.ts preload() to load progression.json, clues.json, and all dialog JSON files
- [X] T027 [US1] Add LibraryScene.initializeProgressionSystems() method creating GameProgressionManager instance
- [X] T028 [US1] Add LibraryScene.linkSystems() method connecting DialogManager with GameProgressionManager
- [X] T029 [US1] Add LibraryScene.setupProgressionEvents() method listening for 'npc-introduced' events
- [X] T030 [US1] Update LibraryScene.create() to call progression initialization before dialog system setup
- [X] T031 [US1] Add event handler in LibraryScene listening for 'dialog-closed' to trigger markNPCIntroduced()
- [X] T032 [US1] Implement NotebookManager integration recording character introductions when recordInNotebook flag is true

**Checkpoint**: At this point, players can experience the full introduction phase with Valentin's opening and talk to all NPCs. All introductions recorded in notebook.

---

## Phase 4: User Story 2 - Incident Trigger (Priority: P2)

**Goal**: Implement Valentin's dramatic return after all introductions are complete. He announces his erdbeerstrudel has been eaten, locks the door, and the game transitions to the investigation phase.

**Independent Test**: Complete all 5 NPC introductions, verify 2-second delay occurs, watch Valentin's cutscene, verify phase changes to 'post-incident'.

### Implementation for User Story 2

- [X] T033 [US2] Implement GameProgressionManager.triggerIncident() method to transition phase and emit 'incident-triggered' event
- [X] T034 [US2] Add incident detection in GameProgressionManager.markNPCIntroduced() that triggers 2-second delay when all NPCs introduced
- [X] T035 [US2] Add LibraryScene.playIncidentCutscene() method orchestrating Valentin's entrance and speech
- [X] T036 [US2] Add event listener in LibraryScene for 'incident-triggered' calling playIncidentCutscene()
- [X] T037 [US2] Implement player movement lock in PlayerCharacter.lockMovement() during cutscene
- [X] T038 [US2] Implement player movement unlock in PlayerCharacter.unlockMovement() after cutscene
- [ ] T039 [US2] Implement LibraryScene.lockDoor() method to visually lock the door at specified position
- [X] T040 [US2] Add cutscene timing logic using Phaser Time.delayedCall for sequencing speech, door lock, and movement restoration
- [X] T041 [US2] Update NotebookManager to record incident event when 'incident-triggered' fires
- [X] T042 [US2] Add Valentin NPC repositioning logic to move to entry position during cutscene
- [ ] T043 [US2] Add Valentin NPC pause/resume movement methods for cutscene control

**Checkpoint**: At this point, User Stories 1 AND 2 should both work - full introduction phase followed by dramatic incident transition.

---

## Phase 5: User Story 3 - Clue Discovery Phase (Priority: P3)

**Goal**: Implement the environmental clue system where players can search for and discover evidence in the library. Clues have three states (locked, unlocked, discovered) with appropriate visual feedback.

**Independent Test**: Trigger incident, verify 2 clues are immediately visible with bright highlights, examine them to discover, verify notebook entries created.

### Implementation for User Story 3

- [X] T044 [P] [US3] Create src/systems/clue-tracker.ts implementing IClueTracker interface from contracts/clue-tracker.ts
- [ ] T045 [P] [US3] Create src/components/clue-highlight.ts component for visual clue state representation
- [X] T046 [US3] Implement ClueTracker.initialize() method loading clues.json and registering in scene Registry
- [X] T047 [US3] Implement ClueTracker.loadClues() method parsing clues.json into ClueData map
- [X] T048 [US3] Implement ClueTracker.spawnClueSprites() method creating visual representations for all clues
- [X] T049 [US3] Implement ClueTracker.updateClueVisual() method setting tint and alpha based on ClueState
- [X] T050 [US3] Implement ClueTracker.unlockClue() method transitioning clue from 'locked' to 'unlocked' state
- [X] T051 [US3] Implement ClueTracker.discoverClue() method transitioning clue from 'unlocked' to 'discovered' state
- [X] T052 [US3] Implement ClueTracker.getClueById() method for looking up clues
- [X] T053 [US3] Implement ClueTracker.getAllClues() method returning all clue data
- [X] T054 [US3] Implement ClueTracker.getCluesByState() method filtering clues by state
- [X] T055 [US3] Implement ClueTracker.update() method managing pulse animations for locked/unlocked clues
- [X] T056 [US3] Add event listener in ClueTracker for 'clue-unlock-requested' calling unlockClue()
- [X] T057 [US3] Update LibraryScene.initializeProgressionSystems() to create ClueTracker instance
- [X] T058 [US3] Add ClueTracker event listener for 'clue-discovered' to create notebook entries
- [X] T059 [US3] Update LibraryScene.setupProgressionEvents() to unlock initially-available clues when phase becomes 'post-incident'
- [ ] T060 [US3] Extend src/systems/interaction-detector.ts with setClueTracker() method
- [ ] T061 [US3] Add InteractionDetector.canInteractWithClue() method checking if clue state is 'unlocked'
- [ ] T062 [US3] Update InteractionDetector.canInteract() to filter out locked clues
- [ ] T063 [US3] Add InteractionDetector handling for clue examination triggering discoverClue()
- [X] T064 [US3] Update LibraryScene.update() to call clueTracker.update(delta) for animations
- [ ] T065 [US3] Add LibraryScene.linkSystems() connection between InteractionDetector and ClueTracker

**Checkpoint**: All three systems working - introduction phase, incident trigger, and clue discovery with proper visual states.

---

## Phase 6: User Story 4 - Progressive Dialog System (Priority: P3)

**Goal**: Implement the dynamic dialog tier system where NPC conversations reveal more information based on how many clues the player has discovered. Includes dialog-triggered clue unlocking.

**Independent Test**: Discover different numbers of clues (0, 1-2, 3-4, 5+), talk to NPCs at each stage, verify dialog content changes and appropriate clues unlock.

### Implementation for User Story 4

- [X] T066 [US4] Implement GameProgressionManager.getDialogTier() method calculating tier from clue count (0→tier 0, 1-2→tier 1, 3-4→tier 2, 5+→tier 3)
- [X] T067 [US4] Implement GameProgressionManager.getDiscoveredClueCount() method returning count from ClueTracker
- [X] T068 [US4] Implement GameProgressionManager.recordConversation() method tracking conversation history per NPC per tier
- [X] T069 [US4] Implement GameProgressionManager.getConversationCount() method returning count for specific NPC and tier
- [ ] T070 [US4] Add DialogManager.setClueTracker() method to receive clue tracker reference
- [X] T071 [US4] Update DialogManager.selectDialog() to handle post-incident tier-based selection
- [X] T072 [US4] Add DialogManager.selectDialogLines() method choosing between initial lines and follow-up lines based on conversation count
- [X] T073 [US4] Implement DialogManager.handlePostDialogActions() method processing unlocksClues array from dialog tier
- [X] T074 [US4] Update DialogManager.close() to call handlePostDialogActions() before closing
- [X] T075 [US4] Update DialogManager.open() to call recordConversation() with current tier
- [X] T076 [US4] Add scene.events.emit('clue-unlock-requested', clueId) in handlePostDialogActions()
- [ ] T077 [US4] Update LibraryScene.linkSystems() to connect DialogManager with ClueTracker
- [X] T078 [US4] Add GameProgressionManager event listener for 'clue-discovered' updating clue count
- [X] T079 [US4] Implement follow-up dialog round-robin selection in DialogManager using conversation history
- [X] T080 [US4] Add validation in DialogManager.selectDialog() ensuring tier data exists with fallback to tier 0

**Checkpoint**: All user stories complete - full game progression from introduction through investigation with dynamic dialog responding to progress.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories and final integration

- [ ] T081 [P] Add debug mode toggle (D key) displaying current phase, clue count, and dialog tier in LibraryScene
- [ ] T082 [P] Implement ProgressionSaveData version migration logic in GameProgressionManager.load()
- [ ] T083 [P] Add error handling and console warnings for missing/malformed JSON data in validation.ts
- [ ] T084 Add save debouncing in GameProgressionManager using Phaser.Time.TimerEvent (2000ms delay)
- [ ] T085 [P] Add graceful fallback in DialogManager if progression systems not initialized
- [ ] T086 [P] Add console logging for major progression events (phase change, incident trigger, clue discovery)
- [ ] T087 Verify all notebook integration points correctly create entries with proper categories
- [ ] T088 [P] Add performance measurement logging for progression system update() methods
- [ ] T089 Test complete playthrough from fresh start to 5+ clues discovered verifying all features
- [ ] T090 Test save/load by refreshing browser at various progression stages
- [ ] T091 Test all edge cases from spec.md (click spam, multiple NPCs, wrong order discovery, etc.)
- [ ] T092 Validate all JSON data files against schemas in data-model.md
- [ ] T093 Run through quickstart.md validation scenarios
- [ ] T094 [P] Add JSDoc comments to all public methods in GameProgressionManager and ClueTracker
- [ ] T095 Update README.md with game progression system overview and debug instructions

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-6)**: All depend on Foundational phase completion
  - User Story 1 (Introduction): Can start after Foundational
  - User Story 2 (Incident): Depends on User Story 1 (needs markNPCIntroduced tracking)
  - User Story 3 (Clues): Can start after Foundational (independent of US1/US2 for core implementation)
  - User Story 4 (Progressive Dialog): Depends on User Story 3 (needs clue count tracking)
- **Polish (Phase 7)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Foundation only - implements core progression manager
- **User Story 2 (P2)**: Depends on US1 - uses markNPCIntroduced() and phase tracking
- **User Story 3 (P3)**: Foundation only - clue system is independent initially
- **User Story 4 (P3)**: Depends on US1 (needs dialog tier calculation) and US3 (needs clue count tracking)

### Within Each User Story

- Setup: All data file creation tasks T004-T009 can run in parallel [P]
- Foundational: All type definition tasks T010-T012 can run in parallel [P]
- User Story 3: ClueTracker and ClueHighlight creation (T044-T045) can run in parallel [P]
- Polish: Most tasks T081-T083, T085-T086, T088, T094 can run in parallel [P]

### Parallel Opportunities

- All dialog JSON files (T004-T009) can be authored simultaneously
- All type definition files (T010-T012) can be created simultaneously
- Once User Story 1 is complete, User Story 3 (clue system core) can start in parallel with User Story 2
- Within User Story 3, ClueTracker and ClueHighlight components can be built in parallel
- Most polish tasks are independent and can run in parallel

---

## Parallel Example: Setup Phase

```bash
# Launch all dialog file creation together:
Task T004: "Create src/data/dialogs/valentin.json"
Task T005: "Create src/data/dialogs/emma.json"
Task T006: "Create src/data/dialogs/klaus.json"
Task T007: "Create src/data/dialogs/luca.json"
Task T008: "Create src/data/dialogs/marianne.json"
Task T009: "Create src/data/dialogs/sebastian.json"
```

## Parallel Example: Foundational Phase

```bash
# Launch all type definition files together:
Task T010: "Create src/types/progression.ts"
Task T011: "Create src/types/clue.ts"
Task T012: "Extend src/types/dialog.ts"
```

---

## Implementation Strategy

### MVP First (User Stories 1 & 2)

1. Complete Phase 1: Setup (data files)
2. Complete Phase 2: Foundational (type definitions)
3. Complete Phase 3: User Story 1 (introduction phase)
4. Complete Phase 4: User Story 2 (incident trigger)
5. **STOP and VALIDATE**: Test introduction → incident flow
6. Demo the narrative transition (playable mystery setup)

### Full Feature (All User Stories)

1. Complete Setup + Foundational → Foundation ready
2. Complete User Story 1 → Test introduction phase
3. Complete User Story 2 → Test incident trigger
4. Complete User Story 3 → Test clue discovery
5. Complete User Story 4 → Test progressive dialog
6. Complete Polish phase → Final integration testing

### Parallel Team Strategy

With multiple developers (after Foundational phase):

1. **Developer A**: User Story 1 (GameProgressionManager + dialog selection)
2. **Developer B**: User Story 3 (ClueTracker + visual system) - can start in parallel with US1
3. **Developer C**: User Story 2 (incident cutscene) - starts after US1 core is done
4. **Integration**: User Story 4 brings everything together once US1 and US3 are complete

---

## Notes

- [P] tasks = different files, no dependencies on other tasks
- [Story] label maps task to specific user story for traceability
- Each user story should be independently testable (except US2 which naturally follows US1)
- All data files in Phase 1 should follow schemas from data-model.md exactly
- All type definitions in Phase 2 should match contracts/ interfaces
- Verify progression state with debug mode (D key) after implementation
- Test save/load persistence after each major feature
- Each phase checkpoint should result in a working, demoable slice of functionality
