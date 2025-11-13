/**
 * EvidenceValidator Utility API
 * 
 * Validates evidence presentations against confrontation statements
 * and player's discovered clues. Pure utility class with no state.
 */

import type {
  ConfrontationStatement,
  EvidenceResult
} from './types';

/**
 * EvidenceValidator handles all evidence validation logic
 * 
 * Responsibilities:
 * - Check if presented evidence matches statement requirements
 * - Support both "required" and "acceptable" evidence lists
 * - Generate appropriate response text based on correctness
 * - Determine whether to advance statement or increment mistakes
 * 
 * Usage:
 * ```typescript
 * const result = EvidenceValidator.validate(
 *   statement,
 *   'desk-papers',
 *   mistakeCount,
 *   discoveredClues
 * );
 * ```
 */
export interface IEvidenceValidator {
  /**
   * Validate evidence against a confrontation statement
   * 
   * @param statement - Statement being contradicted
   * @param presentedClueId - Clue ID player is presenting
   * @param currentMistakeCount - Current mistakes in this confrontation (0-2)
   * @param discoveredClues - All clue IDs player has discovered
   * @returns Validation result with response and next actions
   */
  validate(
    statement: ConfrontationStatement,
    presentedClueId: string,
    currentMistakeCount: number,
    discoveredClues: string[]
  ): EvidenceResult;
  
  /**
   * Check if evidence is correct for a statement
   * 
   * @param statement - Statement to check against
   * @param clueId - Clue ID to validate
   * @returns True if evidence is correct
   */
  isEvidenceCorrect(statement: ConfrontationStatement, clueId: string): boolean;
  
  /**
   * Check if a clue has been discovered
   * 
   * @param clueId - Clue ID to check
   * @param discoveredClues - Array of discovered clue IDs
   * @returns True if clue has been discovered
   */
  isClueDiscovered(clueId: string, discoveredClues: string[]): boolean;
  
  /**
   * Get list of acceptable evidence for a statement
   * Returns required evidence if acceptableEvidence not specified
   * 
   * @param statement - Statement to get evidence for
   * @returns Array of acceptable clue IDs
   */
  getAcceptableEvidence(statement: ConfrontationStatement): string[];
  
  /**
   * Generate penalty message based on mistake count
   * Escalates severity with each mistake
   * 
   * @param mistakeCount - Current mistake count (1-3)
   * @param baseMessage - Base incorrect response from statement
   * @returns Formatted penalty message with mistake counter
   */
  generatePenaltyMessage(mistakeCount: number, baseMessage: string): string;
}

/**
 * Concrete implementation as static utility class
 * 
 * @example
 * ```typescript
 * export class EvidenceValidator implements IEvidenceValidator {
 *   static validate(
 *     statement: ConfrontationStatement,
 *     presentedClueId: string,
 *     currentMistakeCount: number,
 *     discoveredClues: string[]
 *   ): EvidenceResult {
 *     // Check if clue is discovered
 *     if (!this.isClueDiscovered(presentedClueId, discoveredClues)) {
 *       throw new Error('Cannot present undiscovered clue');
 *     }
 *     
 *     // Check if evidence is correct
 *     const correct = this.isEvidenceCorrect(statement, presentedClueId);
 *     
 *     if (correct) {
 *       return {
 *         correct: true,
 *         responseText: statement.correctResponse,
 *         shouldAdvance: true,
 *         confrontationFailed: false,
 *         mistakeCount: currentMistakeCount
 *       };
 *     } else {
 *       const newMistakeCount = currentMistakeCount + 1;
 *       const penaltyMessage = this.generatePenaltyMessage(
 *         newMistakeCount,
 *         statement.incorrectResponse
 *       );
 *       
 *       return {
 *         correct: false,
 *         responseText: penaltyMessage,
 *         shouldAdvance: false,
 *         confrontationFailed: newMistakeCount >= 3,
 *         mistakeCount: newMistakeCount
 *       };
 *     }
 *   }
 *   
 *   static isEvidenceCorrect(
 *     statement: ConfrontationStatement,
 *     clueId: string
 *   ): boolean {
 *     if (!statement.requiresPresentation) {
 *       return true; // Informational statement, auto-advance
 *     }
 *     
 *     const acceptable = this.getAcceptableEvidence(statement);
 *     return acceptable.includes(clueId);
 *   }
 *   
 *   static isClueDiscovered(
 *     clueId: string,
 *     discoveredClues: string[]
 *   ): boolean {
 *     return discoveredClues.includes(clueId);
 *   }
 *   
 *   static getAcceptableEvidence(
 *     statement: ConfrontationStatement
 *   ): string[] {
 *     if (statement.acceptableEvidence) {
 *       return statement.acceptableEvidence;
 *     }
 *     
 *     if (statement.requiredEvidence) {
 *       return [statement.requiredEvidence];
 *     }
 *     
 *     return [];
 *   }
 *   
 *   static generatePenaltyMessage(
 *     mistakeCount: number,
 *     baseMessage: string
 *   ): string {
 *     const countText = [
 *       'That evidence doesn\'t support your claim. Think carefully!',
 *       'Another mistake... You\'re running out of chances.',
 *       'One more wrong move and this accusation will fail!'
 *     ];
 *     
 *     return `${baseMessage}\n\n${countText[mistakeCount - 1]} (Mistakes: ${mistakeCount}/3)`;
 *   }
 * }
 * ```
 */

/**
 * Evidence validation error
 * Thrown when evidence validation fails unexpectedly
 */
export class EvidenceValidationError extends Error {
  constructor(
    message: string,
    public context: {
      statementId?: string;
      clueId?: string;
      reason?: string;
    }
  ) {
    super(`Evidence Validation Error: ${message}`);
    this.name = 'EvidenceValidationError';
  }
}
