# Tasks: Accusation System

**Input**: Design documents from `/specs/005-accusation-system/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Tests are NOT included in this implementation plan. The feature will be validated through manual playtesting as specified in the research and quickstart documents.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `- [ ] [ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

Single project structure: `src/` at repository root

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create data structures and type definitions needed by all accusation system components

- [X] T001 [P] Create TypeScript type definitions in src/types/accusation.ts (AccusationState, ConfrontationProgress, AccusationConfig, ConfrontationSequence, ConfrontationStatement, VictorySequenceData, BadEndingSequenceData, AccusationUIState, EvidenceResult, AccusationValidation)
- [X] T002 [P] Create accusation data file in src/data/accusation.json with configuration structure (config, confrontations for all 5 suspects, endings)
- [X] T003 Extend Valentin dialog data in src/data/dialogs/valentin.json with post-incident accusation initiation options ("I think I know who did it", "Not yet, I need more evidence")
- [X] T004 [P] Extend SaveState interface in src/types/save.ts to include accusation: AccusationState field
- [X] T005 [P] Create EvidenceValidator utility in src/utils/evidence-validator.ts with validation logic for evidence presentation

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core systems that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T006 Implement SaveManager extension methods in src/systems/save-manager.ts (saveAccusationState, loadAccusationState with LocalStorage persistence and try-catch error handling)
- [X] T007 Create AccusationManager system in src/systems/accusation-manager.ts with singleton pattern, JSON loading, state initialization, and registry registration
- [X] T008 Implement AccusationManager core methods: initialize(), canInitiateAccusation(), getState(), loadState(), resetState(), getAvailableSuspects(), getGuiltyParty()
- [X] T009 Create AccusationUI component base structure in src/components/accusation-ui.ts extending Phaser.GameObjects.Container with initialization, visibility management, and z-index layering

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Initiating the Accusation (Priority: P1) 🎯 MVP

**Goal**: Enable player to approach Valentin, select an accusation option, choose a suspect from a list, and enter confrontation mode

**Independent Test**: Discover at least one clue, approach Valentin, interact to see accusation dialog, select "I think I know who did it", verify suspect list displays inline in library scene, select a suspect, verify confrontation UI opens

### Implementation for User Story 1

- [X] T010 [P] [US1] Implement AccusationManager.startSuspectSelection() method that emits 'accusation:suspect-selection-opened' event
- [X] T011 [P] [US1] Implement AccusationUI.showSuspectSelection() method in src/components/accusation-ui.ts to render all 5 suspects with portraits and names in a grid layout
- [X] T012 [P] [US1] Add suspect selection input handling in AccusationUI (click handlers, hover effects, keyboard navigation)
- [X] T013 [US1] Implement AccusationManager.startAccusation(suspectId) method to initialize ConfrontationProgress state and load ConfrontationSequence from JSON
- [X] T014 [US1] Add NPCCharacter/DialogManager integration in src/entities/npc-character.ts to handle 'initiate-accusation' action from Valentin's dialog options
- [X] T015 [US1] Implement accusation validation in DialogManager when player selects accusation option (check canInitiateAccusation and show warning if insufficient clues)
- [X] T016 [US1] Implement AccusationUI.startConfrontation() method to transition from suspect selection to confrontation display with fade-out/fade-in animations
- [X] T017 [US1] Add cancellation functionality: implement AccusationManager.cancelAccusation() and AccusationUI cancel button/Escape key handling that returns to investigation without penalty

**Checkpoint**: At this point, User Story 1 should be fully functional - player can initiate accusation, select suspects, and cancel without bugs

---

## Phase 4: User Story 2 - Phoenix Wright-Style Confrontation (Priority: P2)

**Goal**: Enable interactive confrontation where accused makes statements and player presents evidence from notebook, with correct/incorrect feedback and 3-mistake limit

**Independent Test**: Trigger an accusation, verify confrontation UI displays with suspect portrait and first statement, select "Present Evidence", verify notebook opens with only discovered clues, present various evidence and verify correct/incorrect responses with mistake tracking

### Implementation for User Story 2

- [X] T018 [P] [US2] Implement AccusationUI.showStatement() method in src/components/accusation-ui.ts to render statement text, speaker indicator, and action buttons ("Present Evidence", "Listen")
- [X] T019 [P] [US2] Create confrontation statement text box component as child container with proper text wrapping and pixel-perfect rendering (integer coordinates)
- [X] T020 [P] [US2] Implement mistake counter UI component in AccusationUI with visual indicators (❌⬜⬜ style display)
- [X] T021 [US2] Implement AccusationManager.getCurrentStatement() method to retrieve current statement from active confrontation state
- [X] T022 [US2] Implement AccusationUI.openEvidenceSelection() method that shows notebook overlay with only discovered clues and emits 'ui:evidence-selected' event on selection
- [X] T023 [US2] Integrate NotebookUI component in src/components/notebook-ui.ts for evidence selection during confrontation (add confrontation mode that filters to discovered clues only)
- [X] T024 [US2] Implement EvidenceValidator.validate() method in src/utils/evidence-validator.ts using statement.requiredEvidence and statement.acceptableEvidence fields
- [X] T025 [US2] Implement AccusationManager.presentEvidence(clueId) method that calls EvidenceValidator, updates ConfrontationProgress, and returns EvidenceResult
- [X] T026 [US2] Implement AccusationUI.showCorrectFeedback() method with positive visual/audio feedback and statement.correctResponse text display
- [X] T027 [US2] Implement AccusationUI.showPenaltyDialog() method that overlays penalty message, shows updated mistake count (1/3, 2/3, 3/3), and requires dismissal before continuing
- [X] T028 [US2] Implement penalty dialog escalation messages in EvidenceValidator.generatePenaltyMessage() based on mistake count (1: "Think carefully!", 2: "Running out of chances", 3: "One more wrong move!")
- [X] T029 [US2] Implement AccusationManager.advanceStatement() method to increment currentStatementIndex and emit 'accusation:statement-advanced' event
- [X] T030 [US2] Implement AccusationUI.advanceToNextStatement() method with fade-out/fade-in transition animations between statements
- [X] T031 [US2] Add confrontation completion detection in AccusationManager (when currentStatementIndex reaches statements.length, emit 'accusation:success')
- [X] T032 [US2] Add confrontation failure detection in AccusationManager (when mistakeCount reaches 3, emit 'accusation:failed')

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently - full confrontation mechanics functional with evidence validation

---

## Phase 5: User Story 3 - Correct Accusation Resolution (Priority: P1)

**Goal**: When player successfully proves correct suspect guilty, trigger victory sequence with confession, Valentin reaction, door unlock, and victory screen

**Independent Test**: Make correct accusation with all required evidence, verify confession dialog plays, Valentin reaction displays, door unlock animation triggers, victory screen shows mystery summary, and "Continue" returns to title screen

### Implementation for User Story 3

- [X] T033 [P] [US3] Create EndingSequence component in src/components/ending-sequence.ts extending Phaser.GameObjects.Container with phase management (VictoryPhase enum: CONFESSION, REACTION, DOOR_UNLOCK, SUMMARY)
- [X] T034 [P] [US3] Implement AccusationManager.onConfrontationSuccess(suspectId) method that checks if suspectId matches guiltyParty and returns VictorySequenceData from JSON
- [X] T035 [US3] Implement EndingSequence.playVictory(data) async method in src/components/ending-sequence.ts with 4-phase sequence flow
- [X] T036 [US3] Implement EndingSequence confession phase: load culprit portrait sprite, display confession text from ConfrontationSequence.confession, wait 10-15 seconds or until dismissed
- [X] T037 [US3] Implement EndingSequence Valentin reaction phase: load Valentin portrait sprite, display valentinReaction text from endings.victory based on culpritId, wait 5-10 seconds
- [X] T038 [US3] Implement EndingSequence door unlock phase: trigger door sprite animation (if door sprite exists in scene), play unlock sound effect, wait 3-5 seconds
- [X] T039 [US3] Implement EndingSequence summary screen in src/components/ending-sequence.ts with victory title, culprit name, motive text, key evidence list, optional bonusAcknowledgment, and "Continue" button
- [X] T040 [US3] Implement EndingSequence.skipSequence() method for skip functionality (hold Space key for 1 second to fast-forward to summary screen)
- [X] T041 [US3] Implement EndingSequence.returnToTitle() method that emits 'ending:return-to-title', calls SaveManager.resetState(), and transitions to StartScene
- [ ] T042 [US3] Wire victory trigger in LibraryScene event listener for 'accusation:victory-triggered' that instantiates and plays EndingSequence

**Checkpoint**: All victory flow should work - successful accusation leads to complete victory sequence and return to title

---

## Phase 6: User Story 4 - Incorrect Accusation Handling (Priority: P2)

**Goal**: Track failed accusations, show Valentin frustration after first failure, trigger bad ending after 2 failures, update NPC dialog to reflect failed attempts

**Independent Test**: Deliberately make wrong accusation or 3 mistakes in confrontation, verify failure dialog, check failed accusation count increases, make second failed accusation, verify bad ending sequence triggers with despair speech and failure screen

### Implementation for User Story 4

- [X] T043 [P] [US4] Implement AccusationManager.onConfrontationFailed(suspectId) method that increments failedAccusations in state, persists via SaveManager, and checks for bad ending trigger (failedAccusations === 2)
- [X] T044 [P] [US4] Update AccusationManager.presentEvidence() to emit 'accusation:failed' event when EvidenceResult.confrontationFailed is true (3 mistakes)
- [X] T045 [P] [US4] Extend Valentin dialog data in src/data/dialogs/valentin.json with 'after-first-failure' variant showing frustration ("You already made one wrong accusation. Please be more careful...")
- [X] T046 [US4] Update DialogManager in src/systems/dialog-manager.ts to check AccusationState.failedAccusations and load appropriate Valentin dialog variant
- [X] T047 [US4] Extend all NPC dialog files (emma.json, klaus.json, luca.json, marianne.json, sebastian.json) in src/data/dialogs/ with post-failure dialog variants commenting on failed accusations
- [X] T048 [US4] Update NPCCharacter dialog loading in src/entities/npc-character.ts to check failedAccusations count and select failureVariant dialog if > 0 - IMPLEMENTED in DialogManager.selectDialog() with tier -1 for post-failure variants
- [X] T049 [US4] Implement AccusationManager.getBadEndingData() method that returns BadEndingSequenceData from accusation.json endings.badEnding
- [X] T050 [US4] Implement EndingSequence.playBadEnding(data) async method in src/components/ending-sequence.ts with 3-phase sequence (DESPAIR, DOOR_UNLOCK, FAILURE_SCREEN)
- [X] T051 [US4] Implement EndingSequence despair speech phase: load Valentin portrait with sad expression, display despairSpeech text from BadEndingSequenceData, wait 10-15 seconds
- [X] T052 [US4] Implement EndingSequence failure screen in src/components/ending-sequence.ts with failure title, failureExplanation text, optional actualCulprit reveal, and "Try Again" button
- [X] T053 [US4] Wire bad ending trigger in LibraryScene event listener for 'accusation:bad-ending-triggered' that instantiates and plays bad EndingSequence - Already wired at line 835
- [X] T054 [US4] Add confrontation rejection feedback when 3 mistakes reached: show Valentin rejection dialog before returning to investigation - Implemented with rejectionDialog in accusation.json, getRejectionDialog() method, and showRejectionDialog() in UI

**Checkpoint**: All failure mechanics should work - failed accusations tracked, NPCs react, bad ending triggers after 2 failures

---

## Phase 7: User Story 5 - Evidence Requirement Validation (Priority: P3)

**Goal**: Validate player has minimum clues discovered before successful accusation, require specific evidence sequence in correct logical order, support optional bonus clues

**Independent Test**: Attempt accusation with < 4 clues (should show warning), attempt with correct culprit but wrong evidence order (Valentin corrects), present all required evidence correctly (should succeed), present optional clues (should get bonus acknowledgment)

### Implementation for User Story 5

- [X] T055 [P] [US5] Implement AccusationManager.canInitiateAccusation() validation logic that checks ClueTracker.getDiscoveredClues().length >= config.minimumCluesRequired
- [X] T056 [P] [US5] Add AccusationValidation return type to canInitiateAccusation() with reason field ("You need at least X clues to make an accusation")
- [X] T057 [US5] Update AccusationUI integration with DialogManager to show warning dialog when validation.canAccuse is false
- [X] T058 [US5] Populate accusation.json confrontation sequences with complete statement arrays for all 5 suspects (Emma, Klaus, Luca, Marianne, Sebastian) with requiredEvidence and acceptableEvidence fields
- [X] T059 [US5] Define logical evidence sequence for guilty party in accusation.json (e.g., timeline → motive → opportunity → physical evidence) with specific clue IDs per statement
- [X] T060 [US5] Implement evidence order validation in EvidenceValidator: if player presents out-of-order evidence, generate "Let's start with the basics" response from Valentin
- [X] T061 [US5] Add optional evidence support in confrontation statements: mark certain evidence as bonus with special correctResponse text
- [X] T062 [US5] Implement bonus clue detection in AccusationManager.onConfrontationSuccess(): check if player presented optional evidence during confrontation
- [X] T063 [US5] Populate VictorySequenceData.summary.bonusAcknowledgment in accusation.json for thorough investigation (player found all clues)
- [X] T064 [US5] Update EndingSequence summary screen to conditionally display bonusAcknowledgment if player discovered all clues in game

**Checkpoint**: All evidence validation should work - minimum clue requirements enforced, logical sequence validated, bonus content displays for thorough players

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories and final integration

- [X] T065 [P] Add accusation system event logging in AccusationManager for all major state transitions (started, evidence-presented, success, failed, bad-ending-triggered)
- [X] T066 [P] Implement pixel-perfect rendering validation for all AccusationUI components (verify integer coordinates for all sprites and containers)
- [X] T067 [P] Add keyboard shortcuts for accusation UI: E key for Present Evidence, Space for Continue/Dismiss, Escape for Cancel
- [ ] T068 Add accusation state persistence validation: test save/load cycle with failed accusation count, verify LocalStorage data integrity
- [X] T069 Populate complete confrontation dialog for all 5 suspects in src/data/accusation.json with unique motive, confession, and statement sequences (minimum 3-5 statements per suspect)
- [ ] T070 [P] Create confession and reaction portrait sprites or identify existing character sprites to reuse for EndingSequence phases
- [ ] T071 [P] Add audio cues for accusation events: correct evidence sound, wrong evidence sound, confrontation failure sound, victory music, bad ending music
- [X] T072 Implement fade transitions for all AccusationUI visibility changes (fadeIn/fadeOut with configurable duration from AccusationUIConfig)
- [X] T073 Add input disabling during AccusationUI animations (setInputEnabled(false) during transitions, re-enable after completion)
- [ ] T074 Test accusation cancellation edge cases: cancel during suspect selection, cancel mid-confrontation after presenting evidence, verify state cleanup
- [ ] T075 Test evidence presentation edge cases: present same wrong evidence multiple times, present undiscovered clue (should not be in notebook), present evidence when statement doesn't require it
- [X] T076 Validate accusation.json configuration at game startup in AccusationManager.initialize() with error messages for invalid guilty party, missing confrontations, or invalid clue references
- [ ] T077 Run full quickstart.md manual playtesting scenarios: successful accusation, failed confrontation, bad ending trigger, cancellation, save/load persistence
- [X] T078 [P] Add debug logging mode in AccusationManager (enabled in development) that logs all state changes, evidence validation results, and event emissions to console
- [X] T079 Review and update PROJECT_README.md or docs/ with accusation system architecture overview and integration points
- [X] T080 Code review and cleanup: ensure all AccusationManager methods follow error handling patterns, all UI components properly destroy resources in destroy() methods

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion (T001-T005) - BLOCKS all user stories
- **User Stories (Phase 3-7)**: All depend on Foundational phase completion (T006-T009)
  - User stories can then proceed in parallel if staffed
  - Or sequentially in priority order: US1 (P1) → US3 (P1) → US2 (P2) → US4 (P2) → US5 (P3)
- **Polish (Phase 8)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1) - Initiation**: Can start after Foundational - No dependencies on other stories
- **User Story 2 (P2) - Confrontation**: Depends on US1 completion (needs suspect selection and confrontation start mechanisms)
- **User Story 3 (P1) - Victory**: Depends on US2 completion (needs successful confrontation flow)
- **User Story 4 (P2) - Failure**: Depends on US2 completion (needs failed confrontation detection)
- **User Story 5 (P3) - Validation**: Depends on US1, US2, US3 completion (adds validation to existing flows)

