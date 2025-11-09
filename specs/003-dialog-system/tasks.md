````markdown
# Tasks: Dialog System

**Input**: Design documents from `/specs/003-dialog-system/`  
**Prerequisites**: plan.md ✓, spec.md ✓, research.md ✓, data-model.md ✓, contracts/ ✓

**Tests**: No automated tests requested - manual playtesting only

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions

- Single project structure: `src/`, `public/`, at repository root
- Phaser 3 web game with TypeScript and Vite

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and type definitions for dialog system

- [ ] T001 [P] Create TypeScript type definitions file at src/types/dialog.ts based on contracts/types.ts
- [ ] T002 [P] Update character metadata JSON files with dialog.introduction field for all 6 characters (emma, klaus, luca, marianne, sebastian, valentin) in public/assets/sprites/characters/{name}/metadata.json
- [ ] T003 [P] Create or load interaction indicator sprite asset (simple icon/sprite for visual cue) at public/assets/ui/interaction-icon.png or generate placeholder programmatically

**Checkpoint**: Type definitions and data assets ready for component implementation

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core dialog UI and NPC entity updates that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T004 Create DialogBox component implementing contracts/dialog-box.ts at src/components/dialog-box.ts (background graphics, text objects, show/hide methods)
- [ ] T005 Update NPCCharacter entity to implement Interactable interface in src/entities/npc-character.ts (add id, interactionRange, interactable, dialogData properties)
- [ ] T006 [P] Create InteractionIndicator component implementing visual cue system at src/components/interaction-indicator.ts (sprite with bob animation)

**Checkpoint**: Foundation ready - dialog box can display, NPCs are interactable, indicators can show

---

## Phase 3: User Story 1 - Character Introduction via Dialog (Priority: P1) 🎯 MVP

**Goal**: Enable player to walk up to any NPC character and press spacebar/enter to see their introduction in a dialog box

**Independent Test**: Load library scene, walk player character adjacent to an NPC (like Valentin), press spacebar or enter, verify dialog box appears with character's name and introduction text from metadata.json

### Implementation for User Story 1

- [ ] T007 [P] [US1] Create DialogManager system implementing contracts/dialog-manager.ts at src/systems/dialog-manager.ts (open/close methods, state management, player movement locking)
- [ ] T008 [P] [US1] Create InteractionDetector system implementing contracts/interaction-detector.ts at src/systems/interaction-detector.ts (proximity checks, closest entity detection)
- [ ] T009 [US1] Integrate DialogManager into LibraryScene at src/scenes/library-scene.ts (initialize in create method, add dialogManager property)
- [ ] T010 [US1] Integrate InteractionDetector into LibraryScene at src/scenes/library-scene.ts (initialize in create method, register all NPCs as interactables)
- [ ] T011 [US1] Add keyboard input handling for interaction keys (spacebar, enter, escape) in LibraryScene at src/scenes/library-scene.ts
- [ ] T012 [US1] Implement dialog open logic in LibraryScene.update() at src/scenes/library-scene.ts (detect interaction key press when player in range of NPC)
- [ ] T013 [US1] Implement dialog close logic in LibraryScene.update() at src/scenes/library-scene.ts (handle close key press and auto-close on distance threshold)
- [ ] T014 [US1] Load character metadata JSON files in LibraryScene.preload() at src/scenes/library-scene.ts (load all 6 character metadata files)
- [ ] T015 [US1] Pass loaded metadata to NPCCharacter constructors in LibraryScene.create() at src/scenes/library-scene.ts (ensure dialogData populated from metadata.dialog)

**Checkpoint**: At this point, User Story 1 should be fully functional - player can talk to all NPCs and see their introductions

---

## Phase 4: User Story 2 - Visual Dialog UI Presentation (Priority: P1)

**Goal**: Ensure dialog interface is visually clear, readable, and aesthetically consistent with cozy pixel art style

**Independent Test**: Trigger dialog with any character and evaluate readability, visual clarity, contrast, text rendering quality, and aesthetic fit with game's pixel art style

### Implementation for User Story 2

- [ ] T016 [P] [US2] Configure DialogBox visual styling in src/components/dialog-box.ts (background color: 0x000000 with 85% opacity, border: 4px white, dimensions: 900x150)
- [ ] T017 [P] [US2] Configure text rendering with pixel-perfect settings in src/components/dialog-box.ts (font resolution: 2x, word wrap enabled, font family selection)
- [ ] T018 [US2] Set DialogBox positioning and depth in src/components/dialog-box.ts (fixed to camera at x:512 y:680, depth:1000, scrollFactor:0)
- [ ] T019 [US2] Test text rendering with German special characters (ä, ö, ü, ß) by loading character dialog for all NPCs
- [ ] T020 [US2] Adjust text padding and layout in src/components/dialog-box.ts (20px padding, speaker name at top, message text below with proper spacing)

**Checkpoint**: Dialog UI is polished, readable, and visually consistent with pixel art aesthetic

---

## Phase 5: User Story 3 - Proximity-Based Interaction Detection (Priority: P2)

