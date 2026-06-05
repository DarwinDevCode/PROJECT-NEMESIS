/**
 * OptionsScene.js
 * Escena para configurar Audio, Controles (próximamente) y Visuales (Skins).
 */

import Phaser from 'phaser';
import { SCENES } from '../game/constants.js';
import SaveManager from '../systems/SaveManager.js';
import AudioManager from '../systems/AudioManager.js';

export default class OptionsScene extends Phaser.Scene {
  constructor() {
    super({ key: SCENES.OPTIONS });
  }

  create() {
    // 1. Obtener estado actual
    this.saveData = this.registry.get('saveData') || SaveManager.load();
    this.settings = this.saveData.settings;
    this.audioManager = AudioManager.getInstance();

    // Fondo
    this.add.rectangle(0, 0, this.scale.width, this.scale.height, 0x0a0a1a).setOrigin(0);

    // Título
    this.add.text(this.scale.width / 2, 60, 'OPCIONES', {
      fontFamily: 'Courier',
      fontSize: '48px',
      color: '#00ffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // ─── AUDIO ───
    this.add.text(this.scale.width / 2, 140, '--- AUDIO ---', { fontFamily: 'Courier', fontSize: '24px', color: '#ff00ff' }).setOrigin(0.5);

    // Mute Toggle
    const muteText = this.settings.audio.muted ? 'Muted: ON' : 'Muted: OFF';
    const muteBtn = this.createButton(this.scale.width / 2, 190, muteText, () => {
      this.settings.audio.muted = !this.settings.audio.muted;
      muteBtn.setText(this.settings.audio.muted ? 'Muted: ON' : 'Muted: OFF');
      this.applySettings();
    });

    // Music Volume
    const musicBtn = this.createButton(this.scale.width / 2, 240, `Vol. Música: ${Math.round(this.settings.audio.musicVolume * 100)}%`, () => {
      let vol = this.settings.audio.musicVolume + 0.2;
      if (vol > 1.05) vol = 0;
      this.settings.audio.musicVolume = vol;
      musicBtn.setText(`Vol. Música: ${Math.round(vol * 100)}%`);
      this.applySettings();
    });

    // Effects Volume
    const sfxBtn = this.createButton(this.scale.width / 2, 290, `Vol. Efectos: ${Math.round(this.settings.audio.effectsVolume * 100)}%`, () => {
      let vol = this.settings.audio.effectsVolume + 0.2;
      if (vol > 1.05) vol = 0;
      this.settings.audio.effectsVolume = vol;
      sfxBtn.setText(`Vol. Efectos: ${Math.round(vol * 100)}%`);
      this.applySettings();
      // Reproducir sonido de prueba
      if (this.audioManager) this.audioManager.playSFX('sfx_ui_select');
    });

    // ─── VISUALS (SKINS) ───
    this.add.text(this.scale.width / 2, 350, '--- VISUALES ---', { fontFamily: 'Courier', fontSize: '24px', color: '#ff00ff' }).setOrigin(0.5);
    
    const skins = ['default', 'alt1', 'alt2'];
    
    // Player Skin
    const pSkinBtn = this.createButton(this.scale.width / 2, 400, `Skin Jugador: ${this.settings.visuals.playerSkin}`, () => {
      let idx = skins.indexOf(this.settings.visuals.playerSkin);
      idx = (idx + 1) % skins.length;
      this.settings.visuals.playerSkin = skins[idx];
      pSkinBtn.setText(`Skin Jugador: ${skins[idx]}`);
      this.applySettings();
    });

    // Botón Volver
    this.createButton(this.scale.width / 2, 500, '[ VOLVER AL MENÚ ]', () => {
      this.scene.start(SCENES.MENU);
    }, '#00ffff');
  }

  createButton(x, y, text, callback, color = '#ffffff') {
    const btn = this.add.text(x, y, text, {
      fontFamily: 'Courier',
      fontSize: '24px',
      color: color
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    btn.on('pointerover', () => {
      btn.setColor('#ffff00');
      btn.setScale(1.1);
      if (this.audioManager) this.audioManager.playSfx('ui_hover');
    });

    btn.on('pointerout', () => {
      btn.setColor(color);
      btn.setScale(1.0);
    });

    btn.on('pointerdown', () => {
      if (this.audioManager) this.audioManager.playSfx('ui_click');
      callback();
    });

    return btn;
  }

  applySettings() {
    // Save to LocalStorage
    SaveManager.save(this.saveData);
    
    // Apply audio immediately
    if (this.audioManager) {
      this.audioManager.updateSettings(this.settings.audio);
    }
  }
}
