/**
 * Clue Tracker System
 * 
 * Manages clue discovery state, unlock conditions, and visual representations.
 * Handles three clue states: locked, unlocked, discovered.
 */

import Phaser from 'phaser';
import type { ClueData, ClueState, CluesConfig } from '../types/clue';
import type { SaveManager } from './save-manager';
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
   * Spawn visual representation for a clue
   */
  private spawnClueSprite(clue: ClueData): void {
    // For now, create a simple rectangle placeholder
    // In production, this would load actual clue sprites
    const graphics = this.scene.add.graphics();
    graphics.fillStyle(0xffffff, 1.0);
    graphics.fillRect(0, 0, clue.displaySize.width, clue.displaySize.height);
    graphics.generateTexture(`clue-temp-${clue.id}`, clue.displaySize.width, clue.displaySize.height);
    graphics.destroy();

    const sprite = this.scene.add.sprite(
      clue.position.x,
      clue.position.y,
      `clue-temp-${clue.id}`
    );

    sprite.setDepth(2); // Below NPCs, above floor
    sprite.setOrigin(0.5, 0.5);
    
    // Make sprite non-interactive by default (will be enabled when clues are enabled)
    sprite.setInteractive({ useHandCursor: false });
    sprite.disableInteractive();

    clue.sprite = sprite;
    this.clueSprites.add(sprite);

    // Set initial visual state
    this.updateClueVisual(clue);
  }

  /**
   * Update clue visual based on state
   */
  private updateClueVisual(clue: ClueData): void {
    if (!clue.sprite) return;

    // Hide clues if not enabled (pre-incident phase)
    if (!this.cluesEnabled) {
      clue.sprite.setVisible(false);
      return;
    }

    clue.sprite.setVisible(true);

    switch (clue.state) {
      case 'locked':
        clue.sprite.setTint(0xaaaaaa);
        clue.sprite.setAlpha(0.5);
        break;
      case 'unlocked':
        clue.sprite.setTint(0xffff00);
        clue.sprite.setAlpha(1.0);
        break;
      case 'discovered':
        clue.sprite.setTint(0xffffff);
        clue.sprite.setAlpha(0.7);
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