**Goal**: Automatically detect when player is close enough to NPC to initiate dialog and provide visual feedback (indicator)

**Independent Test**: Move player character toward and away from NPCs, observe visual indicator appears when in range (45-60 pixels) and disappears when out of range

### Implementation for User Story 3

- [ ] T021 [US3] Implement distance calculation in InteractionDetector.update() at src/systems/interaction-detector.ts (calculate squared distance to all interactables, check against interaction range)
- [ ] T022 [US3] Implement closest entity detection in InteractionDetector at src/systems/interaction-detector.ts (sort by distance, return closest in-range entity)
- [ ] T023 [US3] Implement indicator show/hide logic in InteractionDetector.update() at src/systems/interaction-detector.ts (show indicator above closest entity, hide when no entity in range)
- [ ] T024 [US3] Call InteractionDetector.update() in LibraryScene.update() at src/scenes/library-scene.ts (ensure proximity checks run every frame)
- [ ] T025 [US3] Implement indicator position tracking in InteractionIndicator at src/components/interaction-indicator.ts (update position to follow target entity)
- [ ] T026 [US3] Configure interaction range for each NPC in src/entities/npc-character.ts (default: 50 pixels, approximately 3-4 character widths)

**Checkpoint**: Interaction indicators appear and disappear smoothly based on player proximity to NPCs

---

## Phase 6: User Story 4 - Object Interaction Messages (Priority: P3)

**Goal**: Enable player to examine environmental objects (bookshelves, locked door, furniture) with brief text messages using same dialog UI

**Independent Test**: Walk up to an interactive object, press interaction key, verify message appears in dialog UI describing the object

### Implementation for User Story 4

- [ ] T027 [P] [US4] Create InteractableObject class implementing Interactable interface at src/entities/interactable-object.ts (sprite-based object with dialogData for descriptions)
- [ ] T028 [P] [US4] Define object dialog data structure in src/entities/interactable-object.ts (dialog.description field for examination text)
- [ ] T029 [US4] Create sample interactable objects in LibraryScene.create() at src/scenes/library-scene.ts (bookshelf, locked door, furniture with descriptions)
- [ ] T030 [US4] Register interactable objects with InteractionDetector in LibraryScene.create() at src/scenes/library-scene.ts (add objects to detector's interactable list)
- [ ] T031 [US4] Update dialog open logic to handle both NPCs and objects in LibraryScene.update() at src/scenes/library-scene.ts (determine source type, pass appropriate speaker name or null)
- [ ] T032 [US4] Update DialogBox.show() to handle null speaker in src/components/dialog-box.ts (hide speaker text when speaker is null for object messages)

**Checkpoint**: All user stories complete - players can talk to NPCs and examine objects using consistent dialog system

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories and final validation

- [ ] T033 [P] Add validation for dialog message length in DialogManager at src/systems/dialog-manager.ts (max 500 chars, handle empty strings with fallback)
- [ ] T034 [P] Add error handling for missing metadata in NPCCharacter at src/entities/npc-character.ts (fallback message: "Hello, I'm {characterName}.")
- [ ] T035 Add input debouncing to prevent repeated dialog triggers in LibraryScene.update() at src/scenes/library-scene.ts (use Phaser.Input.Keyboard.JustDown() utility)
- [ ] T036 Test auto-close behavior with all NPCs at various distances (verify dialog closes when player moves beyond interaction range + 10 pixel buffer)
- [ ] T037 [P] Verify text wrapping works correctly for long messages in DialogBox at src/components/dialog-box.ts (test with 2-3 line messages)
- [ ] T038 [P] Test edge case: multiple NPCs in close proximity (verify only closest shows indicator and receives interaction)
- [ ] T039 [P] Test edge case: repeated spacebar presses while dialog open (verify system ignores additional presses until dialog closed)
- [ ] T040 Run through quickstart.md validation checklist (all 6 characters have introductions, all interaction scenarios work correctly)
- [ ] T041 [P] Update PROJECT_README.md or documentation with dialog system usage and extension points for future branching conversations

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion (T001-T003) - BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational phase completion (T004-T006)
- **User Story 2 (Phase 4)**: Depends on Foundational phase completion (T004-T006) - can run parallel to US1
- **User Story 3 (Phase 5)**: Depends on Foundational phase completion (T004-T006) - can run parallel to US1/US2
- **User Story 4 (Phase 6)**: Depends on US1 completion (dialog system must work for NPCs first)
- **Polish (Phase 7)**: Depends on all user stories being complete (T007-T032)

### User Story Dependencies

- **User Story 1 (P1 - Character Introduction)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P1 - Visual Dialog UI)**: Can start after Foundational (Phase 2) - No dependencies on other stories, overlaps with US1
- **User Story 3 (P2 - Proximity Detection)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 4 (P3 - Object Interaction)**: Depends on US1 completion - reuses dialog system built for NPCs

### Within Each User Story

