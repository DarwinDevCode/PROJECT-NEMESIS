/**
 * main.js
 * Punto de entrada de Project Nemesis.
 * Configura Phaser con arcade physics, resolución 960×540,
 * y registra todas las escenas del juego.
 */

import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, FIGHTER_CONFIG } from './game/config.js';
import { SCENES } from './game/constants.js';

// ─── Importar escenas ─────────────────────────────────────
import BootScene from './scenes/BootScene.js';
import MenuScene from './scenes/MenuScene.js';
import PrepareScene from './scenes/PrepareScene.js';
import ArenaScene from './scenes/ArenaScene.js';
import PauseScene from './scenes/PauseScene.js';
import ResultScene from './scenes/ResultScene.js';
import AnalysisScene from './scenes/AnalysisScene.js';
import ProfileScene from './scenes/ProfileScene.js';
import NemesisStatsScene from './scenes/NemesisStatsScene.js';
import OptionsScene from './scenes/OptionsScene.js';

// ─── Configuración de Phaser ──────────────────────────────
const config = {
  type: Phaser.AUTO,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  parent: 'game-container',
  backgroundColor: '#0d0d1a',

  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: FIGHTER_CONFIG.gravity },
      debug: false,  // Cambiar a true para ver hitboxes durante desarrollo
    },
  },

  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },

  scene: [
    BootScene, 
    MenuScene, 
    PrepareScene, 
    ArenaScene, 
    PauseScene, 
    ResultScene, 
    AnalysisScene, 
    ProfileScene, 
    NemesisStatsScene,
    OptionsScene,
  ],

  // Pixel art: desactivar antialiasing para sprites nítidos
  pixelArt: true,
  antialias: false,
  roundPixels: true,
};

// ─── Iniciar el juego ─────────────────────────────────────
const game = new Phaser.Game(config);