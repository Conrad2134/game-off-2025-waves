# Data Model: Dialog System

**Feature**: Dialog System for Character Interactions  
**Date**: November 8, 2025  
**Phase**: 1 (Design & Contracts)

## Overview

This document defines the data structures, entities, and relationships for the dialog system. The model follows Phaser 3 architecture patterns and TypeScript type safety principles, with data-driven design using JSON configuration files.

---

## Core Entities

### 1. DialogBox (UI Component)

**Purpose**: Visual container that displays character speech or object descriptions.

**Properties**:
| Property | Type | Description | Validation |
|----------|------|-------------|------------|
| `scene` | `Phaser.Scene` | Parent scene reference | Required, non-null |
| `x` | `number` | Screen X position (fixed to camera) | Integer, 0-1024 |
| `y` | `number` | Screen Y position (fixed to camera) | Integer, 0-768 |
| `width` | `number` | Dialog box width in pixels | Integer, min 200, max 1000 |
| `height` | `number` | Dialog box height in pixels | Integer, min 100, max 400 |
| `padding` | `number` | Internal padding in pixels | Integer, min 10, max 50 |
| `backgroundColor` | `number` | Fill color (hex) | Valid hex color |
| `borderColor` | `number` | Border color (hex) | Valid hex color |
| `borderWidth` | `number` | Border thickness in pixels | Integer, min 1, max 10 |
| `speakerText` | `Phaser.GameObjects.Text` | Character name display | Can be null for objects |
| `messageText` | `Phaser.GameObjects.Text` | Main message content | Required |
| `visible` | `boolean` | Visibility state | Boolean |
| `depth` | `number` | Z-index rendering order | Integer, typically 1000 |

**State Lifecycle**:
```
[Created] → [Hidden] → [Shown with content] → [Hidden] → [Destroyed]
     ↓           ↓              ↓                  ↓
  Pooled     show()         display text       hide()
```

**Relationships**:
- Managed by: `DialogManager` (1:1 when active)
- Renders: `DialogMessage` data (1:1)
- Positioned in: `LibraryScene` camera space

---

### 2. DialogMessage (Data Structure)

**Purpose**: Represents a single unit of dialog content (character speech or object description).

**Properties**:
| Property | Type | Description | Validation |
|----------|------|-------------|------------|
| `speaker` | `string \| null` | Character name (null for objects) | Max 50 chars, alphanumeric + spaces |
| `message` | `string` | Dialog text content | Required, max 500 chars |
| `type` | `'npc' \| 'object'` | Message source type | Enum validation |
| `characterId` | `string \| null` | Character identifier (for NPCs) | Must match metadata file name |
| `objectId` | `string \| null` | Object identifier (for interactables) | Must match object entity ID |

**Validation Rules**:
- At least one of `characterId` or `objectId` must be set
- If `type === 'npc'`, `speaker` and `characterId` must be provided
- If `type === 'object'`, `speaker` should be null
- Message must not be empty string
- Message text supports Unicode (German characters: ä, ö, ü, ß)

**Example**:
```typescript
// NPC dialog message
{
  speaker: "Valentin",
  message: "Guten Tag! I am Valentin, and someone has stolen my precious Erdbeerstrudel!",
  type: "npc",
  characterId: "valentin",
  objectId: null
}

// Object examination message
{
  speaker: null,
  message: "A tall bookshelf filled with old mystery novels. Nothing appears disturbed.",
  type: "object",
  characterId: null,
  objectId: "bookshelf-north"
}
```

---

### 3. DialogManager (System)

**Purpose**: Manages dialog state, coordinates dialog display, and handles input routing.

**Properties**:
| Property | Type | Description | Validation |
|----------|------|-------------|------------|
| `scene` | `Phaser.Scene` | Parent scene reference | Required |
| `currentDialog` | `DialogBox \| null` | Active dialog box instance | Null when closed |
| `currentMessage` | `DialogMessage \| null` | Currently displayed message | Null when closed |
| `isDialogOpen` | `boolean` | Dialog open state | Boolean |
| `dialogHistory` | `DialogMessage[]` | History of displayed messages | Max 50 entries |
| `player` | `PlayerCharacter` | Player entity reference (for locking) | Required |

**State Machine**:
```
[Idle] ←→ [DialogOpen]
  ↓           ↓
  No dialog   Movement locked
  visible     Input redirected
              Message displayed
```

