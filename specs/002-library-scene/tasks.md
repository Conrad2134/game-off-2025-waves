# Tasks: Library/Study Game Scene

**Feature Branch**: `002-library-scene`  
**Generated**: November 7, 2025  
**Input**: Design documents from `/specs/002-library-scene/`

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions

Single project structure:
- Source: `src/` at repository root
- Assets: `public/assets/` at repository root
- Data: `src/data/` for configuration files

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and type definitions

- [ ] T001 Create TypeScript type definitions in src/types/scenes.ts (copy from contracts/scene-api.ts)
- [ ] T002 [P] Create scene layout configuration file in src/data/library-layout.json
- [ ] T003 [P] Update asset manifest in src/data/assets.json with all furniture sprites

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core entities and systems that ALL user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T004 Create PlayerCharacter entity class in src/entities/player-character.ts
- [ ] T005 Implement WASD and arrow key input handling in PlayerCharacter
- [ ] T006 Add diagonal movement normalization in PlayerCharacter.update()
- [ ] T007 Implement movement locking capability in PlayerCharacter (lockMovement/unlockMovement methods)
- [ ] T008 Configure PlayerCharacter physics body (28x28 collision box, centered offset)
- [ ] T009 Create LibraryScene class skeleton in src/scenes/library-scene.ts
- [ ] T010 Register LibraryScene in src/main.ts scene configuration array

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - View Complete Library Environment (Priority: P1) 🎯 MVP

**Goal**: Load and display a fully-rendered library/study scene with all required furniture elements (bookshelves, desk, fireplace, seating, etc.) establishing the locked-room mystery setting

**Independent Test**: Start game, click "start" on start scene, verify complete library scene loads with all furniture visible (10+ pieces including bookshelves, desk, fireplace, seating areas, dining table, trophy wall, bar cart, windows, locked door)

### Implementation for User Story 1

- [ ] T011 [P] [US1] Implement asset preloading in LibraryScene.preload() with error handling
- [ ] T012 [P] [US1] Add loaderror event handler with fallback texture generation in LibraryScene
- [ ] T013 [US1] Load library-layout.json configuration in LibraryScene.preload()
- [ ] T014 [US1] Load all furniture and player sprites from asset manifest in LibraryScene.preload()
- [ ] T015 [US1] Implement createFallbackTexture() method for missing assets (magenta rectangles with white borders)
- [ ] T016 [US1] Implement spawnFurniture() method to create furniture sprites from configuration
- [ ] T017 [US1] Configure furniture physics bodies as immovable static objects in spawnFurniture()
- [ ] T018 [US1] Set collision box dimensions and offsets for each furniture piece in spawnFurniture()
- [ ] T019 [US1] Set furniture render layers (depth) based on configuration in spawnFurniture()
- [ ] T020 [US1] Initialize furnitureGroup as Phaser.Physics.Arcade.StaticGroup in LibraryScene.create()
- [ ] T021 [US1] Spawn all furniture objects into furnitureGroup from layout configuration
- [ ] T022 [US1] Implement validateLayout() method to check world size, furniture count, and spawn position
- [ ] T023 [US1] Add scene-loaded and scene-ready event emissions in LibraryScene.create()

**Checkpoint**: At this point, User Story 1 should be fully functional - complete library scene displays all furniture

---

## Phase 4: User Story 2 - Navigate the Library Space (Priority: P2)

**Goal**: Enable player movement using WASD/arrow keys with smooth navigation, properly sized space (5-15 second traversal time), and collision detection preventing walking through objects

**Independent Test**: Load library scene, use WASD/arrow keys to move character to all corners and areas of room, verify traversal takes 5-15 seconds and collisions work correctly on all furniture and walls

### Implementation for User Story 2

- [ ] T024 [US2] Spawn PlayerCharacter at configured spawn position in LibraryScene.create()
- [ ] T025 [US2] Handle optional custom spawn position from scene data in LibraryScene.create()
- [ ] T026 [US2] Call player.update(delta) in LibraryScene.update() loop
- [ ] T027 [US2] Create player-spawned event with position data
- [ ] T028 [US2] Implement createWalls() method to generate invisible wall collision segments
- [ ] T029 [US2] Configure wall physics bodies as immovable static rectangles
- [ ] T030 [US2] Initialize wallsGroup as Phaser.Physics.Arcade.StaticGroup
- [ ] T031 [US2] Create all wall segments from layout configuration
- [ ] T032 [US2] Add physics collider between player and furnitureGroup
- [ ] T033 [US2] Add physics collider between player and wallsGroup
- [ ] T034 [US2] Test and tune player movement speed (target: 150 px/s for 10-15 second traversal)

