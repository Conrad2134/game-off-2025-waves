import Phaser from 'phaser';
import type { DialogManagerConfig, DialogMessage, DialogData } from '../types/dialog';
import type { DialogBox } from '../components/dialog-box';
import type { NotebookManager } from './notebook-manager';
import type { GameProgressionManager } from './game-progression-manager';
import type { SaveManager } from './save-manager';
import type { CharacterDialogData, GamePhase } from '../types/progression';
import { validateCharacterDialogData, logValidationResult } from '../utils/validation';

/**
 * DialogManager system - Manages dialog state and flow
 * 
 * Features:
 * - Open/close dialog boxes
 * - Player movement locking during dialog
 * - Dialog history tracking
 * - Input handling for dialog interactions
 * - Automatic notebook recording for marked dialogs
 */
export class DialogManager {
  private scene: Phaser.Scene;
  private player: any; // PlayerCharacter type
  private dialogBox: DialogBox;
  private dialogHistory: DialogMessage[] = [];
  private maxHistorySize: number;
  private activeEntity: any | null = null; // The entity currently in conversation
  private notebookManager: NotebookManager | null = null;
  private progressionManager: GameProgressionManager | null = null;
  private saveManager: SaveManager | null = null;
  private dialogCache: Map<string, CharacterDialogData> = new Map();
  private currentNPCId: string | null = null;
  private currentTier: number = 0;
  private isDialogOpen: boolean = false; // Track if this manager is controlling the dialog
  private keys: {
    interact: Phaser.Input.Keyboard.Key[];
    close: Phaser.Input.Keyboard.Key;
  };

