# Feature Specification: Accusation System

**Feature Branch**: `005-accusation-system`  
**Created**: 2025-11-12  
**Status**: Draft  
**Input**: User description: "implement the accusation system for the end game"

## Clarifications

### Session 2025-11-12

- Q: Which suspect is actually guilty, and what are the evidence requirements to prove it? → A: Configurable culprit with minimum clue threshold (e.g., must have 4+ clues discovered) plus specific required evidence sequence - balanced approach
- Q: When a player presents incorrect evidence during confrontation, how should the mistake counter be communicated? → A: Each mistake triggers penalty dialog from Valentin that must be dismissed, emphasizing consequences
- Q: Should the failed accusation count persist between game sessions, or reset when the player closes/reopens the game? → A: Persist across game sessions - saved in LocalStorage/save file
- Q: How should the player initiate an accusation? → A: Walk up to Valentin NPC and interact, accusation UI opens immediately inline in library scene
- Q: How long should the victory and bad ending sequences be? → A: Victory: 30-45 seconds (confession + reaction + door unlock + summary screen), Bad Ending: 20-30 seconds (despair speech + door unlock + failure screen)

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Initiating the Accusation (Priority: P1)

When the player feels they have gathered enough evidence, they can approach Valentin to make an accusation. Valentin will present a list of all suspects (NPCs), and the player must choose who they believe ate the erdbeerstrudel.

**Why this priority**: This is the core win condition trigger. Without the ability to accuse, there's no way to complete the game.

**Independent Test**: Can be fully tested by discovering at least one clue, approaching Valentin, and selecting an accusation option. Delivers the critical "I'm ready to solve this" moment that gives players agency.

**Acceptance Scenarios**:

1. **Given** the player is in post-incident phase, **When** they approach Valentin, **Then** an interaction indicator appears
2. **Given** the player interacts with Valentin, **When** the dialog opens, **Then** Valentin asks if they've figured out who ate the erdbeerstrudel
3. **Given** Valentin's accusation dialog is open, **When** the player selects "I think I know who did it", **Then** a list of all suspects (Emma, Klaus, Luca, Marianne, Sebastian) is displayed inline in the library scene
4. **Given** the suspect list is displayed, **When** the player selects a suspect, **Then** the accusation confrontation UI opens inline in the library scene
5. **Given** the suspect list is displayed, **When** the player selects "Never mind, I need more evidence", **Then** the dialog closes and investigation continues

---

### User Story 2 - Phoenix Wright-Style Confrontation (Priority: P2)

After selecting a suspect, an interactive confrontation scene plays out where the accused (or Valentin) makes statements, and the player must present evidence from their notebook to prove their case.

**Why this priority**: This creates an engaging, interactive climax that makes players feel like they're actively solving the mystery rather than just selecting from a menu. It's the payoff for all the investigation work.

**Independent Test**: Can be tested by triggering an accusation and presenting various pieces of evidence. Delivers the dramatic courtroom-style showdown that makes the solution feel earned.

**Acceptance Scenarios**:

1. **Given** an accusation has been initiated, **When** the confrontation begins, **Then** a dedicated accusation UI appears with the accused character's portrait
2. **Given** the confrontation UI is displayed, **When** the accused makes a statement, **Then** the statement is displayed with options to present evidence or listen
3. **Given** a statement requires contradiction, **When** the player selects "Present Evidence", **Then** their notebook opens with all discovered clues available for selection
4. **Given** the notebook is open during confrontation, **When** the player selects a clue, **Then** they attempt to present it as evidence
5. **Given** the player presents correct evidence, **When** the evidence directly contradicts the statement, **Then** the accused reacts and the confrontation advances
6. **Given** the player presents incorrect evidence, **When** the evidence doesn't contradict the statement, **Then** Valentin displays a penalty dialog that must be dismissed before continuing (emphasizing consequences and mistake count)
7. **Given** the confrontation has multiple stages, **When** the player successfully presents all required evidence, **Then** the culprit is proven guilty
8. **Given** the player is making an accusation, **When** they press the back/escape button, **Then** they can cancel the accusation and return to investigation

