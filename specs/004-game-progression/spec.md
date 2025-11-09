# Feature Specification: Game Progression System

**Feature Branch**: `004-game-progression`  
**Created**: 2025-11-09  
**Status**: Draft  
**Input**: User description: "Start building the system for the game to actually progress. We'll want an initial scene where Valentin is thanking everyone for being at the party, he'll tell everyone that he prepared his famous erdbeerstrudel and he's going to go get it. Meanwhile, the player can go around and talk to all of the NPCs and introduce themselves / give a bit of backstory, a bit of which will be recorded in the notebook. Then, after the player has introduced themselves to everyone, Valentine rushes in and is distraught - someone ate his erdbeerstrudel and he knows it was someone in this room. He goes to lock the door and guard it, saying that no one is leaving until he finds out who did it. Then, the player can go around and search for clues and talk to people, progressively uncovering more information. The dialog will change from NPCs as more clues are uncovered to reveal more information. Once the player feels they have enough infromation, they can make an accusation by talking to Valentin (out of scope for now)."

## Clarifications

### Session 2025-11-09

- Q: The specification mentions "at least 5 discoverable clues" but doesn't clarify if all clues are immediately visible/accessible after the incident, or if some unlock based on other discoveries. → A: All clues physically present but some require talking to NPCs first to "unlock" investigation
- Q: How many distinct dialog progression tiers should each NPC have after the incident? → A: 4 tiers (as specified: 0, 1-2, 3-4, 5+ clues)
- Q: Should locked clues have visual indicators showing they're currently locked, or appear as regular environment objects until unlocked? → A: Appear with subtle highlight that changes when unlocked
- Q: What proportion of the 5+ clues should be immediately investigable vs requiring unlock conversations? → A: 2 immediately investigable, 3+ require unlocking
- Q: When an NPC unlocks a clue during conversation, should the player be able to immediately investigate it mid-conversation, or must they complete the dialog first? → A: Must complete current dialog before clue becomes investigable

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Party Introduction Phase (Priority: P1)

When the game starts, the player experiences the party's opening scene where Valentin welcomes everyone and announces he's retrieving his erdbeerstrudel. During this phase, the player can walk around, talk to NPCs to learn their backstories, and have information recorded in their notebook.

**Why this priority**: This establishes the game world, introduces all characters, and sets up the narrative foundation. Without this, players have no context for the mystery that follows.

**Independent Test**: Can be fully tested by starting a new game, watching the opening scene, interacting with all NPCs, and verifying notebook entries are created. Delivers standalone value as a character introduction experience.

**Acceptance Scenarios**:

1. **Given** the game starts, **When** the player enters the party scene, **Then** Valentin delivers his welcome speech and announces he's getting his erdbeerstrudel
2. **Given** Valentin has left the scene, **When** the player approaches any NPC, **Then** an interaction indicator appears
3. **Given** the player approaches an NPC, **When** they initiate conversation, **Then** the NPC's introduction dialog is displayed
4. **Given** the player is conversing with an NPC, **When** backstory information is shared, **Then** relevant information is recorded in the player's notebook
5. **Given** the player has talked to an NPC once, **When** they talk to the same NPC again before the incident, **Then** the NPC provides additional casual conversation
6. **Given** the player is viewing dialog, **When** they press the advance button, **Then** the next line of dialog appears
7. **Given** the player is on the last line of dialog, **When** they press the advance button, **Then** the dialog box closes and they can move freely

---

### User Story 2 - Incident Trigger (Priority: P2)

After the player has introduced themselves to all NPCs, Valentin returns in distress to announce his erdbeerstrudel has been eaten, accuses someone in the room, locks the door, and declares no one leaves until the culprit is found.

**Why this priority**: This is the inciting incident that transforms the game from a social gathering into a mystery investigation. It's the narrative pivot point.

**Independent Test**: Can be tested by completing all NPC introductions and verifying Valentin's return sequence triggers correctly. Delivers the critical "mystery begins" moment.

**Acceptance Scenarios**:

