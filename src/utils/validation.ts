/**
 * JSON Data Validation Utilities
 * 
 * Provides validation helpers for progression and clue configuration files.
 * Validates data structure, required fields, and value constraints.
 */

import type { ProgressionConfig, ValidationResult, CharacterDialogData } from '../types/progression';
import type { CluesConfig } from '../types/clue';

/**
 * Validate progression configuration data
 * @param data - Parsed progression.json data
 * @returns Validation result with errors and warnings
 */
export function validateProgressionConfig(data: any): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!data) {
    errors.push('Progression config is null or undefined');
    return { valid: false, errors, warnings };
  }

  // Version check
  if (!data.version || typeof data.version !== 'string') {
    errors.push('Missing or invalid version field');
  }

  // Phases check
  if (!data.phases) {
    errors.push('Missing phases object');
  } else {
    if (!data.phases['pre-incident']) {
      errors.push('Missing pre-incident phase config');
    } else {
      validatePhaseConfig(data.phases['pre-incident'], 'pre-incident', errors);
    }
    
    if (!data.phases['post-incident']) {
      errors.push('Missing post-incident phase config');
    } else {
      validatePhaseConfig(data.phases['post-incident'], 'post-incident', errors);
    }
  }

  // Incident trigger check
  if (!data.incidentTrigger) {
    errors.push('Missing incidentTrigger object');
  } else {
    if (!Array.isArray(data.incidentTrigger.requiresNPCsIntroduced)) {
      errors.push('incidentTrigger.requiresNPCsIntroduced must be an array');
    } else if (data.incidentTrigger.requiresNPCsIntroduced.length !== 4) {
      errors.push('incidentTrigger.requiresNPCsIntroduced must have exactly 4 NPCs');
    }
    
    if (typeof data.incidentTrigger.delayMs !== 'number') {
      errors.push('incidentTrigger.delayMs must be a number');
    } else if (data.incidentTrigger.delayMs < 1000 || data.incidentTrigger.delayMs > 5000) {
      warnings.push('incidentTrigger.delayMs should be between 1000-5000ms');
    }
  }

  // Incident cutscene check
  if (!data.incidentCutscene) {
    errors.push('Missing incidentCutscene object');
  } else {
    const cutscene = data.incidentCutscene;
    
    if (!cutscene.entryPosition || typeof cutscene.entryPosition.x !== 'number' || typeof cutscene.entryPosition.y !== 'number') {
      errors.push('Invalid incidentCutscene.entryPosition');
    }
    
    if (!Array.isArray(cutscene.speechLines) || cutscene.speechLines.length < 3) {
      errors.push('incidentCutscene.speechLines must be an array with at least 3 lines');
    }
    
    if (!cutscene.doorPosition || typeof cutscene.doorPosition.x !== 'number' || typeof cutscene.doorPosition.y !== 'number') {
      errors.push('Invalid incidentCutscene.doorPosition');
    }
    
    if (typeof cutscene.durationMs !== 'number') {
      errors.push('incidentCutscene.durationMs must be a number');
    } else if (cutscene.durationMs < 3000 || cutscene.durationMs > 15000) {
      warnings.push('incidentCutscene.durationMs should be between 3000-15000ms');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate individual phase configuration
 */
function validatePhaseConfig(phase: any, phaseName: string, errors: string[]): void {
  if (!phase.name || typeof phase.name !== 'string') {
    errors.push(`${phaseName}: Missing or invalid name`);
  }
  
  if (typeof phase.cluesEnabled !== 'boolean') {
    errors.push(`${phaseName}: cluesEnabled must be a boolean`);
  }
  
  if (typeof phase.notebookEnabled !== 'boolean') {
    errors.push(`${phaseName}: notebookEnabled must be a boolean`);
  }
}

/**
 * Validate clues configuration data
 * @param data - Parsed clues.json data
 * @returns Validation result with errors and warnings
 */
export function validateCluesConfig(data: any): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!data) {
    errors.push('Clues config is null or undefined');
    return { valid: false, errors, warnings };
  }

  // Version check
  if (!data.version || typeof data.version !== 'string') {
    errors.push('Missing or invalid version field');
  }

  // Clues array check
  if (!Array.isArray(data.clues)) {
    errors.push('clues must be an array');
    return { valid: false, errors, warnings };
  }

  if (data.clues.length < 5) {
    errors.push('Must have at least 5 clues (spec requirement)');
  }

  const clueIds = new Set<string>();
  let initiallyUnlockedCount = 0;

  // Validate each clue
  data.clues.forEach((clue: any, index: number) => {
    const prefix = `Clue[${index}]`;
    
    // ID validation
    if (!clue.id || typeof clue.id !== 'string') {
      errors.push(`${prefix}: Missing or invalid id`);
    } else {
      if (clueIds.has(clue.id)) {
        errors.push(`${prefix}: Duplicate clue ID "${clue.id}"`);
      }
      clueIds.add(clue.id);
    }
    
    // Basic field validation
    if (!clue.name || typeof clue.name !== 'string' || clue.name.length < 3 || clue.name.length > 50) {
      errors.push(`${prefix}: name must be 3-50 characters`);
    }
    
    if (!clue.description || typeof clue.description !== 'string' || clue.description.length < 20 || clue.description.length > 500) {
      errors.push(`${prefix}: description must be 20-500 characters`);
    }
    
    // Position validation
    if (!clue.position || typeof clue.position.x !== 'number' || typeof clue.position.y !== 'number') {
      errors.push(`${prefix}: Invalid position`);
    } else {
      if (clue.position.x < 0 || clue.position.x > 1200 || clue.position.y < 0 || clue.position.y > 800) {
        warnings.push(`${prefix}: Position outside typical bounds (0-1200, 0-800)`);
      }
    }
    
    // Sprite validation
    if (!clue.spriteKey || typeof clue.spriteKey !== 'string') {
      errors.push(`${prefix}: Missing or invalid spriteKey`);
    }
    
    if (!clue.displaySize || typeof clue.displaySize.width !== 'number' || typeof clue.displaySize.height !== 'number') {
      errors.push(`${prefix}: Invalid displaySize`);
    }
    
    // Interaction range validation
    if (typeof clue.interactionRange !== 'number' || clue.interactionRange < 30 || clue.interactionRange > 100) {
      warnings.push(`${prefix}: interactionRange should be 30-100 pixels`);
    }
    
    // State validation
    if (clue.state !== 'locked' && clue.state !== 'unlocked' && clue.state !== 'discovered') {
      errors.push(`${prefix}: state must be 'locked', 'unlocked', or 'discovered'`);
    }
    
    // Initially unlocked validation
    if (typeof clue.initiallyUnlocked !== 'boolean') {
      errors.push(`${prefix}: initiallyUnlocked must be a boolean`);
    } else if (clue.initiallyUnlocked) {
      initiallyUnlockedCount++;
    }
    
    // Unlocked by validation
    if (!clue.initiallyUnlocked && !clue.unlockedBy) {
      errors.push(`${prefix}: Must have unlockedBy if initiallyUnlocked is false`);
    }
    
    if (clue.unlockedBy) {
      if (!clue.unlockedBy.npcId || typeof clue.unlockedBy.npcId !== 'string') {
        errors.push(`${prefix}: unlockedBy.npcId must be a string`);
      }
      if (typeof clue.unlockedBy.tier !== 'number' || clue.unlockedBy.tier < 0 || clue.unlockedBy.tier > 3) {
        errors.push(`${prefix}: unlockedBy.tier must be 0-3`);
      }
    }
    
    // Notebook note validation
    if (!clue.notebookNote || typeof clue.notebookNote !== 'string' || clue.notebookNote.length < 10 || clue.notebookNote.length > 200) {
      errors.push(`${prefix}: notebookNote must be 10-200 characters`);
    }
  });

  // Verify exactly 2 initially unlocked (spec requirement)
  if (initiallyUnlockedCount !== 2) {
    errors.push(`Must have exactly 2 initially unlocked clues (found ${initiallyUnlockedCount})`);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate character dialog data
 * @param data - Parsed character dialog JSON
 * @param characterId - Expected character ID
 * @returns Validation result with errors and warnings
 */
export function validateCharacterDialogData(data: any, characterId: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!data) {
    errors.push('Character dialog data is null or undefined');
    return { valid: false, errors, warnings };
  }

  // Character ID validation
  if (data.characterId !== characterId) {
    errors.push(`Character ID mismatch: expected "${characterId}", got "${data.characterId}"`);
  }

  // Character name validation
  if (!data.characterName || typeof data.characterName !== 'string' || data.characterName.length < 3 || data.characterName.length > 30) {
    errors.push('characterName must be 3-30 characters');
  }

  // Introduction validation
  if (!data.introduction) {
    errors.push('Missing introduction object');
  } else {
    if (!Array.isArray(data.introduction.lines) || data.introduction.lines.length < 1 || data.introduction.lines.length > 10) {
      errors.push('introduction.lines must be an array with 1-10 lines');
    }
    
    if (typeof data.introduction.recordInNotebook !== 'boolean') {
      errors.push('introduction.recordInNotebook must be a boolean');
    }
    
    if (data.introduction.recordInNotebook && !data.introduction.notebookNote) {
      errors.push('introduction.notebookNote is required when recordInNotebook is true');
    }
  }

  // Post-incident validation
  if (!Array.isArray(data.postIncident)) {
    errors.push('postIncident must be an array');
  } else {
    if (data.postIncident.length !== 4) {
      errors.push('postIncident must have exactly 4 tiers (0-3)');
    }
    
    // Validate each tier
    data.postIncident.forEach((tier: any, index: number) => {
      const prefix = `Tier[${index}]`;
      
      if (tier.tier !== index) {
        errors.push(`${prefix}: tier field should be ${index}, got ${tier.tier}`);
      }
      
      const expectedClues = [0, 1, 3, 5][index];
      if (tier.requiredClues !== expectedClues) {
        errors.push(`${prefix}: requiredClues should be ${expectedClues}, got ${tier.requiredClues}`);
      }
      
      if (!Array.isArray(tier.lines) || tier.lines.length < 1) {
        errors.push(`${prefix}: lines must be a non-empty array`);
      }
      
      if (!Array.isArray(tier.followUpLines) || tier.followUpLines.length < 1) {
        errors.push(`${prefix}: followUpLines must be a non-empty array`);
      }
      
      if (typeof tier.recordInNotebook !== 'boolean') {
        errors.push(`${prefix}: recordInNotebook must be a boolean`);
      }
      
      if (tier.recordInNotebook && !tier.notebookNote) {
        errors.push(`${prefix}: notebookNote is required when recordInNotebook is true`);
      }
      
      if (tier.unlocksClues && !Array.isArray(tier.unlocksClues)) {
        errors.push(`${prefix}: unlocksClues must be an array`);
      }
    });
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Log validation results to console
 * @param name - Name of the data being validated
 * @param result - Validation result
 */
export function logValidationResult(name: string, result: ValidationResult): void {
  if (result.valid) {
    console.log(`✓ ${name} validation passed`);
  } else {
    console.error(`✗ ${name} validation failed:`);
    result.errors.forEach(error => console.error(`  - ${error}`));
  }
  
  if (result.warnings.length > 0) {
    console.warn(`⚠ ${name} warnings:`);
    result.warnings.forEach(warning => console.warn(`  - ${warning}`));
  }
}
