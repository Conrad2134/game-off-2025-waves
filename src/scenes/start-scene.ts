import Phaser from 'phaser';

export class StartScene extends Phaser.Scene {
  private assetErrors: Map<string, boolean> = new Map();
  private titleText!: Phaser.GameObjects.Text;
  private startButton!: Phaser.GameObjects.Text;
  private background!: Phaser.GameObjects.Graphics;
  private decorations: Phaser.GameObjects.Graphics[] = [];

  // Cozy library color palette
  private colors = {
    darkBrown: 0x3d2817,      // Dark wood
    brown: 0x5c4033,          // Medium wood
    lightBrown: 0x8b6f47,     // Light wood
    cream: 0xf4e8d0,          // Parchment/paper
    gold: 0xd4af37,           // Golden accents
    darkGold: 0xb8941f,       // Darker gold
    shadow: 0x2a1810,         // Deep shadow
    warmLight: 0xfff5e6,      // Warm light
  };

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

    // Create pixel art background
    this.createBackground(width, height);

    // Create decorative elements
    this.createDecorations(width, height);

    // Create title text with pixel art styling
    this.titleText = this.add.text(width / 2, height * 0.25, 'Who Ate Valentin\'s\nErdbeerstrudel?', {
      fontSize: '42px',
      fontFamily: 'monospace',
      color: '#f4e8d0',
      align: 'center',
      stroke: '#2a1810',
      strokeThickness: 4,
    });
    this.titleText.setOrigin(0.5);
    this.titleText.setScrollFactor(0);
    this.titleText.setShadow(2, 2, '#2a1810', 0, false, true);
    this.titleText.setDepth(10);

    // Create button background (decorative frame)
    const buttonBg = this.add.graphics();
    this.drawButtonFrame(buttonBg, width / 2, height * 0.6, 240, 60);
    buttonBg.setScrollFactor(0);
    this.decorations.push(buttonBg);

    // Create start button with pixel art styling
    this.startButton = this.add.text(width / 2, height * 0.6, 'Start Game', {
      fontSize: '28px',
      fontFamily: 'monospace',
      color: '#d4af37',
      align: 'center',
      stroke: '#2a1810',
      strokeThickness: 3,
    });
    this.startButton.setOrigin(0.5);
    this.startButton.setScrollFactor(0);

    // Make button interactive
    this.startButton.setInteractive({ useHandCursor: true });

    // Hover effect
    this.startButton.on('pointerover', () => {
      this.startButton.setColor('#fff5e6');
      this.startButton.setScale(1.05);
    });

    this.startButton.on('pointerout', () => {
      this.startButton.setColor('#d4af37');
      this.startButton.setScale(1.0);
    });

    // Click effect (placeholder - does nothing yet)
    this.startButton.on('pointerdown', () => {
      this.startButton.setScale(0.98);
    });