1. **Given** the player has talked to all NPCs, **When** they finish the last conversation, **Then** Valentin's return sequence is triggered
2. **Given** Valentin's return is triggered, **When** he enters the scene, **Then** he displays distressed behavior and delivers his accusation speech
3. **Given** Valentin delivers his speech, **When** the speech ends, **Then** the door lock animation plays
4. **Given** the door is locked, **When** the player attempts to approach the door, **Then** Valentin blocks access and reminds them no one leaves
5. **Given** the incident has occurred, **When** the player opens their notebook, **Then** the incident is recorded as a new entry

---

### User Story 3 - Clue Discovery Phase (Priority: P3)

After the incident, the player can search the environment for interactive clues and find evidence related to the mystery. Each discovered clue is recorded in the notebook.

**Why this priority**: This provides the investigation gameplay mechanic and gives players agency in solving the mystery through environmental exploration.

**Independent Test**: Can be tested by triggering the incident and then searching for all clues in the environment. Delivers standalone investigation gameplay value.

**Acceptance Scenarios**:

1. **Given** the incident has occurred, **When** the player approaches a clue location, **Then** an interaction indicator appears
2. **Given** the player interacts with a clue, **When** they examine it, **Then** clue information is displayed
3. **Given** a clue is examined, **When** the examination completes, **Then** the clue is marked as discovered and recorded in the notebook
4. **Given** the player has discovered a clue, **When** they interact with it again, **Then** they see a "already examined" message
5. **Given** the player opens their notebook, **When** they navigate to clues section, **Then** all discovered clues are listed with descriptions

---

### User Story 4 - Progressive Dialog System (Priority: P3)

After the incident, NPC conversations change based on how many clues the player has discovered. NPCs reveal more information as the investigation progresses.

**Why this priority**: This creates dynamic gameplay where investigation progress directly impacts social interactions, making both exploration and conversation feel meaningful and interconnected.

**Independent Test**: Can be tested by discovering different numbers of clues and talking to NPCs at each stage to verify dialog changes. Delivers replayability and depth to conversations.

**Acceptance Scenarios**:

1. **Given** the incident has occurred and no clues are found, **When** the player talks to an NPC, **Then** they receive initial post-incident dialog
2. **Given** the player has discovered 1-2 clues, **When** they talk to an NPC, **Then** the NPC provides slightly more information based on basic progress
3. **Given** the player has discovered 3-4 clues, **When** they talk to an NPC, **Then** the NPC reveals intermediate-level information
4. **Given** the player has discovered 5+ clues, **When** they talk to an NPC, **Then** the NPC provides their most revealing dialog
5. **Given** an NPC's dialog has changed, **When** the player talks to them again with the same clue count, **Then** they get contextually appropriate follow-up dialog
6. **Given** the player discovers a new clue after talking to an NPC, **When** they return to that NPC, **Then** new dialog options become available

---

### Edge Cases

