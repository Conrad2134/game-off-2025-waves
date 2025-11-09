import Phaser from 'phaser';
import type {
  NotebookManagerConfig,
  NotebookEntry,
  NotebookSection,
  NotebookCategory,
} from '../types/notebook';
import type { DialogMessage } from '../types/dialog';

/**
 * NotebookManager - System for tracking and managing notebook entries
 * 
 * Features:
 * - Record dialog messages and clues
 * - Organize entries by source (NPC or object)
 * - Generate sections for UI display
 * - Automatic deduplication
 */
export class NotebookManager {
  private scene: Phaser.Scene;
  private entries: NotebookEntry[] = [];
  private maxEntries: number;
  private nextId: number = 0;

  constructor(config: NotebookManagerConfig) {
    this.scene = config.scene;
    this.maxEntries = config.maxEntries ?? 100;
  }

  /**
   * Record a dialog message in the notebook
   */
  public recordDialog(message: DialogMessage): void {
    // Only record if explicitly marked
    if (!message.recordInNotebook) {
      return;
    }

    const category: NotebookCategory = message.type === 'npc' ? 'npc' : 'clue';
    const sourceId = message.characterId ?? message.objectId ?? 'unknown';
    const sourceName = message.speaker ?? sourceId;
    
    // Use the summarized note if available, otherwise fall back to the full message
    const noteText = message.notebookNote ?? message.message;

    this.addEntry({
      id: this.generateId(),
      category,
      sourceId,
      sourceName,
      text: noteText,
      timestamp: Date.now(),
    });
  }

  /**
   * Manually add an entry to the notebook
   */
  public addEntry(entry: NotebookEntry): void {
    // Check for duplicates (same source and text)
    const isDuplicate = this.entries.some(
      existing =>
        existing.sourceId === entry.sourceId &&
        existing.text === entry.text
    );

    if (isDuplicate) {
      console.log(`NotebookManager: Skipping duplicate entry from ${entry.sourceName}`);
      return;
    }

    this.entries.push(entry);

    // Trim old entries if exceeding max
    if (this.entries.length > this.maxEntries) {
      this.entries.shift();
    }

    console.log(`NotebookManager: Recorded entry from ${entry.sourceName} (${entry.category})`);
    this.scene.events.emit('notebook-entry-added', entry);
  }

  /**
   * Get all entries
   */
  public getEntries(): NotebookEntry[] {
    return [...this.entries];
  }

  /**
   * Get entries by category
   */
  public getEntriesByCategory(category: NotebookCategory): NotebookEntry[] {
    return this.entries.filter(entry => entry.category === category);
  }

  /**
   * Get entries by source ID
   */
  public getEntriesBySource(sourceId: string): NotebookEntry[] {
    return this.entries.filter(entry => entry.sourceId === sourceId);
  }

  /**
   * Generate sections for UI display
   * Groups entries by source, organized by category
   */
  public generateSections(): NotebookSection[] {
    const sections: NotebookSection[] = [];
    const sourceMap = new Map<string, NotebookEntry[]>();

    // Group entries by source
    this.entries.forEach(entry => {
      const existing = sourceMap.get(entry.sourceId);
      if (existing) {
        existing.push(entry);
      } else {
        sourceMap.set(entry.sourceId, [entry]);
      }
    });

    // Convert to sections
    sourceMap.forEach((entries, sourceId) => {
      // Sort entries by timestamp
      entries.sort((a, b) => a.timestamp - b.timestamp);

      sections.push({
        sourceId,
        sourceName: entries[0].sourceName,
        category: entries[0].category,
        entries,
      });
    });

    // Sort sections: NPCs first (alphabetically), then clues (alphabetically)
    sections.sort((a, b) => {
      if (a.category !== b.category) {
        return a.category === 'npc' ? -1 : 1;
      }
      return a.sourceName.localeCompare(b.sourceName);
    });

    return sections;
  }

  /**
   * Clear all entries
   */
  public clear(): void {
    this.entries = [];
    this.scene.events.emit('notebook-cleared');
  }

  /**
   * Get total number of entries
   */
  public getEntryCount(): number {
    return this.entries.length;
  }

  /**
   * Generate a unique entry ID
   */
  private generateId(): string {
    return `entry-${this.nextId++}`;
  }

  /**
   * Clean up resources
   */
  public destroy(): void {
    this.entries = [];
  }
}
