# Quickstart Guide: Dialog System Implementation

**Feature**: Dialog System for Character Interactions  
**Date**: November 8, 2025  
**Phase**: 1 (Design & Contracts)

## Overview

This guide provides a step-by-step implementation plan for the dialog system. Follow these steps in order to integrate dialog functionality into the library scene.

**Estimated Implementation Time**: 4-6 hours  
**Prerequisites**: Phaser 3.80.0, TypeScript 5.0+, existing LibraryScene with NPCCharacter entities

---

## Implementation Steps

### Step 1: Create Type Definitions (30 minutes)

Create `src/types/dialog.ts` based on `contracts/types.ts`:

```typescript
// Copy interface definitions from contracts/types.ts
// Add to src/types/dialog.ts
export type DialogMessageType = 'npc' | 'object';
export interface DialogBoxConfig { /* ... */ }
export interface DialogMessage { /* ... */ }
export interface DialogData { /* ... */ }
export interface Interactable { /* ... */ }
export interface InteractionIndicatorConfig { /* ... */ }
export interface CharacterMetadata { /* ... */ }
```

**Verification**: Run `npm run build` to ensure types compile without errors.

---

### Step 2: Update Character Metadata Files (20 minutes)

Add dialog data to each character's metadata.json file:

```bash
# Files to update:
# public/assets/sprites/characters/emma/metadata.json
# public/assets/sprites/characters/klaus/metadata.json
# public/assets/sprites/characters/luca/metadata.json
# public/assets/sprites/characters/marianne/metadata.json
# public/assets/sprites/characters/sebastian/metadata.json
# public/assets/sprites/characters/valentin/metadata.json
```

Example structure:
```json
{
  "name": "Valentin",
  "description": "A baker from Austria who loves Erdbeerstrudel",
  "animations": { /* existing */ },
  "dialog": {
    "introduction": "Guten Tag! I am Valentin, and someone has stolen my precious Erdbeerstrudel! Can you help me find the culprit?"
  }
}
```

**Character Introduction Messages** (suggested):
- **Emma**: "Hi, I'm Emma! I was reading in the corner when I heard the commotion. Such a shame about the strudel."
- **Klaus**: "Good day. I'm Klaus. I didn't see anything unusual, but I'm happy to help investigate."
- **Luca**: "Hey there! Name's Luca. This mystery is quite intriguing, isn't it? Count me in!"
- **Marianne**: "Hello, I'm Marianne. I was organizing books when it happened. Let me know if you need anything."
- **Sebastian**: "Greetings. Sebastian here. I pride myself on my observational skills. Perhaps I can assist."
- **Valentin**: "Guten Tag! I am Valentin, and someone has stolen my precious Erdbeerstrudel! Can you help me find the culprit?"

**Verification**: Load metadata files in browser console to verify JSON is valid.

---

### Step 3: Update NPCCharacter Entity to Implement Interactable (30 minutes)

Modify `src/entities/npc-character.ts`:

```typescript
import type { Interactable, DialogData } from '../types/dialog';

export class NPCCharacter extends Phaser.GameObjects.Container implements Interactable {
  public readonly id: string;
  public readonly interactionRange: number = 50;
  public readonly interactable: boolean = true;
  public readonly dialogData: DialogData;
  public readonly metadata: CharacterMetadata;
  
  constructor(config: NPCCharacterConfig) {
    super(config.scene, config.x, config.y);
    
    this.id = config.characterId;
    this.metadata = config.metadata; // Loaded from JSON
    this.dialogData = config.metadata.dialog;
    
    // ... existing constructor code
  }
  
  // Add getter for displayHeight (required by Interactable)
  get displayHeight(): number {
    return this.sprite.displayHeight;
  }
}
```

**Verification**: Compile and check that NPCCharacter satisfies Interactable interface.

---

### Step 4: Create DialogBox Component (1.5 hours)

Create `src/components/dialog-box.ts` implementing `contracts/dialog-box.ts`:

**Key Implementation Points**:

1. **Create background using Graphics**:
```typescript
const bg = this.scene.add.graphics();
bg.fillStyle(this.backgroundColor, 0.85);
bg.fillRect(0, 0, this.width, this.height);
bg.lineStyle(this.borderWidth, this.borderColor, 1);
bg.strokeRect(0, 0, this.width, this.height);
```

