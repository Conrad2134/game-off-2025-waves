import Phaser from 'phaser';
import type { NotebookUIConfig, NotebookSection } from '../types/notebook';

/**
 * NotebookUI - Visual component for displaying the player's notebook
 * 
 * Features:
 * - Parchment-style notebook interface
 * - Sections for each NPC and a "Clues" section
 * - Scrollable content
 * - Toggle visibility with 'N' key
 */
export class NotebookUI {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container;
  private background!: Phaser.GameObjects.Rectangle;
  private border!: Phaser.GameObjects.Rectangle;
  private titleText!: Phaser.GameObjects.Text;
  private contentText!: Phaser.GameObjects.Text;
  private closeHintText!: Phaser.GameObjects.Text;
  private visible: boolean = false;
  
  // Configuration
  private x: number;
  private y: number;
  private width: number;
  private height: number;
  private depth: number;
  private backgroundColor: number;
  private borderColor: number;
  
  // Content management
  private sections: NotebookSection[] = [];
  private scrollY: number = 0;
  private maxScroll: number = 0;

  constructor(config: NotebookUIConfig) {
    this.scene = config.scene;
    this.x = config.x ?? this.scene.cameras.main.width / 2;
    this.y = config.y ?? this.scene.cameras.main.height / 2;
    this.width = config.width ?? 800;
    this.height = config.height ?? 600;
    this.depth = config.depth ?? 2000;
    this.backgroundColor = config.backgroundColor ?? 0xf5e6d3; // Parchment color
    this.borderColor = config.borderColor ?? 0x8b4513; // Brown border
    
    // Create container
    this.container = this.scene.add.container(0, 0);
    this.container.setScrollFactor(0); // Fixed to camera
    this.container.setDepth(this.depth);
    
    this.createUI();
    this.hide(); // Start hidden
  }

  /**
   * Create the UI elements
   */
  private createUI(): void {
    // Background
    this.background = this.scene.add.rectangle(
      this.x,
      this.y,
      this.width,
      this.height,
      this.backgroundColor,
      0.95
    );
    this.container.add(this.background);

    // Border
    this.border = this.scene.add.rectangle(
      this.x,
      this.y,
      this.width,
      this.height
    );
    this.border.setStrokeStyle(4, this.borderColor, 1);
    this.border.setFillStyle(0x000000, 0); // Transparent fill
    this.container.add(this.border);

    // Title
    this.titleText = this.scene.add.text(
      this.x,
      this.y - this.height / 2 + 30,
      'My Notebook',
      {
        fontFamily: 'Georgia, serif',
        fontSize: '32px',
        color: '#3d2817',
        fontStyle: 'bold',
      }
    );
    this.titleText.setOrigin(0.5, 0);
    this.container.add(this.titleText);

    // Create a clipping mask for the content area
    const maskShape = this.scene.make.graphics({});
    maskShape.fillStyle(0xffffff);
    maskShape.fillRect(
      this.x - this.width / 2 + 40,
      this.y - this.height / 2 + 80,
      this.width - 80,
      this.height - 160
    );
    const mask = maskShape.createGeometryMask();

    // Content area
    this.contentText = this.scene.add.text(
      this.x - this.width / 2 + 40,
      this.y - this.height / 2 + 80,
      '',
      {
        fontFamily: 'Georgia, serif',
        fontSize: '16px',
        color: '#2d2013',
        lineSpacing: 6,
        wordWrap: { width: this.width - 80 },
      }
    );
    this.contentText.setOrigin(0, 0);
    this.contentText.setMask(mask);
    this.container.add(this.contentText);

    // Close hint
    this.closeHintText = this.scene.add.text(
      this.x,
      this.y + this.height / 2 - 30,
      'Press N to close',
      {
        fontFamily: 'Arial',
        fontSize: '16px',
        color: '#666666',
        fontStyle: 'italic',
      }
    );
    this.closeHintText.setOrigin(0.5, 0);
    this.container.add(this.closeHintText);
  }

  /**
   * Update the notebook with new sections
   */
  public updateSections(sections: NotebookSection[]): void {
    this.sections = sections;
    this.scrollY = 0;
    this.renderContent();
  }

  /**
   * Render the content text
   */
  private renderContent(): void {
    if (this.sections.length === 0) {
      this.contentText.setText('No notes yet. Talk to people and\nexamine objects to discover clues!');
      this.maxScroll = 0;
      return;
    }

    let content = '';

    // Group sections by category
    const npcSections = this.sections.filter(s => s.category === 'npc');
    const clueSections = this.sections.filter(s => s.category === 'clue');

    // Render NPC conversations
    if (npcSections.length > 0) {
      content += '══ CONVERSATIONS ══\n\n';
      
      npcSections.forEach(section => {
        content += `◆ ${section.sourceName}\n`;
        section.entries.forEach(entry => {
          content += `  • ${entry.text}\n`;
        });
        content += '\n';
      });
    }

    // Render clues
    if (clueSections.length > 0) {
      content += '══ CLUES ══\n\n';
      
      clueSections.forEach(section => {
        content += `◆ ${section.sourceName}\n`;
        section.entries.forEach(entry => {
          content += `  • ${entry.text}\n`;
        });
        content += '\n';
      });
    }

    this.contentText.setText(content);
    
    // Calculate max scroll based on content height
    const contentHeight = this.contentText.height;
    const visibleHeight = this.height - 160; // Account for title and padding
    this.maxScroll = Math.max(0, contentHeight - visibleHeight);
  }

  /**
   * Scroll the content
   */
  public scroll(deltaY: number): void {
    this.scrollY = Phaser.Math.Clamp(this.scrollY + deltaY, 0, this.maxScroll);
    this.contentText.setY((this.y - this.height / 2 + 80) - this.scrollY);
  }

  /**
   * Show the notebook
   */
  public show(): void {
    this.visible = true;
    this.container.setVisible(true);
  }

  /**
   * Hide the notebook
   */
  public hide(): void {
    this.visible = false;
    this.container.setVisible(false);
  }

  /**
   * Toggle visibility
   */
  public toggle(): void {
    if (this.visible) {
      this.hide();
    } else {
      this.show();
    }
  }

  /**
   * Check if notebook is currently visible
   */
  public isVisible(): boolean {
    return this.visible;
  }

  /**
   * Clean up resources
   */
  public destroy(): void {
    this.container.destroy();
  }
}