### Within Each User Story

- Type definitions and data files (T001-T005) before any system implementation
- AccusationManager core methods (T006-T009) before UI components
- UI base structure before specific UI features
- State management before UI rendering
- Core mechanics before polish/edge cases

### Parallel Opportunities

**Phase 1 (Setup)**: All tasks T001-T005 can run in parallel (different files)

**Phase 2 (Foundational)**: Limited parallelization due to dependencies
- T006 (SaveManager) and T007-T008 (AccusationManager) can run in parallel
- T009 (AccusationUI base) can run after T007 completes

**Phase 3 (US1)**: 
- T010 (startSuspectSelection) and T011 (showSuspectSelection UI) can run in parallel
- T012 (input handling) can run in parallel with T010-T011
- T014 (startAccusation) can run after T010 completes
- T015 (validation) and T016 (startConfrontation) can run in parallel after T014

**Phase 4 (US2)**:
- T018 (showStatement), T019 (text box), T020 (mistake counter) can run in parallel
- T022 (openEvidenceSelection), T023 (NotebookUI integration) can run in parallel
- T024 (EvidenceValidator) can run in parallel with T021-T023
- T026 (correctFeedback), T027 (penaltyDialog), T028 (penalty messages) can run in parallel

**Phase 5 (US3)**:
- T033 (EndingSequence base), T034 (onConfrontationSuccess) can run in parallel
- T036 (confession phase), T037 (reaction phase), T038 (door unlock) implementation can run in parallel after T035