2. **Create text objects with pixel-perfect settings**:
```typescript
this.speakerText = this.scene.add.text(20, 10, '', {
  fontFamily: 'Arial, sans-serif',
  fontSize: '20px',
  color: '#ffffff',
  fontStyle: 'bold',
});
this.speakerText.setResolution(2); // Crisp pixel rendering

this.messageText = this.scene.add.text(20, 40, '', {
  fontFamily: 'Arial, sans-serif',
  fontSize: '16px',
  color: '#ffffff',
  wordWrap: { width: this.width - 40, useAdvancedWrap: true },
});
this.messageText.setResolution(2);
```

3. **Set fixed to camera**:
```typescript
this.container.setScrollFactor(0);
this.container.setDepth(1000);
```

4. **Implement show/hide methods**:
```typescript
show(message: DialogMessage): void {
  this.validateMessage(message);
  this.currentMessage = message;
  
  // Update speaker text (hide if null)
  if (message.speaker) {
    this.speakerText.setText(message.speaker);
    this.speakerText.setVisible(true);
  } else {
    this.speakerText.setVisible(false);
  }
  
  // Update message text
  this.messageText.setText(message.message);
  
  // Show container
  this.container.setVisible(true);
}

hide(): void {
  this.container.setVisible(false);
  this.currentMessage = null;
}
```

**Verification**: Create test scene and manually call `show()` with test message.

---

### Step 5: Create InteractionIndicator Component (45 minutes)

Create `src/components/interaction-indicator.ts`:

**Key Implementation Points**:

1. **Load indicator sprite** (use placeholder if no asset):
```typescript
// In scene.preload():
this.load.image('interaction-icon', 'assets/ui/interaction-icon.png');
// Or create simple placeholder in code:
const graphics = this.add.graphics();
graphics.fillStyle(0xffffff);
graphics.fillCircle(0, -10, 8);
graphics.generateTexture('interaction-icon', 16, 16);
```

2. **Create animated indicator**:
```typescript
constructor(config: InteractionIndicatorConfig) {
  this.sprite = config.scene.add.sprite(0, 0, config.spriteKey);
  this.sprite.setVisible(false);
  this.offsetY = config.offsetY ?? -30;
  
  // Bob animation
  this.animation = config.scene.tweens.add({
    targets: this.sprite,
    y: '+=5',
    duration: config.animationDuration ?? 800,
    yoyo: true,
    repeat: -1,
    ease: 'Sine.easeInOut',
  });
}

showAbove(entity: Interactable): void {
  this.targetEntity = entity;
  this.updatePosition();
  this.sprite.setVisible(true);
}

updatePosition(): void {
  if (this.targetEntity) {
    this.sprite.setPosition(
      this.targetEntity.x,
      this.targetEntity.y - this.targetEntity.displayHeight / 2 + this.offsetY
    );
  }
}

hide(): void {
  this.sprite.setVisible(false);
  this.targetEntity = null;
}
```

**Verification**: Create indicator and test show/hide above an NPC.

---

### Step 6: Create InteractionDetector System (1 hour)

Create `src/systems/interaction-detector.ts` implementing `contracts/interaction-detector.ts`:

**Key Implementation Points**:

1. **Update method (called every frame)**:
```typescript
update(): void {
  if (!this.enabled) return;
  
  const distances = this.calculateDistances();
  const closest = this.findClosest(distances);
  
  if (closest !== this.closestInteractable) {
    // Closest entity changed
    if (this.closestInteractable) {
      this.hideIndicator();
    }
    this.closestInteractable = closest;
    if (this.closestInteractable) {
      this.showIndicator(this.closestInteractable);
    }
  } else if (this.closestInteractable) {
    // Update indicator position (follow entity)
    this.updateIndicatorPosition();
  }
}
```

2. **Distance calculation (optimized)**:
```typescript
private calculateDistances(): Array<[Interactable, number]> {
  const results: Array<[Interactable, number]> = [];
  
  for (const entity of this.interactables) {
    if (!entity.interactable) continue;
    
    const distSq = Phaser.Math.Distance.Squared(
      this.player.x,
      this.player.y,
      entity.x,
      entity.y
    );
    
    // Only include if within range (use squared distance)
    const rangeSq = entity.interactionRange * entity.interactionRange;
    if (distSq <= rangeSq) {
      results.push([entity, Math.sqrt(distSq)]);
    }
  }
  
  return results;
}

private findClosest(distances: Array<[Interactable, number]>): Interactable | null {
  if (distances.length === 0) return null;
  
  distances.sort((a, b) => a[1] - b[1]);
  return distances[0][0];
}
```

**Verification**: Log `closestInteractable` in update loop and walk near NPCs.

---

### Step 7: Create DialogManager System (1 hour)

Create `src/systems/dialog-manager.ts` implementing `contracts/dialog-manager.ts`:

**Key Implementation Points**:

1. **Open dialog method**:
```typescript
open(
  dialogData: DialogData,
  sourceType: 'npc' | 'object',
  sourceId: string,
  speakerName?: string | null
): void {
  if (this.isDialogOpen) {
    console.warn('Dialog already open, ignoring open request');
    return;
  }
  
  const message = this.createMessage(dialogData, sourceType, sourceId, speakerName);
  this.currentMessage = message;
  this.dialogBox.show(message);
  this.lockPlayerMovement();
  this.addToHistory(message);
  this.isDialogOpen = true;
}
```

2. **Handle input method**:
```typescript
handleInput(): void {
  if (this.isDialogOpen) {
    // Check for close keys
    if (this.isCloseKeyPressed() || this.isInteractKeyPressed()) {
      this.close();
    }
  }
  // Note: Opening dialog is handled by scene (when interact key pressed near entity)
}

private isInteractKeyPressed(): boolean {
  return this.keys.interact.some(key => Phaser.Input.Keyboard.JustDown(key));
}

private isCloseKeyPressed(): boolean {
  return Phaser.Input.Keyboard.JustDown(this.keys.close);
}
```

3. **Create message helper**:
```typescript
private createMessage(
  dialogData: DialogData,
  sourceType: 'npc' | 'object',
  sourceId: string,
  speakerName?: string | null
): DialogMessage {
  let message: string;
  
  if (sourceType === 'npc' && dialogData.introduction) {
    message = dialogData.introduction;
  } else if (sourceType === 'object' && dialogData.description) {
    message = dialogData.description;
  } else {
    message = 'No dialog available.'; // Fallback
  }
  
  return {
    speaker: speakerName ?? null,
    message,
    type: sourceType,
    characterId: sourceType === 'npc' ? sourceId : null,
    objectId: sourceType === 'object' ? sourceId : null,
  };
}
```

**Verification**: Test open/close with mock data.

---

### Step 8: Integrate into LibraryScene (1 hour)

Modify `src/scenes/library-scene.ts`:

**Key Changes**:

1. **Add system properties**:
```typescript
export class LibraryScene extends Phaser.Scene {
  // ... existing properties
  private dialogBox!: DialogBox;
  private dialogManager!: DialogManager;
  private interactionDetector!: InteractionDetector;
  private interactKey!: Phaser.Input.Keyboard.Key;
  private enterKey!: Phaser.Input.Keyboard.Key;
}
```

2. **Initialize systems in create()**:
```typescript
create(data?: LibrarySceneData): void {
  // ... existing scene setup
  
  // Create dialog box
  this.dialogBox = new DialogBox({
    scene: this,
    x: 512,
    y: 680,
    width: 900,
    height: 150,
  });
  
  // Create dialog manager
  this.dialogManager = new DialogManager({
    scene: this,
    player: this.player,
    dialogBox: this.dialogBox,
  });
  
  // Create interaction detector
  this.interactionDetector = new InteractionDetector({
    scene: this,
    player: this.player,
    indicatorConfig: {
      spriteKey: 'interaction-icon',
    },
  });
  
  // Register all NPCs as interactable
  this.npcs.forEach(npc => {
    this.interactionDetector.registerInteractable(npc);
  });
  
  // Setup interaction keys
  this.interactKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
  this.enterKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
}
```

3. **Update interaction detection and input handling**:
```typescript
update(time: number, delta: number): void {
  // ... existing update logic (player movement, etc.)
  
  // Update interaction detection
  this.interactionDetector.update();
  
  // Handle dialog input
  this.dialogManager.handleInput();
  
  // Handle interaction trigger
  if (!this.dialogManager.isOpen() && this.interactionDetector.canInteract()) {
    if (Phaser.Input.Keyboard.JustDown(this.interactKey) || 
        Phaser.Input.Keyboard.JustDown(this.enterKey)) {
      const entity = this.interactionDetector.getClosestInteractable();
      if (entity) {
        this.dialogManager.open(
          entity.dialogData,
          'npc', // Assume NPC for now; determine from entity type in future
          entity.id,
          (entity as NPCCharacter).metadata?.name
        );
      }
    }
  }
  
  // Auto-close dialog if player moves out of range
  if (this.dialogManager.isOpen() && this.interactionDetector.closestInteractable) {
    const entity = this.interactionDetector.closestInteractable;
    const distance = Phaser.Math.Distance.Between(
      this.player.x,
      this.player.y,
      entity.x,
      entity.y
    );
    const closeThreshold = entity.interactionRange + 10; // Buffer
    if (distance > closeThreshold) {
      this.dialogManager.close();
    }
  }
}
```

