/**
 * AccusationManager System
 * 
 * Core system managing accusation logic, state transitions, and evidence validation.
 * Singleton instance accessed via Phaser Registry.
 */

import Phaser from 'phaser';
import type {
  AccusationState,
  AccusationConfig,
  ConfrontationProgress,
  ConfrontationStatement,
  EvidenceResult,
  AccusationValidation,
  VictorySequenceData,
  BadEndingSequenceData
} from '../types/accusation';
import { EvidenceValidator } from '../utils/evidence-validator';
import type { SaveManager } from './save-manager';
import type { ClueTracker } from './clue-tracker';

/**
 * AccusationManager manages the core accusation system logic
 */
export class AccusationManager extends Phaser.Events.EventEmitter {
  private scene: Phaser.Scene;
  private config!: AccusationConfig;
  private state: AccusationState;
  private saveManager?: SaveManager;
  private clueTracker?: ClueTracker;
  private debugMode: boolean = false;
  
  constructor(scene: Phaser.Scene) {
    super();
    this.scene = scene;
    this.state = this.getDefaultState();
    
    // Enable debug logging (can be toggled via setDebugMode())
    this.debugMode = true;
  }
  
  /**
   * Enable or disable debug logging
   */
  public setDebugMode(enabled: boolean): void {
    this.debugMode = enabled;
  }
  
  /**
   * Initialize the accusation system
   * Loads configuration from src/data/accusation.json
   * Registers with scene registry
   * 
   * @throws {Error} If configuration is invalid
   */
  async initialize(): Promise<void> {
    // Load configuration
    try {
      const response = await fetch('/src/data/accusation.json');
      if (!response.ok) {
        throw new Error(`Failed to load accusation config: ${response.statusText}`);
      }
      this.config = await response.json() as AccusationConfig;
      this.validateConfig();
      console.log('✓ AccusationManager: Configuration loaded');
    } catch (error) {
      console.error('Failed to load accusation configuration:', error);
      throw error;
    }
    
    // Get system references
    this.saveManager = this.scene.registry.get('saveManager') as SaveManager;
    this.clueTracker = this.scene.registry.get('clueTracker') as ClueTracker;
    
    // Load saved state
    if (this.saveManager) {
      const savedState = this.saveManager.loadAccusationState();
      this.state = savedState;
      console.log(`✓ AccusationManager: State loaded (${this.state.failedAccusations} failed accusations)`);
    }
    
    // Register with scene registry
    this.scene.registry.set('accusationManager', this);
    console.log('✓ AccusationManager initialized');
  }
  
  /**
   * Check if player can initiate an accusation
   * Validates minimum clues discovered
   */
  canInitiateAccusation(): AccusationValidation {
    if (!this.clueTracker) {
      return {
        canAccuse: false,
        reason: 'Investigation system not initialized',
      };
    }
    
    const discoveredClues = this.clueTracker.getDiscoveredIds();
    const minimumRequired = this.config.config.minimumCluesRequired;
    
    if (discoveredClues.length < minimumRequired) {
      return {
        canAccuse: false,
        reason: `You need at least ${minimumRequired} clues to make an accusation. You have ${discoveredClues.length}.`,
        minimumCluesRequired: minimumRequired,
        discoveredClues: discoveredClues.length,
      };
    }
    
    return {
      canAccuse: true,
      minimumCluesRequired: minimumRequired,
      discoveredClues: discoveredClues.length,
    };
  }
  
  /**
   * Start the suspect selection phase
   */
  startSuspectSelection(): void {
    this.logEvent('suspect-selection-opened', { timestamp: Date.now() });
    this.emit('accusation:suspect-selection-opened');
    console.log('AccusationManager: Suspect selection opened');
  }
  
  /**
   * Start a confrontation with the specified suspect
   */
  startAccusation(suspectId: string): void {
    const sequence = this.config.confrontations[suspectId];
    if (!sequence) {
      throw new Error(`No confrontation sequence defined for suspect: ${suspectId}`);
    }
    
    // Initialize confrontation progress
    this.state.currentConfrontation = {
      suspectId,
      currentStatementIndex: 0,
      mistakeCount: 0,
      presentedEvidence: [],
      startedAt: Date.now(),
      bonusEvidencePresented: [],
    };
    
    // Record that this suspect has been accused
    if (!this.state.accusedSuspects.includes(suspectId)) {
      this.state.accusedSuspects.push(suspectId);
    }
    
    this.state.lastAccusationTimestamp = Date.now();
    
    this.logEvent('accusation-started', { suspectId, timestamp: Date.now() });
    this.emit('accusation:started', { suspectId, statement: sequence.statements[0] });
    console.log(`AccusationManager: Accusation started against ${suspectId}`);
  }
  
