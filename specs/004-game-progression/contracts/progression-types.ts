/**
 * Shared Type Definitions: Game Progression
 * 
 * Core types used throughout the progression system.
 * These types are referenced by multiple systems and components.
 */

/**
 * Game narrative phase
 */
export type GamePhase = 'pre-incident' | 'post-incident';

/**
 * Investigation progress snapshot (computed state)
 */
export interface InvestigationProgress {
  /** Current game phase */
  phase: GamePhase;
  
  /** Number of clues discovered (0-5+) */
  clueCount: number;
  
  /** Current dialog tier based on clue count (0-3) */
  dialogTier: number;
  
  /** Whether all NPCs have been introduced */
  allNPCsIntroduced: boolean;
  
  /** Whether the incident has been triggered */
  incidentTriggered: boolean;
}

/**
 * Persisted progression state (saved to LocalStorage)
 */
export interface ProgressionSaveData {
  /** Save data version for migration */
  version: string;
  
  /** Current game phase */
  currentPhase: GamePhase;
  
  /** Set of NPC IDs the player has been introduced to */
  introducedNPCs: string[];
  
  /** Set of clue IDs the player has discovered */
  discoveredClues: string[];
  
  /** Set of clue IDs that are unlocked (investigable) */
  unlockedClues: string[];
  
  /** Conversation counters per NPC per tier */
  conversationHistory: Record<string, Record<number, number>>;
  
  /** Save timestamp (for debugging/analytics) */
  timestamp: number;
}

/**
 * Configuration loaded from progression.json
 */
export interface ProgressionConfig {
  /** Configuration version */
  version: string;
  
  /** Phase definitions */
  phases: {
    'pre-incident': PhaseConfig;
    'post-incident': PhaseConfig;
  };
  
  /** Incident trigger conditions */
  incidentTrigger: {
    /** All NPCs from this list must be introduced */
    requiresNPCsIntroduced: string[];
    
    /** Delay in milliseconds before incident plays */
    delayMs: number;
  };
  
  /** Valentin's incident cutscene definition */
  incidentCutscene: {
    /** Valentin's entry position */
    entryPosition: { x: number; y: number };
    
    /** Valentin's speech lines */
    speechLines: string[];
    
    /** Door position to lock */
    doorPosition: { x: number; y: number };
    
    /** Total cutscene duration (ms) */
    durationMs: number;
  };
}

/**
 * Phase-specific configuration
 */
export interface PhaseConfig {
  /** Phase display name */
  name: string;
  
  /** Whether clues are interactable in this phase */
  cluesEnabled: boolean;
  
  /** Whether notebook is accessible */
  notebookEnabled: boolean;
}

/**
 * Dialog tier for phase-based NPC conversations
 */
export interface DialogTier {
  /** Tier identifier (0-3) */
  tier: number;
  
  /** Minimum clues required to unlock this tier */
  requiredClues: number;
  
  /** Dialog lines for first conversation at this tier */
  lines: string[];
  
  /** Dialog lines for repeated conversations at this tier */
  followUpLines: string[];
  
  /** Whether this dialog should be recorded in notebook */
  recordInNotebook: boolean;
  
  /** Summarized note for notebook (if recordInNotebook is true) */
  notebookNote?: string;
  
  /** Clue IDs unlocked after this conversation completes */
  unlocksClues?: string[];
}

/**
 * Character dialog data loaded from JSON
 */
export interface CharacterDialogData {
  /** Character identifier */
  characterId: string;
  
  /** Character display name */
  characterName: string;
  
  /** Introduction phase dialog */
  introduction: {
    lines: string[];
    recordInNotebook: boolean;
    notebookNote?: string;
  };
  
  /** Post-incident dialog tiers (exactly 4) */
  postIncident: DialogTier[];
}

/**
 * Validation result for data files
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}
