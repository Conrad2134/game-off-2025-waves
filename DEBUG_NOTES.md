# Dialogue Tier Debug Notes

## Current Status
✅ **FIXED** - The dialogue tier system now works correctly! Clues are InteractableObjects that can be discovered through the normal interaction system.

## Debug Commands Available

Open browser console and use these commands:

```javascript
// Check current clue status
window.showClues()

// Check conversation history
window.showConversations()

// Manually unlock all clues (makes them visible/interactive in post-incident phase)
window.unlockAllClues()

// Manually mark a clue as discovered (bypasses interaction)
window.discoverClue("strudel-crumbs")
window.discoverClue("suspicious-napkin")
window.discoverClue("desk-papers")
```

## Testing the Tier System

### Step 1: Start the game and progress to post-incident phase
1. Start game and watch Valentin's introduction
2. Talk to Emma, Luca, Marianne, Sebastian (4 NPCs to trigger incident)
3. Watch the incident cutscene
4. Post-incident phase begins - 2 clues automatically unlock

### Step 2: Discover clues naturally
1. Walk up to glowing clue objects (strudel-crumbs and suspicious-napkin are initially unlocked)
2. Press SPACE or ENTER when near a clue to discover it
3. Clue is automatically added to your notebook

### Step 3: Watch dialogue tiers unlock
- **Tier 0 (0 clues)**: Basic post-incident dialogue
- **Tier 1 (1+ clues)**: NPCs reveal more information, some unlock additional clues
- **Tier 2 (3+ clues)**: Deeper revelations, NPCs start pointing fingers
- **Tier 3 (5 clues)**: Full confessions from all NPCs

### Quick Test with Debug Commands
```javascript
// Skip ahead - unlock all clues immediately
window.unlockAllClues()

// Then walk around and discover them, or use:
window.discoverClue("strudel-crumbs")
window.discoverClue("suspicious-napkin") 
// Now talk to NPCs - should see tier 1 dialogue

window.discoverClue("desk-papers")
// Now at tier 2

window.discoverClue("bookshelf-hiding-spot")
window.discoverClue("empty-plate")
// Now at tier 3 - full confessions
```

## How It Works

### Clue Discovery Flow
1. **Locked State**: Clue exists but is not interactable (hidden/disabled)
2. **Unlocked State**: Clue becomes interactable (glows yellow, shows interaction indicator when player is near)
3. **Discovered State**: Player pressed SPACE/ENTER near the clue, it's recorded in notebook and progression manager

### Tier Unlocking
- Progression manager tracks `discoveredClues` count
- When opening dialogue, DialogManager calls `getAvailableTier()` which checks discovered count
- Dialogue is clamped to the highest available tier based on clues discovered
- Each tier has specific `requiredClues` values (0, 1, 3, 5)

## Debug Logging

Console output shows:
- `[ProgressionManager.getDiscoveredClueCount]` - Tracks discovered count
- `[ProgressionManager.getDialogTier]` - Calculates tier from count  
- `[getAvailableTier]` - Shows tier availability check per character
- `[Dialog]` - Which tier dialogue is actually shown
- `🔍 [ProgressionManager.notifyClueDiscovered]` - When clues are discovered

## Implementation Details

### System Architecture
**All interactable clue objects are defined in `src/data/clues.json`**

The clues.json file defines 5 physical objects in the library:
- `strudel-crumbs` - Pastry crumbs near the dining table
- `suspicious-napkin` - Stained napkin 
- `desk-papers` - Valentin's crossed-out recipe on his desk
- `bookshelf-hiding-spot` - Hidden gap behind the bookshelf
- `empty-plate` - The suspiciously clean plate

Each clue has:
- Position, sprite, description
- `initiallyUnlocked` flag (2 clues start unlocked)
- `unlockedBy` field (which NPC dialogue unlocks it)
- `notebookNote` (what gets recorded when discovered)

### What Was Fixed
1. ✅ **Unified System** - Clues ARE the interactable objects (no separate entities)
2. ✅ Clues created as `InteractableObject` instances from clues.json
3. ✅ Clues register with the `InteractionDetector` system
4. ✅ Proximity indicator appears when near unlocked clues
5. ✅ SPACE/ENTER interaction discovers clues
6. ✅ Discovery calls `clueTracker.discoverClue()` which notifies progression manager
7. ✅ Dialogue tier gates properly based on discovered count

### Key Files
- `src/data/clues.json` - **Single source of truth for all interactable clues**
- `src/systems/clue-tracker.ts` - Creates InteractableObjects from clues.json
- `src/scenes/library-scene.ts` - Registers clues, handles discovery on interaction
- `src/systems/dialog-manager.ts` - Checks tier availability with `getAvailableTier()`
- `src/systems/game-progression-manager.ts` - Tracks discovered clues, calculates tiers

## Tier Requirements

- **Tier 0**: 0 clues discovered ✅
- **Tier 1**: 1 clue discovered ✅ 
- **Tier 2**: 3 clues discovered ✅
- **Tier 3**: 5 clues discovered ✅

All dialogue JSON files have correct `requiredClues` values validated on load.
