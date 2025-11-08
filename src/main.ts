import Phaser from 'phaser';
import { StartScene } from './scenes/start-scene';
import { LibraryScene } from './scenes/library-scene';

const GAME_WIDTH = 1024;
const GAME_HEIGHT = 768;
const TARGET_FPS = 60;

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  parent: 'game-container',
  backgroundColor: '#000000',
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  fps: {
    target: TARGET_FPS,
    forceSetTimeOut: false,
  },
  scene: [StartScene, LibraryScene],
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false,
    },
  },
  render: {
    antialias: false, // Critical for pixel art!
    pixelArt: true, // Critical for pixel art!
  },
};

const game = new Phaser.Game(config);

// Export for debugging
interface WindowWithGame extends Window {
  game?: Phaser.Game;
}

(window as WindowWithGame).game = game;
