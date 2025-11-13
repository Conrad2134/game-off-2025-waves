/**
 * EvidenceValidator Utility
 * 
 * Validates evidence presentations against confrontation statements
 * and player's discovered clues. Pure utility class with no state.
 */

import type {
  ConfrontationStatement,
  EvidenceResult
} from '../types/accusation';

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

/**
 * EvidenceValidator handles all evidence validation logic
 */
export class EvidenceValidator {
  /**
   * Validate evidence against a confrontation statement
   * 
   * @param statement - Statement being contradicted
   * @param presentedClueId - Clue ID player is presenting
   * @param currentMistakeCount - Current mistakes in this confrontation (0-2)
   * @param discoveredClues - All clue IDs player has discovered
   * @param presentedEvidence - Array of clue IDs already presented in this confrontation
   * @param allStatements - All statements in the confrontation sequence (for order validation)
   * @param currentIndex - Current statement index (for order validation)
   * @returns Validation result with response and next actions
   */
  static validate(
    statement: ConfrontationStatement,
    presentedClueId: string,
    currentMistakeCount: number,
    discoveredClues: string[],
    presentedEvidence: string[] = [],
    allStatements: ConfrontationStatement[] = [],
    currentIndex: number = 0
  ): EvidenceResult {
    // Check if clue is discovered
    if (!this.isClueDiscovered(presentedClueId, discoveredClues)) {
      throw new EvidenceValidationError(
        'Cannot present undiscovered clue',
        {
          statementId: statement.id,
          clueId: presentedClueId,
          reason: 'Clue not in discovered list'
        }
      );
    }
    
    // Check if evidence is correct for current statement
    const correct = this.isEvidenceCorrect(statement, presentedClueId);
    
    // Check if this is bonus evidence
    const isBonus = statement.bonusEvidence === presentedClueId;
    
    // Check if evidence is out of order (correct evidence, but for future statement)
    const outOfOrder = !correct && !isBonus && this.isEvidenceOutOfOrder(
      presentedClueId,
      allStatements,
      currentIndex,
      presentedEvidence
    );
    
    if (correct || isBonus) {
      // Use bonus response if bonus evidence was presented
      const responseText = isBonus && statement.bonusResponse 
        ? statement.bonusResponse 
        : statement.correctResponse;
        
      return {
        correct: true,
        responseText,
        shouldAdvance: true,
        confrontationFailed: false,
        mistakeCount: currentMistakeCount,
        isBonus
      };
    } else if (outOfOrder) {
      // Evidence is correct, but for a later statement - Valentin guides player
      return {
        correct: false,
        responseText: "Wait, that evidence is relevant, but we need to establish the basics first. Let's take this step by step.",
        shouldAdvance: false,
        confrontationFailed: false,
        mistakeCount: currentMistakeCount // Don't count as mistake
      };
    } else {
      const newMistakeCount = currentMistakeCount + 1;
      const penaltyMessage = this.generatePenaltyMessage(
        newMistakeCount,
        statement.incorrectResponse
      );
      
      return {
        correct: false,
        responseText: penaltyMessage,
        shouldAdvance: false,
        confrontationFailed: newMistakeCount >= 3,
        mistakeCount: newMistakeCount
      };
    }
  }
  
  /**
   * Check if evidence is correct for a statement
   * 
   * @param statement - Statement to check against
   * @param clueId - Clue ID to validate
   * @returns True if evidence is correct
   */
  static isEvidenceCorrect(
    statement: ConfrontationStatement,
    clueId: string
  ): boolean {
    if (!statement.requiresPresentation) {
      return true; // Informational statement, auto-advance
    }
    
    const acceptable = this.getAcceptableEvidence(statement);
    return acceptable.includes(clueId);
  }
  
  /**
   * Check if evidence is out of order (correct evidence, but for a future statement)
   * 
   * @param clueId - Clue ID being presented
   * @param allStatements - All statements in the confrontation
   * @param currentIndex - Current statement index
   * @param presentedEvidence - Evidence already presented
   * @returns True if evidence is valid for a future statement but not current
   */
  static isEvidenceOutOfOrder(
    clueId: string,
    allStatements: ConfrontationStatement[],
    currentIndex: number,
    presentedEvidence: string[]
  ): boolean {
    // Check if this evidence is correct for any future statement
    for (let i = currentIndex + 1; i < allStatements.length; i++) {
      const futureStatement = allStatements[i];
      const acceptable = this.getAcceptableEvidence(futureStatement);
      
      if (acceptable.includes(clueId)) {
        // Check it hasn't been presented already
        if (!presentedEvidence.includes(clueId)) {
          return true;
        }
      }
    }
    
    return false;
  }
  
  /**
   * Check if a clue has been discovered
   * 
   * @param clueId - Clue ID to check
   * @param discoveredClues - Array of discovered clue IDs
   * @returns True if clue has been discovered
   */
  static isClueDiscovered(clueId: string, discoveredClues: string[]): boolean {
    return discoveredClues.includes(clueId);
  }
  
  /**
   * Get list of acceptable evidence for a statement
   * Returns required evidence if acceptableEvidence not specified
   * 
   * @param statement - Statement to get evidence for
   * @returns Array of acceptable clue IDs
   */
  static getAcceptableEvidence(statement: ConfrontationStatement): string[] {
    if (statement.acceptableEvidence && statement.acceptableEvidence.length > 0) {
      return statement.acceptableEvidence;
    }
    
    if (statement.requiredEvidence) {
      return [statement.requiredEvidence];
    }
    
    return [];
  }
  
  /**
   * Generate penalty message based on mistake count
   * Escalates severity with each mistake
   * 
   * @param mistakeCount - Current mistake count (1-3)
   * @param baseMessage - Base incorrect response from statement
   * @returns Formatted penalty message with mistake counter
   */
  static generatePenaltyMessage(mistakeCount: number, baseMessage: string): string {
    const countText = [
      'Think carefully!',
      "You're running out of chances.",
      'One more wrong move and this accusation will fail!'
    ];
    
    const severity = mistakeCount - 1;
    const warningText = countText[Math.min(severity, countText.length - 1)];
    
    return `${baseMessage}\n\n${warningText} (Mistakes: ${mistakeCount}/3)`;
  }
}
