/**
 * Game Progression Manager
 * 
 * Central authority for tracking game progression state including:
 * - Game phases (pre-incident, post-incident)
 * - NPC introductions
 * - Clue discovery tracking
 * - Dialog tier calculation
 * - State persistence to LocalStorage
 */

import Phaser from 'phaser';
import type {
  GamePhase,
  InvestigationProgress,
  ProgressionSaveData,
  ProgressionConfig,
} from '../types/progression';
import {
  validateProgressionConfig,
  logValidationResult,
} from '../utils/validation';

export interface GameProgressionManagerConfig {
  /** Parent Phaser scene */
  scene: Phaser.Scene;
  
  /** Registry key for singleton access (default: 'progressionManager') */
  registryKey?: string;
  
  /** LocalStorage key for persistence (default: 'erdbeerstrudel-progression') */
  storageKey?: string;
  
  /** Auto-save debounce delay in ms (default: 2000) */
  saveDebounceMs?: number;
}

export class GameProgressionManager extends Phaser.Events.EventEmitter {
  private scene: Phaser.Scene;
  private registryKey: string;
  private storageKey: string;
  private saveDebounceMs: number;
  
  private currentPhase: GamePhase = 'pre-incident';
  private introducedNPCs: Set<string> = new Set();
  private discoveredClues: Set<string> = new Set();
  private unlockedClues: Set<string> = new Set();
  private conversationHistory: Map<string, Map<number, number>> = new Map();
  
  private config: ProgressionConfig | null = null;
  private saveDebounceTimer: Phaser.Time.TimerEvent | null = null;
  private initialized: boolean = false;

  constructor(config: GameProgressionManagerConfig) {
    super();
    this.scene = config.scene;
    this.registryKey = config.registryKey ?? 'progressionManager';
    this.storageKey = config.storageKey ?? 'erdbeerstrudel-progression';
    this.saveDebounceMs = config.saveDebounceMs ?? 2000;
  }

  /**
   * Initialize the manager, load saved state if available
   */
  initialize(): void {
    if (this.initialized) {
      console.warn('GameProgressionManager already initialized');
      return;
    }

    // Load progression configuration
    this.loadConfig();

    // Register in scene registry for singleton access
    this.scene.registry.set(this.registryKey, this);

    // Load saved state if exists
    const savedData = this.load();
    if (savedData) {
      this.restoreFromSave(savedData);
      console.log('✓ Progression state restored from save');
    } else {
      console.log('✓ Starting fresh progression');
    }

    this.initialized = true;
    console.log(`✓ GameProgressionManager initialized (phase: ${this.currentPhase})`);
    
    // Expose reset method to window for debugging
    if (typeof window !== 'undefined') {
      (window as any).resetGame = () => {
        this.reset();
        console.log('🔄 Game reset! Reload the page to start fresh.');
      };
      console.log('💡 Debug: Use window.resetGame() to clear save data');
    }
  }

  /**
   * Load and validate progression.json configuration
   */
  private loadConfig(): void {
    const data = this.scene.cache.json.get('progression-config');
    if (!data) {
      throw new Error('progression.json not loaded in cache');
    }

    const validationResult = validateProgressionConfig(data);
    logValidationResult('progression.json', validationResult);

    if (!validationResult.valid) {
      throw new Error('Invalid progression.json: ' + validationResult.errors.join(', '));
    }

    this.config = data as ProgressionConfig;
  }

  /**
   * Restore state from saved data
   */
  private restoreFromSave(data: ProgressionSaveData): void {
    this.currentPhase = data.currentPhase;
    this.introducedNPCs = new Set(data.introducedNPCs);
    this.discoveredClues = new Set(data.discoveredClues);
    this.unlockedClues = new Set(data.unlockedClues);

    // Restore conversation history
    this.conversationHistory.clear();
    for (const [npcId, tierCounts] of Object.entries(data.conversationHistory)) {
      const tierMap = new Map<number, number>();
      for (const [tier, count] of Object.entries(tierCounts)) {
        tierMap.set(parseInt(tier), count);
      }
      this.conversationHistory.set(npcId, tierMap);
    }
  }