  /**
   * Get the current confrontation state
   */
  getCurrentConfrontation(): ConfrontationProgress | null {
    return this.state.currentConfrontation;
  }
  
  /**
   * Get the current statement in active confrontation
   */
  getCurrentStatement(): ConfrontationStatement | null {
    if (!this.state.currentConfrontation) {
      return null;
    }
    
    const sequence = this.config.confrontations[this.state.currentConfrontation.suspectId];
    if (!sequence) {
      return null;
    }
    
    return sequence.statements[this.state.currentConfrontation.currentStatementIndex] || null;
  }
  
  /**
   * Present evidence against the current statement
   */
  presentEvidence(clueId: string): EvidenceResult {
    if (!this.state.currentConfrontation) {
      throw new Error('No active confrontation');
    }
    
    const statement = this.getCurrentStatement();
    if (!statement) {
      throw new Error('No current statement');
    }
    
    if (!this.clueTracker) {
      throw new Error('ClueTracker not initialized');
    }
    
    // Get confrontation sequence for order validation
    const sequence = this.config.confrontations[this.state.currentConfrontation.suspectId];
    if (!sequence) {
      throw new Error('Confrontation sequence not found');
    }
    
    // Validate evidence with order checking
    const discoveredClues = this.clueTracker.getDiscoveredIds();
    const result = EvidenceValidator.validate(
      statement,
      clueId,
      this.state.currentConfrontation.mistakeCount,
      discoveredClues,
      this.state.currentConfrontation.presentedEvidence,
      sequence.statements,
      this.state.currentConfrontation.currentStatementIndex
    );
    
    // Update confrontation state
    this.state.currentConfrontation.mistakeCount = result.mistakeCount;
    this.state.currentConfrontation.presentedEvidence.push(clueId);
    
    // Track bonus evidence
    if (result.isBonus && this.state.currentConfrontation.bonusEvidencePresented) {
      this.state.currentConfrontation.bonusEvidencePresented.push(clueId);
    }
    
    // Log evidence presentation
    this.logEvent('evidence-presented', {
      clueId,
      correct: result.correct,
      isBonus: result.isBonus,
      mistakeCount: result.mistakeCount,
      statementId: statement.id,
    });
    
    // Emit events based on result
    this.emit('accusation:evidence-presented', { 
      clueId, 
      correct: result.correct,
      mistakeCount: result.mistakeCount,
      isBonus: result.isBonus,
    });
    
    if (result.confrontationFailed) {
      this.emit('accusation:failed', { 
        suspectId: this.state.currentConfrontation.suspectId,
      });
    }
    
    return result;
  }
  
  /**
   * Advance to the next statement in confrontation
   */
  advanceStatement(): boolean {
    if (!this.state.currentConfrontation) {
      return false;
    }
    
    const sequence = this.config.confrontations[this.state.currentConfrontation.suspectId];
    if (!sequence) {
      return false;
    }
    
    this.state.currentConfrontation.currentStatementIndex++;
    
    // Check if more statements remain
    const hasMore = this.state.currentConfrontation.currentStatementIndex < sequence.statements.length;
    
    if (hasMore) {
      const nextStatement = sequence.statements[this.state.currentConfrontation.currentStatementIndex];
      this.emit('accusation:statement-advanced', { 
        statementIndex: this.state.currentConfrontation.currentStatementIndex,
        statement: nextStatement,
      });
    } else {
      // Confrontation complete - success!
      this.emit('accusation:success', { 
        suspectId: this.state.currentConfrontation.suspectId,
      });
    }
    
    return hasMore;
  }
  
  /**
   * Cancel the current confrontation
   */
  cancelAccusation(): void {
    if (!this.state.currentConfrontation) {
      return;
    }
    
    const suspectId = this.state.currentConfrontation.suspectId;
    this.state.currentConfrontation = null;
    
    this.emit('accusation:cancelled', { suspectId });
    console.log('AccusationManager: Accusation cancelled');
  }
  