**Checkpoint**: At this point, User Stories 1 AND 2 should both work - scene displays with working player movement and collision

---

## Phase 5: User Story 3 - Perceive Room Layout and Spatial Relationships (Priority: P2)

**Goal**: Implement camera following behavior that smoothly tracks the player, keeps them centered/near-center, and respects scene boundaries to show functional areas without empty space

**Independent Test**: Have a new player view the scene and identify distinct areas (desk area, fireplace seating, bookshelves) without explanation, verify camera follows player smoothly and stops at scene edges

### Implementation for User Story 3

- [ ] T035 [US3] Set camera bounds to world size (2400x1600) in LibraryScene.create()
- [ ] T036 [US3] Configure camera to follow player with smooth lerp (0.1, 0.1) in LibraryScene.create()
- [ ] T037 [US3] Set camera zoom level to 1.0 (no zoom) in LibraryScene.create()
- [ ] T038 [US3] Enable camera pixel rounding for pixel-perfect rendering
- [ ] T039 [US3] Verify camera stops at scene boundaries and doesn't show empty space
- [ ] T040 [US3] Arrange furniture in library-layout.json to create distinct functional areas (reading, workspace, social)
- [ ] T041 [US3] Add natural pathways between furniture clusters in layout configuration
- [ ] T042 [US3] Position locked door prominently in south wall for clear exit visibility

**Checkpoint**: All core user stories (1, 2, 3) should now be independently functional with complete exploration experience

---

## Phase 6: User Story 4 - Appreciate German Castle Atmosphere (Priority: P3)

**Goal**: Apply cozy pixel art aesthetic with warm colors and German castle styling through furniture choices and décor to create appropriate atmosphere

**Independent Test**: Show scene to players and verify it feels like a European/German castle library without additional context, with cozy yet dramatic atmosphere

### Asset Creation for User Story 4

- [ ] T043 [P] [US4] Create player sprite SVG in public/assets/sprites/characters/player.svg (48x48, pixel art)
- [ ] T044 [P] [US4] Create desk sprite SVG in public/assets/sprites/environment/desk.svg (64x64, ornate European style)
- [ ] T045 [P] [US4] Create tall bookshelf sprite SVG in public/assets/sprites/environment/bookshelf-tall.svg (64x128)
- [ ] T046 [P] [US4] Create fireplace sprite SVG in public/assets/sprites/environment/fireplace.svg (128x128, stone/wood)
- [ ] T047 [P] [US4] Create couch sprite SVG in public/assets/sprites/environment/couch.svg (96x48)
- [ ] T048 [P] [US4] Create chair sprite SVG in public/assets/sprites/environment/chair.svg (32x32)
- [ ] T049 [P] [US4] Create dining table sprite SVG in public/assets/sprites/environment/dining-table.svg (128x64)
- [ ] T050 [P] [US4] Create window sprite SVG in public/assets/sprites/environment/window.svg (64x96, castle style)
- [ ] T051 [P] [US4] Create trophy wall sprite SVG in public/assets/sprites/environment/trophy-wall.svg (128x64)
- [ ] T052 [P] [US4] Create bar cart sprite SVG in public/assets/sprites/environment/bar-cart.svg (48x64)
- [ ] T053 [P] [US4] Create locked door sprite SVG in public/assets/sprites/environment/locked-door.svg (96x128)

### Implementation for User Story 4

- [ ] T054 [US4] Verify all furniture sprites load with correct dimensions and pixel-perfect rendering
- [ ] T055 [US4] Apply warm color palette (browns, grays, gold accents) consistent with cozy aesthetic
- [ ] T056 [US4] Ensure European/German castle styling in furniture designs (ornate, cultured)

**Checkpoint**: Complete visual atmosphere established - all user stories fully functional with proper aesthetic

---

## Phase 7: Integration & Scene Transitions

