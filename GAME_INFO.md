# Who Ate Valentin's Erdbeerstrudel? - Game Design Document

## Overview

**Genre**: 2D Pixel Art Detective/Mystery Game (Locked-Room Mystery)  
**Core Mechanic**: Investigation through dialogue and clue discovery  
**Theme**: Absurdist locked-room mystery in a German castle  
**Central Mystery**: Someone ate Valentin's precious erdbeerstrudel (strawberry strudel), and he's locked everyone in his library/study until the culprit is found

## Game Concept

### The Premise
Valentin, the passionate German castle owner, has prepared his famous erdbeerstrudel for his gathering. When he discovers someone has eaten it, he goes absolutely **crazy** (in a comedically dramatic way) and locks all guests in the library/study, refusing to let anyone leave until the mystery is solved. The player must navigate this increasingly absurd situation and identify the dessert thief.

### The Mystery
You're trapped in Valentin's library/study with several other guests. The doors are locked. Valentin is having a meltdown. Someone in this room ate his erdbeerstrudel. The player must:
- Question the other trapped guests
- Examine the library/study for clues
- Deal with Valentin's theatrical German dramatics
- Piece together who had motive, means, and opportunity
- Identify the culprit before tensions boil over

### Core Gameplay Loop
1. **Explore** the locked library/study (limited space creates intimacy)
2. **Interact** with NPCs through dialogue trees (everyone is trapped together)
3. **Discover** clues by examining objects and noticing details
4. **Observe** character reactions and contradictions
5. **Deduce** connections between evidence and testimonies
6. **Accuse** the culprit (Valentin won't unlock the door until you're right!)

### Tone & Style
- **Visual Style**: Cozy/warm pixel art (inspired by Stardew Valley/Celeste aesthetic)
- **Comedy**: Absurdist humor through Valentin's dramatic overreaction
- **Mystery**: Moderate difficulty with genuine deduction required (scalable for future versions)
- **Cultural Flavor**: Light German language integration (mainly exclamations and phrases from Valentin)

## Game World

### Setting
- **Location**: Valentin's library/study in his German castle (Schloss)
- **Time Period**: Contemporary (modern day but in a historic castle)
- **Atmosphere**: Locked-room tension meets absurdist comedy
  - Ornate German furniture and décor
  - Bookshelves, desk, fireplace, comfortable chairs
  - Growing claustrophobia as time passes
  - Valentin pacing dramatically, occasionally shouting in German