**Verification**: Run game, walk up to NPCs, verify indicators appear, press spacebar to open dialog.

---

### Step 9: Load Character Metadata in Scene (30 minutes)

Ensure character metadata is loaded and passed to NPCCharacter constructors:

```typescript
// In LibraryScene.preload()
this.load.json('emma-metadata', 'assets/sprites/characters/emma/metadata.json');
this.load.json('klaus-metadata', 'assets/sprites/characters/klaus/metadata.json');
this.load.json('luca-metadata', 'assets/sprites/characters/luca/metadata.json');
this.load.json('marianne-metadata', 'assets/sprites/characters/marianne/metadata.json');
this.load.json('sebastian-metadata', 'assets/sprites/characters/sebastian/metadata.json');
this.load.json('valentin-metadata', 'assets/sprites/characters/valentin/metadata.json');

// In LibraryScene.create()
const valentinMetadata = this.cache.json.get('valentin-metadata') as CharacterMetadata;
const valentin = new NPCCharacter({
  scene: this,
  x: 500,
  y: 400,
  characterId: 'valentin',
  metadata: valentinMetadata,
  // ... other config
});
```

**Verification**: Check browser console for metadata load errors.

---

### Step 10: Testing and Polish (30 minutes)

**Manual Test Checklist**:

- [ ] Walk up to each NPC, verify indicator appears at correct range
- [ ] Press spacebar/enter, verify dialog opens with correct character name and message
- [ ] Verify German characters render correctly (ä, ö, ü, ß)
- [ ] Press spacebar/enter/escape while dialog open, verify dialog closes
- [ ] Walk away while dialog open, verify auto-close at distance threshold
- [ ] Verify player movement locked while dialog open
- [ ] Verify only one indicator shows when multiple NPCs nearby
- [ ] Test with multiple NPCs in close proximity, verify closest gets indicator
- [ ] Verify dialog box is pixel-perfect (no blurry edges)
- [ ] Verify text wraps correctly for long messages

**Common Issues and Fixes**:

| Issue | Solution |
|-------|----------|
| Blurry text | Set `text.setResolution(2)` |
| Indicator doesn't follow NPC | Call `updatePosition()` in detector's update loop |
| Dialog opens repeatedly | Use `Phaser.Input.Keyboard.JustDown()` instead of `isDown` |
| Movement not locked | Verify `player.setMovementLocked(true)` is called |
| Metadata not loading | Check file paths and JSON validity |

---

## Configuration Values

### Recommended Settings

```typescript
// Dialog Box
const dialogBoxConfig = {
  x: 512,              // Center of 1024px screen
  y: 680,              // Bottom third (768 - 150/2 - margin)
  width: 900,          // Most of screen width
  height: 150,         // 2-3 lines of text
  padding: 20,         // Comfortable margin
  backgroundColor: 0x000000,
  borderColor: 0xffffff,
  borderWidth: 4,
};

// Interaction Range
const interactionRange = 50; // 3-4 character widths (scaled sprite ~14px * 2 = 28px)

// Indicator
const indicatorConfig = {
  offsetY: -30,        // 30 pixels above head
  animationDuration: 800,
  animationRange: 5,
};

// Auto-close Buffer
const autoCloseBuffer = 10; // Prevents flickering
```

---

## Next Steps

After completing this implementation:

1. **Test thoroughly** with all 6 characters
2. **Add object interactions** (bookshelves, locked door) using same system
3. **Create interaction indicator sprite** (replace placeholder)
4. **Add sound effects** for dialog open/close (optional)
5. **Implement dialog history UI** (notebook/journal)
6. **Add branching conversations** based on clues found

---

## Troubleshooting

### Dialog doesn't open
- Check that NPC implements `Interactable` interface
- Verify `metadata.dialog.introduction` exists and is loaded
- Check console for errors in `DialogManager.open()`

### Indicator not showing
- Verify `interaction-icon` sprite is loaded
- Check that `interactionDetector.update()` is called in scene's update loop
- Ensure NPC's `interactable` property is `true`

### Player movement not locked
- Verify `PlayerCharacter.setMovementLocked()` method exists
- Check that `dialogManager.open()` calls `lockPlayerMovement()`
- Ensure `movementLocked` flag is checked in player's update logic

### Text rendering issues
- For blurry text: Set `text.setResolution(2)`
- For missing characters: Use web font with extended Latin character set
- For wrapping issues: Adjust `wordWrap.width` to dialog box width minus padding

---

**Implementation Complete**: Dialog system ready for integration into full game.