---

### User Story 3 - Correct Accusation Resolution (Priority: P1)

When the player successfully proves the correct suspect is guilty by presenting all necessary evidence, a resolution scene plays where the culprit confesses, Valentin reacts, and the game reaches its victory ending.

**Why this priority**: This is the win condition and the primary goal players are working toward. Without this, the game has no satisfying conclusion.

**Independent Test**: Can be tested by making a correct accusation with all necessary evidence. Delivers the ultimate payoff and sense of accomplishment for solving the mystery.

**Acceptance Scenarios**:

1. **Given** the player has proven the correct suspect guilty, **When** the final evidence is presented, **Then** the culprit delivers a confession dialog
2. **Given** the culprit confesses, **When** the confession ends, **Then** Valentin reacts with a dramatic response appropriate to the culprit's identity
3. **Given** Valentin reacts, **When** his reaction completes, **Then** the door unlock animation plays
4. **Given** the door unlocks, **When** the animation completes, **Then** a victory screen is displayed
5. **Given** the victory screen appears, **When** it's displayed, **Then** it shows the mystery summary (who, why, how)
6. **Given** the victory screen is shown, **When** the player selects "Continue", **Then** they return to the title screen
7. **Given** a game is completed, **When** the player starts a new game, **Then** their previous progress is cleared

---

### User Story 4 - Incorrect Accusation Handling (Priority: P2)

When the player accuses the wrong suspect or presents incorrect evidence, Valentin becomes increasingly frustrated. After two failed accusations, the player receives a bad ending where Valentin gives up in despair.

**Why this priority**: This creates meaningful stakes and consequences for the investigation. It prevents random guessing and ensures players actually engage with the clue-gathering mechanics.

**Independent Test**: Can be tested by deliberately making wrong accusations and verifying the failure state triggers. Delivers tension and replayability by creating consequences for poor deduction.

**Acceptance Scenarios**:

1. **Given** the player presents incorrect evidence during confrontation, **When** the mistake counter reaches 3 incorrect presentations, **Then** the confrontation fails and Valentin rejects the accusation
2. **Given** an accusation is rejected, **When** the player returns to investigation, **Then** the failed accusation count increases by 1
3. **Given** the player has made 1 failed accusation, **When** they return to the main scene, **Then** Valentin displays frustrated dialog
4. **Given** the player makes a second failed accusation, **When** Valentin rejects it, **Then** a bad ending sequence triggers
5. **Given** the bad ending triggers, **When** it begins, **Then** Valentin delivers a despairing "I give up" speech
6. **Given** Valentin gives up, **When** his speech ends, **Then** he unlocks the door and everyone leaves without solving the mystery
7. **Given** the bad ending sequence completes, **When** it finishes, **Then** a failure screen is displayed explaining what happened
8. **Given** the failure screen is shown, **When** the player selects "Try Again", **Then** they return to the title screen
9. **Given** the player has made failed accusations, **When** they talk to NPCs, **Then** NPCs comment on the failed attempts with unique dialog

---

### User Story 5 - Evidence Requirement Validation (Priority: P3)

The system validates that the player has discovered sufficient evidence before allowing a successful accusation. The confrontation requires specific clues to be presented in logical order to prove guilt.

**Why this priority**: This ensures players actually investigate before accusing, creating meaningful gameplay progression and preventing lucky guesses from shortcutting the experience.

**Independent Test**: Can be tested by attempting accusations with different combinations of discovered clues. Delivers depth by making investigation thorough and rewarding completionism.

**Acceptance Scenarios**:

1. **Given** the correct culprit is accused, **When** the confrontation begins, **Then** the system checks which clues the player has discovered
2. **Given** the player lacks critical evidence, **When** they try to present it, **Then** the option is not available in their notebook
3. **Given** the confrontation has multiple evidence points, **When** the player presents evidence in wrong order, **Then** Valentin corrects them and requests the logical starting point
4. **Given** all required evidence is discovered, **When** the player presents it correctly, **Then** each piece builds the case progressively
5. **Given** the player has optional/bonus clues, **When** they present them during confrontation, **Then** Valentin acknowledges them with extra dialog flavor
6. **Given** the player tries to accuse without discovering minimum clues, **When** they select a suspect, **Then** Valentin suggests they investigate more before accusing

