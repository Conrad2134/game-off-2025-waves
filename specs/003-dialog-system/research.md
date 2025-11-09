# Research: Dialog System

**Feature**: Dialog System for Character Interactions  
**Date**: November 8, 2025  
**Phase**: 0 (Outline & Research)

## Overview

This document captures research findings and technical decisions for implementing the dialog system in "Who Ate Valentin's Erdbeerstrudel?". The system enables player-NPC interactions through proximity-based dialog boxes, visual interaction indicators, and data-driven dialog content management.

---

## Research Areas

### 1. Dialog UI Rendering in Phaser 3

**Decision**: Use Phaser's native Graphics and Text objects for dialog boxes, not DOM overlays.

**Rationale**:
- Phaser's rendering pipeline maintains 60 FPS with native game objects
- Graphics API provides pixel-perfect control for borders and backgrounds
- Text objects support proper scaling and pixel art rendering when configured correctly
- Avoids DOM/Canvas synchronization issues and z-index conflicts
- Consistent with existing game architecture (everything is Phaser objects)

**Alternatives Considered**:
- **HTML/CSS overlay**: Rejected because it breaks pixel art rendering consistency, complicates coordinate system translation between DOM and canvas, and adds complexity for keyboard input handling
- **Third-party UI library (Rexrainbow/phaser3-rex-plugins)**: Rejected for MVP to minimize dependencies; can revisit for advanced features like scrolling text or complex layouts
- **Bitmap font rendering**: Considered but rejected for initial implementation due to asset creation overhead; web fonts with `setResolution(2)` provide adequate pixel art aesthetic

**Implementation Notes**:
- Use `Phaser.GameObjects.Graphics` for dialog box background and border
- Use `Phaser.GameObjects.Text` with web fonts (e.g., "Press Start 2P" or "Courier New")
- Set text resolution to 2x for crisp rendering: `text.setResolution(2)`
- Position dialog box at integer coordinates (e.g., bottom of screen at y=680)
- Text wrapping handled by Phaser's `wordWrap` configuration

---

### 2. Proximity Detection for Interaction Triggers

**Decision**: Use Phaser Arcade Physics distance checks with custom interaction radius (45-60 pixels).

**Rationale**:
- Arcade Physics already active in the game (gravity: {x:0, y:0} for top-down)
- `Phaser.Math.Distance.Between()` provides efficient distance calculation
- No need for full collision detection; simple radius check is sufficient
- Can update check in scene's `update()` loop without performance impact
- Allows flexible interaction ranges per NPC (e.g., shy vs. friendly characters)

**Alternatives Considered**:
- **Overlap/collision bodies**: Rejected because it requires creating physics bodies for interaction zones, which is overkill for simple distance checks
- **Grid-based proximity**: Rejected because continuous distance is more natural for pixel-based movement and avoids grid snapping artifacts
- **Raycasting**: Rejected as unnecessarily complex for top-down proximity detection

**Implementation Notes**:
- Calculate distance in scene's `update()` method: `Phaser.Math.Distance.Between(player.x, player.y, npc.x, npc.y)`
- Interaction range stored in NPC entity configuration (default 50 pixels)
- Check against closest NPC only to avoid multiple indicators appearing simultaneously
- Optimization: Use squared distance (`Between^2`) to avoid expensive sqrt calculations

---

### 3. Dialog Data Storage Format

**Decision**: Extend existing character `metadata.json` files with a `dialog` property containing introduction text and future conversation trees.

**Rationale**:
- Follows Constitution Principle III (Data-Driven Design)
- Character metadata files already exist and are loaded by the asset system
- JSON structure is flexible for future expansion (branching conversations, clue-based responses)
- Keeps character-specific data colocated with character sprites
- Easy to author and modify without touching code

**Alternatives Considered**:
- **Centralized dialogues.json file**: Rejected because it separates dialog data from character assets, making it harder to maintain and version control character-specific content
- **Yarn Spinner or Ink integration**: Rejected for MVP; these narrative engines add significant complexity and are overkill for simple introduction messages
- **Hardcoded strings in NPC entities**: Rejected as violation of data-driven design principle

**Implementation Notes**:
```json
// public/assets/sprites/characters/valentin/metadata.json
{
  "name": "Valentin",
  "description": "A baker from Austria who loves Erdbeerstrudel",
  "animations": { ... },
  "dialog": {
    "introduction": "Guten Tag! I am Valentin, and someone has stolen my precious Erdbeerstrudel!",
    "conversations": {
      // Future: branching dialog trees based on game state
    }
  }
}
```

- Load metadata in scene's `preload()` using existing asset loading
- Parse and validate dialog structure in `create()` with fallback for missing data
- Access via `metadata.dialog.introduction` in DialogManager

---

### 4. Interaction Indicator Visual Design

**Decision**: Use a simple sprite-based icon (speech bubble or arrow) positioned above NPC's head with gentle bob animation.