**Purpose**: Connect library scene to start scene with smooth transitions

- [ ] T057 Update StartScene to transition to LibraryScene on start button click in src/scenes/start-scene.ts
- [ ] T058 Implement camera fade-out (500ms) before scene transition in StartScene
- [ ] T059 Add camerafadeoutcomplete event listener to trigger scene.start('library-scene')
- [ ] T060 Implement camera fade-in (500ms) at start of LibraryScene.create()
- [ ] T061 Test complete scene transition flow from start to library

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Final improvements and validation

- [ ] T062 Add debug mode toggle with 'D' key to show/hide collision boxes
- [ ] T063 [P] Verify pixel-perfect rendering with pixelArt: true and antialias: false
- [ ] T064 [P] Test FPS performance (30+ FPS target on modern browsers)
- [ ] T065 Validate scene world size is exactly 2400x1600 pixels
- [ ] T066 Verify furniture count meets minimum requirement (10+ pieces)
- [ ] T067 Test collision detection on all furniture pieces and walls
- [ ] T068 Verify player spawns at center (1200, 800) without obstructions
- [ ] T069 Measure and validate traversal time (should be 10-15 seconds across scene)
- [ ] T070 Test scene on Chrome, Firefox, and Safari browsers
- [ ] T071 [P] Add console logging for scene lifecycle events (loaded, ready, player-spawned)
- [ ] T072 Verify graceful degradation with fallback textures if assets fail
- [ ] T073 Run through all acceptance scenarios from spec.md user stories
- [ ] T074 Execute quickstart.md validation steps

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phases 3-6)**: All depend on Foundational phase completion
  - User Story 1 (Scene Display): Can start after Foundational - Independent
  - User Story 2 (Navigation): Can start after Foundational - Depends on US1 furniture being spawned
  - User Story 3 (Camera/Layout): Can start after Foundational - Depends on US2 player movement
  - User Story 4 (Atmosphere): Asset creation can happen in parallel with US1-3, integration after US3
- **Integration (Phase 7)**: Depends on User Story 2 completion (player movement needed)
- **Polish (Phase 8)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Depends on Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Depends on US1 furniture spawning - Player needs objects to collide with
- **User Story 3 (P2)**: Depends on US2 player movement - Camera needs player to follow
- **User Story 4 (P3)**: Asset creation independent, but visual integration depends on US1-3 structure

### Within Each User Story

- **US1**: Preload → Configuration loading → Furniture spawning → Validation
- **US2**: Player creation → Wall creation → Collision setup → Speed tuning
- **US3**: Camera configuration → Layout optimization → Boundary testing
- **US4**: All asset tasks can run in parallel → Integration happens sequentially

### Parallel Opportunities

#### Phase 1 (Setup) - All Parallel
```bash
Task T002: "Create scene layout configuration file"
Task T003: "Update asset manifest"
```

#### Phase 2 (Foundational) - PlayerCharacter and LibraryScene Setup Sequential
```bash
# PlayerCharacter tasks (T004-T008) must complete before LibraryScene uses it
# LibraryScene skeleton (T009-T010) can happen after T004
```

#### Phase 3 (User Story 1) - Many Parallel Tasks
```bash
# Asset loading and error handling (all parallel):
Task T011: "Implement asset preloading"
Task T012: "Add loaderror event handler"

# After loading setup, spawn logic can proceed in sequence
```

#### Phase 6 (User Story 4) - All Asset Creation Parallel
```bash
Task T043: "Create player sprite"
Task T044: "Create desk sprite"
Task T045: "Create bookshelf sprite"
Task T046: "Create fireplace sprite"
Task T047: "Create couch sprite"
Task T048: "Create chair sprite"
Task T049: "Create dining table sprite"
Task T050: "Create window sprite"
Task T051: "Create trophy wall sprite"
Task T052: "Create bar cart sprite"
Task T053: "Create locked door sprite"
```

#### Phase 8 (Polish) - Testing Tasks Parallel
```bash
Task T063: "Verify pixel-perfect rendering"
Task T064: "Test FPS performance"
Task T071: "Add console logging"
```

---

## Parallel Example: User Story 1