**Phase 6 (US4)**:
- T043 (onConfrontationFailed), T044 (presentEvidence update), T045 (Valentin dialog) can run in parallel
- T047 (NPC dialog updates) can happen in parallel across all 5 NPC files
- T050 (playBadEnding), T049 (getBadEndingData) can run in parallel

**Phase 7 (US5)**:
- T055 (validation logic), T056 (validation return type), T057 (UI integration) can run in parallel
- T058 (populate confrontations) can happen in parallel with other validation work
- T061 (bonus evidence), T062 (bonus detection), T063 (bonus acknowledgment) can run in parallel

**Phase 8 (Polish)**:
- T065 (logging), T066 (pixel-perfect), T067 (keyboard shortcuts), T070 (portraits), T071 (audio), T078 (debug logging) can all run in parallel
- T069 (dialog population) can run in parallel with code tasks

---

## Parallel Example: Phase 1 (Setup)

All setup tasks can launch together since they create different files:

```bash
Task T001: "Create TypeScript type definitions in src/types/accusation.ts"
Task T002: "Create accusation data file in src/data/accusation.json"
Task T003: "Extend Valentin dialog data in src/data/dialogs/valentin.json"
Task T004: "Extend SaveState interface in src/types/save.ts"
Task T005: "Create EvidenceValidator utility in src/utils/evidence-validator.ts"
```