  constructor(config: DialogManagerConfig) {
    this.scene = config.scene;
    this.player = config.player;
    this.dialogBox = config.dialogBox;
    this.maxHistorySize = config.maxHistorySize ?? 50;

    // Setup input keys
    const keyboard = this.scene.input.keyboard;
    if (keyboard) {
      this.keys = {
        interact: [
          keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE),
          keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER),
        ],
        close: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC),
      };
    } else {
      throw new Error('DialogManager: Keyboard input not available');
    }
  }

  /**
   * Set the notebook manager for automatic recording
   */
  public setNotebookManager(notebookManager: NotebookManager): void {
    this.notebookManager = notebookManager;
  }
  /**
   * Set the progression manager for phase-based dialog selection
   */
  public setProgressionManager(manager: GameProgressionManager): void {
    this.progressionManager = manager;
  }

  /**
   * Set the save manager for auto-saving after conversations
   */
  public setSaveManager(manager: SaveManager): void {
    this.saveManager = manager;
  }

  /**
   * Load character dialog data from JSON files
   */
  public loadCharacterDialogs(): void {
    const characters = ['valentin', 'emma', 'klaus', 'luca', 'marianne', 'sebastian'];
    
    characters.forEach(id => {
      try {
        const data = this.scene.cache.json.get(`dialog-${id}`);
        if (!data) {
          console.warn(`Dialog data not found for ${id}`);
          return;
        }

        const validationResult = validateCharacterDialogData(data, id);
        logValidationResult(`dialog-${id}.json`, validationResult);

        if (validationResult.valid) {
          this.dialogCache.set(id, data as CharacterDialogData);
        } else {
          console.error(`Failed to load dialog for ${id}:`, validationResult.errors);
        }
      } catch (error) {
        console.error(`Error loading dialog for ${id}:`, error);
      }
    });

    console.log(`✓ Loaded dialog data for ${this.dialogCache.size} characters`);
  }

  /**
   * Open dialog with content from an entity
   */
  public open(
    dialogData: DialogData,
    sourceType: 'npc' | 'object',
    sourceId: string,
    speakerName?: string | null,
    entity?: any
  ): void {
    if (this.isOpen()) {
      return;
    }

    // Use phase-based selection for NPCs if progression manager available
    let messageData = dialogData;
    let effectiveTier = 0;
    let dialogOptions: any[] | undefined;
    
    if (sourceType === 'npc' && this.progressionManager) {
      const phase = this.progressionManager.getCurrentPhase();
      
      // Check for failed accusations to show appropriate dialog variant
      const accusationManager = this.scene.registry.get('accusationManager');
      const failedAccusations = accusationManager?.getState()?.failedAccusations || 0;
      
      // For Valentin in post-incident phase, check if we should show accusation dialog
      if (sourceId === 'valentin' && phase === 'post-incident') {
        const validation = accusationManager?.canInitiateAccusation();
        
        // Show accusation initiation dialog if player has enough clues
        if (validation?.canAccuse) {
          const valentinData = this.dialogCache.get('valentin');
          let accusationDialog: any;
          
          if (failedAccusations > 0 && (valentinData as any).accusationInitiation?.afterFirstFailure) {
            accusationDialog = (valentinData as any).accusationInitiation.afterFirstFailure[0];
          } else if ((valentinData as any).accusationInitiation?.default) {
            accusationDialog = (valentinData as any).accusationInitiation.default[0];
          }
          
          if (accusationDialog) {
            messageData = {
              lines: [accusationDialog.text],
              recordInNotebook: false,
            };
            dialogOptions = accusationDialog.options;
            this.currentNPCId = sourceId;
            this.currentTier = 0;
          }
        } else if (!validation?.canAccuse && (this.dialogCache.get('valentin') as any)?.accusationInitiation?.insufficientEvidence) {
          // Show insufficient evidence dialog
          const valentinData = this.dialogCache.get('valentin');
          const insufficientDialog = (valentinData as any).accusationInitiation.insufficientEvidence[0];
          messageData = {
            lines: [insufficientDialog.text],
            recordInNotebook: false,
          };
          dialogOptions = insufficientDialog.options;
          this.currentNPCId = sourceId;
          this.currentTier = 0;
        } else {
          // Normal tier-based dialog selection
          const requestedTier = this.progressionManager.getDialogTier();
          
          // Select dialog and get the actual tier used
          const result = this.selectDialog(sourceId, phase, requestedTier);
          messageData = result.data;
          effectiveTier = result.effectiveTier;
          
          this.currentNPCId = sourceId;
          this.currentTier = effectiveTier; // Track the actual tier being shown
        }
      } else {
        // Normal tier-based dialog selection for other NPCs
        const requestedTier = this.progressionManager.getDialogTier();
        
        // Select dialog and get the actual tier used
        const result = this.selectDialog(sourceId, phase, requestedTier);
        messageData = result.data;
        effectiveTier = result.effectiveTier;
        
        this.currentNPCId = sourceId;
        this.currentTier = effectiveTier; // Track the actual tier being shown
      }
    }

    const message = this.createMessage(messageData, sourceType, sourceId, speakerName);
    
    // Add options if present
    if (dialogOptions) {
      message.options = dialogOptions;
    }
    
    // Pass entity reference for option handling callback
    this.dialogBox.show(message, (action: string) => {
      console.log(`[DialogManager] Option selected: ${action}`);
      // Close dialog first so action can open new UI
      this.close();
      // Handle option selection after closing
      if (entity && typeof entity.handleDialogAction === 'function') {
        entity.handleDialogAction(action);
      }
    });
    
    this.isDialogOpen = true; // Mark that THIS manager is controlling the dialog
    this.lockPlayerMovement();
    this.addToHistory(message);

    // Record in notebook if marked
    if (this.notebookManager && message.recordInNotebook) {
      this.notebookManager.recordDialog(message);
    }

    // Record conversation AFTER showing dialog (for accurate follow-up tracking)
    // ONLY record conversations during post-incident phase (not introductions)
    if (sourceType === 'npc' && this.progressionManager && this.currentNPCId) {
      const phase = this.progressionManager.getCurrentPhase();
      console.log(`[Dialog.open] Recording conversation - NPC: ${this.currentNPCId}, Phase: ${phase}, Tier: ${this.currentTier}`);
      if (phase === 'post-incident') {
        const countBefore = this.progressionManager.getConversationCount(this.currentNPCId, this.currentTier);
        console.log(`[Dialog.open] ${this.currentNPCId} - Count BEFORE recordConversation: ${countBefore}`);
        this.progressionManager.recordConversation(this.currentNPCId, this.currentTier);
        const countAfter = this.progressionManager.getConversationCount(this.currentNPCId, this.currentTier);
        console.log(`[Dialog.open] ${this.currentNPCId} - Count AFTER recordConversation: ${countAfter}`);
      } else {
        console.log(`[Dialog.open] ${this.currentNPCId} - Skipping recordConversation (pre-incident introduction)`);
      }
    }

    // Store active entity and pause NPC movement if applicable
    this.activeEntity = entity ?? null;
    if (this.activeEntity && typeof this.activeEntity.pauseMovement === 'function') {
      this.activeEntity.pauseMovement();
      
      // Make NPC face the player
      if (typeof this.activeEntity.faceTowards === 'function') {
        this.activeEntity.faceTowards(this.player.x, this.player.y);
      }
    }
  }
  /**
   * Close the current dialog
   */
  public close(): void {
    if (!this.isOpen()) {
      return;
    }

    // Handle post-dialog actions (clue unlocking)
    if (this.currentNPCId && this.progressionManager) {
      this.handlePostDialogActions(this.currentNPCId, this.currentTier);
    }

    // Emit dialog-closed event for progression tracking
    if (this.currentNPCId) {
      this.scene.events.emit('dialog-closed', { sourceId: this.currentNPCId });
      
      // Auto-save after conversation
      if (this.saveManager) {
        this.saveManager.autoSave();
      }
    }

    this.dialogBox.hide();
    this.isDialogOpen = false; // Mark that dialog manager is no longer controlling the dialog
    this.unlockPlayerMovement();

    // Resume NPC movement if applicable
    // EXCEPT for Valentin in post-incident phase (he's guarding the door)
    if (this.activeEntity && typeof this.activeEntity.resumeMovement === 'function') {
      const isValentinPostIncident = this.activeEntity.id === 'valentin' && 
                                      this.progressionManager?.getCurrentPhase() === 'post-incident';
      
      if (!isValentinPostIncident) {
        this.activeEntity.resumeMovement();
      } else {
        console.log('[DialogManager] Keeping Valentin paused - he\'s guarding the door');
      }
    }
    
    this.activeEntity = null;
    this.currentNPCId = null;
    this.currentTier = 0;
  }

  /**
   * Check if dialog is currently open BY THIS MANAGER
   * (not just if dialog box is visible)
   */
  public isOpen(): boolean {
    return this.isDialogOpen;
  }

  /**
   * Handle input for dialog interactions
   */
  public handleInput(): void {
    if (this.isOpen()) {
      // First check for number key input (option selection)
      if (this.dialogBox.handleNumberKeyInput()) {
        // Option was selected via keyboard
        return;
      }
      
      // Check for interact keys (advance page or close)
      if (this.isInteractKeyPressed()) {
        // Try to advance to next page
        if (!this.dialogBox.nextPage()) {
          // No more pages, close the dialog
          this.close();
        }
      } else if (this.isCloseKeyPressed()) {
        // ESC always closes immediately
        this.close();
      }
    }
  }

  /**
   * Get dialog history
   */
  public getHistory(): DialogMessage[] {
    return [...this.dialogHistory];
  }

  /**
   * Clear dialog history
   */
  public clearHistory(): void {
    this.dialogHistory = [];
  }

  /**
   * Create a dialog message from dialog data
   */
  private createMessage(
    dialogData: DialogData,
    sourceType: 'npc' | 'object',
    sourceId: string,
    speakerName?: string | null
  ): DialogMessage {
    let message: string;

    // Handle new lines array format (for phase-based system)
    if (dialogData.lines && dialogData.lines.length > 0) {
      message = dialogData.lines.join('\n\n');
    } else if (sourceType === 'npc' && dialogData.introduction) {
      message = dialogData.introduction;
    } else if (sourceType === 'object' && dialogData.description) {
      message = dialogData.description;
    } else {
      message = 'No dialog available.'; // Fallback
      console.warn(`DialogManager: No dialog content for ${sourceType} ${sourceId}`);
    }

    return {
      speaker: speakerName ?? null,
      message,
      type: sourceType,
      characterId: sourceType === 'npc' ? sourceId : null,
      objectId: sourceType === 'object' ? sourceId : null,
      recordInNotebook: dialogData.recordInNotebook ?? false,
      notebookNote: dialogData.notebookNote,
    };
  }

  /**
   * Lock player movement
   */
  private lockPlayerMovement(): void {
    if (this.player && typeof this.player.lockMovement === 'function') {
      this.player.lockMovement();
    } else {
      console.warn('DialogManager: Player does not have lockMovement method');
    }
  }

  /**
   * Unlock player movement
   */
  private unlockPlayerMovement(): void {
    if (this.player && typeof this.player.unlockMovement === 'function') {
      this.player.unlockMovement();
    }
  }

  /**
   * Add message to history
   */
  private addToHistory(message: DialogMessage): void {
    this.dialogHistory.push(message);
    
    // Trim history if it exceeds max size
    if (this.dialogHistory.length > this.maxHistorySize) {
      this.dialogHistory.shift();
    }
  }

  /**
   * Check if any interact key was just pressed
   */
  private isInteractKeyPressed(): boolean {
    return this.keys.interact.some(key => Phaser.Input.Keyboard.JustDown(key));
  }

  /**
   * Check if close key was just pressed
   */
  private isCloseKeyPressed(): boolean {
    return Phaser.Input.Keyboard.JustDown(this.keys.close);
  }

  /**
   * Get the highest available dialog tier based on discovered clues
   */
  private getAvailableTier(characterId: string): number {
    const charData = this.dialogCache.get(characterId);
    if (!charData || !charData.postIncident) {
      return 0;
    }

    const discoveredCount = this.progressionManager?.getDiscoveredClueCount() ?? 0;
    console.log(`[getAvailableTier] ${characterId} - Discovered clues: ${discoveredCount}`);
    
    // Find the highest tier that the player has unlocked
    let availableTier = 0;
    for (let i = charData.postIncident.length - 1; i >= 0; i--) {
      const tierData = charData.postIncident[i];
      console.log(`[getAvailableTier] ${characterId} - Checking tier ${i}: requires ${tierData.requiredClues} clues, have ${discoveredCount}`);
      if (discoveredCount >= tierData.requiredClues) {
        availableTier = i;
        console.log(`[getAvailableTier] ${characterId} - Tier ${i} is available!`);
        break;
      }
    }

    console.log(`[getAvailableTier] ${characterId} - Final available tier: ${availableTier}`);
    return availableTier;
  }

  /**
   * Select appropriate dialog content based on phase and tier
   * Returns both the dialog data and the effective tier used
   */
  private selectDialog(characterId: string, phase: GamePhase, tier: number): { data: DialogData; effectiveTier: number } {
    const charData = this.dialogCache.get(characterId);
    if (!charData) {
      console.warn(`No dialog data for character: ${characterId}`);
      return { data: this.fallbackDialog(), effectiveTier: 0 };
    }
    
    // Check for failed accusations to show post-failure variant
    const accusationManager = this.scene.registry.get('accusationManager');
    const failedAccusations = accusationManager?.getState()?.failedAccusations || 0;

    if (phase === 'pre-incident') {
      // Return introduction dialog
      console.log(`[Dialog] ${characterId} - Phase: ${phase} - Showing introduction`);
      return {
        data: {
          lines: charData.introduction.lines,
          recordInNotebook: charData.introduction.recordInNotebook,
          notebookNote: charData.introduction.notebookNote,
        },
        effectiveTier: 0,
      };
    } else {
      // Post-incident: check for post-failure variant first
      if (failedAccusations > 0 && (charData as any).postFailureVariant) {
        const postFailure = (charData as any).postFailureVariant;
        const conversationCount = this.progressionManager?.getConversationCount(characterId, -1) ?? 0;
        
        console.log(`[Dialog] ${characterId} - Phase: ${phase}, Failed accusations: ${failedAccusations}, Using post-failure variant`);
        
        if (conversationCount === 0) {
          return {
            data: {
              lines: postFailure.lines,
              recordInNotebook: false,
            },
            effectiveTier: -1, // Special tier for post-failure
          };
        } else {
          const index = (conversationCount - 1) % postFailure.followUpLines.length;
          return {
            data: {
              lines: [postFailure.followUpLines[index]],
              recordInNotebook: false,
            },
            effectiveTier: -1,
          };
        }
      }
      
      // Normal tier-based selection
      // check if tier is available based on clues discovered
      const availableTier = this.getAvailableTier(characterId);
      const effectiveTier = Math.min(tier, availableTier);
      
      if (effectiveTier !== tier) {
        console.log(`[Dialog] ${characterId} - Tier ${tier} not unlocked yet (max available: ${availableTier})`);
      }

      // Select tier
      if (!charData.postIncident || effectiveTier >= charData.postIncident.length) {
        console.warn(`No tier ${effectiveTier} dialog for ${characterId}`);
        return { data: this.fallbackDialog(), effectiveTier: 0 };
      }

      const tierData = charData.postIncident[effectiveTier];
      const conversationCount = this.progressionManager?.getConversationCount(characterId, effectiveTier) ?? 0;

      // Debug output
      console.log(`[Dialog] ${characterId} - Phase: ${phase}, Tier: ${effectiveTier} (requested: ${tier}), ConversationCount: ${conversationCount}, Clues: ${this.progressionManager?.getDiscoveredClueCount() ?? 0}`);

      // First conversation at this tier: use initial lines
      if (conversationCount === 0) {
        console.log(`[Dialog] ${characterId} - Showing INITIAL lines (recordInNotebook: ${tierData.recordInNotebook})`);
        return {
          data: {
            lines: tierData.lines,
            recordInNotebook: tierData.recordInNotebook,
            notebookNote: tierData.notebookNote,
          },
          effectiveTier,
        };
      } else {
        // Follow-up conversation: cycle through follow-up lines
        const index = (conversationCount - 1) % tierData.followUpLines.length;
        console.log(`[Dialog] ${characterId} - Showing FOLLOW-UP line ${index + 1}/${tierData.followUpLines.length}`);
        return {
          data: {
            lines: [tierData.followUpLines[index]],
            recordInNotebook: false, // Don't record follow-ups
          },
          effectiveTier,
        };
      }
    }
  }

  /**
   * Fallback dialog when data is missing
   */
  private fallbackDialog(): DialogData {
    return {
      lines: ['...'],
      recordInNotebook: false,
    };
  }

  /**
   * Handle post-dialog actions (clue unlocking)
   */
  private handlePostDialogActions(characterId: string, tier: number): void {
    const charData = this.dialogCache.get(characterId);
    if (!charData || !charData.postIncident) return;

    const tierData = charData.postIncident[tier];
    if (!tierData || !tierData.unlocksClues || tierData.unlocksClues.length === 0) {
      return;
    }

    // Emit clue unlock events
    tierData.unlocksClues.forEach(clueId => {
      console.log(`Dialog unlocking clue: ${clueId}`);
      this.scene.events.emit('clue-unlock-requested', clueId);
    });
  }

  /**
   * Destroy and clean up
   */
  public destroy(): void {
    this.dialogHistory = [];
    this.dialogCache.clear();
  }
}
