import Phaser from 'phaser';
import { WIDTH, HEIGHT, FPS } from './constants.js';
import { BootScene } from './scenes/BootScene.js';
import { ConnectScene } from './scenes/ConnectScene.js';
import { GameScene } from './scenes/GameScene.js';

const config = {
  type: Phaser.AUTO,
  width: WIDTH,
  height: HEIGHT,
  parent: 'game-container',
  backgroundColor: '#1a1a2e',
  fps: {
    target: FPS,
    forceSetTimeOut: true,
  },
  dom: {
    createContainer: true,
  },
  scene: [BootScene, ConnectScene, GameScene],
};

new Phaser.Game(config);
