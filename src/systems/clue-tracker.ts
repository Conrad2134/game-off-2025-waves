/**
 * Clue Tracker System
 * 
 * Manages clue discovery state, unlock conditions, and visual representations.
 * Handles three clue states: locked, unlocked, discovered.
 */

import Phaser from 'phaser';
import type { ClueData, ClueState, CluesConfig } from '../types/clue';
import type { SaveManager } from './save-manager';
import { InteractableObject } from '../entities/interactable-object';
import { validateCluesConfig, logValidationResult } from '../utils/validation';

export interface ClueTrackerConfig {
  /** Parent Phaser scene */
  scene: Phaser.Scene;
  
  /** Registry key for singleton access (default: 'clueTracker') */
  registryKey?: string;
}

export class ClueTracker extends Phaser.Events.EventEmitter {
  private scene: Phaser.Scene;
  private registryKey: string;
  private clues: Map<string, ClueData> = new Map();
  private clueSprites: Phaser.GameObjects.Group;
  private clueObjects: InteractableObject[] = [];
  private pulseTime: number = 0;
  private initialized: boolean = false;
  private saveManager: SaveManager | null = null;
  private progressionManager: any | null = null;
  private cluesEnabled: boolean = false;

  constructor(config: ClueTrackerConfig) {
    super();
    this.scene = config.scene;
    this.registryKey = config.registryKey ?? 'clueTracker';
    this.clueSprites = this.scene.add.group();
  }

  /**
   * Set the save manager for auto-saving after clue discoveries
   */
  public setSaveManager(manager: SaveManager): void {
    this.saveManager = manager;
  }

  /**
   * Initialize the tracker, load clues from JSON, spawn visual representations
   */
  initialize(): void {
    if (this.initialized) {
      console.warn('ClueTracker already initialized');
      return;
    }

    // Get progression manager reference
    this.progressionManager = this.scene.registry.get('progressionManager');
    if (this.progressionManager) {
      const currentPhase = this.progressionManager.getCurrentPhase();
      const config = this.progressionManager.getConfig();
      this.cluesEnabled = config?.phases[currentPhase]?.cluesEnabled ?? false;
      
      // Listen for phase changes
      this.progressionManager.on('phase-changed', (data: { phase: string }) => {
        const phaseConfig = config?.phases[data.phase];
        this.cluesEnabled = phaseConfig?.cluesEnabled ?? false;
        this.updateAllClueVisibility();
        console.log(`✓ ClueTracker: Phase ${data.phase} - clues ${this.cluesEnabled ? 'enabled' : 'disabled'}`);
      });
    } else {
      console.warn('[ClueTracker] No progression manager found!');
    }

    // Load clues from JSON
    this.loadClues();

    // Register in scene registry
    this.scene.registry.set(this.registryKey, this);

    // Listen for unlock requests from dialog manager
    this.scene.events.on('clue-unlock-requested', this.handleUnlockRequest, this);

    // Listen for debug unlock all event
    this.scene.events.on('debug-unlock-all-clues', () => {
      console.log('🔓 [ClueTracker] Debug: Unlocking all clues visually...');
      this.clues.forEach(clue => {
        if (clue.state === 'locked') {
          clue.state = 'unlocked';
          this.updateClueVisual(clue);
          if (clue.sprite && clue.sprite instanceof InteractableObject) {
            clue.sprite.setInteractable(true);
          }
        }
      });
      console.log('✓ [ClueTracker] All clues are now unlocked and interactive');
    });

    this.initialized = true;
    console.log(`✓ ClueTracker initialized with ${this.clues.size} clues`);
  }

  /**
   * Load and validate clues from JSON
   */
  private loadClues(): void {
    const data = this.scene.cache.json.get('clues-data');
    if (!data) {
      throw new Error('clues.json not loaded in cache');
    }

    const validationResult = validateCluesConfig(data);
    logValidationResult('clues.json', validationResult);

    if (!validationResult.valid) {
      throw new Error('Invalid clues.json: ' + validationResult.errors.join(', '));
    }

    const config = data as CluesConfig;

    // Create ClueData objects and spawn sprites
    config.clues.forEach(def => {
      const clue: ClueData = {
        ...def,
        sprite: undefined,
      };
      this.clues.set(def.id, clue);
      
      // Spawn visual representation
      this.spawnClueSprite(clue);
    });
  }