  /**
   * Handle successful confrontation completion
   */
  onConfrontationSuccess(suspectId: string): VictorySequenceData {
    const sequence = this.config.confrontations[suspectId];
    if (!sequence) {
      throw new Error(`No confrontation sequence for suspect: ${suspectId}`);
    }
    
    const isCorrectCulprit = suspectId === this.config.config.guiltyParty;
    
    if (isCorrectCulprit) {
      // Check for thorough investigation (all clues discovered + bonus evidence presented)
      const discoveredClues = this.clueTracker?.getDiscoveredIds() || [];
      const totalCluesInGame = 5; // From clues.json
      const allCluesDiscovered = discoveredClues.length >= totalCluesInGame;
      
      const bonusEvidencePresented = this.state.currentConfrontation?.bonusEvidencePresented || [];
      const presentedBonusEvidence = bonusEvidencePresented.length > 0;
      
      const shouldShowBonus = allCluesDiscovered && presentedBonusEvidence;
      
      // Prepare victory data
      const keyEvidence = sequence.statements
        .filter(s => s.requiredEvidence)
        .map(s => s.requiredEvidence!);
      
      const victoryData: VictorySequenceData = {
        culpritId: suspectId,
        confession: sequence.confession,
        valentinReaction: this.config.endings.victory.valentinReaction[suspectId] || 'I... I never expected this...',
        summary: {
          motive: sequence.motive,
          keyEvidence,
          bonusAcknowledgment: shouldShowBonus
            ? this.config.endings.victory.bonusAcknowledgment 
            : undefined,
        },
      };
      
      // Clear current confrontation
      this.state.currentConfrontation = null;
      
      // Log victory
      this.logEvent('accusation-success', {
        culpritId: suspectId,
        allCluesFound: allCluesDiscovered,
        bonusEvidenceUsed: presentedBonusEvidence,
      });
      
      // Emit victory trigger
      this.emit('accusation:victory-triggered', { culpritId: suspectId, victoryData });
      console.log(`AccusationManager: Victory! ${suspectId} was the culprit`);
      
      return victoryData;
    } else {
      // Wrong suspect - treat as failure
      this.onConfrontationFailed(suspectId);
      throw new Error('Wrong suspect accused - confrontation failed');
    }
  }
  
  /**
   * Handle failed confrontation (3 mistakes or wrong suspect)
   */
  onConfrontationFailed(suspectId: string): void {
    // Clear current confrontation
    this.state.currentConfrontation = null;
    
    // Increment failed accusation count
    this.state.failedAccusations++;
    this.state.lastAccusationTimestamp = Date.now();
    
    // Save state
    if (this.saveManager) {
      this.saveManager.saveAccusationState(this.state);
    }
    
    this.logEvent('accusation-failed', {
      suspectId,
      failedCount: this.state.failedAccusations,
      triggersEnding: this.state.failedAccusations >= 2,
    });
    
    console.log(`AccusationManager: Accusation failed (${this.state.failedAccusations}/2 failures)`);
    
    // Check if bad ending should trigger
    if (this.state.failedAccusations >= 2) {
      this.logEvent('bad-ending-triggered', {
        totalFailures: this.state.failedAccusations,
      });
      this.emit('accusation:bad-ending-triggered');
      console.log('AccusationManager: Bad ending triggered');
    } else {
      this.emit('accusation:failed', { 
        suspectId,
        failedCount: this.state.failedAccusations,
      });
    }
  }
  
  /**
   * Get bad ending sequence data
   */
  getBadEndingData(): BadEndingSequenceData {
    return {
      despairSpeech: this.config.endings.badEnding.despairSpeech,
      failureExplanation: this.config.endings.badEnding.failureExplanation,
      actualCulprit: this.config.config.guiltyParty,
    };
  }
  
  /**
   * Get rejection dialog for when 3 mistakes reached
   */
  getRejectionDialog(): { speaker: string; text: string } {
    return this.config.config.rejectionDialog || {
      speaker: 'valentin',
      text: 'This is unacceptable! Too many mistakes. Please investigate more thoroughly!'
    };
  }
  