**Rationale**:
- Sprite-based approach is consistent with pixel art aesthetic
- Simple animation (sine wave bob) is performant and visually clear
- Positioned relative to NPC position ensures indicator follows character if they move (future)
- Can be pooled efficiently using Phaser Groups

**Alternatives Considered**:
- **Particle effects**: Rejected as too visually busy for a cozy mystery game
- **Outline glow on NPC sprite**: Rejected because it's harder to implement with pixel art and less visually distinct
- **Text prompt ("Press E")**: Rejected as less elegant and breaks visual style; prefer icon-based affordance

**Implementation Notes**:
- Create sprite in `components/interaction-indicator.ts`
- Use `scene.tweens.add()` for bob animation: `y: '+=5', yoyo: true, repeat: -1, duration: 800`
- Position above NPC: `indicator.y = npc.y - npc.displayHeight/2 - 20`
- Show/hide based on proximity check in scene's `update()` loop
- Asset: Simple 16x16 or 32x32 speech bubble icon (can be generated or hand-drawn)

---

### 5. Input Handling for Dialog Interactions

**Decision**: Use Phaser's keyboard input system with spacebar, enter, and escape keys mapped to dialog actions.

**Rationale**:
- Phaser's `Input.Keyboard` API already in use for player movement (WASD/arrows)
- Single key press detection avoids repeated triggers: `keyboard.addKey().isDown` with custom debouncing
- Spacebar/enter are standard game interaction keys; escape for closing is intuitive
- Keyboard events work well with existing input architecture

**Alternatives Considered**:
- **Click-based interaction**: Rejected because game uses keyboard for movement; mixing input methods reduces cohesion
- **Gamepad support**: Deferred to future iteration; not required for MVP
- **Mouse hover for proximity**: Rejected because interaction is position-based, not selection-based

**Implementation Notes**:
- Add keys in scene's `create()` method:
  ```typescript
  this.interactKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
  this.enterKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
  this.escapeKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
  ```
- Check in `update()` with Phaser's `JustDown()` utility to prevent repeated triggers:
  ```typescript
  if (Phaser.Input.Keyboard.JustDown(this.interactKey)) { /* open dialog */ }
  ```
- Dialog manager handles key routing based on dialog state (open vs closed)

---

### 6. Movement Locking During Dialog Display

**Decision**: Set player character's movement lock flag (`player.setMovementLocked(true)`) when dialog opens.

**Rationale**:
- Player entity already has `movementLocked` property (from existing implementation)
- Clean separation of concerns: dialog system controls lock state, player entity respects it
- No need to pause entire scene; other game logic can continue (animations, etc.)
- Unlocking on dialog close or out-of-range movement is straightforward

**Alternatives Considered**:
- **Pause entire scene**: Rejected because it would freeze all animations and potentially cause issues with Phaser's scene lifecycle
- **Physics body velocity zeroing**: Rejected as less clean; doesn't prevent input from being processed, just movement application
- **Input key disabling**: Rejected because it's more complex and doesn't generalize to future input methods (gamepad, etc.)

**Implementation Notes**:
- PlayerCharacter already has `setMovementLocked(locked: boolean)` method
- DialogManager calls `player.setMovementLocked(true)` when opening dialog
- DialogManager calls `player.setMovementLocked(false)` when closing dialog
- Auto-close dialog checks distance in `update()` and calls close if player moved (requires unlock check)

---

### 7. Text Wrapping and Special Character Support

**Decision**: Use Phaser's built-in word wrap feature with Unicode-aware font rendering for German characters.

**Rationale**:
- Phaser Text objects support Unicode out of the box
- Word wrap configuration (`wordWrap: {width, useAdvancedWrap: true}`) handles multi-line text automatically
- Web fonts (Google Fonts, etc.) include full character sets including ä, ö, ü, ß
- No need for custom text rendering logic

**Alternatives Considered**:
- **Manual line breaking**: Rejected as error-prone and unnecessary given Phaser's built-in support
- **Bitmap fonts with extended character sets**: Rejected due to asset creation complexity for MVP
- **Separate font files per language**: Rejected as over-engineered for a single-language game

**Implementation Notes**:
- Configure text wrapping:
  ```typescript
  text.setWordWrapWidth(dialogBoxWidth - 40); // 20px padding each side
  text.setWordWrapCallback((text) => text.split(' ')); // Default word break
  ```
- Test with German phrases from character descriptions: "Guten Tag!", "Erdbeerstrudel", "Gemütlichkeit"
- Font recommendations: "Press Start 2P" (Google Fonts) includes Latin Extended characters

---

### 8. Dialog Box Positioning and Z-Index

**Decision**: Position dialog box at bottom-center of screen (y=680) with depth set to 1000 to ensure it renders above all game objects.

**Rationale**:
- Bottom-center is standard for visual novels and RPGs; doesn't obscure most of the game world
- Fixed screen position (not world position) ensures dialog stays visible during camera movement
- High depth value (1000) guarantees dialog renders on top of characters, furniture, etc.
- Phaser's depth sorting is efficient and automatic

