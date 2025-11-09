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
  private currentMessage: DialogMessage | null = null;

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

    // Update speaker text (hide if null)
    if (message.speaker) {
      this.speakerText.setText(message.speaker);
      this.speakerText.setVisible(true);
    } else {
      this.speakerText.setVisible(false);
    }

    // Update message text
    this.messageText.setText(message.message);
    
    // Adjust message text position based on speaker visibility
    if (message.speaker) {
      this.messageText.setY(-this.height / 2 + this.padding + 30);
    } else {
      this.messageText.setY(-this.height / 2 + this.padding);
    }

    // Show container
    this.container.setVisible(true);
  }

  /**
   * Hide the dialog box
   */
  public hide(): void {
    this.container.setVisible(false);
    this.currentMessage = null;
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

    if (message.message.length > 500) {
      console.warn('DialogBox: Message exceeds 500 characters, truncating');
      message.message = message.message.substring(0, 497) + '...';
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