  /**
   * Get the current game phase
   */
  getCurrentPhase(): GamePhase {
    return this.currentPhase;
  }

  /**
   * Get complete investigation progress snapshot
   */
  getProgress(): InvestigationProgress {
    return {
      phase: this.currentPhase,
      clueCount: this.discoveredClues.size,
      dialogTier: this.getDialogTier(),
      allNPCsIntroduced: this.areAllNPCsIntroduced(),
      incidentTriggered: this.currentPhase === 'post-incident',
    };
  }

  /**
   * Get count of discovered clues
   */
  getDiscoveredClueCount(): number {
    return this.discoveredClues.size;
  }

  /**
   * Get current dialog tier based on clue count
   */
  getDialogTier(): number {
    const clueCount = this.discoveredClues.size;
    if (clueCount >= 5) return 3;
    if (clueCount >= 3) return 2;
    if (clueCount >= 1) return 1;
    return 0;
  }

  /**
   * Mark an NPC as introduced
   */
  markNPCIntroduced(npcId: string): void {
    if (this.introducedNPCs.has(npcId)) {
      return; // Already introduced
    }

    this.introducedNPCs.add(npcId);
    this.emit('npc-introduced', { npcId });
    console.log(`NPC introduced: ${npcId} (${this.introducedNPCs.size}/${this.config?.incidentTrigger.requiresNPCsIntroduced.length ?? 5})`);

    this.debouncedSave();

    // Check if all NPCs introduced
    if (this.areAllNPCsIntroduced() && this.currentPhase === 'pre-incident') {
      this.scheduleIncidentTrigger();
    }
  }

  /**
   * Check if all required NPCs have been introduced
   */
  areAllNPCsIntroduced(): boolean {
    if (!this.config) return false;
    
    const required = this.config.incidentTrigger.requiresNPCsIntroduced;
    return required.every((npcId) => this.introducedNPCs.has(npcId));
  }

  /**
   * Schedule incident trigger after delay
   */
  private scheduleIncidentTrigger(): void {
    const delayMs = this.config?.incidentTrigger.delayMs ?? 2000;
    console.log(`All NPCs introduced! Triggering incident in ${delayMs}ms...`);

    this.scene.time.delayedCall(delayMs, () => {
      this.triggerIncident();
    });
  }

  /**
   * Trigger the incident phase transition
   */
  triggerIncident(): void {
    if (this.currentPhase === 'post-incident') {
      console.warn('Incident already triggered');
      return;
    }

    const previousPhase = this.currentPhase;
    this.currentPhase = 'post-incident';

    this.emit('phase-changed', { phase: this.currentPhase, previousPhase });
    this.emit('incident-triggered', { timestamp: Date.now() });

    console.log('✨ Incident triggered! Phase changed to post-incident');
    this.save(); // Immediate save on phase transition
  }

  /**
   * Notify about a clue being unlocked (called by ClueTracker)
   */
  notifyClueUnlocked(clueId: string): void {
    this.unlockedClues.add(clueId);
    this.debouncedSave();
  }

  /**
   * Notify about a clue being discovered (called by ClueTracker)
   */
  notifyClueDiscovered(clueId: string): void {
    if (!this.unlockedClues.has(clueId)) {
      console.warn(`Clue ${clueId} discovered but not unlocked!`);
    }

    this.discoveredClues.add(clueId);
    console.log(`Clue discovered: ${clueId} (total: ${this.discoveredClues.size}, tier: ${this.getDialogTier()})`);
    this.debouncedSave();
  }

  /**
   * Get IDs of unlocked clues
   */
  getUnlockedClueIds(): string[] {
    return Array.from(this.unlockedClues);
  }

  /**
   * Get IDs of discovered clues
   */
  getDiscoveredClueIds(): string[] {
    return Array.from(this.discoveredClues);
  }

  /**
   * Record a conversation with an NPC at a specific tier
   */
  recordConversation(npcId: string, tier: number): void {
    if (!this.conversationHistory.has(npcId)) {
      this.conversationHistory.set(npcId, new Map());
    }

    const tierMap = this.conversationHistory.get(npcId)!;
    const currentCount = tierMap.get(tier) ?? 0;
    const newCount = currentCount + 1;
    tierMap.set(tier, newCount);

    this.emit('conversation-recorded', { npcId, tier, count: newCount });
    this.debouncedSave();
  }