**Methods**:
| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `open()` | `message: DialogMessage` | `void` | Shows dialog box with message |
| `close()` | - | `void` | Hides dialog box, unlocks player |
| `isOpen()` | - | `boolean` | Returns current dialog state |
| `getHistory()` | - | `DialogMessage[]` | Returns dialog history |
| `clearHistory()` | - | `void` | Clears dialog history |

**State Transitions**:
1. `Idle → DialogOpen`: Player presses interact key while in range of NPC/object
2. `DialogOpen → Idle`: Player presses close key (spacebar/enter/escape) OR moves out of range

---

### 4. InteractionIndicator (UI Component)

**Purpose**: Visual cue shown above interactable entities when player is in range.

**Properties**:
| Property | Type | Description | Validation |
|----------|------|-------------|------------|
| `scene` | `Phaser.Scene` | Parent scene reference | Required |
| `sprite` | `Phaser.GameObjects.Sprite` | Icon image (speech bubble, etc.) | Required |
| `targetEntity` | `NPCCharacter \| InteractableObject` | Entity to follow | Required |
| `offsetY` | `number` | Vertical offset above entity | Integer, typically -20 to -40 |
| `visible` | `boolean` | Visibility state | Boolean |
| `animation` | `Phaser.Tweens.Tween` | Bob animation reference | Optional |

**Animation**:
- Type: Sine wave vertical bob
- Duration: 800ms
- Range: ±5 pixels
- Repeat: Infinite yoyo

**Lifecycle**:
```
[Created] → [Hidden] → [Shown above entity] → [Hidden] → [Pooled]
                ↓             ↓                    ↓
           inRange==true   Follow entity     inRange==false
```

---

### 5. InteractionDetector (System)

**Purpose**: Detects proximity between player and interactable entities, triggers indicators and enables interaction.

**Properties**:
| Property | Type | Description | Validation |
|----------|------|-------------|------------|
| `scene` | `Phaser.Scene` | Parent scene reference | Required |
| `player` | `PlayerCharacter` | Player entity reference | Required |
| `interactables` | `Interactable[]` | List of all interactable entities | Array |
| `closestInteractable` | `Interactable \| null` | Currently in-range entity | Null if none in range |
| `activeIndicator` | `InteractionIndicator \| null` | Currently visible indicator | Null if none active |

**Methods**:
| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `update()` | - | `void` | Called each frame to check distances |
| `checkProximity()` | - | `Interactable \| null` | Returns closest in-range entity |
| `showIndicator()` | `entity: Interactable` | `void` | Displays indicator above entity |
| `hideIndicator()` | - | `void` | Hides current indicator |
| `canInteract()` | - | `boolean` | Returns true if interaction possible |

**Detection Algorithm**:
```typescript
1. For each interactable entity:
   - Calculate distance to player: Phaser.Math.Distance.Between(player.x, player.y, entity.x, entity.y)
   - If distance <= entity.interactionRange: add to candidateList

2. If candidateList.length > 0:
   - Sort by distance (ascending)
   - Set closestInteractable = candidateList[0]
   - Show indicator for closestInteractable
3. Else:
   - Set closestInteractable = null
   - Hide indicator
```

---

### 6. Interactable (Interface)

**Purpose**: Shared interface for entities that can be interacted with (NPCs and objects).

**Properties**:
| Property | Type | Description | Validation |
|----------|------|-------------|------------|
| `id` | `string` | Unique entity identifier | Required, unique |
| `x` | `number` | World X position | Float |
| `y` | `number` | World Y position | Float |
| `interactionRange` | `number` | Proximity threshold in pixels | Integer, 30-100 |
| `interactable` | `boolean` | Whether entity can be interacted with | Boolean, true |
| `dialogData` | `DialogData` | Dialog content reference | Required |

**Implementations**:
- `NPCCharacter extends Phaser.GameObjects.Container implements Interactable`
- `InteractableObject extends Phaser.GameObjects.Sprite implements Interactable`

---

### 7. DialogData (JSON Structure)

**Purpose**: Data-driven dialog content stored in character metadata or object definitions.

**Character Metadata Format** (`public/assets/sprites/characters/{name}/metadata.json`):
```json
{
  "name": "Valentin",
  "description": "A baker from Austria who loves Erdbeerstrudel",
  "animations": { /* existing animation data */ },
  "dialog": {
    "introduction": "Guten Tag! I am Valentin, and someone has stolen my precious Erdbeerstrudel!",
    "conversations": {
      // Future: branching conversation trees
      // "clue_found_flour": { "message": "...", "nextId": "..." }
    }
  }
}
```