  /**
   * Spawn visual representation for a clue as an InteractableObject
   */
  private spawnClueSprite(clue: ClueData): void {
    // Create a small glowing orb/indicator texture for the clue
    // This represents the "point of interest" on/near the physical object
    const graphics = this.scene.add.graphics();
    
    // Draw a small glowing circle
    graphics.fillStyle(0xffffff, 0.8);
    graphics.fillCircle(clue.displaySize.width / 2, clue.displaySize.height / 2, Math.min(clue.displaySize.width, clue.displaySize.height) / 2);
    
    // Add a subtle outline
    graphics.lineStyle(2, 0xffff00, 0.6);
    graphics.strokeCircle(clue.displaySize.width / 2, clue.displaySize.height / 2, Math.min(clue.displaySize.width, clue.displaySize.height) / 2);
    
    graphics.generateTexture(`clue-indicator-${clue.id}`, clue.displaySize.width, clue.displaySize.height);
    graphics.destroy();

    // Create InteractableObject for the clue
    // This is a small interactive hotspot, not the physical object itself
    const clueObject = new InteractableObject({
      scene: this.scene,
      x: clue.position.x,
      y: clue.position.y,
      spriteKey: `clue-indicator-${clue.id}`,
      id: clue.id,
      description: clue.description,
      interactionRange: clue.interactionRange,
    });

    clueObject.setDepth(6); // Above furniture so it's visible
    clueObject.setOrigin(0.5, 0.5);
    
    // Setup dialog data for notebook recording
    clueObject.dialogData.recordInNotebook = true;
    clueObject.dialogData.notebookNote = clue.notebookNote;
    
    // Start with interaction disabled (will be enabled when clues become available)
    clueObject.setInteractable(false);

    clue.sprite = clueObject;
    this.clueSprites.add(clueObject);
    this.clueObjects.push(clueObject);

    // Set initial visual state
    this.updateClueVisual(clue);
  }

  /**
   * Update clue visual based on state
   */
  private updateClueVisual(clue: ClueData): void {
    if (!clue.sprite) return;

    // Clue indicators show/hide based on state
    // The physical furniture is always visible - these are just interaction points
    switch (clue.state) {
      case 'locked':
        // Locked clues are invisible - the physical object exists but no indicator shows
        clue.sprite.setVisible(false);
        clue.sprite.setAlpha(0);
        break;
      case 'unlocked':
        // Unlocked clues show a bright yellow glow to indicate they're interactable
        clue.sprite.setVisible(true);
        clue.sprite.setTint(0xffff00);
        clue.sprite.setAlpha(1.0);
        break;
      case 'discovered':
        // Discovered clues fade out or disappear
        clue.sprite.setVisible(false);
        clue.sprite.setAlpha(0);
        break;
    }
  }

  /**
   * Handle unlock request from dialog manager
   */
  private handleUnlockRequest(clueId: string): void {
    this.unlockClue(clueId);
  }

  /**
   * Get all clues
   */
  getAllClues(): ClueData[] {
    return Array.from(this.clues.values());
  }

  /**
   * Get all clue InteractableObjects for registration with interaction detector
   */
  getClueObjects(): InteractableObject[] {
    return this.clueObjects;
  }

  /**
   * Get a specific clue by ID
   */
  getClueById(clueId: string): ClueData | null {
    return this.clues.get(clueId) ?? null;
  }

  /**
   * Get all clues in a specific state
   */
  getCluesByState(state: ClueState): ClueData[] {
    return Array.from(this.clues.values()).filter(clue => clue.state === state);
  }

  /**
   * Get IDs of all discovered clues
   */
  getDiscoveredIds(): string[] {
    return this.getCluesByState('discovered').map(clue => clue.id);
  }

  /**
   * Get IDs of all unlocked clues
   */
  getUnlockedIds(): string[] {
    return this.getCluesByState('unlocked').map(clue => clue.id);
  }

