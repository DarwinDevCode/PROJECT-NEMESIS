/**
 * NemesisStatsScene.js
 * Muestra el estado evolutivo de Nemesis y su historial de aprendizaje.
 */

import Phaser from 'phaser';
import { SCENES } from '../game/constants.js';
import { GAME_WIDTH, GAME_HEIGHT } from '../game/config.js';

export default class NemesisStatsScene extends Phaser.Scene {
  constructor() {
    super(SCENES.NEMESIS_STATS);
  }

  create() {
    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;

    const saveData = this.registry.get('saveData');
    const state = saveData?.nemesisState;
    const profile = saveData?.nemesisProfile;
    const memory = saveData?.nemesisMemory;

    this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x1a0a0a).setOrigin(0);

    this.add.text(cx, 40, 'SISTEMA NEMESIS', {
      fontSize: '32px', fontFamily: 'Courier New', color: '#cc2222', fontStyle: 'bold'
    }).setOrigin(0.5);

    if (!state || state.experience === 0) {
      this.add.text(cx, cy, 'Nemesis no tiene datos suficientes.\nJuega una partida para iniciar su aprendizaje.', {
        fontSize: '16px', fontFamily: 'Courier New', color: '#aaaaaa', align: 'center'
      }).setOrigin(0.5);
    } else {
      // ─── Columna Izquierda: Estado Actual ─────────────────
      const leftX = cx - 220;
      
      this.add.text(leftX, 100, 'NIVEL DE ADAPTACIÓN', { fontSize: '18px', color: '#ffffff', fontFamily: 'Courier New', fontStyle: 'bold' }).setOrigin(0.5);
      
      // Barra de XP
      this.add.rectangle(leftX, 140, 300, 20, 0x331111);
      this.add.rectangle(leftX - 150, 140, 300 * (state.experience / 100), 20, 0xcc2222).setOrigin(0, 0.5);
      this.add.text(leftX, 140, `${Math.round(state.experience)} / 100 XP`, { fontSize: '12px', color: '#ffffff', fontFamily: 'Courier New' }).setOrigin(0.5);

      // Habilidades (Maestrías)
      this.add.text(leftX, 190, 'DOMINIO DE HABILIDADES', { fontSize: '16px', color: '#aaaaaa', fontFamily: 'Courier New' }).setOrigin(0.5);
      
      let py = 220;
      const masteries = [
        { key: 'defensiveMastery', name: 'Defensa' },
        { key: 'dashMastery', name: 'Evasión' },
        { key: 'spacingMastery', name: 'Spacing' },
        { key: 'comboPredictionMastery', name: 'Predicción' },
        { key: 'counterAttackMastery', name: 'Contraataque' },
        { key: 'berserkMastery', name: 'Berserk' }
      ];

      masteries.forEach(m => {
        const value = state.masteries ? state.masteries[m.key] : 0.15;
        const percent = Math.round((value || 0) * 100);
        let color = '#ffaa00';
        if (percent > 60) color = '#00ff00';
        
        this.add.text(leftX - 120, py, `[${percent}%] ${m.name}`, { fontSize: '14px', color: color, fontFamily: 'Courier New' });
        py += 22;
      });

      // Perfil Actual
      this.add.text(leftX, 370, 'ESTRATEGIA ACTUAL', { fontSize: '16px', color: '#aaaaaa', fontFamily: 'Courier New' }).setOrigin(0.5);
      this.add.text(leftX, 400, profile.currentProfile, { fontSize: '24px', color: '#ff4444', fontFamily: 'Courier New', fontStyle: 'bold' }).setOrigin(0.5);


      // ─── Columna Derecha: Memoria Evolutiva ───────────────
      const rightX = cx + 220;
      this.add.text(rightX, 100, 'MEMORIA EVOLUTIVA (ÚLTIMOS EVENTOS)', { fontSize: '16px', color: '#ffffff', fontFamily: 'Courier New', fontStyle: 'bold' }).setOrigin(0.5);

      const events = memory.events.slice(-12).reverse(); // Últimos 12 eventos, más recientes primero
      
      if (events.length === 0) {
        this.add.text(rightX, 150, 'No hay eventos registrados.', { fontSize: '14px', color: '#666666', fontFamily: 'Courier New' }).setOrigin(0.5);
      } else {
        py = 140;
        events.forEach(e => {
          let prefix = '•';
          let color = '#cccccc';
          
          if (e.type === 'skill_unlock') { prefix = '🔓'; color = '#ffaa00'; }
          else if (e.type === 'pattern') { prefix = '👁️'; color = '#44aaff'; }
          else if (e.type === 'profile_change') { prefix = '🔄'; color = '#ff4444'; }
          else if (e.type === 'match') { prefix = '⚔️'; color = '#888888'; }

          // Truncar texto si es muy largo
          let text = e.event;
          if (text.length > 40) text = text.substring(0, 37) + '...';

          this.add.text(rightX - 180, py, `[P${e.match}]`, { fontSize: '12px', color: '#666666', fontFamily: 'Courier New' });
          this.add.text(rightX - 130, py, `${prefix} ${text}`, { fontSize: '12px', color: color, fontFamily: 'Courier New' });
          py += 22;
        });
      }
    }

    this._createButton(cx, GAME_HEIGHT - 40, 'VOLVER AL MENÚ', () => {
      this.scene.start(SCENES.MENU);
    });
  }

  _createButton(x, y, text, callback) {
    const btn = this.add.text(x, y, text, {
      fontSize: '18px', fontFamily: 'Courier New', color: '#ffffff', backgroundColor: '#331111', padding: { x: 20, y: 10 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    btn.on('pointerover', () => btn.setBackgroundColor('#662222'));
    btn.on('pointerout', () => btn.setBackgroundColor('#331111'));
    btn.on('pointerdown', callback);
  }
}