---

### Edge Cases

- What happens when the player repeatedly talks to Valentin without making an accusation? (He gives increasingly impatient dialog but allows unlimited attempts until 2 failures)
- What happens when the player opens their notebook during the confrontation and closes it without presenting evidence? (The confrontation continues, they can re-open notebook anytime)
- What happens when the player presents the same incorrect evidence multiple times? (Each incorrect presentation counts toward the 3-mistake limit per confrontation)
- What happens when the player cancels an accusation mid-confrontation? (The accusation is canceled, doesn't count as a failure, player returns to investigation)
- What happens when the player has 1 failed accusation and cancels the second attempt? (Canceling doesn't count as failure, they still have 1 more attempt left)
- What happens when multiple clues could technically work for a statement? (The system has a "best" answer but accepts any logically valid clue)
- What happens when the player makes an accusation immediately after the incident without any clues? (Valentin suggests gathering evidence first, confrontation proceeds but likely fails)
- What happens when the player discovers ALL clues including optional ones? (Victory scene includes bonus acknowledgment of thorough investigation)
- What happens when the player returns to the game after a bad ending save? (Previous save is wiped, they must start fresh from title screen)

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow player to interact with Valentin in post-incident phase to initiate accusation dialog
- **FR-002**: System MUST display accusation initiation options ("I think I know who did it", "Not yet") in Valentin's post-incident dialog
- **FR-003**: System MUST present a list of all suspect NPCs (Emma, Klaus, Luca, Marianne, Sebastian) when player chooses to accuse
- **FR-004**: System MUST allow player to cancel accusation and return to investigation from suspect selection
- **FR-005**: System MUST display accusation/confrontation UI inline within the library scene when suspect is selected (no separate scene transition)
- **FR-006**: System MUST display the accused character's portrait and name in confrontation UI
- **FR-007**: System MUST present scripted accusation statements from the accused (or Valentin) during confrontation
- **FR-008**: System MUST provide "Present Evidence" and "Listen/Continue" options during confrontation statements
- **FR-009**: System MUST open player's notebook showing only discovered clues when "Present Evidence" is selected
- **FR-010**: System MUST validate presented evidence against the current statement's required evidence
- **FR-011**: System MUST track incorrect evidence presentations with a counter (max 3 per confrontation)
- **FR-012**: System MUST advance confrontation to next statement when correct evidence is presented
- **FR-013**: System MUST display negative feedback via Valentin penalty dialog (that must be dismissed) and increment mistake counter when incorrect evidence is presented
- **FR-014**: System MUST fail the accusation when 3 incorrect evidence presentations occur in one confrontation
- **FR-015**: System MUST track total failed accusations across the game session (max 2 failures before bad ending)
- **FR-016**: System MUST trigger victory sequence when correct suspect is accused and all evidence is successfully presented
- **FR-017**: System MUST trigger bad ending sequence when 2 accusation failures have occurred
- **FR-018**: System MUST display culprit's confession dialog in victory sequence
- **FR-019**: System MUST display Valentin's reaction dialog based on culprit identity in victory sequence
- **FR-020**: System MUST play door unlock animation in victory sequence
- **FR-021**: System MUST display victory screen with mystery summary (culprit, motive, key evidence)
- **FR-022**: System MUST display Valentin's despair dialog in bad ending sequence
- **FR-023**: System MUST play door unlock animation in bad ending sequence
- **FR-024**: System MUST display failure screen explaining the bad ending in bad ending sequence
- **FR-025**: System MUST return player to title screen from both victory and failure screens
- **FR-026**: System MUST clear game progress when returning to title screen after an ending
- **FR-027**: System MUST allow player to cancel confrontation and return to investigation without penalty
- **FR-028**: System MUST update Valentin's idle dialog after first failed accusation to show frustration
- **FR-029**: System MUST update NPC dialog after failed accusations to comment on the situation
- **FR-030**: System MUST define minimum required clues for successful accusation (at least 4 clues discovered, with culprit and required evidence sequence configurable per suspect via JSON)
- **FR-031**: System MUST allow multiple valid evidence options for statements where applicable
- **FR-032**: System MUST include optional bonus dialog when player presents extra/supporting evidence
- **FR-033**: System MUST prevent accusation with helpful message if player has fewer than 4 clues discovered
- **FR-034**: System MUST support accusation data configuration in JSON format for each potential culprit, including culprit identity, required evidence sequence, and minimum clue threshold
- **FR-035**: System MUST persist accusation attempt count in save state (LocalStorage/save file) across game sessions

### Key Entities

- **Accusation State**: Tracks the player's progress through accusations. Maintains total failed accusation count (0-2), current confrontation mistake count (0-3), and which suspects have been accused. Persisted in LocalStorage/save file across game sessions. Determines when bad ending should trigger.

- **Confrontation Sequence**: Represents a scripted accusation dialog flow for a specific suspect. Contains ordered statements that require evidence, maps statements to valid/required evidence clues, defines confrontation success/failure conditions. Configured per potential culprit in JSON.

- **Evidence Requirement**: Defines which clues are needed to prove guilt for each suspect. Specifies minimum required clues for accusation (at least 4 clues must be discovered), maps confrontation statements to acceptable evidence with specific required evidence sequence (e.g., timeline → motive → opportunity → physical evidence), distinguishes between required and optional/bonus evidence. The guilty culprit is configurable via JSON. Ensures players must investigate thoroughly before successfully accusing.

- **Accusation UI State**: Controls the confrontation interface rendered inline within the library scene. Manages suspect portrait display, current statement presentation, notebook overlay for evidence selection, mistake counter visualization, penalty dialog display (triggered on incorrect evidence), and confrontation progress indicators. Overlays the library scene without transitioning to a separate scene.

- **Ending Sequence**: Represents victory or bad ending flow. Contains culprit-specific confession dialogs, Valentin's reaction dialogs, door unlock animations, and summary screen data. Triggers based on accusation outcome. Victory sequence runs 30-45 seconds total, bad ending runs 20-30 seconds total.

- **Victory Summary**: Data displayed on victory screen. Includes culprit identity, motive explanation, key evidence used to solve, and optional bonus acknowledgment for thorough investigation.

- **Failed Accusation Record**: Tracks each failed accusation attempt. Records which suspect was wrongly accused, how many mistakes were made during confrontation, timestamp of failure. Used to update NPC reactions and Valentin's frustration level.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Players can locate and interact with Valentin to initiate accusation in under 10 seconds from any location in the library
- **SC-002**: The suspect selection interface displays all 5 suspects clearly with portraits and names
- **SC-003**: Confrontation UI renders inline within the library scene with character portraits loading in under 1 second
- **SC-004**: Players can present evidence during confrontations with notebook opening in under 0.5 seconds
- **SC-005**: Correct evidence presentation provides clear positive feedback within 1 second
- **SC-006**: Incorrect evidence presentation triggers Valentin penalty dialog within 1 second, showing mistake count and requiring dismissal before continuing
- **SC-007**: Victory sequence plays complete culprit confession and resolution in 30-45 seconds (confession: 10-15s, reaction: 5-10s, door unlock: 3-5s, summary screen: 10-15s)
- **SC-008**: Bad ending sequence communicates failure clearly and returns to title screen in 20-30 seconds (despair speech: 10-15s, door unlock: 3-5s, failure screen: 5-10s)
- **SC-009**: 90% of players understand the evidence presentation mechanic without external instruction
- **SC-010**: Players who discover all clues can complete confrontation on first attempt 80% of the time
- **SC-011**: Players report the accusation system feels fair and logical in post-play surveys
- **SC-012**: The confrontation system supports all 5 potential culprits with unique confession and resolution dialogs
- **SC-013**: Failed accusation states persist correctly in LocalStorage/save file across game sessions, allowing resume without data loss
- **SC-014**: Accusation cancellation works reliably with no progression bugs or soft-locks