  /**
   * Unlock a clue
   */
  unlockClue(clueId: string): void {
    const clue = this.clues.get(clueId);
    if (!clue) {
      console.error(`Clue not found: ${clueId}`);
      return;
    }

    if (clue.state !== 'locked') {
      console.warn(`Clue ${clueId} is already ${clue.state}`);
      return;
    }

    clue.state = 'unlocked';
    this.updateClueVisual(clue);
    
    // Enable interaction on the clue object
    if (clue.sprite && clue.sprite instanceof InteractableObject) {
      clue.sprite.setInteractable(true);
    }
    
    this.emit('clue-unlocked', { clueId, clue });

    // Notify progression manager
    const progressionManager = this.scene.registry.get('progressionManager');
    if (progressionManager && typeof progressionManager.notifyClueUnlocked === 'function') {
      progressionManager.notifyClueUnlocked(clueId);
    }

    console.log(`✨ Clue unlocked: ${clue.name}`);
  }

  /**
   * Discover a clue
   */
  discoverClue(clueId: string): void {
    const clue = this.clues.get(clueId);
    if (!clue) {
      console.error(`Clue not found: ${clueId}`);
      return;
    }

    if (clue.state === 'locked') {
      console.error(`Cannot discover locked clue: ${clueId}`);
      return;
    }

    if (clue.state === 'discovered') {
      console.warn(`Clue ${clueId} already discovered`);
      return;
    }

    clue.state = 'discovered';
    this.updateClueVisual(clue);
    this.emit('clue-discovered', { clueId, clue });

    // Notify progression manager
    const progressionManager = this.scene.registry.get('progressionManager');
    if (progressionManager && typeof progressionManager.notifyClueDiscovered === 'function') {
      progressionManager.notifyClueDiscovered(clueId);
    }

    // Auto-save after clue discovery
    if (this.saveManager) {
      this.saveManager.autoSave();
    }

    console.log(`🔍 Clue discovered: ${clue.name}`);
  }

  /**
   * Check if a clue can be interacted with
   */
  canInteract(clueId: string): boolean {
    return this.cluesEnabled && this.clues.get(clueId)?.state === 'unlocked';
  }

  /**
   * Update visibility for all clues based on current phase
   */
  private updateAllClueVisibility(): void {
    this.clues.forEach(clue => {
      this.updateClueVisual(clue);
    });
  }

  /**
   * Restore clue states from saved data
   */
  restoreState(unlockedIds: string[], discoveredIds: string[]): void {
    let unlockedCount = 0;
    let discoveredCount = 0;

    // First, restore discovered clues
    discoveredIds.forEach(clueId => {
      const clue = this.clues.get(clueId);
      if (clue) {
        clue.state = 'discovered';
        this.updateClueVisual(clue);
        discoveredCount++;
      }
    });

    // Then, restore unlocked clues (that aren't discovered)
    unlockedIds.forEach(clueId => {
      const clue = this.clues.get(clueId);
      if (clue && clue.state !== 'discovered') {
        clue.state = 'unlocked';
        this.updateClueVisual(clue);
        unlockedCount++;
      }
    });

    this.emit('state-restored', { unlockedCount, discoveredCount });
    console.log(`✓ Clue state restored: ${unlockedCount} unlocked, ${discoveredCount} discovered`);
  }

  /**
   * Update visual representations (pulse animations)
   */
  update(delta: number): void {
    this.pulseTime += delta;

    // Pulse animation for locked and unlocked clues
    this.clues.forEach(clue => {
      if (!clue.sprite || clue.state === 'discovered') return;

      const speed = clue.state === 'locked' ? 0.001 : 0.002; // Faster pulse for unlocked
      const intensity = clue.state === 'locked' ? 0.1 : 0.2;

      const pulseValue = Math.sin(this.pulseTime * speed) * intensity + 1.0;
      clue.sprite.setScale(pulseValue);
    });
  }

  /**
   * Destroy the tracker and clean up
   */
  destroy(): void {
    this.scene.events.off('clue-unlock-requested', this.handleUnlockRequest, this);
    this.clueSprites.clear(true, true);
    this.clues.clear();
    this.scene.registry.remove(this.registryKey);
    this.removeAllListeners();
    this.initialized = false;
    console.log('✓ ClueTracker destroyed');
  }
}

/**
 * Factory function to create ClueTracker
 */
export function createClueTracker(config: ClueTrackerConfig): ClueTracker {
  return new ClueTracker(config);
}

/**
 * Retrieve existing ClueTracker from scene registry
 */
export function getClueTracker(
  scene: Phaser.Scene,
  registryKey?: string
): ClueTracker | null {
  return scene.registry.get(registryKey ?? 'clueTracker') ?? null;
}
