import Phaser from 'phaser';
import type { DialogBoxConfig, DialogMessage } from '../types/dialog';

/**
 * DialogBox component - UI container for displaying dialog messages
 * 
 * Features:
 * - Semi-transparent background with border
 * - Speaker name display (optional)
 * - Word-wrapped message text
 * - Pixel-perfect rendering
 * - Fixed to camera viewport
 */
export class DialogBox {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container;
  private background: Phaser.GameObjects.Graphics;
  private speakerText: Phaser.GameObjects.Text;
  private messageText: Phaser.GameObjects.Text;
  private continueText: Phaser.GameObjects.Text;
  private currentMessage: DialogMessage | null = null;
  private messagePages: string[] = [];
  private currentPageIndex: number = 0;

  // Configuration
  private width: number;
  private height: number;
  private padding: number;
  private backgroundColor: number;
  private borderColor: number;
  private borderWidth: number;

  constructor(config: DialogBoxConfig) {
    this.scene = config.scene;
    this.width = config.width;
    this.height = config.height;
    this.padding = config.padding ?? 20;
    this.backgroundColor = config.backgroundColor ?? 0x000000;
    this.borderColor = config.borderColor ?? 0xffffff;
    this.borderWidth = config.borderWidth ?? 4;

    // Create container
    this.container = this.scene.add.container(config.x, config.y);
    this.container.setScrollFactor(0); // Fixed to camera
    this.container.setDepth(config.depth ?? 1000);
    this.container.setVisible(false);

    // Create background graphics
    this.background = this.scene.add.graphics();
    this.drawBackground();
    this.container.add(this.background);

    // Create speaker text (character name)
    this.speakerText = this.scene.add.text(
      -this.width / 2 + this.padding,
      -this.height / 2 + this.padding,
      '',
      {
        fontFamily: 'Arial, sans-serif',
        fontSize: '26px',
        color: '#ffffff',
        fontStyle: 'bold',
      }
    );
    this.speakerText.setResolution(2); // Crisp pixel rendering
    this.speakerText.setVisible(false);
    this.container.add(this.speakerText);

    // Create message text (dialog content)
    this.messageText = this.scene.add.text(
      -this.width / 2 + this.padding,
      -this.height / 2 + this.padding + 30,
      '',
      {
        fontFamily: 'Arial, sans-serif',
        fontSize: '22px',
        color: '#ffffff',
        wordWrap: { width: this.width - this.padding * 2, useAdvancedWrap: true },
      }
    );
    this.messageText.setResolution(2); // Crisp pixel rendering
    this.container.add(this.messageText);

    // Create continue indicator (shown when there are more pages)
    this.continueText = this.scene.add.text(
      this.width / 2 - this.padding - 10,
      this.height / 2 - this.padding - 5,
      '▼',
      {
        fontFamily: 'Arial, sans-serif',
        fontSize: '20px',
        color: '#ffff00',
      }
    );
    this.continueText.setOrigin(1, 1);
    this.continueText.setResolution(2);
    this.continueText.setVisible(false);
    this.container.add(this.continueText);
  }

  /**
   * Draw the background and border
   */
  private drawBackground(): void {
    this.background.clear();

    // Draw semi-transparent background
    this.background.fillStyle(this.backgroundColor, 0.85);
    this.background.fillRect(
      -this.width / 2,
      -this.height / 2,
      this.width,
      this.height
    );

    // Draw border
    this.background.lineStyle(this.borderWidth, this.borderColor, 1);
    this.background.strokeRect(
      -this.width / 2,
      -this.height / 2,
      this.width,
      this.height
    );
  }

  /**
   * Show the dialog box with a message
   */
  public show(message: DialogMessage): void {
    this.validateMessage(message);
    this.currentMessage = message;
    this.currentPageIndex = 0;

    // Update speaker text (hide if null)
    if (message.speaker) {
      this.speakerText.setText(message.speaker);
      this.speakerText.setVisible(true);
    } else {
      this.speakerText.setVisible(false);
    }

    // Paginate the message
    this.messagePages = this.paginateMessage(message.message);
    
    // Adjust message text position based on speaker visibility
    if (message.speaker) {
      this.messageText.setY(-this.height / 2 + this.padding + 30);
    } else {
      this.messageText.setY(-this.height / 2 + this.padding);
    }

    // Display first page
    this.displayCurrentPage();

    // Show container
    this.container.setVisible(true);
  }

  /**
   * Paginate message into chunks that fit in the dialog box
   */
  private paginateMessage(message: string): string[] {
    const maxCharsPerPage = 180; // Approximate character limit per page
    const pages: string[] = [];
    
    // Split by sentences first
    const sentences = message.match(/[^.!?]+[.!?]+/g) || [message];
    let currentPage = '';
    
    for (const sentence of sentences) {
      const trimmedSentence = sentence.trim();
      
      // If adding this sentence would exceed limit, start new page
      if (currentPage.length + trimmedSentence.length > maxCharsPerPage && currentPage.length > 0) {
        pages.push(currentPage.trim());
        currentPage = trimmedSentence;
      } else {
        currentPage += (currentPage.length > 0 ? ' ' : '') + trimmedSentence;
      }
    }
    
    // Add remaining content
    if (currentPage.trim().length > 0) {
      pages.push(currentPage.trim());
    }
    
    return pages.length > 0 ? pages : [message];
  }

  /**
   * Display the current page
   */
  private displayCurrentPage(): void {
    if (this.messagePages.length === 0) return;
    
    this.messageText.setText(this.messagePages[this.currentPageIndex]);
    
    // Show/hide continue indicator
    this.continueText.setVisible(this.hasNextPage());
  }

  /**
   * Advance to the next page
   * @returns true if advanced, false if already on last page
   */
  public nextPage(): boolean {
    if (!this.hasNextPage()) {
      return false;
    }
    
    this.currentPageIndex++;
    this.displayCurrentPage();
    return true;
  }

  /**
   * Check if there's a next page
   */
  public hasNextPage(): boolean {
    return this.currentPageIndex < this.messagePages.length - 1;
  }

  /**
   * Get current page number (1-indexed)
   */
  public getCurrentPage(): number {
    return this.currentPageIndex + 1;
  }

  /**
   * Get total number of pages
   */
  public getTotalPages(): number {
    return this.messagePages.length;
  }

  /**
   * Hide the dialog box
   */
  public hide(): void {
    this.container.setVisible(false);
    this.currentMessage = null;
    this.messagePages = [];
    this.currentPageIndex = 0;
    this.continueText.setVisible(false);
  }

  /**
   * Check if dialog box is currently visible
   */
  public isVisible(): boolean {
    return this.container.visible;
  }

  /**
   * Get the current message being displayed
   */
  public getCurrentMessage(): DialogMessage | null {
    return this.currentMessage;
  }

  /**
   * Validate a dialog message
   */
  private validateMessage(message: DialogMessage): void {
    if (!message.message || message.message.trim().length === 0) {
      console.warn('DialogBox: Empty message provided, using fallback');
      message.message = 'No dialog available.';
    }

    if (message.speaker && message.speaker.length > 50) {
      console.warn('DialogBox: Speaker name exceeds 50 characters, truncating');
      message.speaker = message.speaker.substring(0, 47) + '...';
    }
  }

  /**
   * Destroy the dialog box and clean up resources
   */
  public destroy(): void {
    this.container.destroy();
  }
}
