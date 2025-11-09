# Feature Specification: Dialog System

**Feature Branch**: `003-dialog-system`  
**Created**: November 8, 2025  
**Status**: Draft  
**Input**: User description: "create a feature to introduce the dialog system. This includes the UI elements for dialog and other messaging (like text that shows up when interacting with things), system for initiating dialog when going up to someone and hitting spacebar or enter. Initially, when interacting with a character, they just introduce themselves."

## Clarifications

### Session 2025-11-08

- Q: What is the pixel distance range for interaction triggers around NPCs? → A: 45-60 pixels (moderate range, approximately 3-4 character widths)
- Q: How should character introduction text and dialog data be stored? → A: Simple JSON structure in each character's metadata.json file (extends existing metadata pattern)
- Q: What happens if the player moves away while a dialog box is open? → A: Dialog closes automatically if player moves beyond interaction range (45-60 pixel threshold)
- Q: What visual design should the interaction indicator use? → A: Simple icon/sprite floating above the NPC's head (e.g., speech bubble, exclamation mark, arrow)
- Q: What happens when the player repeatedly presses the interaction key while dialog is already open? → A: Ignore additional presses - one press opens dialog, subsequent presses ignored until dialog closed by explicit action

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Character Introduction via Dialog (Priority: P1)

When the player walks up to any NPC character in the library and presses the interaction key (spacebar or enter), a dialog box should appear displaying the character's introduction. This represents the foundational interaction mechanic for the entire investigation gameplay.

**Why this priority**: This is the core communication mechanism for the mystery game. Without dialog, players cannot question suspects, gather information, or progress through the story. It's the MVP for any narrative interaction.

**Independent Test**: Can be fully tested by loading the library scene, walking the player character adjacent to an NPC (like Valentin, Klaus, Emma, etc.), pressing spacebar or enter, and verifying that a dialog box appears with the character's name and introduction text.

**Acceptance Scenarios**:

1. **Given** the player is standing near an NPC character, **When** they press spacebar or enter, **Then** a dialog box appears showing the character's name and introduction message
2. **Given** a dialog box is displayed, **When** the player reads the introduction, **Then** the character's name is clearly visible along with their introduction text
3. **Given** the player has opened a character's dialog, **When** they want to close it, **Then** pressing spacebar, enter, or escape closes the dialog box and returns control to the player
4. **Given** the player is not near any character, **When** they press spacebar or enter, **Then** no dialog box appears

---

### User Story 2 - Visual Dialog UI Presentation (Priority: P1)

The dialog interface should be visually clear, readable, and aesthetically consistent with the cozy pixel art style of the game, ensuring players can comfortably read character dialogue without eye strain or confusion.

**Why this priority**: A poorly designed dialog UI will frustrate players and break immersion. Since dialog is the primary gameplay mechanic, the UI must be polished and functional from the start.

**Independent Test**: Can be fully tested by triggering dialog with any character and evaluating readability, visual clarity, contrast, and aesthetic fit with the game's pixel art style.

**Acceptance Scenarios**:

1. **Given** a dialog box is displayed, **When** the player reads it, **Then** the text is clearly legible with sufficient contrast against the background
2. **Given** a character is speaking, **When** the dialog box appears, **Then** it includes a visual frame/border that fits the cozy pixel art aesthetic
3. **Given** the dialog UI is displayed, **When** the player observes it, **Then** the character's name is prominently displayed to identify who is speaking
4. **Given** a dialog box is open, **When** the player views the screen, **Then** the dialog box is positioned consistently (typically bottom or center) and does not obscure critical game elements

---

### User Story 3 - Proximity-Based Interaction Detection (Priority: P2)

The game should automatically detect when the player character is close enough to an NPC to initiate dialog, providing visual feedback (like an indicator) to signal that interaction is possible.

**Why this priority**: Clear interaction affordances prevent player confusion about which characters can be talked to and when. This enhances usability but is secondary to the core dialog functionality working.

**Independent Test**: Can be fully tested by moving the player character toward and away from NPCs, observing whether a visual indicator appears when in range and disappears when out of range.

**Acceptance Scenarios**:

1. **Given** the player character is far from any NPC, **When** they walk toward an NPC, **Then** a visual indicator appears when they enter interaction range
2. **Given** the player is within interaction range of an NPC, **When** they move away, **Then** the visual indicator disappears
3. **Given** multiple NPCs are in the library, **When** the player is near multiple NPCs simultaneously, **Then** the indicator shows for the closest NPC only
4. **Given** an interaction indicator is visible, **When** the player presses spacebar or enter, **Then** dialog initiates with the indicated character

---

### User Story 4 - Object Interaction Messages (Priority: P3)

When the player examines environmental objects (like bookshelves, the locked door, furniture), a brief text message should appear describing the object or providing flavor text, using the same dialog UI system for consistency.

**Why this priority**: Object examination adds depth to the investigation gameplay and environmental storytelling, but it's not critical for the initial character interaction MVP. Can be added after core character dialog works.