**Object Definition Format** (stored in `InteractableObject` entity):
```typescript
{
  id: "bookshelf-north",
  type: "bookshelf",
  interactable: true,
  interactionRange: 50,
  dialog: {
    description: "A tall bookshelf filled with old mystery novels. Nothing appears disturbed."
  }
}
```

**Validation**:
- `dialog.introduction` is required for NPCs (string, max 500 chars)
- `dialog.description` is required for interactable objects (string, max 500 chars)
- Text must be valid UTF-8 (supports German characters)

---

## Data Relationships

```
┌─────────────────┐
│  LibraryScene   │
└────────┬────────┘
         │ owns
         ├──────────────┬──────────────┬──────────────┐
         ▼              ▼              ▼              ▼
  ┌─────────────┐ ┌──────────────┐ ┌──────────────┐ ┌────────────────┐
  │DialogManager│ │PlayerCharacter│ │NPCCharacter[]│ │InteractableObj[]│
  └─────┬───────┘ └───────┬──────┘ └──────┬───────┘ └────────┬───────┘
        │                 │               │                  │
        │ manages         │               │ implements       │ implements
        ▼                 │               ▼                  ▼
  ┌───────────┐           │        ┌──────────────────────────┐
  │ DialogBox │           │        │    Interactable          │
  └─────┬─────┘           │        └────────┬─────────────────┘
        │ displays        │                 │
        ▼                 │                 │ has
  ┌──────────────┐        │                 ▼
  │DialogMessage │        │          ┌──────────────┐
  └──────────────┘        │          │  DialogData  │
                          │          └──────────────┘
                          │
  ┌─────────────────────┐ │
  │InteractionDetector  │─┘
  └─────────┬───────────┘
            │ shows/hides
            ▼
  ┌───────────────────────┐
  │InteractionIndicator   │
  └───────────────────────┘
```

---

## State Transitions

### Dialog Interaction Flow

```
[Player moving in world]
         │
         ▼
InteractionDetector.update()
         │
         ├──> Distance check to all interactables
         │
         ▼
Distance <= interactionRange?
         │
    Yes  │  No
    ▼    │  └──> Hide indicator, closestInteractable = null
Show indicator above entity
closestInteractable = entity
         │
         ▼
Player presses interact key (Space/Enter)?
         │
    Yes  │  No
    ▼    │  └──> Wait for input
DialogManager.open(entity.dialogData)
         │
         ├──> Create DialogMessage
         ├──> Show DialogBox
         └──> PlayerCharacter.setMovementLocked(true)
         │
         ▼
Dialog visible, player locked
         │
         ├──> Player presses close key? → DialogManager.close()
         └──> Player moves out of range? → DialogManager.close()
                  │
                  ▼
         Hide DialogBox
         PlayerCharacter.setMovementLocked(false)
         Return to [Player moving in world]
```

---

## Data Flow Examples

### Example 1: Player talks to Valentin

```
1. Player walks toward Valentin (NPCCharacter)
2. InteractionDetector.update() calculates distance
3. Distance = 45 pixels (within interactionRange: 50)
4. InteractionIndicator appears above Valentin's head
5. Player presses SPACE key
6. LibraryScene detects input, calls DialogManager.open()
7. DialogManager loads Valentin's metadata.dialog.introduction
8. DialogManager creates DialogMessage: { speaker: "Valentin", message: "Guten Tag!...", type: "npc" }
9. DialogManager shows DialogBox with message
10. PlayerCharacter movement locked
11. Player reads message, presses SPACE again
12. DialogManager.close() called
13. DialogBox hidden, PlayerCharacter unlocked
14. Player resumes movement
```

### Example 2: Player examines bookshelf

```
1. Player walks toward bookshelf (InteractableObject)
2. InteractionDetector.update() calculates distance
3. Distance = 40 pixels (within interactionRange: 50)
4. InteractionIndicator appears above bookshelf
5. Player presses ENTER key
6. LibraryScene detects input, calls DialogManager.open()
7. DialogManager accesses bookshelf.dialog.description
8. DialogManager creates DialogMessage: { speaker: null, message: "A tall bookshelf...", type: "object" }
9. DialogManager shows DialogBox (no speaker name displayed)
10. PlayerCharacter movement locked
11. Player reads message, presses ESC
12. DialogManager.close() called
13. DialogBox hidden, PlayerCharacter unlocked
```