**Alternatives Considered**:
- **Top-center positioning**: Rejected because it could obscure NPC characters during conversation
- **Dynamic positioning near NPC**: Rejected as more complex and potentially confusing (dialog box jumping around)
- **Full-screen overlay**: Rejected as too intrusive for simple introductions

**Implementation Notes**:
- Create dialog box in scene's camera view, not world space: `this.add.container(512, 680)` (center x, bottom y)
- Set depth: `dialogBox.setDepth(1000)`
- Set `setScrollFactor(0)` to fix to camera instead of world coordinates
- Dialog box size: 900x150 pixels (fits character name + 2-3 lines of text)

---

### 9. Auto-Close Behavior on Distance Threshold

**Decision**: Check player-NPC distance every frame in `update()` and auto-close dialog if distance exceeds interaction range + 10 pixel buffer.

**Rationale**:
- Prevents player from wandering away while dialog is open (breaks immersion)
- Buffer zone (50 + 10 = 60 pixels) prevents flickering if player moves slightly
- Continuous distance check is performant (simple math calculation)
- Aligns with interaction range detection (consistent mechanic)

**Alternatives Considered**:
- **No auto-close**: Rejected because spec explicitly requires this behavior for better UX
- **Timer-based auto-close**: Rejected as less intuitive than distance-based
- **Trigger zone exit**: Rejected because we're not using trigger zones, we use distance checks

**Implementation Notes**:
```typescript
// In LibraryScene.update()
if (this.dialogManager.isOpen()) {
  const distance = Phaser.Math.Distance.Between(player.x, player.y, currentNPC.x, currentNPC.y);
  const closeThreshold = currentNPC.interactionRange + 10; // Buffer
  if (distance > closeThreshold) {
    this.dialogManager.close();
  }
}
```

---

### 10. Object Interaction Message Reusability

**Decision**: Use the same DialogBox component for both NPC conversations and object examination messages, differentiated by message source.

**Rationale**:
- DRY principle: one dialog UI implementation serves multiple use cases
- Consistent visual presentation for all text interactions
- Simplified state management (one dialog open at a time)
- Easy to extend for future interaction types (clue discovery, etc.)

**Alternatives Considered**:
- **Separate tooltip component for objects**: Rejected as unnecessary duplication; dialog box already fits the need
- **Context menu system**: Rejected as over-engineered for simple examination text

**Implementation Notes**:
- DialogBox accepts configuration: `{ speaker?: string, message: string, type: 'npc' | 'object' }`
- Speaker name displayed only if provided (NPCs); omitted for objects
- InteractionDetector system checks for both NPCs and interactive objects
- Object metadata format: `{ type: 'object', interactable: true, description: 'A tall bookshelf...' }`

---

## Summary of Key Technical Choices

| Area | Decision | Primary Rationale |
|------|----------|------------------|
| UI Rendering | Phaser Graphics/Text | Pixel-perfect control, no DOM sync issues |
| Proximity Detection | Arcade Physics distance | Already in use, efficient, flexible |
| Data Storage | Extend metadata.json | Data-driven design, colocated with assets |
| Interaction Indicator | Sprite with bob animation | Pixel art consistent, visually clear |
| Input Handling | Keyboard API (Space/Enter/Esc) | Consistent with existing controls |
| Movement Locking | Player entity flag | Clean separation of concerns |
| Text Rendering | Phaser word wrap + Unicode fonts | Built-in support, German characters |
| Positioning | Bottom-center, depth 1000 | Standard RPG convention, always visible |
| Auto-Close | Distance check in update() | Prevents immersion break, uses existing system |
| Object Messages | Reuse DialogBox component | DRY, consistent UX |

---

## Risks and Mitigations

### Risk 1: Text rendering blurriness
**Likelihood**: Medium  
**Impact**: High (breaks pixel art aesthetic)  
**Mitigation**: Use `text.setResolution(2)` and test with bitmap fonts if web fonts don't render crisply at target resolution.

### Risk 2: Input key conflicts with future systems
**Likelihood**: Low  
**Impact**: Medium (may need to refactor key bindings)  
**Mitigation**: Centralize key bindings in a configuration file for easy remapping.

### Risk 3: Performance degradation with many NPCs
**Likelihood**: Low (only 6 characters in MVP)  
**Impact**: Low  
**Mitigation**: Use object pooling for indicators and optimize distance checks (use squared distance).

---

## Open Questions for Phase 1

1. Should dialog text support markup (bold, color) for emphasis? → Defer to future iteration unless trivial to implement.
2. Should we add sound effects for dialog open/close? → Out of scope for this feature, but keep audio hooks in DialogManager API.
3. How will branching conversations work in future? → Design data model to support future expansion (conversation tree structure).

---

**Research Complete**: Ready to proceed to Phase 1 (Data Model & Contracts).
