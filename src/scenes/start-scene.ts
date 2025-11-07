import Phaser from 'phaser';

export class StartScene extends Phaser.Scene {
  private assetErrors: Map<string, boolean> = new Map();
  private titleText!: Phaser.GameObjects.Text;
  private startButton!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'start-scene' });
  }

  preload(): void {
    // Register error handler for failed asset loads
    this.load.on('loaderror', (file: Phaser.Loader.File) => {
      console.warn(`Asset load failed: ${file.key}`);
      this.assetErrors.set(file.key, true);
    });

    // Future asset loading will go here
  }

  create(): void {
    const { width, height } = this.cameras.main;

    // Create background
    this.cameras.main.setBackgroundColor('#2c3e50');

    // Create title text
    this.titleText = this.add.text(width / 2, height * 0.25, 'Who Ate Valentin\'s Erdbeerstrudel?', {
      fontSize: '48px',
      fontFamily: 'monospace',
      color: '#ecf0f1',
      align: 'center',
      fontStyle: 'bold',
    });
    this.titleText.setOrigin(0.5);
    this.titleText.setScrollFactor(0);

    // Create start button
    this.startButton = this.add.text(width / 2, height * 0.6, 'Start Game', {
      fontSize: '32px',
      fontFamily: 'monospace',
      color: '#3498db',
      align: 'center',
    });
    this.startButton.setOrigin(0.5);
    this.startButton.setScrollFactor(0);

    // Make button interactive
    this.startButton.setInteractive({ useHandCursor: true });

    // Hover effect
    this.startButton.on('pointerover', () => {
      this.startButton.setColor('#5dade2');
      this.startButton.setScale(1.1);
    });

    this.startButton.on('pointerout', () => {
      this.startButton.setColor('#3498db');
      this.startButton.setScale(1.0);
    });

    // Click effect (placeholder - does nothing yet)
    this.startButton.on('pointerdown', () => {
      this.startButton.setScale(0.95);
    });

    this.startButton.on('pointerup', () => {
      this.startButton.setScale(1.1);
      // TODO: Transition to game scene when implemented
      console.warn('Start button clicked - game scene not yet implemented');
    });

    // Fade in effect
    this.cameras.main.fadeIn(500);

    // Handle window events
    this.game.events.on('blur', this.handlePause, this);
    this.game.events.on('focus', this.handleResume, this);
    this.scale.on('resize', this.handleResize, this);
  }

  update(): void {
    // No update logic needed for static home screen
  }

  private handlePause(): void {
    this.scene.pause();
  }

  private handleResume(): void {
    this.scene.resume();
  }

  private handleResize(gameSize: Phaser.Structs.Size): void {
    const { width, height } = gameSize;

    // Reposition title
    if (this.titleText) {
      this.titleText.setPosition(width / 2, height * 0.25);
    }

    // Reposition button
    if (this.startButton) {
      this.startButton.setPosition(width / 2, height * 0.6);
    }
  }

  shutdown(): void {
    // Clean up event listeners
    this.game.events.off('blur', this.handlePause, this);
    this.game.events.off('focus', this.handleResume, this);
    this.scale.off('resize', this.handleResize, this);
  }
}