  /**
   * Get conversation count for an NPC at a specific tier
   */
  getConversationCount(npcId: string, tier: number): number {
    const tierMap = this.conversationHistory.get(npcId);
    if (!tierMap) return 0;
    return tierMap.get(tier) ?? 0;
  }

  /**
   * Save current state to LocalStorage (debounced)
   */
  private debouncedSave(): void {
    if (this.saveDebounceTimer) {
      this.saveDebounceTimer.remove();
    }

    this.saveDebounceTimer = this.scene.time.delayedCall(this.saveDebounceMs, () => {
      this.save();
    });
  }

  /**
   * Manually save current state to LocalStorage
   */
  save(): void {
    const data: ProgressionSaveData = {
      version: '1.0.0',
      currentPhase: this.currentPhase,
      introducedNPCs: Array.from(this.introducedNPCs),
      discoveredClues: Array.from(this.discoveredClues),
      unlockedClues: Array.from(this.unlockedClues),
      conversationHistory: this.serializeConversationHistory(),
      timestamp: Date.now(),
    };

    try {
      localStorage.setItem(this.storageKey, JSON.stringify(data));
      this.emit('save-complete', { success: true });
    } catch (error) {
      console.error('Failed to save progression:', error);
      this.emit('save-complete', { success: false, error: String(error) });
    }
  }

  /**
   * Serialize conversation history for JSON storage
   */
  private serializeConversationHistory(): Record<string, Record<number, number>> {
    const result: Record<string, Record<number, number>> = {};

    for (const [npcId, tierMap] of this.conversationHistory.entries()) {
      result[npcId] = {};
      for (const [tier, count] of tierMap.entries()) {
        result[npcId][tier] = count;
      }
    }

    return result;
  }

  /**
   * Load state from LocalStorage
   */
  load(): ProgressionSaveData | null {
    try {
      const json = localStorage.getItem(this.storageKey);
      if (!json) return null;

      const data = JSON.parse(json) as ProgressionSaveData;

      // Version migration (future-proofing)
      if (data.version !== '1.0.0') {
        console.warn(`Save data version mismatch: ${data.version} (expected 1.0.0)`);
        return this.migrateData(data);
      }

      return data;
    } catch (error) {
      console.error('Failed to load progression:', error);
      return null;
    }
  }

  /**
   * Migrate save data from older versions
   */
  private migrateData(data: any): ProgressionSaveData | null {
    console.warn('No migration path available, starting fresh');
    return null;
  }

  /**
   * Clear all progression state (reset to fresh game)
   */
  reset(): void {
    this.currentPhase = 'pre-incident';
    this.introducedNPCs.clear();
    this.discoveredClues.clear();
    this.unlockedClues.clear();
    this.conversationHistory.clear();

    try {
      localStorage.removeItem(this.storageKey);
    } catch (error) {
      console.error('Failed to clear save:', error);
    }

    this.emit('progression-reset');
    console.log('✓ Progression reset to fresh state');
  }

  /**
   * Destroy the manager and clean up resources
   */
  destroy(): void {
    if (this.saveDebounceTimer) {
      this.saveDebounceTimer.remove();
      this.saveDebounceTimer = null;
    }

    this.scene.registry.remove(this.registryKey);
    this.removeAllListeners();
    this.initialized = false;
    console.log('✓ GameProgressionManager destroyed');
  }

  /**
   * Get progression configuration
   */
  getConfig(): ProgressionConfig | null {
    return this.config;
  }
}

/**
 * Factory function to create GameProgressionManager
 */
export function createGameProgressionManager(
  config: GameProgressionManagerConfig
): GameProgressionManager {
  return new GameProgressionManager(config);
}

/**
 * Retrieve existing GameProgressionManager from scene registry
 */
export function getGameProgressionManager(
  scene: Phaser.Scene,
  registryKey?: string
): GameProgressionManager | null {
  return scene.registry.get(registryKey ?? 'progressionManager') ?? null;
}
