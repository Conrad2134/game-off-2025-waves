/**
 * Core Type Definitions for Accusation System
 * 
 * These interfaces define the data structures used throughout the accusation system.
 * All components and systems should import from this file for type consistency.
 */

/**
 * Player's overall accusation progress state
 * Persisted to LocalStorage via SaveManager
 */
export interface AccusationState {
  /** Number of failed accusations (0-2, triggers bad ending at 2) */
  failedAccusations: number;
  
  /** Currently active confrontation, null when not in confrontation */
  currentConfrontation: ConfrontationProgress | null;
  
  /** IDs of suspects that have been accused (regardless of outcome) */
  accusedSuspects: string[];
  
  /** Timestamp of last accusation attempt (for debugging/analytics) */
  lastAccusationTimestamp?: number;
}

/**
 * Progress through an active confrontation sequence
 * Temporary state, not persisted across sessions
 */
export interface ConfrontationProgress {
  /** NPC ID being accused */
  suspectId: string;
  
  /** Current position in the statement sequence (0-based) */
  currentStatementIndex: number;
  
  /** Number of incorrect evidence presentations (0-3, fails at 3) */
  mistakeCount: number;
  
  /** Clue IDs already presented during this confrontation */
  presentedEvidence: string[];
  
  /** Timestamp when confrontation started */
  startedAt: number;
}

/**
 * Configuration defining the guilty party and evidence requirements
 * Root object in src/data/accusation.json
 */
export interface AccusationConfig {
  /** Version for future migrations */
  version: string;
  
  /** Main configuration */
  config: {
    /** NPC ID of the actual culprit */
    guiltyParty: string;
    
    /** Minimum clues player must discover before successful accusation */
    minimumCluesRequired: number;
    
    /** If true, some evidence presentations can be skipped (not implemented in MVP) */
    allowPartialEvidence: boolean;
  };
  
  /** Confrontation sequences keyed by suspect ID */
  confrontations: Record<string, ConfrontationSequence>;
  
  /** Ending sequence data */
  endings: {
    victory: VictoryEndingConfig;
    badEnding: BadEndingConfig;
  };
}

/**
 * Scripted dialog flow for accusing a specific suspect
 */
export interface ConfrontationSequence {
  /** NPC ID this sequence is for */
  suspectId: string;
  
  /** Why they did it (displayed on victory screen) */
  motive: string;
  
  /** Confession dialog on successful accusation */
  confession: string;
  
  /** Ordered sequence of statements requiring evidence */
  statements: ConfrontationStatement[];
}

/**
 * Single statement in a confrontation that may require evidence
 */
export interface ConfrontationStatement {
  /** Unique identifier for this statement */
  id: string;
  
  /** Statement dialog text */
  text: string;
  
  /** Who delivers this statement */
  speaker: 'suspect' | 'valentin';
  
  /** Primary clue ID that contradicts this statement */
  requiredEvidence?: string;
  
  /** Alternative valid clue IDs (includes requiredEvidence) */
  acceptableEvidence?: string[];
  
  /** Dialog shown when correct evidence is presented */
  correctResponse: string;
  
  /** Dialog shown when incorrect evidence is presented */
  incorrectResponse: string;
  
  /** If false, statement auto-advances (informational only) */
  requiresPresentation: boolean;
}

/**
 * Victory ending configuration
 */
export interface VictoryEndingConfig {
  /** Valentin's reaction dialog for each possible culprit */
  valentinReaction: Record<string, string>;
  
  /** Bonus message if player found all clues */
  bonusAcknowledgment: string;
}

/**
 * Bad ending configuration
 */
export interface BadEndingConfig {
  /** Valentin's "I give up" speech */
  despairSpeech: string;
  
  /** Explanation shown on failure screen */
  failureExplanation: string;
}

/**
 * Data for victory sequence display
 */
export interface VictorySequenceData {
  /** Who was guilty */
  culpritId: string;
  
  /** Culprit's confession */
  confession: string;
  
  /** Valentin's reaction to this specific culprit */
  valentinReaction: string;
  
  /** Summary information */
  summary: {
    /** Why they did it */
    motive: string;
    
    /** Critical clue IDs that proved guilt */
    keyEvidence: string[];
    
    /** Optional bonus message if player found all clues */
    bonusAcknowledgment?: string;
  };
}

/**
 * Data for bad ending sequence display
 */
export interface BadEndingSequenceData {
  /** Valentin's despair speech */
  despairSpeech: string;
  
  /** Explanation of what went wrong */
  failureExplanation: string;
  
  /** Optional reveal of actual culprit */
  actualCulprit?: string;
}

/**
 * Visual state of the accusation UI
 */
export interface AccusationUIState {
  /** Whether accusation UI is visible */
  isVisible: boolean;
  
  /** Current phase of accusation flow */
  phase: 'suspect-selection' | 'confrontation' | 'ending';
  
  /** Selected suspect during suspect selection phase */
  selectedSuspect: string | null;
  
  /** Currently displayed statement during confrontation */
  currentStatement: ConfrontationStatement | null;
  
  /** Whether notebook is open for evidence selection */
  notebookOpen: boolean;
  
  /** Disable input during animations */
  animationPlaying: boolean;
}

/**
 * Result of evidence presentation attempt
 */
export interface EvidenceResult {
  /** Whether the evidence was correct */
  correct: boolean;
  
  /** Response dialog to show */
  responseText: string;
  
  /** Whether to advance to next statement */
  shouldAdvance: boolean;
  
  /** Whether confrontation has failed (3 mistakes) */
  confrontationFailed: boolean;
  
  /** Updated mistake count */
  mistakeCount: number;
}

/**
 * Accusation validation result
 */
export interface AccusationValidation {
  /** Whether accusation is allowed */
  canAccuse: boolean;
  
  /** Reason if accusation is not allowed */
  reason?: string;
  
  /** Minimum clues required */
  minimumCluesRequired?: number;
  
  /** Number of clues player has discovered */
  discoveredClues?: number;
}