## Parallel Example: User Story 2 (Confrontation UI)

After T017 completes, these can launch together:

```bash
Task T018: "Implement AccusationUI.showStatement() in src/components/accusation-ui.ts"
Task T019: "Create confrontation statement text box component"
Task T020: "Implement mistake counter UI component in AccusationUI"
```

---

## Implementation Strategy

### MVP First (User Stories 1 & 3 Only)

For fastest path to playable accusation system:

1. Complete Phase 1: Setup (T001-T005)
2. Complete Phase 2: Foundational (T006-T009) - CRITICAL
3. Complete Phase 3: User Story 1 (T010-T017) - Accusation initiation
4. Complete Phase 4: User Story 2 (T018-T032) - Confrontation mechanics
5. Complete Phase 5: User Story 3 (T033-T042) - Victory sequence
6. **STOP and VALIDATE**: Test complete victory path
7. Deploy/demo basic accusation system

This gives you a functional accusation system with successful resolution. Failure mechanics (US4) and advanced validation (US5) can be added incrementally.

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. Add User Story 1 (Initiation) → Can start accusations
3. Add User Story 2 (Confrontation) → Can present evidence
4. Add User Story 3 (Victory) → Can win game (MVP complete!)
5. Add User Story 4 (Failure) → Bad ending and NPC reactions
6. Add User Story 5 (Validation) → Evidence requirements and bonus content
7. Polish phase → Production ready

