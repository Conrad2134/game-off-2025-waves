/**
 * Save Manager
 * 
 * Central system for saving and loading complete game state including:
 * - Character positions and states
 * - Progression state
 * - Dialog history
 * - Clue discoveries
 * - Notebook entries
 * 
 * Auto-saves after key events and provides manual save/load functionality.
 */

import Phaser from 'phaser';
import type { GameSaveData, SaveResult, PlayerSaveState, CharacterSaveState } from '../types/save';
import type { PlayerCharacter } from '../entities/player-character';
import type { NPCCharacter } from '../entities/npc-character';
import type { GameProgressionManager } from './game-progression-manager';
import type { NotebookManager } from './notebook-manager';

export interface SaveManagerConfig {
  /** Parent Phaser scene */
  scene: Phaser.Scene;
  
  /** LocalStorage key for persistence (default: 'erdbeerstrudel-save') */
  storageKey?: string;
  
  /** Auto-save debounce delay in ms (default: 1000) */
  saveDebounceMs?: number;
}

export class SaveManager extends Phaser.Events.EventEmitter {
  private scene: Phaser.Scene;
  private storageKey: string;
  private saveDebounceMs: number;
  private saveDebounceTimer: Phaser.Time.TimerEvent | null = null;
  
  // References to other systems (set after initialization)
  private progressionManager?: GameProgressionManager;
  private notebookManager?: NotebookManager;
  private player?: PlayerCharacter;
  private npcs?: NPCCharacter[];
  
  // State tracking
  private hasPlayedOpeningScene: boolean = false;
  private hasPlayedIncident: boolean = false;

  constructor(config: SaveManagerConfig) {
    super();
    this.scene = config.scene;
    this.storageKey = config.storageKey ?? 'erdbeerstrudel-save';
    this.saveDebounceMs = config.saveDebounceMs ?? 1000;
  }

  /**
   * Initialize the save manager with references to other systems
   */
  initialize(
    player: PlayerCharacter,
    npcs: NPCCharacter[],
    progressionManager: GameProgressionManager,
    notebookManager: NotebookManager
  ): void {
    this.player = player;
    this.npcs = npcs;
    this.progressionManager = progressionManager;
    this.notebookManager = notebookManager;

    console.log('✓ SaveManager initialized');
    
    // Expose methods to window for debugging
    if (typeof window !== 'undefined') {
      (window as any).saveGame = () => {
        this.saveGame();
        console.log('💾 Manual save complete!');
      };
      (window as any).loadGame = () => {
        const result = this.loadGame();
        console.log('📂 Load result:', result);
        return result;
      };
      console.log('💡 Debug: Use window.saveGame() / window.loadGame()');
    }
  }

  /**
   * Check if a saved game exists
   */
  hasSavedGame(): boolean {
    try {
      const json = localStorage.getItem(this.storageKey);
      return json !== null;
    } catch (error) {
      console.error('Failed to check for saved game:', error);
      return false;
    }
  }

  /**
   * Save complete game state immediately
   */
  saveGame(): SaveResult {
    if (!this.player || !this.npcs || !this.progressionManager || !this.notebookManager) {
      console.warn('SaveManager not fully initialized, cannot save');
      return { success: false, error: 'SaveManager not initialized' };
    }

    try {
      const saveData: GameSaveData = {
        version: '1.0.0',
        timestamp: Date.now(),
        player: this.getPlayerState(),
        npcs: this.getNPCStates(),
        currentPhase: this.progressionManager.getCurrentPhase(),
        introducedNPCs: Array.from(this.progressionManager['introducedNPCs'] || []),
        discoveredClues: this.progressionManager.getDiscoveredClueIds(),
        unlockedClues: this.progressionManager.getUnlockedClueIds(),
        conversationHistory: this.getConversationHistory(),
        hasPlayedOpeningScene: this.hasPlayedOpeningScene,
        hasPlayedIncident: this.progressionManager.getCurrentPhase() === 'post-incident',
        notebookEntries: this.notebookManager.getEntries(),
      };

      localStorage.setItem(this.storageKey, JSON.stringify(saveData));
      this.emit('save-complete', { success: true });
      console.log('💾 Game saved successfully');
      return { success: true };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error('Failed to save game:', error);
      this.emit('save-complete', { success: false, error: errorMsg });
      return { success: false, error: errorMsg };
    }
  }

  /**
   * Save game state with debouncing (auto-save)
   */
  autoSave(): void {
    if (this.saveDebounceTimer) {
      this.saveDebounceTimer.remove();
    }

    this.saveDebounceTimer = this.scene.time.delayedCall(this.saveDebounceMs, () => {
      this.saveGame();
    });
  }