**Independent Test**: Can be fully tested by walking up to an interactive object, pressing the interaction key, and verifying that a message appears in the dialog UI describing the object.

**Acceptance Scenarios**:

1. **Given** the player is near an interactive object, **When** they press spacebar or enter, **Then** a message appears in the dialog UI describing the object
2. **Given** an object description is displayed, **When** the player reads it, **Then** the message is brief (1-3 sentences) and provides relevant information or flavor text
3. **Given** the player examines multiple objects, **When** they interact with each one, **Then** each object displays its unique description text

---

### Edge Cases

- What happens when the player repeatedly presses the interaction key while dialog is already open? (system ignores additional presses; dialog remains open until explicitly closed by spacebar/enter/escape or player moves out of range)
- How does the system handle multiple NPCs in close proximity? (prioritize closest NPC, or show indicator for the one the player is facing)
- What if dialog text exceeds the size of the dialog box? (text should wrap appropriately, or use pagination/scrolling for longer messages)
- How does the dialog system handle special characters in names or text (like Valentin's German phrases)? (text rendering must support accented characters: ä, ö, ü, ß, etc.)
- What happens if the player moves away while a dialog box is open? (dialog closes automatically when player moves beyond the 45-60 pixel interaction range threshold)
- How does the dialog system interact with game state (pause/unpause)? (when dialog is open, player movement should be disabled but game doesn't need to fully pause)

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST display a dialog box when the player presses spacebar or enter while standing adjacent to an NPC character
- **FR-002**: Dialog box MUST clearly display the speaking character's name and their introduction text
- **FR-003**: System MUST support closing the dialog box when the player presses spacebar, enter, or escape key
- **FR-004**: Dialog UI MUST use readable typography with sufficient contrast between text and background
- **FR-005**: Dialog UI MUST fit aesthetically with the game's cozy pixel art visual style
- **FR-006**: System MUST prevent player movement while a dialog box is actively displayed
- **FR-007**: System MUST detect proximity between player character and NPCs to enable interaction (interaction range: 45-60 pixels, approximately 3-4 character widths)
- **FR-008**: System MUST display a visual indicator (icon/sprite floating above NPC's head) when the player is within interaction range of an NPC
- **FR-009**: System MUST support displaying brief text messages when the player interacts with environmental objects (furniture, locked door, etc.)
- **FR-010**: Dialog text rendering MUST support special characters used in German text (ä, ö, ü, ß, and accented characters)
- **FR-011**: System MUST handle text wrapping when dialog messages exceed the width of the dialog box
- **FR-012**: Each NPC character MUST have a unique introduction message that displays on first interaction; introduction text stored in character's metadata.json file
- **FR-013**: Dialog box MUST be positioned consistently on screen (standard position is bottom-third or center)
- **FR-014**: System MUST prioritize the closest NPC when multiple characters are in interaction range simultaneously
- **FR-015**: Dialog system MUST be reusable for both NPC conversations and object examination messages
- **FR-016**: System MUST automatically close the dialog box if the player moves beyond the interaction range (45-60 pixels) while dialog is displayed
- **FR-017**: System MUST ignore interaction key presses (spacebar/enter) while dialog is already open; dialog can only be closed via explicit close action or moving out of range

### Key Entities

- **Dialog Box**: Visual container that displays character speech or object descriptions; includes character name label, text content area, border/frame decoration
- **Interaction Indicator**: Visual cue shown above an NPC/object when player is in range to interact; implemented as a simple icon/sprite floating above the NPC's head (speech bubble, exclamation mark, or arrow icon)
- **Dialog Message**: Text content to be displayed; includes speaker name (for NPCs) and message text; supports special characters and multi-line content
- **Interaction Trigger**: Proximity detection zone around NPCs and interactive objects; defines the range within which player can initiate dialog
- **Character Introduction**: Specific type of dialog message that serves as each NPC's initial greeting when first talked to; stored in each character's metadata.json file under a "dialog" property with "introduction" field
- **Character Metadata**: JSON structure in public/assets/sprites/characters/{characterName}/metadata.json containing character properties including dialog data (introduction text, future conversation trees)

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Players can successfully initiate dialog with any NPC character by pressing spacebar or enter when standing adjacent to them
- **SC-002**: Dialog text is readable without strain across all character introductions (100% of test players can read all dialog without complaints)
- **SC-003**: Players understand which characters are interactive within 3 seconds of approaching an NPC (interaction indicators provide clear affordance)
- **SC-004**: Dialog boxes open and close smoothly without delay (player input to dialog appearance occurs within 100 milliseconds)
- **SC-005**: All NPC characters successfully display their introduction messages when interacted with for the first time (100% success rate across all characters)
- **SC-006**: Players can distinguish between different speakers (character names are always clearly visible in dialog UI)
- **SC-007**: System handles all six playable characters (Emma, Klaus, Luca, Marianne, Sebastian, Valentin) plus any NPCs present in the library scene
