/**
 * HUD.js
 * Heads-Up Display durante el combate.
 * Compone: barras de vida, indicador de adaptación, ayuda de controles.
 */

import { GAME_WIDTH } from '../game/config.js';
import HealthBar from './HealthBar.js';

export default class HUD {
  /**
   * @param {Phaser.Scene} scene
   */
  constructor(scene) {
    this.scene = scene;

    const barWidth = 280;
    const barY = 20;
    const margin = 30;

    // ─── Barra de vida del jugador (izquierda) ────────────
    this.playerBar = new HealthBar(scene, margin, barY, barWidth, 16, false);
    this.playerBar.setLabel('JUGADOR', '#4488ff');

    // ─── Barra de vida de Nemesis (derecha, flipped) ──────
    this.nemesisBar = new HealthBar(
      scene,
      GAME_WIDTH - margin - barWidth, barY,
      barWidth, 16, true
    );
    this.nemesisBar.setLabel('NEMESIS', '#cc2222');

    // ─── Indicador de adaptación de Nemesis ───────────────
    this.adaptationText = scene.add.text(GAME_WIDTH / 2, barY + 2, '', {
      fontSize: '11px',
      fontFamily: 'Courier New',
      color: '#cc4444',
      fontStyle: 'bold',
    }).setOrigin(0.5, 0).setDepth(102);

    // ─── Separador "VS" ──────────────────────────────────
    this.vsText = scene.add.text(GAME_WIDTH / 2, barY + 16, 'VS', {
      fontSize: '10px',
      fontFamily: 'Courier New',
      color: '#333333',
    }).setOrigin(0.5, 0).setDepth(100);

    // ─── Ayuda de controles (esquina inferior) ────────────
    this.controlsText = scene.add.text(10, 510, 
      'A/D=Mover  W=Saltar  J=Ataque  K=Especial  L=Bloqueo  ESC=Pausa', {
      fontSize: '9px',
      fontFamily: 'Courier New',
      color: '#444444',
    }).setDepth(100);

    // ─── Estado del combatiente (debug / feedback) ────────
    this.playerStateText = scene.add.text(margin, barY + 38, '', {
      fontSize: '9px',
      fontFamily: 'Courier New',
      color: '#666666',
    }).setDepth(100);

    this.nemesisStateText = scene.add.text(GAME_WIDTH - margin, barY + 38, '', {
      fontSize: '9px',
      fontFamily: 'Courier New',
      color: '#666666',
    }).setOrigin(1, 0).setDepth(100);
  }

  /**
   * Actualiza el HUD cada frame.
   * @param {number} delta
   * @param {import('../entities/Player.js').default} player
   * @param {import('../entities/Nemesis.js').default} nemesis
   * @param {number} adaptationLevel - 0-100
   */
  update(delta, player, nemesis, adaptationLevel) {
    // Actualizar barras de vida
    this.playerBar.setValue(player.hp, player.maxHP);
    this.playerBar.update(delta);

    this.nemesisBar.setValue(nemesis.hp, nemesis.maxHP);
    this.nemesisBar.update(delta);

    // Actualizar indicador de adaptación
    this.adaptationText.setText(`Adaptación: ${Math.round(adaptationLevel)}%`);

    // Actualizar estado (feedback visual simple)
    this.playerStateText.setText(this._formatState(player));
    this.nemesisStateText.setText(this._formatState(nemesis));
  }

  /**
   * Formatea el estado de un combatiente para mostrar en el HUD.
   * @param {import('../entities/Fighter.js').default} fighter
   * @returns {string}
   * @private
   */
  _formatState(fighter) {
    const stateIcons = {
      idle: '●',
      moving: '►',
      jumping: '▲',
      attacking: '⚔',
      special_attacking: '★',
      blocking: '▣',
      hurt: '✕',
      dead: '☠',
    };
    return stateIcons[fighter.state] || '';
  }

  /**
   * Destruye todos los elementos del HUD.
   */
  destroy() {
    this.playerBar.destroy();
    this.nemesisBar.destroy();
    this.adaptationText.destroy();
    this.vsText.destroy();
    this.controlsText.destroy();
    this.playerStateText.destroy();
    this.nemesisStateText.destroy();
  }
}