### Example 3: Auto-close on distance

```
1. Player in dialog with Sebastian
2. Player's friend bumps the keyboard (accidental movement input)
3. Player moves 5 pixels away from Sebastian
4. LibraryScene.update() runs InteractionDetector.checkProximity()
5. Distance = 55 pixels (exceeds interactionRange: 50)
6. LibraryScene calls DialogManager.close()
7. DialogBox auto-closes
8. PlayerCharacter unlocked
9. Indicator hidden
10. Player regains control
```

---

## Data Validation Requirements

### Input Validation

1. **Dialog message length**:
   - Min: 1 character
   - Max: 500 characters
   - Validation: Trim whitespace, reject empty strings

2. **Speaker name**:
   - Min: 1 character
   - Max: 50 characters
   - Pattern: Alphanumeric + spaces only
   - Validation: Reject special characters except spaces

3. **Interaction range**:
   - Min: 30 pixels
   - Max: 100 pixels
   - Validation: Integer only, reject floats

4. **Entity IDs**:
   - Pattern: Lowercase alphanumeric + hyphens
   - Validation: Must be unique across scene
   - Example: `valentin`, `bookshelf-north`, `dining-table-1`

### Asset Validation

1. **Character metadata files**:
   - Must exist at `public/assets/sprites/characters/{name}/metadata.json`
   - Must have valid JSON structure
   - Must contain `dialog.introduction` field
   - Fallback: Default message "Hello, I'm {characterName}."

2. **Object definitions**:
   - Must have `dialog.description` field if `interactable: true`
   - Fallback: "You examine the {objectType}."

### Runtime Validation

1. **Distance calculations**:
   - Use squared distance to avoid sqrt() overhead
   - Only convert to actual distance when needed for threshold comparison

2. **Input handling**:
   - Debounce interaction key using Phaser's `JustDown()` utility
   - Prevent multiple dialog opens while one is active

3. **State consistency**:
   - Ensure `DialogManager.isDialogOpen` matches `DialogBox.visible`
   - Ensure `PlayerCharacter.movementLocked` matches dialog state

---

## Performance Considerations

### Object Pooling

1. **DialogBox instances**: Pool of 1 (only one dialog active at a time)
   - Create once in scene initialization
   - Reuse by calling `show()/hide()` instead of `destroy()/create()`

2. **InteractionIndicator instances**: Pool size = number of interactable entities
   - One indicator per potential interactable
   - Activate/deactivate based on proximity

3. **DialogMessage objects**: No pooling needed (plain data objects)

### Optimization Strategies

1. **Distance checks**:
   - Use squared distance (avoid `Math.sqrt()`)
   - Check only entities within a reasonable screen radius
   - Optimization: Spatial partitioning if >20 interactables (not needed for MVP)

2. **Text rendering**:
   - Preload fonts during scene preload phase
   - Cache text measurements for word wrapping
   - Use single Text object, update content instead of destroying/recreating

3. **Update frequency**:
   - InteractionDetector: Check every frame (required for smooth indicator placement)
   - Auto-close distance check: Only when dialog is open (conditional)

---

## Future Expansion Hooks

### Branching Conversations (Future)

```json
// Expanded dialog data structure
{
  "dialog": {
    "introduction": "...",
    "conversations": {
      "initial": {
        "message": "What would you like to know?",
        "choices": [
          { "text": "Where were you?", "nextId": "alibi" },
          { "text": "What did you see?", "nextId": "witness" }
        ]
      },
      "alibi": {
        "message": "I was in the kitchen all morning.",
        "nextId": "initial"
      },
      "witness": {
        "message": "I saw someone near the strudel around 10 AM.",
        "condition": "clue_flour_found",
        "nextId": "initial"
      }
    }
  }
}
```

### Dialog History UI (Future)

- Store all displayed messages in `DialogManager.dialogHistory`
- Add notebook/journal UI to review past conversations
- Persist history to localStorage for session continuity

### Multiple Language Support (Future)

```json
{
  "dialog": {
    "introduction": {
      "en": "Good day! I am Valentin...",
      "de": "Guten Tag! Ich bin Valentin..."
    }
  }
}
```

---

**Data Model Complete**: Ready to proceed to contract definitions.
