/**
 * MenuScene.js
 * Menú principal del juego.
 * Muestra opciones para Iniciar/Continuar, Ver Perfil del Jugador,
 * y Ver Estadísticas de Nemesis.
 */

import Phaser from 'phaser';
import { SCENES } from '../game/constants.js';
import { GAME_WIDTH, GAME_HEIGHT } from '../game/config.js';
import SaveManager from '../systems/SaveManager.js';
import AudioManager from '../systems/AudioManager.js';
import { AUDIO_KEYS } from '../game/audioConfig.js';

export default class MenuScene extends Phaser.Scene {
  constructor() {
    super(SCENES.MENU);
  }

  create() {
    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;

    // Iniciar música global (solo si no hay música reproduciéndose)
    AudioManager.getInstance()?.startMusic();

    // Fondo
    const bg = this.add.image(cx, cy, 'menu_bg').setOrigin(0.5);
    // Oscurecer un poco el fondo para que el texto resalte más
    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.4);
    overlay.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Título
    this.add.text(cx, 100, 'PROJECT NEMESIS', {
      fontSize: '48px',
      fontFamily: 'Courier New',
      color: '#cc0000',
      fontStyle: 'bold',
      shadow: { blur: 10, color: '#ff0000', fill: true }
    }).setOrigin(0.5);

    // Subtítulo
    this.add.text(cx, 150, 'IA ADAPTATIVA - DEMO', {
      fontSize: '18px',
      fontFamily: 'Courier New',
      color: '#666666',
      letterSpacing: 2
    }).setOrigin(0.5);

    // Opciones del menú
    const saveData = this.registry.get('saveData');
    const matchesPlayed = saveData?.playerStats?.totalMatches || 0;
    const isNewGame = matchesPlayed === 0;

    const startText = isNewGame ? 'INICIAR SIMULACIÓN' : 'CONTINUAR SIMULACIÓN';
    
    this._createButton(cx, 250, startText, () => {
      this.scene.start(SCENES.PREPARE);
    });

    this._createButton(cx, 280, '[ OPCIONES ]', () => {
      this.scene.start(SCENES.OPTIONS);
    });

    this._createButton(cx, 350, '[ PERFIL DEL JUGADOR ]', () => {
      this.scene.start(SCENES.PROFILE);
    });

    this._createButton(cx, 420, '[ ANÁLISIS DE NEMESIS ]', () => {
      this.scene.start(SCENES.NEMESIS_STATS);
    });

    if (!isNewGame) {
      this._createButton(cx, 490, '[ REINICIAR SIMULACIÓN ]', () => {
        // Reiniciar datos
        const newData = SaveManager.reset();
        this.registry.set('saveData', newData);
        this.scene.start(SCENES.PREPARE);
      }, '#ff4444');
    }
  }

  /**
   * Crea un botón interactivo.
   */
  _createButton(x, y, text, callback, color = '#ffffff') {
    const btn = this.add.text(x, y, text, {
      fontSize: '20px',
      fontFamily: 'Courier New',
      color: color,
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    btn.on('pointerover', () => {
      btn.setColor('#ffaa00');
      btn.setScale(1.1);
      AudioManager.getInstance()?.playUiSfx(AUDIO_KEYS.UI_HOVER);
    });

    btn.on('pointerout', () => {
      btn.setColor(color);
      btn.setScale(1);
    });

    btn.on('pointerdown', () => {
      AudioManager.getInstance()?.playUiSfx(AUDIO_KEYS.UI_CLICK);
      callback();
    });
  }
}
