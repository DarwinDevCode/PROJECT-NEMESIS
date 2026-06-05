/**
 * PauseScene.js
 * Escena de pausa overlay.
 * Manejada en paralelo con ArenaScene para pausar/reanudar y abandonar.
 * Incluye controles de volumen para ajustar audio durante el combate.
 */

import Phaser from 'phaser';
import { SCENES, COMBAT_RESULTS } from '../game/constants.js';
import { GAME_WIDTH, GAME_HEIGHT } from '../game/config.js';
import AudioManager from '../systems/AudioManager.js';
import SaveManager from '../systems/SaveManager.js';

export default class PauseScene extends Phaser.Scene {
  constructor() {
    super(SCENES.PAUSE);
  }

  create() {
    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;

    // Obtener estado actual de audio
    this.saveData = this.registry.get('saveData') || SaveManager.load();
    this.audioSettings = this.saveData.settings.audio;

    // Overlay oscuro
    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.8);
    overlay.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Título
    this.add.text(cx, cy - 140, 'PAUSA', {
      fontSize: '40px',
      fontFamily: 'Courier New',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // Controles
    this.add.text(cx, cy - 100, 'WASD/Flechas | J = Ataque | K = Especial | L = Bloqueo | I/Shift = Dash', {
      fontSize: '11px',
      fontFamily: 'Courier New',
      color: '#666666',
    }).setOrigin(0.5);

    // ─── Controles de Volumen ─────────────────────────────────
    const volumeStartY = cy - 60;

    this.add.text(cx, volumeStartY, '── AUDIO ──', {
      fontSize: '14px',
      fontFamily: 'Courier New',
      color: '#ff00ff',
    }).setOrigin(0.5);

    // Volumen de música
    this._createVolumeControl(cx, volumeStartY + 35, 'Música', 'musicVolume');

    // Volumen de efectos
    this._createVolumeControl(cx, volumeStartY + 70, 'Efectos', 'effectsVolume');

    // Mute toggle
    this.muteBtn = this._createButton(cx, volumeStartY + 110,
      this.audioSettings.muted ? '♪ MUTE: ON' : '♪ MUTE: OFF', () => {
        this.audioSettings.muted = !this.audioSettings.muted;
        this.muteBtn.setText(this.audioSettings.muted ? '♪ MUTE: ON' : '♪ MUTE: OFF');
        this._applyAudioSettings();
      }, '#aaaaaa');

    // ─── Botones de acción ────────────────────────────────────
    this._createButton(cx, volumeStartY + 170, 'REANUDAR (ESC)', () => {
      this.resumeGame();
    });

    this._createButton(cx, volumeStartY + 210, '♫ SIGUIENTE CANCIÓN', () => {
      AudioManager.getInstance()?.nextTrack();
    }, '#66ccff');

    this._createButton(cx, volumeStartY + 250, 'RENDIRSE', () => {
      this._surrender();
    }, '#cc4444');

    // Manejo de ESC
    this.input.keyboard.on('keydown-ESC', () => {
      this.resumeGame();
    });
  }

  /**
   * Crea un control de volumen con label, barra y botones +/-.
   * @param {number} x
   * @param {number} y
   * @param {string} label
   * @param {string} settingKey - 'musicVolume' o 'effectsVolume'
   * @private
   */
  _createVolumeControl(x, y, label, settingKey) {
    const currentValue = Math.round((this.audioSettings[settingKey] || 0) * 100);

    // Label
    this.add.text(x - 140, y, label, {
      fontSize: '14px',
      fontFamily: 'Courier New',
      color: '#cccccc',
    }).setOrigin(0, 0.5);

    // Botón -
    const btnMinus = this.add.text(x + 20, y, '[-]', {
      fontSize: '16px',
      fontFamily: 'Courier New',
      color: '#ff6666',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    // Valor
    const valueText = this.add.text(x + 70, y, `${currentValue}%`, {
      fontSize: '14px',
      fontFamily: 'Courier New',
      color: '#ffffff',
    }).setOrigin(0.5);

    // Botón +
    const btnPlus = this.add.text(x + 120, y, '[+]', {
      fontSize: '16px',
      fontFamily: 'Courier New',
      color: '#66ff66',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    // Lógica de botones
    btnMinus.on('pointerdown', () => {
      this.audioSettings[settingKey] = Math.max(0, (this.audioSettings[settingKey] || 0) - 0.1);
      valueText.setText(`${Math.round(this.audioSettings[settingKey] * 100)}%`);
      this._applyAudioSettings();
    });

    btnPlus.on('pointerdown', () => {
      this.audioSettings[settingKey] = Math.min(1, (this.audioSettings[settingKey] || 0) + 0.1);
      valueText.setText(`${Math.round(this.audioSettings[settingKey] * 100)}%`);
      this._applyAudioSettings();
    });

    // Hover effects
    [btnMinus, btnPlus].forEach(btn => {
      const origColor = btn.style.color;
      btn.on('pointerover', () => btn.setScale(1.2));
      btn.on('pointerout', () => btn.setScale(1));
    });
  }

  /**
   * Aplica los cambios de audio inmediatamente.
   * @private
   */
  _applyAudioSettings() {
    const audioManager = AudioManager.getInstance();
    if (audioManager) {
      audioManager.updateSettings(this.audioSettings);
    }
    // Guardar en saveData
    this.saveData.settings.audio = this.audioSettings;
    this.registry.set('saveData', this.saveData);
    SaveManager.save(this.saveData);
  }

  /**
   * Rendirse — reanudar ArenaScene primero para que los timers funcionen.
   * @private
   */
  _surrender() {
    // 1. Reanudar ArenaScene para que los timers/delayedCalls funcionen
    this.scene.resume(SCENES.ARENA);

    // 2. Notificar a ArenaScene de la rendición
    const arena = this.scene.get(SCENES.ARENA);
    if (arena) {
      arena._endMatch(COMBAT_RESULTS.SURRENDER);
    }

    // 3. Detener esta escena de pausa
    this.scene.stop();
  }

  resumeGame() {
    this.scene.resume(SCENES.ARENA);
    this.scene.stop();
  }

  _createButton(x, y, text, callback, color = '#ffffff') {
    const btn = this.add.text(x, y, text, {
      fontSize: '18px',
      fontFamily: 'Courier New',
      color: color,
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    btn.on('pointerover', () => {
      btn.setColor('#ffaa00');
      btn.setScale(1.1);
    });

    btn.on('pointerout', () => {
      btn.setColor(color);
      btn.setScale(1);
    });

    btn.on('pointerdown', callback);

    return btn;
  }
}