    this.startButton.on('pointerup', () => {
      this.startButton.setScale(1.05);
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

    // Recreate background to fit new size
    this.createBackground(width, height);
    
    // Recreate decorations
    this.decorations.forEach(d => d.destroy());
    this.decorations = [];
    this.createDecorations(width, height);

    // Reposition title
    if (this.titleText) {
      this.titleText.setPosition(width / 2, height * 0.25);
      this.titleText.setDepth(10);
    }

    // Recreate and reposition button background
    const buttonBg = this.add.graphics();
    this.drawButtonFrame(buttonBg, width / 2, height * 0.6, 240, 60);
    buttonBg.setScrollFactor(0);
    this.decorations.push(buttonBg);

    // Reposition button (bring to front)
    if (this.startButton) {
      this.startButton.setPosition(width / 2, height * 0.6);
      this.startButton.setDepth(10);
    }
  }

  private createBackground(width: number, height: number): void {
    if (this.background) {
      this.background.destroy();
    }

    this.background = this.add.graphics();
    
    // Main background - dark brown wood
    this.background.fillStyle(this.colors.darkBrown);
    this.background.fillRect(0, 0, width, height);

    // Create wood grain texture effect with horizontal planks
    const plankHeight = 80;
    for (let y = 0; y < height; y += plankHeight) {
      // Alternating slightly different shades for planks
      const shade = y % (plankHeight * 2) === 0 ? this.colors.brown : this.colors.darkBrown;
      this.background.fillStyle(shade, 0.3);
      this.background.fillRect(0, y, width, plankHeight - 4);
      
      // Plank separation line
      this.background.fillStyle(this.colors.shadow, 0.5);
      this.background.fillRect(0, y + plankHeight - 4, width, 4);
    }

    // Add some wood grain details (vertical lines)
    this.background.lineStyle(1, this.colors.lightBrown, 0.1);
    for (let x = 0; x < width; x += 40) {
      const offset = Math.sin(x * 0.1) * 10;
      this.background.beginPath();
      this.background.moveTo(x, 0);
      this.background.lineTo(x + offset, height);
      this.background.strokePath();
    }

    // Vignette effect
    this.background.fillGradientStyle(
      this.colors.shadow, this.colors.shadow, 
      this.colors.shadow, this.colors.shadow,
      0.6, 0, 0, 0.6
    );
    const vignetteWidth = width * 0.25;
    const vignetteHeight = height * 0.25;
    
    // Top vignette
    this.background.fillRect(0, 0, width, vignetteHeight);
    // Bottom vignette
    this.background.fillRect(0, height - vignetteHeight, width, vignetteHeight);
    // Left vignette
    this.background.fillRect(0, 0, vignetteWidth, height);
    // Right vignette
    this.background.fillRect(width - vignetteWidth, 0, vignetteWidth, height);

    this.background.setScrollFactor(0);
  }

  private createDecorations(width: number, height: number): void {
    // Create decorative border (library shelves aesthetic)
    const border = this.add.graphics();
    
    // Top shelf
    border.fillStyle(this.colors.brown);
    border.fillRect(20, 20, width - 40, 12);
    border.fillStyle(this.colors.lightBrown);
    border.fillRect(20, 20, width - 40, 6);
    border.fillStyle(this.colors.shadow);
    border.fillRect(20, 32, width - 40, 4);
    
    // Bottom shelf
    border.fillStyle(this.colors.brown);
    border.fillRect(20, height - 32, width - 40, 12);
    border.fillStyle(this.colors.lightBrown);
    border.fillRect(20, height - 32, width - 40, 6);
    border.fillStyle(this.colors.shadow);
    border.fillRect(20, height - 36, width - 40, 4);
    
    // Left bookshelf
    border.fillStyle(this.colors.brown);
    border.fillRect(20, 36, 12, height - 72);
    border.fillStyle(this.colors.lightBrown);
    border.fillRect(20, 36, 6, height - 72);
    
    // Right bookshelf
    border.fillStyle(this.colors.brown);
    border.fillRect(width - 32, 36, 12, height - 72);
    border.fillStyle(this.colors.lightBrown);
    border.fillRect(width - 32, 36, 6, height - 72);
    
    // Corner ornaments (golden brackets)
    this.drawCornerOrnament(border, 32, 32, 1, 1);
    this.drawCornerOrnament(border, width - 32, 32, -1, 1);
    this.drawCornerOrnament(border, 32, height - 32, 1, -1);
    this.drawCornerOrnament(border, width - 32, height - 32, -1, -1);
    
    border.setScrollFactor(0);
    this.decorations.push(border);
  }

  private drawCornerOrnament(graphics: Phaser.GameObjects.Graphics, x: number, y: number, dirX: number, dirY: number): void {
    graphics.fillStyle(this.colors.gold);
    // Small decorative bracket
    graphics.fillRect(x, y, dirX * 16, dirY * 4);
    graphics.fillRect(x, y, dirX * 4, dirY * 16);
    // Accent
    graphics.fillStyle(this.colors.darkGold);
    graphics.fillRect(x + dirX * 2, y + dirY * 2, dirX * 2, dirY * 2);
  }

  private drawButtonFrame(graphics: Phaser.GameObjects.Graphics, x: number, y: number, w: number, h: number): void {
    const halfW = w / 2;
    const halfH = h / 2;
    
    // Button background (dark wood panel)
    graphics.fillStyle(this.colors.brown);
    graphics.fillRect(x - halfW, y - halfH, w, h);
    
    // Highlight on top and left
    graphics.lineStyle(3, this.colors.lightBrown, 1);
    graphics.strokeRect(x - halfW + 2, y - halfH + 2, w - 4, h - 4);
    
    // Shadow on bottom and right
    graphics.lineStyle(2, this.colors.shadow, 1);
    graphics.beginPath();
    graphics.moveTo(x - halfW + 4, y + halfH - 2);
    graphics.lineTo(x + halfW - 2, y + halfH - 2);
    graphics.lineTo(x + halfW - 2, y - halfH + 4);
    graphics.strokePath();
    
    // Golden corners
    const cornerSize = 6;
    graphics.fillStyle(this.colors.gold);
    graphics.fillRect(x - halfW, y - halfH, cornerSize, cornerSize);
    graphics.fillRect(x + halfW - cornerSize, y - halfH, cornerSize, cornerSize);
    graphics.fillRect(x - halfW, y + halfH - cornerSize, cornerSize, cornerSize);
    graphics.fillRect(x + halfW - cornerSize, y + halfH - cornerSize, cornerSize, cornerSize);
  }

  shutdown(): void {
    // Clean up event listeners
    this.game.events.off('blur', this.handlePause, this);
    this.game.events.off('focus', this.handleResume, this);
    this.scale.off('resize', this.handleResize, this);
  }
}