**User Story 1 (Character Introduction)**:
1. T007 & T008 can run in parallel (DialogManager and InteractionDetector in different files)
2. T009 & T010 integrate systems into scene (sequential, same file)
3. T011-T013 add input handling and logic (sequential, same file)
4. T014 & T015 load metadata and pass to NPCs (sequential, same file)

**User Story 2 (Visual Dialog UI)**:
1. T016 & T017 can run in parallel with T018 (different properties in same file)
2. T019 & T020 test and adjust (sequential)

**User Story 3 (Proximity Detection)**:
1. T021-T023 implement detector logic (sequential, same file)
2. T024 integrates into scene
3. T025 & T026 configure indicator and range (can run parallel, different files)

**User Story 4 (Object Interaction)**:
1. T027 & T028 create InteractableObject class (sequential, same file)
2. T029 & T030 create and register objects (sequential, same file)
3. T031 & T032 update dialog logic (can run parallel, different files)

### Parallel Opportunities

- **Phase 1 (Setup)**: All three tasks (T001, T002, T003) can run in parallel
- **Phase 2 (Foundational)**: T004 and T005 sequential (same file modifications possible), T006 can run parallel
- **Within US1**: T007 and T008 can run in parallel (different files)
- **US1, US2, US3 can start simultaneously** after Foundational phase (different developer focus areas):
  - Developer A: US1 (core dialog functionality)
  - Developer B: US2 (visual polish)
  - Developer C: US3 (proximity indicators)
- **Within US4**: T027 and T028 (same file), T031 and T032 (different files) can be parallelized
- **Phase 7 (Polish)**: T033, T034, T037, T038, T039, T041 can run in parallel (different files)

---

## Parallel Example: Foundational Phase

```bash
# Can work on different components simultaneously:
Task T004: "DialogBox component at src/components/dialog-box.ts"
Task T006: "InteractionIndicator component at src/components/interaction-indicator.ts"

# Then:
Task T005: "Update NPCCharacter entity at src/entities/npc-character.ts"
```

## Parallel Example: User Story 1

```bash
# Launch systems in parallel (different files):
Task T007: "DialogManager system at src/systems/dialog-manager.ts"
Task T008: "InteractionDetector system at src/systems/interaction-detector.ts"

# Then integrate into scene:
Task T009: "Integrate DialogManager into LibraryScene"
Task T010: "Integrate InteractionDetector into LibraryScene"
```

---

## Implementation Strategy

### MVP First (User Stories 1 & 2 Only)

1. Complete Phase 1: Setup (T001-T003)
2. Complete Phase 2: Foundational (T004-T006) → Foundation ready
3. Complete Phase 3: User Story 1 (T007-T015) → Core dialog works
4. Complete Phase 4: User Story 2 (T016-T020) → Dialog is polished
5. **STOP and VALIDATE**: Test character introductions with all 6 NPCs independently
6. Deploy/demo MVP (characters can introduce themselves)

### Incremental Delivery

1. **Foundation** (Setup + Foundational) → T001-T006 complete
2. **MVP Release** (US1 + US2) → T007-T020 complete → Character introductions work
3. **Enhanced Release** (+ US3) → T021-T026 complete → Visual indicators added
4. **Full Release** (+ US4) → T027-T032 complete → Object examination added
5. **Polished Release** (+ Polish) → T033-T041 complete → Edge cases handled

### Parallel Team Strategy

With multiple developers after Foundational phase:

1. Team completes Setup + Foundational together (T001-T006)
2. Once Foundational is done:
   - **Developer A**: User Story 1 (T007-T015) - Core dialog functionality
   - **Developer B**: User Story 2 (T016-T020) - Visual polish (works with A's components)
   - **Developer C**: User Story 3 (T021-T026) - Proximity detection (independent)
3. After US1 complete:
   - **Developer D**: User Story 4 (T027-T032) - Object interactions
4. Final: All developers on Polish tasks (T033-T041)

---

## Task Count Summary

- **Phase 1 (Setup)**: 3 tasks
- **Phase 2 (Foundational)**: 3 tasks
- **Phase 3 (US1)**: 9 tasks
- **Phase 4 (US2)**: 5 tasks
- **Phase 5 (US3)**: 6 tasks
- **Phase 6 (US4)**: 6 tasks
- **Phase 7 (Polish)**: 9 tasks

**Total Tasks**: 41

**Parallelizable Tasks**: 16 tasks marked [P]

**MVP Scope (US1 + US2)**: 20 tasks (T001-T020)

---

## Notes

- All tasks follow strict checklist format: `- [ ] [ID] [P?] [Story?] Description with file path`
- [P] tasks target different files or independent properties
- [Story] labels (US1-US4) map tasks to user stories from spec.md
- Each user story is independently testable per acceptance scenarios in spec.md
- Constitution principles validated: data-driven design (JSON metadata), Phaser 3 architecture, pixel art rendering, type safety
- No automated tests requested - manual playtesting per quickstart.md
- Foundation phase (T004-T006) blocks all user story work - must complete first
- MVP delivery possible after US1+US2 (character introductions working)
- Incremental delivery: US1 → US2 → US3 → US4 → Polish

````