```bash
# Launch asset loading setup together:
Task T011: "Implement asset preloading in LibraryScene.preload()"
Task T012: "Add loaderror event handler in LibraryScene"

# After setup, sequential implementation of spawn logic
```

## Parallel Example: User Story 4

```bash
# Launch ALL asset creation tasks together (different files):
Task T043: "Create player.svg"
Task T044: "Create desk.svg"
Task T045: "Create bookshelf-tall.svg"
Task T046: "Create fireplace.svg"
Task T047: "Create couch.svg"
Task T048: "Create chair.svg"
Task T049: "Create dining-table.svg"
Task T050: "Create window.svg"
Task T051: "Create trophy-wall.svg"
Task T052: "Create bar-cart.svg"
Task T053: "Create locked-door.svg"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T003)
2. Complete Phase 2: Foundational (T004-T010) - CRITICAL blocker
3. Complete Phase 3: User Story 1 (T011-T023)
4. **STOP and VALIDATE**: Test that complete library scene displays with all furniture
5. Deploy/demo basic scene (no player movement yet, but environment is complete)

### Incremental Delivery

1. **Setup + Foundational** (T001-T010) → Foundation ready
2. **Add User Story 1** (T011-T023) → Test independently → Deploy/Demo (Scene displays!)
3. **Add User Story 2** (T024-T034) → Test independently → Deploy/Demo (Navigation works!)
4. **Add User Story 3** (T035-T042) → Test independently → Deploy/Demo (Camera follows smoothly!)
5. **Add User Story 4** (T043-T056) → Test independently → Deploy/Demo (Beautiful atmosphere!)
6. **Integration** (T057-T061) → Full scene transition working
7. **Polish** (T062-T074) → Production ready

Each story adds value without breaking previous stories.

### Parallel Team Strategy

With multiple developers:

1. **Team completes Setup + Foundational together** (T001-T010)
2. **Once Foundational is done:**
   - Developer A: User Story 1 (Scene Display) - T011-T023
   - Developer B: User Story 4 (Asset Creation) - T043-T053 (can work in parallel!)
3. **Sequential after US1:**
   - Developer A: User Story 2 (Navigation) - T024-T034
   - Developer A: User Story 3 (Camera) - T035-T042
4. **Final Integration:**
   - Developer A or B: Integration & Polish - T057-T074

---

## Summary

**Total Tasks**: 74 tasks across 8 phases

**Task Breakdown by Phase**:
- Phase 1 (Setup): 3 tasks (~30 minutes)
- Phase 2 (Foundational): 7 tasks (~2 hours) - BLOCKS all stories
- Phase 3 (User Story 1 - Scene Display): 13 tasks (~2 hours)
- Phase 4 (User Story 2 - Navigation): 11 tasks (~1.5 hours)
- Phase 5 (User Story 3 - Camera/Layout): 8 tasks (~1 hour)
- Phase 6 (User Story 4 - Atmosphere): 14 tasks (~2 hours asset creation + 30 min integration)
- Phase 7 (Integration): 5 tasks (~30 minutes)
- Phase 8 (Polish): 13 tasks (~1.5 hours)

**Estimated Total Time**: 10-12 hours for complete implementation

**Parallel Opportunities**:
- Phase 1: 2 tasks can run in parallel (T002, T003)
- Phase 3: 2 tasks can run in parallel (T011, T012)
- Phase 6: 11 asset creation tasks can ALL run in parallel (T043-T053)
- Phase 8: 3 testing tasks can run in parallel (T063, T064, T071)

**MVP Scope** (Minimal Viable Product):
- Phases 1-3 only (T001-T023)
- Results in complete library scene display
- Estimated time: ~4.5 hours
- Provides foundation for all other user stories

**Independent Test Criteria**:
- **US1**: Scene loads with 10+ furniture pieces visible
- **US2**: Player moves freely, collides with all objects, 10-15 second traversal
- **US3**: Camera follows smoothly, shows distinct areas, respects boundaries
- **US4**: Scene visually communicates German castle library atmosphere

**Notes**:
- No automated tests required per spec.md (manual playtesting only)
- All tasks follow strict checklist format: `- [ ] [ID] [P?] [Story?] Description with file path`
- Each user story is independently implementable and testable
- Foundation phase (T004-T010) is critical blocker - must complete before any user story work