Each phase adds value without breaking previous functionality.

### Parallel Team Strategy

With multiple developers after Foundational phase completes:

- Developer A: User Story 1 (Initiation) → User Story 3 (Victory)
- Developer B: User Story 2 (Confrontation) 
- Developer C: User Story 4 (Failure) → User Story 5 (Validation)
- Developer D: Data population (T069 - all confrontation dialogs)

Stories integrate at milestones for testing.

---

## Notes

- **[P] tasks**: Different files, no dependencies, safe to parallelize
- **[Story] labels**: Map tasks to user stories for traceability
- **Manual Testing**: No automated tests - use quickstart.md scenarios for validation
- **Data-Driven**: Confrontation content in JSON allows changing culprit without code changes
- **LocalStorage**: All save operations wrapped in try-catch for graceful degradation
- **Pixel Perfect**: All UI components use integer coordinates (pixelArt: true)
- **Event-Driven**: Components communicate via Phaser scene.events.emit/on
- **Object Pooling**: Consider Phaser Groups for UI elements if performance issues arise

**Stop at any checkpoint to validate story independently before proceeding**

---

## Total Task Count

- **Setup**: 5 tasks
- **Foundational**: 4 tasks
- **User Story 1**: 8 tasks
- **User Story 2**: 15 tasks
- **User Story 3**: 10 tasks
- **User Story 4**: 12 tasks
- **User Story 5**: 10 tasks
- **Polish**: 16 tasks

**Total**: 80 tasks

**Parallel Opportunities**: 30+ tasks marked [P] can run in parallel with others in their phase

**MVP Scope**: Phases 1-5 (User Stories 1, 2, 3) = 42 tasks for basic functional accusation system with victory condition
