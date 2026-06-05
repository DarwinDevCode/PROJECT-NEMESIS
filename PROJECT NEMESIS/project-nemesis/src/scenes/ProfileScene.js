/**
 * ProfileScene.js
 * Muestra las estadísticas históricas acumuladas del jugador.
 */

import Phaser from 'phaser';
import { SCENES } from '../game/constants.js';
import { GAME_WIDTH, GAME_HEIGHT } from '../game/config.js';

export default class ProfileScene extends Phaser.Scene {
  constructor() {
    super(SCENES.PROFILE);
  }

  create() {
    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;

    const saveData = this.registry.get('saveData');
    const stats = saveData?.playerStats;

    this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x0a0a1a).setOrigin(0);

    this.add.text(cx, 50, 'PERFIL DEL JUGADOR', {
      fontSize: '32px', fontFamily: 'Courier New', color: '#4488ff', fontStyle: 'bold'
    }).setOrigin(0.5);

    if (!stats || stats.totalMatches === 0) {
      this.add.text(cx, cy, 'No hay datos suficientes.\nJuega al menos una partida.', {
        fontSize: '18px', fontFamily: 'Courier New', color: '#aaaaaa', align: 'center'
      }).setOrigin(0.5);
    } else {
      const leftCol = cx - 150;
      const rightCol = cx + 150;
      let py = 120;
      const spacing = 35;

      const formatTime = (secs) => {
        const m = Math.floor(secs / 60);
        const s = Math.floor(secs % 60);
        return `${m}m ${s}s`;
      };

      // Tasa de victoria
      const winRate = Math.round((stats.wins / stats.totalMatches) * 100) || 0;

      // Columna Izquierda (Resultados)
      this.add.text(leftCol, py, 'RESULTADOS', { fontSize: '18px', color: '#ffffff', fontFamily: 'Courier New', fontStyle: 'bold' }).setOrigin(0.5);
      py += spacing;
      this._addStatRow(leftCol, py, 'Partidas Jugadas', stats.totalMatches); py += spacing;
      this._addStatRow(leftCol, py, 'Victorias', stats.wins, '#44cc44'); py += spacing;
      this._addStatRow(leftCol, py, 'Derrotas', stats.losses, '#cc4444'); py += spacing;
      this._addStatRow(leftCol, py, 'Tasa de Victoria', `${winRate}%`); py += spacing;
      
      py += 20;
      this.add.text(leftCol, py, 'ESTILO CLASIFICADO', { fontSize: '16px', color: '#888888', fontFamily: 'Courier New' }).setOrigin(0.5);
      py += 25;
      this.add.text(leftCol, py, stats.detectedProfile, { fontSize: '22px', color: '#ffaa00', fontFamily: 'Courier New', fontStyle: 'bold' }).setOrigin(0.5);

      // Columna Derecha (Acciones)
      py = 120;
      this.add.text(rightCol, py, 'ESTADÍSTICAS DE COMBATE', { fontSize: '18px', color: '#ffffff', fontFamily: 'Courier New', fontStyle: 'bold' }).setOrigin(0.5);
      py += spacing;
      this._addStatRow(rightCol, py, 'Ataques Rápidos', stats.totalQuickAttacks); py += spacing;
      this._addStatRow(rightCol, py, 'Ataques Especiales', stats.totalSpecialAttacks); py += spacing;
      this._addStatRow(rightCol, py, 'Bloqueos', stats.totalBlocks); py += spacing;
      this._addStatRow(rightCol, py, 'Saltos', stats.totalJumps); py += spacing;
      this._addStatRow(rightCol, py, 'Daño Realizado', Math.round(stats.totalDamageDealt)); py += spacing;
      this._addStatRow(rightCol, py, 'Daño Recibido', Math.round(stats.totalDamageReceived)); py += spacing;
      this._addStatRow(rightCol, py, 'Tiempo en Movimiento', formatTime(stats.totalTimeMoving)); py += spacing;
      this._addStatRow(rightCol, py, 'Tiempo Inactivo', formatTime(stats.totalTimeIdle));
    }

    this._createButton(cx, GAME_HEIGHT - 60, 'VOLVER AL MENÚ', () => {
      this.scene.start(SCENES.MENU);
    });
  }

  _addStatRow(x, y, label, value, valueColor = '#ffffff') {
    this.add.text(x - 10, y, label + ':', { fontSize: '14px', fontFamily: 'Courier New', color: '#aaaaaa' }).setOrigin(1, 0.5);
    this.add.text(x + 10, y, String(value), { fontSize: '14px', fontFamily: 'Courier New', color: valueColor, fontStyle: 'bold' }).setOrigin(0, 0.5);
  }

  _createButton(x, y, text, callback) {
    const btn = this.add.text(x, y, text, {
      fontSize: '20px', fontFamily: 'Courier New', color: '#ffffff', backgroundColor: '#222233', padding: { x: 20, y: 10 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    btn.on('pointerover', () => btn.setBackgroundColor('#444466'));
    btn.on('pointerout', () => btn.setBackgroundColor('#222233'));
    btn.on('pointerdown', callback);
  }
}
