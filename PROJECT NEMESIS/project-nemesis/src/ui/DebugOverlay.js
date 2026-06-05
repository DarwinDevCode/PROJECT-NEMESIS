/**
 * DebugOverlay.js
 * Renderiza métricas técnicas en pantalla para diagnóstico de los Runtimes,
 * Event Bus, Pools e instancias en tiempo de ejecución.
 */

import { CHARACTER_SYSTEM_CONFIG } from '../game/characterSystemConfig.js';
import { GlobalEventBus } from '../systems/core/EventBus.js';

export default class DebugOverlay {
  /**
   * @param {Phaser.Scene} scene 
   */
  constructor(scene) {
    this.scene = scene;
    this.text = null;
    this.graphics = null;
    this.isEnabled = CHARACTER_SYSTEM_CONFIG.FLAGS.ENABLE_DEBUG_OVERLAY;

    if (this.isEnabled) {
      this._createDisplay();
    }
  }

  _createDisplay() {
    this.text = this.scene.add.text(10, 100, 'Data-Driven Debug', {
      fontFamily: 'monospace',
      fontSize: '12px',
      color: '#00ff00',
      backgroundColor: '#000000aa',
      padding: { x: 5, y: 5 }
    });
    this.text.setScrollFactor(0);
    this.text.setDepth(1000);

    this.graphics = this.scene.add.graphics();
    this.graphics.setDepth(999);
  }

  /**
   * Actualiza las métricas en pantalla.
   * @param {import('../entities/Player.js').default} player 
   * @param {import('../entities/Nemesis.js').default} nemesis 
   * @param {import('../systems/CombatSystem.js').default} combatSystem 
   */
  update(player, nemesis, combatSystem) {
    if (!this.isEnabled || !this.text) return;

    let debugString = `=== ARCHITECTURE DEBUG ===\n`;

    // 1. Métricas Globales
    const globalMetrics = GlobalEventBus.getMetrics();
    debugString += `[Global Event Bus]\n`;
    debugString += `  Emitted: ${globalMetrics.eventsEmitted} | Listeners: ${globalMetrics.activeListeners}\n\n`;

    // 2. Jugador
    debugString += this._formatFighterMetrics('PLAYER', player);

    // 3. Enemigo
    debugString += this._formatFighterMetrics('NEMESIS', nemesis);

    this.text.setText(debugString);
    
    // Dibujar hitboxes y hurtboxes con this.graphics
    this.graphics.clear();
    
    if (combatSystem) {
      // Hurtboxes (Azul)
      this.graphics.lineStyle(2, 0x0088ff, 0.8);
      for (const hb of combatSystem.activeHurtboxes) {
        if (!hb.body || !hb.body.enable) continue;
        this.graphics.strokeRect(hb.x - hb.width/2, hb.y - hb.height/2, hb.width, hb.height);
      }

      // Hitboxes (Rojo)
      this.graphics.lineStyle(2, 0xff0000, 0.8);
      this.graphics.fillStyle(0xff0000, 0.3);
      for (const hb of combatSystem.activeHitboxes) {
        if (!hb.body || !hb.body.enable) continue;
        this.graphics.fillRect(hb.x - hb.width/2, hb.y - hb.height/2, hb.width, hb.height);
        this.graphics.strokeRect(hb.x - hb.width/2, hb.y - hb.height/2, hb.width, hb.height);
      }
    }
  }

  _formatFighterMetrics(name, fighter) {
    if (!fighter || !fighter.dataDriven) return `[${name}] No Data-Driven\n\n`;

    const dr = fighter.dataDriven.runtimes;
    const db = fighter.dataDriven.eventBus.getMetrics();
    
    let out = `[${name}]\n`;
    out += `  HP: ${dr.health.currentHP}/${dr.health.maxHP} | Dead: ${dr.health.isDead}\n`;
    out += `  Anim: ${dr.animation.currentAnimationId} (Frame: ${dr.animation.currentFrame})\n`;
    
    if (dr.combat.currentAttack) {
      out += `  Attack Active: ${dr.combat.currentAttack.attackId} (ID: ${dr.combat.currentAttack.id})\n`;
    } else {
      out += `  Attack Active: None\n`;
    }

    out += `  Local Bus -> Emitted: ${db.eventsEmitted} | Listeners: ${db.activeListeners}\n\n`;
    return out;
  }
}