- What happens when the player tries to leave before talking to all NPCs? (They can move freely; the incident trigger only happens after all introductions)
- What happens when the player clicks too quickly through dialog? (Each click advances one line; can't skip ahead)
- What happens when the player tries to interact with multiple NPCs simultaneously? (Only one conversation can be active at a time; other indicators remain but don't respond until current dialog ends)
- What happens when the player discovers clues in a different order than expected? (Dialog adapts based on total clue count, not specific clues found)
- What happens when the player tries to access the door before the incident? (No special interaction; it's just scenery)
- What happens when the player tries to interact with Valentin before completing all introductions? (He gives a friendly "please enjoy the party" message)
- What happens when the player tries to re-read notebook entries during a conversation? (Notebook can be opened anytime; pauses/overlays current dialog)
- What happens when an NPC unlocks a clue mid-conversation and the player tries to investigate it immediately? (Clue remains locked with subtle highlight until dialog completes, then becomes investigable with prominent highlight)

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST display Valentin's opening speech when the party scene starts
- **FR-002**: System MUST position Valentin so he exits the scene after his opening speech
- **FR-003**: System MUST provide six distinct NPCs (Emma, Klaus, Luca, Marianne, Sebastian, and Valentin) with unique introduction dialogs
- **FR-004**: System MUST display interaction indicators when the player is near an interactable NPC or clue
- **FR-005**: System MUST record backstory information from NPC conversations into the player's notebook
- **FR-006**: System MUST track which NPCs the player has been introduced to
- **FR-007**: System MUST trigger Valentin's return sequence only after the player has talked to all other NPCs (5 NPCs: Emma, Klaus, Luca, Marianne, Sebastian)
- **FR-008**: System MUST display Valentin's distressed return dialog when all introductions are complete
- **FR-009**: System MUST visually lock the door after Valentin's accusation
- **FR-010**: System MUST prevent player exit via the door after it's locked
- **FR-011**: System MUST track the game phase (pre-incident, post-incident)
- **FR-012**: System MUST provide at least 5 discoverable clues in the environment (2 immediately investigable after incident, 3+ require NPC conversations to unlock)
- **FR-013**: System MUST track which clues have been discovered by the player
- **FR-014**: System MUST record discovered clues in the player's notebook with descriptions
- **FR-015**: System MUST change NPC dialog content based on the number of clues discovered
- **FR-016**: System MUST support at least 4 tiers of dialog progression (0 clues, 1-2 clues, 3-4 clues, 5+ clues)
- **FR-017**: System MUST prevent duplicate clue discovery (examining same clue multiple times)
- **FR-018**: System MUST support dialog advancement via player input (click/key press)
- **FR-019**: System MUST allow only one active dialog at a time
- **FR-020**: System MUST allow notebook access during any game phase
- **FR-021**: System MUST persist notebook entries throughout the game session
- **FR-022**: System MUST support clue unlocking through NPC dialog interactions (certain clues become investigable only after specific conversations)
- **FR-023**: System MUST display locked clues with subtle visual highlight that changes to more prominent highlight when unlocked
- **FR-024**: System MUST prevent clue investigation during active dialog (unlocked clues become investigable only after current conversation completes)

### Key Entities

- **Game Phase**: Represents the current state of the game narrative (Pre-Incident, Post-Incident). Controls which dialog sets are available and which game mechanics are active.

- **NPC Character**: Represents each party guest with unique identity (name, sprite, position). Contains multiple dialog sets that change based on game phase and investigation progress. Tracks introduction status.

- **Clue**: Represents discoverable evidence in the environment. Contains location, interaction radius, description, discovery status, and unlock condition (2 immediately investigable, 3+ require specific NPC conversations). Has visual representation with two highlight states: subtle highlight when locked, more prominent highlight when unlocked and investigable. Unlocked clues become investigable only after the unlocking conversation completes. Contributes to investigation progress count when discovered.

- **Dialog Set**: Collection of conversation lines for an NPC in a specific context. Categorized by phase (introduction, post-incident) and progression tier (exactly 4 tiers post-incident: 0 clues, 1-2 clues, 3-4 clues, 5+ clues). Contains ordered dialog lines and notebook recording flags.

- **Notebook Entry**: Record of information learned during gameplay. Types include character introductions, clues discovered, and incident details. Contains timestamp, category, title, and content text.

- **Investigation Progress**: Tracks player's advancement through the mystery. Maintains count of clues discovered, NPCs introduced, and current dialog tier. Used to determine which content is available.

- **Interaction Indicator**: Visual cue showing available interactions. Has position relative to interactable object, activation radius, and visual state (visible/hidden).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Players can complete the introduction phase by talking to all 5 NPCs in under 10 minutes of gameplay
- **SC-002**: The incident trigger activates within 3 seconds of completing the final introduction conversation
- **SC-003**: Players can discover all clues through environmental exploration within 15 minutes
- **SC-004**: NPC dialog changes are noticeable and meaningful, with each tier revealing at least 2 new pieces of information per NPC
- **SC-005**: Players can access and review their notebook at any time with content displaying in under 1 second
- **SC-006**: 100% of discovered clues and character information are correctly recorded in the notebook
- **SC-007**: The game maintains a consistent frame rate during all dialog sequences and phase transitions
- **SC-008**: Players understand the investigation mechanics without external instruction (tutorial-free design success)