### The Locked Room (Primary Location)
**Valentin's Library/Study** - The entire game takes place in this single, detailed room:
- **Bookshelves**: Floor-to-ceiling, filled with German literature
- **Valentin's Desk**: Papers, photos, personal items to examine
- **Seating Area**: Chairs/couches where guests are gathered
- **Fireplace**: With mantle decorations and possible clues
- **Windows**: Locked, overlooking castle grounds (can see outside but can't escape)
- **Trophy Wall**: Valentin's achievements, certificates, memorabilia
- **Bar Cart**: Half-empty glasses, bottles (who was drinking what?)
- **The Locked Door**: Prominently featured, Valentin guards the key
## Characters

### Player Character
- **Role**: One of the trapped guests at Valentin's gathering
- **Appearance**: Defined protagonist sprite with distinct visual design
- **Movement**: Top-down character control, walks around the library to interact with objects and people
- **Motivation**: Get out of this increasingly awkward situation by solving the mystery
- **Personality**: Player-defined through dialogue choices (sympathetic, sarcastic, earnest, etc.)
- **Abilities**: Can talk to anyone, examine objects, observe details, make deductions
- **Status**: Initially just wants to leave, gradually gets invested in the absurd mystery

### Valentin (The Host/Victim)
- **Role**: Castle owner, host, and victim of the erdbeerstrudel theft
- **Investigation Role**: Guards the locked door, pacing dramatically. Occasionally shouts in German or makes comments, but lets you investigate. You can talk to him when needed.
- **Personality**: 
  - Passionate to the point of obsession about his baking
  - Theatrical and dramatic (treats this like a serious crime)
  - Speaks with German phrases peppered throughout (main source of German language in game)
  - Oscillates between rage, despair, and manic energy
  - Surprisingly competent at keeping everyone locked in
- **Appearance**: Well-dressed, probably has an apron or baking-related accessory
- **Dialogue Style**: 
  - "Mein Gott! Someone has eaten mein erdbeerstrudel!"
  - "Das ist eine Katastrophe! Nobody leaves until I know the truth!"
  - "I spent THREE HOURS on the perfect dough! DREI STUNDEN!"
- **Relationship**: He invited everyone here, but now trusts no one

### Guest Characters (Pool System)
**The Locked Room Group** - **5 guest characters** (+ Valentin + Player = 7 total):

**V1.0 Character Count**: 5 unique guest characters, each with distinct personalities, motivations, and roles in the mystery. Manageable scope while providing enough suspects for a satisfying mystery.

**Potential Character Archetypes:**
- **The Nervous Guest**: Keeps insisting they didn't do it (suspiciously)
- **The Dismissive One**: Thinks this whole thing is ridiculous, wants to leave
- **The Food Critic**: Actually appreciates that someone ate it (was it them?)
- **The Old Friend**: Has history with Valentin, knows his quirks
- **The Outsider**: Doesn't know anyone well, easy to suspect
- **The Competitor**: Another baker/chef, possibly jealous of Valentin's skills
- **The Sweet Tooth**: Openly admits they love pastries (too obvious?)
### Investigation System

#### Dialogue
- **Branching Conversations**: Different dialogue paths based on:
  - Discovered clues
  - Previously questioned NPCs
  - Order of investigation
  - Time elapsed (characters get more agitated/revealing)
- **Multiple Questioning**: Return to NPCs with new information to unlock new dialogue
- **Valentin Interjections**: Valentin periodically interrupts with dramatic German outbursts
- **Personality-Based Responses**: Characters have different cooperation levels:
  - Helpful witnesses (genuinely want to solve this)
  - Evasive suspects (clearly hiding something)
  - Dismissive types (think this is ridiculous)
- **Language**: Primarily English with light German sprinkling for flavor and cultural authenticity
#### Clue Discovery
- **Interaction System**: Automatic indicators (!) appear above interactable objects and people when nearby
- **The Crime Scene**: Plate with strudel remnants (partially eaten) provides physical forensic evidence
- **Physical Clues**: Found by examining objects in the library/study
  - Crumbs on someone's clothing or chair
  - Powdered sugar traces on the plate and potentially on culprit
  - Partially eaten strudel with specific evidence
  - Napkins with strudel remnants
  - Moved furniture or items
  - Stain on clothing
  - Tell-tale smells
- **Testimony Clues**: Information revealed through conversations
  - Who was where before being locked in
  - Who has a sweet tooth
  - Who was in the kitchen earlier
  - Who has a grudge against Valentin
  - Timeline contradictions
  - Behavioral observations (nervous, smug, defensive)
- **Observational Clues**: Details about character behavior
  - Who looks guilty/nervous
  - Who seems too eager to blame others
  - Who is trying to change the subject
  - Physical tells (crumbs in beard, sugar on fingers)
- **Clue Combination**: Some clues only make sense when combined
  - Example: "crumbs on chair" + "person sitting there" + "timeline" = opportunity
  - "motivation for revenge" + "kitchen access" + "missing napkin" = method
#### Accusation Mechanics
- **Phoenix Wright Style**: Interactive accusation system where you present evidence to counter statements
- **How It Works**:
- **When Ready**: Player can accuse any character at any time (approach Valentin with your theory)
- **Confrontation System**: 
  1. Choose a suspect to accuse
  2. Valentin (or the accused) makes statements during confrontation
  3. Present specific evidence from your notebook to support or contradict claims
  4. Interactive back-and-forth like Phoenix Wright courtroom sequences
  5. Must successfully present the right evidence to prove guilt
- **Consequence System**:
  - **Correct Accusation**: 
    - Dramatic confrontation scene concludes
    - Culprit confesses (or defends themselves amusingly)
    - Valentin's reaction (rage? Forgiveness? More German dramatics?)
    - Door unlocks, everyone free to leave
    - Victory/resolution screen
  - **Incorrect Accusation**: 
    - Valentin gets MORE upset ("Nein! Das ist falsch!")
    - Accused character reacts (hurt, angry, smug)
    - Room tension increases
    - Player can continue investigating
    - **2 wrong accusations = BAD ENDING**: Valentin gives up in despair, unlocks door, mystery remains unsolved
  - **Stakes**: Limited to 2 mistakes before failure ending - creates tension while allowing learning

### Near-Term Replayability (Configuration-Based)
**Version 2.0 Scope**: Multiple pre-designed scenarios using:
- Character pool with modular dialogues
- Multiple culprit options with associated clue sets
- Procedural selection from handcrafted content
- 5-10 different "mystery setups"
- Same room, different people/motives/clues

#### Modular System Design
```json
{
  "mysterySets": [
    {
      "id": "jealous_competitor",
      "culprit": "baker_franz",
      "motive": "Professional rivalry - wanted to prove Valentin's baking isn't that good",
      "keyClues": ["crumbs_on_franz", "competitive_history", "kitchen_knowledge"],
      "redHerrings": ["nervous_intern", "broken_plate"],
      "valentinReaction": "betrayed_by_friend"
    },
    {
      "id": "hungry_critic",
      "culprit": "food_critic_greta",
      "motive": "Couldn't resist tasting before the official review",
      "keyClues": ["camera_photos", "review_notes", "powdered_sugar"],
      "redHerrings": ["suspicious_timing", "window_theory"],
      "valentinReaction": "professional_outrage"
    },
    {
      "id": "sweet_tooth_oma",
      "culprit": "oma_helga",
      "motive": "Reminded her of her late husband's baking, couldn't help herself",
      "keyClues": ["nostalgic_comments", "napkin_in_purse", "tears"],
      "redHerrings": ["claims_diabetes", "too_obvious"],
      "valentinReaction": "conflicted_sympathy"
    }
  ],
  "characterPool": [
    {
      "id": "baker_franz",
      "name": "Franz the Baker",
      "roles": ["suspect", "culprit", "red_herring"],
      "dialogueSets": ["neutral_baker", "guilty_baker", "innocent_baker"],
      "germanisms": ["Ja, natürlich!", "Das ist Quatsch!", "Ordnung muss sein!"]
    },
    {
      "id": "oma_helga",
      "name": "Oma Helga",
      "roles": ["suspect", "culprit", "witness"],
      "dialogueSets": ["sweet_oma", "guilty_oma", "helpful_oma"],
      "germanisms": ["Ach du lieber!", "Mein Schatz!", "So ein Unsinn!"]
    }
  ]
}
```**Das Notizbuch** (The Notebook) UI:
- **Organization**: Character-centric layout with tabs/pages for each suspect
- **Character Profiles**: Each suspect has their own page with:
  - Portrait and basic info
  - All clues related to them
  - Testimonies and contradictions
  - Observed behaviors
- **Evidence Presentation**: Used during Phoenix Wright-style accusation to present specific clues
- **Auto-Save**: Progress automatically saved as clues are discovered
- **Connection Web**: [Future feature] Visual representation of clue relationships

### Deduction & Accusation

#### Building the Case
- Player must identify:
  1. **Motive**: Why they wanted the erdbeerstrudel
### Main Screens
1. **Title Screen**: Start new game, continue (auto-saved progress), options
2. **Investigation View**: Top-down locked library/study with player movement
   - Walk around the room with WASD/Arrow keys
   - Automatic (!) indicators show interactable objects/people
   - Press E to examine/interact when near indicators
   - Valentin pacing/standing by the locked door
   - Cozy, warm pixel art aesthetic
3. **Dialogue View**: Character portrait + text box with dialogue options
   - German phrases with contextual translations (light sprinkling)
   - Character expressions/reactions
   - Dialogue-driven investigation gameplay
4. **Notebook View**: Evidence, character notes, case summary
   - **"Das Notizbuch"** (The Notebook)
   - Character-centric organization with tabs for each suspect
   - All clues related to each character grouped together
   - Used to review evidence and select clues during accusation
5. **Accusation View**: Phoenix Wright-style confrontation
   - Dramatic scene with accused character and Valentin
   - Statements made that you must support/contradict
   - Select evidence from notebook to present
   - Interactive back-and-forth dialogue
6. **Resolution Screen**: Mystery solved (or failed)
   - Culprit revealed and reacts
   - Valentin's dramatic response
   - Door unlocks (or doesn't)
   - Victory ending or bad ending (if 2 wrong accusations made)

### Scene Structure
```
StartScene          → Title screen, menu
IntroScene          → Valentin's meltdown, door locks, setup
InvestigationScene  → Main gameplay, locked library exploration
DialogueScene       → Overlays investigation, handles conversations
NotebookScene       → Overlays investigation, clue review ("Das Notizbuch")
AccusationScene     → Present case to Valentin, identify culprit
ConclusionScene     → Mystery resolution, door unlocks (or doesn't), ending
```

### Introduction Sequence (IntroScene)
**The Setup**:
1. Brief scene showing everyone gathering for dessert
2. Valentin enters, discovers the plate with partially eaten strudel
3. "MEIN ERDBEERSTRUDEL! Someone has eaten MEIN ERDBEERSTRUDEL!"
4. Valentin's dramatic meltdown in German and English
5. *Click* - Door locks
6. "Nobody leaves this room until I know who did this! NIEMAND!"
7. Camera pans to show all trapped guests (5 guests + player)
8. Player control begins - top-down movement investigation starts

### Audio Design
- **Background Music**: Atmospheric music in the library (tense strings, quiet piano, German-inspired melodies)
- **Sound Effects**: Footsteps, door sounds, examining objects, dialogue blips, Valentin's pacing
- **Ambient Sounds**: Crackling fireplace, clock ticking, distant castle ambiance
- **Dynamic Audio**: Music intensity changes based on investigation progress and dramatic moments

### Near-Term Replayability (Configuration-Based)
**Version 2.0 Scope**: Multiple pre-designed scenarios using:
- Character pool with modular dialogues
- Multiple culprit options with associated clue sets
- Procedural selection from handcrafted content
- 5-10 different "mystery setups"

#### Modular System Design
```json
{
  "mysterySets": [
    {
      "id": "jealous_chef",
      "culprit": "chef_pierre",
      "motive": "professional rivalry",
      "keyClues": ["burnt_recipe", "timing_sheet", "kitchen_access"],
#### Mystery Configuration
```json
{
  "mysteryId": "erdbeerstrudel_v1",
  "setting": "locked_library",
  "solution": {
    "culprit": "character_id",
    "motive": "why_they_ate_it",
    "method": "when_and_how",
    "evidence": ["key_clue_1", "key_clue_2", "key_clue_3"]
  },
  "requiredClues": ["clue_1", "clue_2", "clue_3"],
  "optionalClues": ["clue_4", "clue_5"],
  "valentinMood": "absolutely_unhinged",
  "timeLimit": null,
  "wrongAccusationLimit": 3
}
```

#### Character Data
```json
{
  "id": "oma_helga",
  "name": "Oma Helga",
  "nameWithArticle": "die Oma",
  "sprite": "assets/characters/oma.png",
  "personality": "sweet_but_secretive",
  "germanisms": ["Ach du lieber!", "Mein Schatz!", "Was für ein Theater!"],
  "initialPosition": { "x": 300, "y": 400 },
  "seatingArea": "comfortable_chair",
  "dialogueTrees": {
    "initial": "dialogue_oma_first",
    "afterClue_crumbs": "dialogue_oma_defensive",
    "afterClue_nostalgia": "dialogue_oma_emotional",
    "neutral": "dialogue_oma_chitchat"
  },
  "physicalClues": {
    "visible": ["floral_dress", "reading_glasses", "purse"],
    "hidden": ["napkin_with_crumbs"]
  }
}
```

#### Dialogue Trees
```json
{
  "id": "dialogue_oma_first",
  "speaker": "oma_helga",
  "nodes": [
    {
      "id": "start",
      "text": "Ach, what a fuss over a pastry! In my day, we didn't make such a theater.",
      "germanPhrase": "Was für ein Theater!",
      "responses": [
        {
          "text": "Do you know anything about the missing strudel?",
### Phase 1: Core Investigation Mechanics ✓ (In Progress)
- [x] Phaser 3 setup with pixel art configuration
- [x] Title screen
- [ ] Introduction scene (Valentin's meltdown, door locks)
- [ ] Player character with movement (locked library)
- [ ] Single detailed room (library/study with German décor)
- [ ] Basic interaction system (examine objects, talk to people)
- [ ] Dialogue system with one NPC (test with Valentin or one guest)
- [ ] Simple clue collection (find one or two test clues)

### Phase 2: Full Mystery Implementation
- [ ] Complete locked library/study environment
  - [ ] Detailed pixel art room with cozy/warm aesthetic (Stardew Valley-inspired)
  - [ ] German castle décor (bookshelves, desk, fireplace, etc.)
  - [ ] Automatic (!) indicators for interactable items
  - [ ] Plate with partially eaten strudel as crime scene centerpiece
- [ ] 5 guest characters + Valentin
  - [ ] Unique sprites with cozy pixel art style
  - [ ] Distinct personalities (one will be culprit)
  - [ ] Valentin positioned by locked door, pacing animation
  - [ ] Defined protagonist sprite design
- [ ] Full dialogue trees for all characters
  - [ ] Initial conversations
  - [ ] Clue-dependent dialogue unlocks
  - [ ] Light German sprinkling (mainly from Valentin)
  - [ ] Valentin's dramatic interjections
- [ ] 10-15 clues scattered throughout
  - [ ] Physical evidence from strudel remnants
  - [ ] Testimony contradictions
  - [ ] Behavioral observations
- [ ] Notebook UI ("Das Notizbuch")
  - [ ] Character-centric organization with tabs
  - [ ] Clue collection grouped by suspect
  - [ ] Evidence selection for accusations
- [ ] Phoenix Wright-style accusation mechanic
  - [ ] Interactive confrontation system
  - [ ] Present evidence to counter/support statements
  - [ ] 2 wrong accusations = bad ending
## Open Questions & Discussion Points

### Narrative & Setting ✅ (Resolved)
1. ✅ **Player's role**: Defined protagonist, trapped guest who investigates
2. ✅ **Player movement**: Top-down exploration with WASD/arrows
3. ✅ **Valentin's role**: Castle owner/host who locks everyone in, guards door dramatically
4. ✅ **Introduction**: Dramatic locking scene showing Valentin's meltdown over partially eaten strudel
5. ✅ **Resolution tone**: Absurdist/comedic but satisfying reveal

### Gameplay Mechanics ✅ (Resolved)
6. ✅ **Time limit**: No time limit for V1.0, focus on investigation quality
7. ✅ **Failure state**: 2 wrong accusations = bad ending (Valentin gives up, mystery unsolved)
8. ✅ **Interaction system**: Automatic (!) indicators show interactable objects/people
9. ✅ **Accusation style**: Phoenix Wright-style with evidence presentation
10. ✅ **Dialogue skill checks**: No for V1.0, keep it simple
11. ✅ **Evidence analysis**: Automatic understanding with flavor text, no mini-games
12. ✅ **Red herrings**: Yes! Essential for mystery
13. ✅ **Clue organization**: Character-centric notebook with tabs for each suspect
14. ✅ **Save system**: Auto-save to localStorage, resume anytime

### Character & Story ✅ (Resolved)
15. ✅ **Character count for V1**: **5 guests + Valentin + player = 7 total**
16. ✅ **Character relationships**: Yes! Old friends, rivals, strangers make dialogue interesting
17. ✅ **Motive variety**: Multiple possible motives across character pool
### Version 1.0 (Single Mystery - "Das Erdbeerstrudel Incident")
- [ ] One complete locked-room mystery that takes 30-45 minutes to solve
- [ ] **5 unique guest characters + Valentin + defined protagonist** (7 total)
- [ ] Dramatic introduction (Valentin's meltdown, discovers partially eaten strudel, locks door)
- [ ] Detailed library/study environment with cozy pixel art (Stardew Valley-inspired)
- [ ] **Moderate difficulty** with 2-3 viable suspects until key clues found (scalable in future)
- [ ] All core systems functional and polished:
  - Top-down movement with automatic interaction indicators
  - Dialogue system with branching paths
  - Character-centric notebook ("Das Notizbuch")
  - Phoenix Wright-style accusation with evidence presentation
  - 2 wrong accusations = bad ending, correct = victory
  - Auto-save system
  - Background music + SFX
- [ ] Light German cultural integration (mainly Valentin's exclamations)
- [ ] Cozy, warm pixel art aesthetic is consistent and charming
- [ ] Playable on modern web browsers (Chrome, Firefox, Safari)
- [ ] One culprit, 10-15 clues including physical evidence from strudel remnants, multiple red herringsmotive (betrayal vs. sympathy)
    - Social embarrassment
    - Possible reconciliation or banishment from future events
    - **Comedic resolution**: Maybe culprit has to bake replacement?

### Replayability Design ✅ (Resolved)
18. ✅ **Modular from start**: Build modular JSON data structure but focus on ONE polished mystery for V1.0
19. ✅ **Quality vs. Variety**: V1.0 = depth and polish, V2.0+ = breadth with variations
20. ✅ **Character consistency**: Architecture supports future character pool system
21. ✅ **Room layout**: Same locked library for V1.0, architected for future variations

### Technical & Scope ✅ (Resolved)
22. ✅ **Target playtime**: **30-45 minutes** for first playthrough
23. ✅ **Difficulty**: **Moderate** for V1.0, architected to be scalable (easy/hard modes in future)
24. ✅ **Platform support**: Desktop browser (keyboard + mouse) for V1.0
25. ✅ **Achievements**: Future feature
26. ✅ **Audio**: Background music + sound effects + ambient sounds

### Visual & Cultural Design ✅ (Resolved)
27. ✅ **Art style**: Cozy/warm pixel art (Stardew Valley/Celeste inspired)
28. ✅ **Language balance**: Light German sprinkling, mainly through Valentin's exclamations
29. ✅ **Cultural elements**: 
    - Valentin switches to German when emotional (exclamations, emphasis)
    - German food culture taken seriously
    - Castle/schloss atmosphere
    - Lighthearted and respectful treatment
30. ✅ **The strudel**: Partially eaten with physical remnants as key evidence
- **ESC**: Menu/pause
- **Mouse**: Click to interact (alternative to keyboard)
- **Number Keys**: Quick-select dialogue options

**Questions for refinement:**
- Should we support gamepad/controller?
- Mobile touch controls for future ports?

## Technical Architecture

### Scene Structure
```
StartScene          → Title screen, menu
InvestigationScene  → Main gameplay, castle exploration
DialogueScene       → Overlays investigation, handles conversations
NotebookScene       → Overlays investigation, clue review
AccusationScene     → Present case and identify culprit
ConclusionScene     → Mystery resolution, ending
```

### Key Systems

#### DialogueManager
- Loads dialogue trees from JSON
- Tracks conversation state per character
- Unlocks new dialogue based on clues discovered
- Handles branching logic and conditional responses

#### InvestigationTracker
- Tracks which clues have been discovered
- Manages character interaction states
- Determines when new areas/dialogues unlock
- Validates accusation against mystery solution

#### GameStateManager
- **Auto-save**: Continuously persists investigation progress to localStorage
- Tracks discovered clues, completed dialogues, current position
- Manages mystery scenario (current version/culprit)
- Allows seamless resume from any point

#### ClueNotebook Component
- Displays discovered clues with descriptions
- Shows character profiles and suspicion levels
- Allows review of previous dialogues
- [Future] Visual connection mapping

### Data Structure

#### Mystery Configuration
```json
{
  "mysteryId": "erdbeerstrudel_v1",
  "solution": {
    "culprit": "character_id",
    "motive": "reason",
    "method": "how_it_happened"
  },
  "requiredClues": ["clue_1", "clue_2", "clue_3"],
  "optionalClues": ["clue_4", "clue_5"]
}
```

#### Character Data
```json
{
  "id": "chef_pierre",
  "name": "Chef Pierre",
  "sprite": "assets/characters/chef.png",
  "personality": "gruff_but_kind",
  "initialLocation": "kitchen",
  "dialogueTrees": {
    "initial": "dialogue_chef_first",
    "afterClue_1": "dialogue_chef_suspicious",
    "neutral": "dialogue_chef_help"
  }
}
```

#### Dialogue Trees
```json
{
  "id": "dialogue_chef_first",
  "speaker": "chef_pierre",
  "nodes": [
    {
      "id": "start",
      "text": "Bah! What do you want? I have a kitchen to run!",
      "responses": [
        {
          "text": "I'm investigating the missing erdbeerstrudel.",
          "nextNode": "about_strudel"
        },
        {
          "text": "Sorry to bother you.",
          "nextNode": "end"
        }
      ]
    }
  ]
}
```

## Development Phases

### Phase 1: Core Investigation Mechanics ✓ (In Progress)
- [x] Phaser 3 setup with pixel art configuration
- [x] Title screen
- [ ] Player character with movement
- [ ] Single investigation scene (castle kitchen?)
- [ ] Basic interaction system (examine objects)
- [ ] Dialogue system with one NPC
- [ ] Simple clue collection

### Phase 2: Full Mystery Implementation
- [ ] Complete castle with multiple rooms
- [ ] 6-8 characters with distinct personalities
- [ ] Full dialogue trees for all characters
- [ ] 10-15 clues scattered throughout
- [ ] Notebook UI with clue management
- [ ] Accusation mechanic
- [ ] Victory/failure conditions
- [ ] One complete, polished mystery

### Phase 3: Replayability Foundation
- [ ] Character pool system
- [ ] Modular dialogue sets
- [ ] 3-5 alternate mystery scenarios
- [ ] Mystery configuration loader
- [ ] Procedural culprit/clue assignment
- [ ] Playtesting and balancing

### Phase 4: AI Integration (Future Vision)
- [ ] LLM API integration
- [ ] Prompt engineering for dialogue generation
- [ ] Mystery validation system
- [ ] Content caching and optimization
- [ ] Quality feedback loop

## Open Questions & Discussion Points

### Narrative & Setting
1. What's the player's motivation for investigating? Are they a friend, professional detective, or nosy party guest?
2. What's Valentin's relationship to the castle/party? Host, guest, caterer?
3. Should there be a tutorial/introduction sequence?
4. What's the tone of the resolution? Lighthearted confrontation or serious accusations?

### Gameplay Mechanics
5. Should there be a time limit or event progression (party stages)?
6. Can the player fail permanently, or always able to keep investigating?
7. Should there be dialogue skill checks (persuasion, intimidation, charm)?
8. Should physical evidence need to be "analyzed" or automatically understood?
9. Should there be red herring clues that point to wrong suspects?
10. Should the player be able to take notes/annotations on clues?

### Character & Story
11. How many characters should be in the first version? What's the minimum viable mystery?
12. Should characters have relationships with each other that affect testimonies?
13. Should there be multiple possible motives (revenge, hunger, accident, prank)?
14. What's the culprit's punishment/consequence? (Just embarrassment? Banned from parties?)

### Replayability Design
15. Should we build modular systems from day one, or optimize for single polished mystery first?
16. What's the balance between handcrafted quality and procedural variety?
17. Should character personalities remain consistent across playthroughs or vary?
18. Should the castle layout change between mysteries, or remain constant?

### Technical & Scope
19. What's the target playtime for one mystery? (30 minutes? 1 hour? 2 hours?)
20. Should there be difficulty levels (easy = more clues, hard = less obvious)?
21. Mobile/touch support planned, or desktop-only initially?
22. Should there be achievements/unlockables across multiple playthroughs?

## Success Criteria

### Version 1.0 (Single Mystery)
- [ ] One complete mystery that takes 30-45 minutes to solve
- [ ] 5 unique guest characters + Valentin + defined protagonist (7 total)
- [ ] Moderate difficulty with satisfying "aha!" moment
- [ ] All core systems functional and polished:
  - [ ] Top-down movement with automatic indicators
  - [ ] Character-centric notebook organization
  - [ ] Phoenix Wright-style accusation system
  - [ ] Auto-save functionality
  - [ ] Background music + SFX
- [ ] Cozy, warm pixel art aesthetic (Stardew Valley-inspired)
- [ ] Light German cultural integration (accessible to all players)
- [ ] Playable on modern web browsers
- [ ] 2 wrong accusations = bad ending system working

### Version 2.0 (Replayability)
- [ ] 5 different mysteries with unique solutions
- [ ] 10+ hours of unique content across all mysteries
- [ ] Modular system allows new mysteries to be added easily
- [ ] Character pool of 15+ with reusable dialogue patterns
- [ ] No two playthroughs feel identical

### Version 3.0 (AI-Enhanced)
- [ ] Theoretically infinite unique mysteries
- [ ] Generated content maintains quality and solvability
- [ ] Performance remains smooth despite generative elements
- [ ] Player feedback indicates high replayability value
- [ ] System can generate mystery in under 30 seconds

## References & Inspiration

### Games
- **Return of the Obra Dinn**: Deduction mechanics, notebook system
- **Ace Attorney series**: Dialogue-driven investigation, evidence presentation
- **Her Story / Telling Lies**: Non-linear investigation, piecing together truth
- **Papers, Please**: Attention to detail, catching inconsistencies
- **Disco Elysium**: Dialogue variety, character personality systems

### Mechanics to Consider
- **Contradiction Detection**: Highlight when testimonies don't align
- **Timeline Reconstruction**: Place events in chronological order
- **Evidence Combination**: Synthesize two clues for new information
- **Reputation System**: How you treat characters affects their cooperation

---

## Document Status

**Version**: 0.2 (Design Locked)  
**Last Updated**: 2025-11-07  
**Status**: Core design decisions finalized, ready for implementation

This document is a living guide for the game's design. All sections marked with questions are open for discussion and decision-making. As decisions are made, this document should be updated to reflect the game's evolving vision.

---

## Next Steps

1. **Answer Open Questions**: Go through questions and make design decisions
2. **Define Scope**: Determine what goes in Version 1.0 vs. future versions
3. **Character Development**: Create detailed profiles for initial character set
4. **Mystery Design**: Write out the first complete mystery scenario
5. **Technical Specification**: Create detailed specs for each game system
6. **Asset Planning**: Define art and audio requirements

**Let's discuss and refine this document together!**
