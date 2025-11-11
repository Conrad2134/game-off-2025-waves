import Phaser from 'phaser';

export class StartScene extends Phaser.Scene {
  private assetErrors: Map<string, boolean> = new Map();
  private titleText!: Phaser.GameObjects.Text;
  private startButton!: Phaser.GameObjects.Text;
  private resetButton!: Phaser.GameObjects.Text;
  private background!: Phaser.GameObjects.Graphics;
  private decorations: Phaser.GameObjects.Graphics[] = [];

  // Cozy library color palette
  private colors = {
    darkBrown: 0x3d2817,
    brown: 0x5c4033,
    lightBrown: 0x8b6f47,
    cream: 0xf4e8d0,
    gold: 0xd4af37,
    darkGold: 0xb8941f,
    shadow: 0x2a1810,
    warmLight: 0xfff5e6,
  };

  constructor() {
    super({ key: 'start-scene' });
  }

  preload(): void {
    this.load.on('loaderror', (file: Phaser.Loader.File) => {
      console.warn(`Asset load failed: ${file.key}`);
      this.assetErrors.set(file.key, true);
    });
  }

  create(): void {
    const { width, height } = this.cameras.main;
    this.createBackground(width, height);
    this.createDecorations(width, height);

    // Check for saved game
    const hasSave = this.checkForSavedGame();

    this.titleText = this.add.text(width / 2, height * 0.25, "Who Ate Valentin's\nErdbeerstrudel?", {
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

    const buttonBg = this.add.graphics();
    this.drawButtonFrame(buttonBg, width / 2, height * 0.6, 240, 60);
    buttonBg.setScrollFactor(0);
    this.decorations.push(buttonBg);

    // Show "Resume Game" if save exists, otherwise "Start Game"
    const buttonText = hasSave ? 'Resume Game' : 'Start Game';
    this.startButton = this.add.text(width / 2, height * 0.6, buttonText, {
      fontSize: '28px',
      fontFamily: 'monospace',
      color: '#d4af37',
      align: 'center',
      stroke: '#2a1810',
      strokeThickness: 3,
    });
    this.startButton.setOrigin(0.5);
    this.startButton.setScrollFactor(0);
    this.startButton.setInteractive({ useHandCursor: true });

    this.startButton.on('pointerover', () => {
      this.startButton.setColor('#fff5e6');
      this.startButton.setScale(1.05);
    });
    this.startButton.on('pointerout', () => {
      this.startButton.setColor('#d4af37');
      this.startButton.setScale(1.0);
    });
    this.startButton.on('pointerdown', () => this.startButton.setScale(0.98));
    this.startButton.on('pointerup', () => {
      this.startButton.setScale(1.05);
      this.handleStartClick();
    });

    const resetButtonBg = this.add.graphics();
    this.drawButtonFrame(resetButtonBg, width / 2, height * 0.75, 240, 60);
    resetButtonBg.setScrollFactor(0);
    this.decorations.push(resetButtonBg);

    this.resetButton = this.add.text(width / 2, height * 0.75, 'Reset Game', {
      fontSize: '28px',
      fontFamily: 'monospace',
      color: '#b8941f',
      align: 'center',
      stroke: '#2a1810',
      strokeThickness: 3,
    });
    this.resetButton.setOrigin(0.5);
    this.resetButton.setScrollFactor(0);
    this.resetButton.setInteractive({ useHandCursor: true });

    this.resetButton.on('pointerover', () => {
      this.resetButton.setColor('#d4af37');
      this.resetButton.setScale(1.05);
    });
    this.resetButton.on('pointerout', () => {
      this.resetButton.setColor('#b8941f');
      this.resetButton.setScale(1.0);
    });
    this.resetButton.on('pointerdown', () => this.resetButton.setScale(0.98));
    this.resetButton.on('pointerup', () => {
      this.resetButton.setScale(1.05);
      this.handleResetClick();
    });

    this.cameras.main.fadeIn(500);
    this.game.events.on('blur', this.handlePause, this);
    this.game.events.on('focus', this.handleResume, this);
    this.scale.on('resize', this.handleResize, this);
  }

  update(): void {}

  private handlePause(): void { this.scene.pause(); }
  private handleResume(): void { this.scene.resume(); }

  private handleResize(gameSize: Phaser.Structs.Size): void {
    const { width, height } = gameSize;
    this.createBackground(width, height);
    this.decorations.forEach(d => d.destroy());
    this.decorations = [];
    this.createDecorations(width, height);

    if (this.titleText) {
      this.titleText.setPosition(width / 2, height * 0.25);
      this.titleText.setDepth(10);
    }

    const buttonBg = this.add.graphics();
    this.drawButtonFrame(buttonBg, width / 2, height * 0.6, 240, 60);
    buttonBg.setScrollFactor(0);
    this.decorations.push(buttonBg);

    if (this.startButton) {
      this.startButton.setPosition(width / 2, height * 0.6);
      this.startButton.setDepth(10);
    }

    const resetButtonBg = this.add.graphics();
    this.drawButtonFrame(resetButtonBg, width / 2, height * 0.75, 240, 60);
    resetButtonBg.setScrollFactor(0);
    this.decorations.push(resetButtonBg);

    if (this.resetButton) {
      this.resetButton.setPosition(width / 2, height * 0.75);
      this.resetButton.setDepth(10);
    }
  }

  private createBackground(width: number, height: number): void {
    if (this.background) this.background.destroy();
    this.background = this.add.graphics();
    this.background.fillStyle(this.colors.darkBrown);
    this.background.fillRect(0, 0, width, height);

    const plankHeight = 80;
    for (let y = 0; y < height; y += plankHeight) {
      const shade = y % (plankHeight * 2) === 0 ? this.colors.brown : this.colors.darkBrown;
      this.background.fillStyle(shade, 0.3);
      this.background.fillRect(0, y, width, plankHeight - 4);
      this.background.fillStyle(this.colors.shadow, 0.5);
      this.background.fillRect(0, y + plankHeight - 4, width, 4);
    }

    this.background.lineStyle(1, this.colors.lightBrown, 0.1);
    for (let x = 0; x < width; x += 40) {
      const offset = Math.sin(x * 0.1) * 10;
      this.background.beginPath();
      this.background.moveTo(x, 0);
      this.background.lineTo(x + offset, height);
      this.background.strokePath();
    }

    this.background.fillGradientStyle(this.colors.shadow, this.colors.shadow, this.colors.shadow, this.colors.shadow, 0.6, 0, 0, 0.6);
    const vignetteWidth = width * 0.25;
    const vignetteHeight = height * 0.25;
    this.background.fillRect(0, 0, width, vignetteHeight);
    this.background.fillRect(0, height - vignetteHeight, width, vignetteHeight);
    this.background.fillRect(0, 0, vignetteWidth, height);
    this.background.fillRect(width - vignetteWidth, 0, vignetteWidth, height);
    this.background.setScrollFactor(0);
  }

  private createDecorations(width: number, height: number): void {
    const border = this.add.graphics();
    border.fillStyle(this.colors.brown);
    border.fillRect(20, 20, width - 40, 12);
    border.fillStyle(this.colors.lightBrown);
    border.fillRect(20, 20, width - 40, 6);
    border.fillStyle(this.colors.shadow);
    border.fillRect(20, 32, width - 40, 4);
    border.fillStyle(this.colors.brown);
    border.fillRect(20, height - 32, width - 40, 12);
    border.fillStyle(this.colors.lightBrown);
    border.fillRect(20, height - 32, width - 40, 6);
    border.fillStyle(this.colors.shadow);
    border.fillRect(20, height - 36, width - 40, 4);
    border.fillStyle(this.colors.brown);
    border.fillRect(20, 36, 12, height - 72);
    border.fillStyle(this.colors.lightBrown);
    border.fillRect(20, 36, 6, height - 72);
    border.fillStyle(this.colors.brown);
    border.fillRect(width - 32, 36, 12, height - 72);
    border.fillStyle(this.colors.lightBrown);
    border.fillRect(width - 32, 36, 6, height - 72);
    this.drawCornerOrnament(border, 32, 32, 1, 1);
    this.drawCornerOrnament(border, width - 32, 32, -1, 1);
    this.drawCornerOrnament(border, 32, height - 32, 1, -1);
    this.drawCornerOrnament(border, width - 32, height - 32, -1, -1);
    border.setScrollFactor(0);
    this.decorations.push(border);
  }

  private drawCornerOrnament(graphics: Phaser.GameObjects.Graphics, x: number, y: number, dirX: number, dirY: number): void {
    graphics.fillStyle(this.colors.gold);
    graphics.fillRect(x, y, dirX * 16, dirY * 4);
    graphics.fillRect(x, y, dirX * 4, dirY * 16);
    graphics.fillStyle(this.colors.darkGold);
    graphics.fillRect(x + dirX * 2, y + dirY * 2, dirX * 2, dirY * 2);
  }

  private drawButtonFrame(graphics: Phaser.GameObjects.Graphics, x: number, y: number, w: number, h: number): void {
    const halfW = w / 2;
    const halfH = h / 2;
    graphics.fillStyle(this.colors.brown);
    graphics.fillRect(x - halfW, y - halfH, w, h);
    graphics.lineStyle(3, this.colors.lightBrown, 1);
    graphics.strokeRect(x - halfW + 2, y - halfH + 2, w - 4, h - 4);
    graphics.lineStyle(2, this.colors.shadow, 1);
    graphics.beginPath();
    graphics.moveTo(x - halfW + 4, y + halfH - 2);
    graphics.lineTo(x + halfW - 2, y + halfH - 2);
    graphics.lineTo(x + halfW - 2, y - halfH + 4);
    graphics.strokePath();
    const cornerSize = 6;
    graphics.fillStyle(this.colors.gold);
    graphics.fillRect(x - halfW, y - halfH, cornerSize, cornerSize);
    graphics.fillRect(x + halfW - cornerSize, y - halfH, cornerSize, cornerSize);
    graphics.fillRect(x - halfW, y + halfH - cornerSize, cornerSize, cornerSize);
    graphics.fillRect(x + halfW - cornerSize, y + halfH - cornerSize, cornerSize, cornerSize);
  }

  private handleStartClick(): void {
    this.startButton.disableInteractive();
    this.cameras.main.fadeOut(500, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.stop();
      this.scene.start('library-scene');
    });
  }

  private handleResetClick(): void {
    localStorage.clear();
    console.log('🔄 Game data cleared!');
    this.resetButton.setText('Reset Complete!');
    this.resetButton.setFontSize('24px'); // Slightly smaller to fit
    this.resetButton.setColor('#5c4033');
    this.resetButton.disableInteractive();
    this.time.delayedCall(1500, () => {
      this.resetButton.setText('Reset Game');
      this.resetButton.setFontSize('28px'); // Back to original size
      this.resetButton.setColor('#b8941f');
      this.resetButton.setInteractive({ useHandCursor: true });
      
      // Update start button text since save is cleared
      this.startButton.setText('Start Game');
    });
  }

  /**
   * Check if a saved game exists
   */
  private checkForSavedGame(): boolean {
    try {
      const save = localStorage.getItem('erdbeerstrudel-save');
      return save !== null;
    } catch (error) {
      console.error('Failed to check for saved game:', error);
      return false;
    }
  }

  shutdown(): void {
    this.game.events.off('blur', this.handlePause, this);
    this.game.events.off('focus', this.handleResume, this);
    this.scale.off('resize', this.handleResize, this);
  }
}