  /**
   * Load game state from storage
   */
  loadGame(): GameSaveData | null {
    try {
      const json = localStorage.getItem(this.storageKey);
      if (!json) {
        console.log('No saved game found');
        return null;
      }

      const saveData = JSON.parse(json) as GameSaveData;

      // Version migration (future-proofing)
      if (saveData.version !== '1.0.0') {
        console.warn(`Save data version mismatch: ${saveData.version} (expected 1.0.0)`);
        return this.migrateSaveData(saveData);
      }

      console.log('📂 Game loaded successfully');
      this.emit('load-complete', { success: true });
      return saveData;
    } catch (error) {
      console.error('Failed to load game:', error);
      this.emit('load-complete', { success: false, error: String(error) });
      return null;
    }
  }

  /**
   * Restore game state from save data
   * Called by LibraryScene after scene setup
   */
  restoreGameState(saveData: GameSaveData): void {
    if (!this.player || !this.npcs || !this.progressionManager) {
      console.error('Cannot restore state: SaveManager not initialized');
      return;
    }

    // Restore player position and direction
    this.player.setPosition(saveData.player.x, saveData.player.y);
    // Note: Direction restoration would require adding a setDirection method to PlayerCharacter

    // Restore NPC positions and states
    saveData.npcs.forEach(npcState => {
      const npc = this.npcs!.find(n => n.id === npcState.id);
      if (npc) {
        npc.setPosition(npcState.x, npcState.y);
        // Note: Direction restoration would require adding a setDirection method to NPCCharacter
        
        // If this is Valentin and incident has happened, keep him paused at the door
        if (npc.id === 'valentin' && saveData.hasPlayedIncident) {
          if (typeof npc.pauseMovement === 'function') {
            npc.pauseMovement();
            console.log('[SaveManager] Valentin kept paused at door (incident played)');
          }
        }
      }
    });

    // Restore progression state through the progression manager
    // The progression manager should already handle this in its own load method
    
    // Restore opening scene flag
    this.hasPlayedOpeningScene = saveData.hasPlayedOpeningScene;
    this.hasPlayedIncident = saveData.hasPlayedIncident;

    console.log('✓ Game state restored');
    this.emit('state-restored', { saveData });
  }

  /**
   * Mark opening scene as played
   */
  markOpeningScenePlayed(): void {
    this.hasPlayedOpeningScene = true;
    this.autoSave();
  }

  /**
   * Mark incident as played
   */
  markIncidentPlayed(): void {
    this.hasPlayedIncident = true;
    this.autoSave();
  }

  /**
   * Check if opening scene has been played
   */
  getHasPlayedOpeningScene(): boolean {
    return this.hasPlayedOpeningScene;
  }

  /**
   * Check if incident has been played
   */
  getHasPlayedIncident(): boolean {
    return this.hasPlayedIncident;
  }

  /**
   * Delete saved game
   */
  clearSave(): SaveResult {
    try {
      localStorage.removeItem(this.storageKey);
      this.emit('save-cleared');
      console.log('🗑️ Save data cleared');
      return { success: true };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error('Failed to clear save:', error);
      return { success: false, error: errorMsg };
    }
  }

  /**
   * Get player state for saving
   */
  private getPlayerState(): PlayerSaveState {
    if (!this.player) {
      throw new Error('Player not initialized');
    }

    return {
      x: this.player.x,
      y: this.player.y,
      direction: 'south', // TODO: Get actual facing direction from player
    };
  }

  /**
   * Get NPC states for saving
   */
  private getNPCStates(): CharacterSaveState[] {
    if (!this.npcs) {
      throw new Error('NPCs not initialized');
    }

    return this.npcs.map(npc => ({
      id: npc.id,
      x: npc.x,
      y: npc.y,
      direction: 'south', // TODO: Get actual facing direction from NPC
      introduced: this.progressionManager?.['introducedNPCs']?.has(npc.id) || false,
    }));
  }

  /**
   * Get conversation history from progression manager
   */
  private getConversationHistory(): Record<string, Record<number, number>> {
    if (!this.progressionManager) {
      return {};
    }

    // Access private conversationHistory through type casting
    const history = (this.progressionManager as any).conversationHistory as Map<string, Map<number, number>>;
    const result: Record<string, Record<number, number>> = {};

    for (const [npcId, tierMap] of history.entries()) {
      result[npcId] = {};
      for (const [tier, count] of tierMap.entries()) {
        result[npcId][tier] = count;
      }
    }

    return result;
  }

  /**
   * Migrate save data from older versions
   */
  private migrateSaveData(_data: any): GameSaveData | null {
    console.warn('No migration path available for this save version');
    return null;
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    if (this.saveDebounceTimer) {
      this.saveDebounceTimer.remove();
      this.saveDebounceTimer = null;
    }

    this.removeAllListeners();
    console.log('✓ SaveManager destroyed');
  }
}

/**
 * Factory function to create SaveManager
 */
export function createSaveManager(config: SaveManagerConfig): SaveManager {
  return new SaveManager(config);
}