  /**
   * Get the current accusation state
   */
  getState(): AccusationState {
    return { ...this.state };
  }
  
  /**
   * Load accusation state from save file
   */
  loadState(state: AccusationState): void {
    this.state = state;
    // Never restore currentConfrontation - always start fresh
    this.state.currentConfrontation = null;
    console.log('AccusationManager: State loaded from save');
  }
  
  /**
   * Reset accusation state after ending
   */
  resetState(): void {
    this.state = this.getDefaultState();
    if (this.saveManager) {
      this.saveManager.saveAccusationState(this.state);
    }
    console.log('AccusationManager: State reset');
  }
  
  /**
   * Get list of all suspects that can be accused
   * Excludes Klaus and Valentin who are not suspects
   */
  getAvailableSuspects(): string[] {
    return Object.keys(this.config.confrontations).filter(
      id => id !== 'klaus' && id !== 'valentin'
    );
  }
  
  /**
   * Check if a suspect has already been accused
   */
  hasSuspectBeenAccused(suspectId: string): boolean {
    return this.state.accusedSuspects.includes(suspectId);
  }
  
  /**
   * Get the guilty party ID from configuration
   */
  getGuiltyParty(): string {
    return this.config.config.guiltyParty;
  }
  
  /**
   * Validate configuration
   */
  private validateConfig(): void {
    const { config, confrontations, endings } = this.config;
    const errors: string[] = [];
    
    // Check guilty party has confrontation
    if (!confrontations[config.guiltyParty]) {
      errors.push(`Guilty party "${config.guiltyParty}" has no confrontation defined`);
    }
    
    // Validate confrontation sequences
    for (const [suspectId, sequence] of Object.entries(confrontations)) {
      if (sequence.statements.length === 0) {
        errors.push(`Confrontation for ${suspectId} has no statements`);
      }
      
      // Validate each statement's evidence references
      sequence.statements.forEach((statement, idx) => {
        if (statement.requiresPresentation) {
          if (!statement.requiredEvidence && (!statement.acceptableEvidence || statement.acceptableEvidence.length === 0)) {
            errors.push(`Statement ${statement.id} (${suspectId}[${idx}]) requires evidence but has none defined`);
          }
          
          // Check if evidence clues exist in game (we know there are 5 clues from clues.json)
          const validClues = ['strudel-crumbs', 'suspicious-napkin', 'desk-papers', 'bookshelf-hiding-spot', 'empty-plate'];
          const evidenceToCheck = statement.acceptableEvidence || (statement.requiredEvidence ? [statement.requiredEvidence] : []);
          
          evidenceToCheck.forEach(clueId => {
            if (!validClues.includes(clueId)) {
              errors.push(`Statement ${statement.id} references invalid clue: ${clueId}`);
            }
          });
          
          if (statement.bonusEvidence && !validClues.includes(statement.bonusEvidence)) {
            errors.push(`Statement ${statement.id} references invalid bonus clue: ${statement.bonusEvidence}`);
          }
        }
      });
    }
    
    // Validate endings configuration
    if (!endings.victory || !endings.badEnding) {
      errors.push('Missing victory or badEnding configuration in endings');
    }
    
    if (endings.victory && !endings.victory.valentinReaction[config.guiltyParty]) {
      errors.push(`Missing Valentin reaction for guilty party: ${config.guiltyParty}`);
    }
    
    // Report errors or success
    if (errors.length > 0) {
      console.error('❌ AccusationManager: Configuration validation failed:');
      errors.forEach(error => console.error(`  - ${error}`));
      throw new Error(`Invalid accusation configuration: ${errors.length} error(s) found`);
    }
    
    console.log('✓ AccusationManager: Configuration validated');
  }
  
  /**
   * Get default accusation state
   */
  private getDefaultState(): AccusationState {
    return {
      failedAccusations: 0,
      currentConfrontation: null,
      accusedSuspects: [],
    };
  }
  
  /**
   * Log accusation system events (enabled in development mode)
   */
  private logEvent(eventName: string, data?: Record<string, any>): void {
    if (this.debugMode) {
      console.log(`[AccusationManager] Event: ${eventName}`, data || {});
    }
  }
  
  /**
   * Clean up resources
   */
  destroy(): void {
    this.removeAllListeners();
    console.log('✓ AccusationManager destroyed');
  }
}
