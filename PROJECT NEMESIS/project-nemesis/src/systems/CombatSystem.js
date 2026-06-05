/**
 * CombatSystem.js
 * Gestiona la lógica de combate entre dos Fighters:
 * - Detección de golpes por proximidad + estado de ataque
 * - Cálculo de daño con reducción por bloqueo
 * - Tracking de golpes ya aplicados (evitar doble daño)
 * - Efectos visuales de impacto
 *
 * No modifica stats de los combatientes — solo detecta y aplica daño.
 */

import { FIGHTER_CONFIG } from '../game/config.js';
import { GlobalEventBus } from './core/EventBus.js';
import { CHARACTER_SYSTEM_CONFIG } from '../game/characterSystemConfig.js';

export default class CombatSystem {
  /**
   * @param {Phaser.Scene} scene
   * @param {import('../systems/StatisticsSystem.js').default} statisticsSystem
   */
  constructor(scene, statisticsSystem) {
    this.scene = scene;
    this.stats = statisticsSystem;

    // Almacenaje para Phase 3/4
    this.activeHitboxes = [];
    this.activeHurtboxes = [];

    GlobalEventBus.on('HITBOX_SPAWNED', this._onHitboxSpawned, this, this);
    GlobalEventBus.on('HURTBOX_SPAWNED', this._onHurtboxSpawned, this, this);
  }

  _onHitboxSpawned(hitboxZone) {
    if (!this.activeHitboxes.includes(hitboxZone)) {
      this.activeHitboxes.push(hitboxZone);
    }
  }

  _onHurtboxSpawned(hurtboxZone) {
    if (!this.activeHurtboxes.includes(hurtboxZone)) {
      this.activeHurtboxes.push(hurtboxZone);
    }
  }

  _resolveHitboxCollision(hitbox, hurtbox) {
    
    const target = hurtbox.ownerRef;
    const attacker = hitbox.ownerRef;
    const damage = hitbox.hitboxData.damage;
    const knockback = hitbox.hitboxData.knockback;

    const hitResult = target.takeDamage(damage);

    // TODO: Registrar en stats apropiadamente basándonos en ID
    if (attacker._animBaseKey === 'player') {
      this.stats.recordDamageDealt(hitResult.actualDamage);
    } else {
      this.stats.recordDamageReceived(hitResult.actualDamage);
    }

    if (!hitResult.blocked) {
      const direction = target.x > attacker.x ? 1 : -1;
      target.body.setVelocityX(direction * knockback);
    }

    this._showHitEffect(target.x, target.y - 30, hitResult.blocked);
    GlobalEventBus.emit('HITBOX_COLLISION', { hitbox, hurtbox, hitResult });
  }

  /**
   * Verifica y procesa combate entre player y nemesis.
   * Llamar cada frame desde ArenaScene.
   *
   * @param {import('../entities/Player.js').default} player
   * @param {import('../entities/Nemesis.js').default} nemesis
   * @returns {{ playerHit: boolean, nemesisHit: boolean, playerDamage: number, nemesisDamage: number }}
   */
  update(player, nemesis) {
    const result = {
      playerHit: false,
      nemesisHit: false,
      playerDamage: 0,
      nemesisDamage: 0,
    };

    // Limpiar arrays (garbage collection segura si los pools reutilizan)
    this.activeHitboxes = this.activeHitboxes.filter(h => h.body && h.body.enable);
    this.activeHurtboxes = this.activeHurtboxes.filter(h => h.body && h.body.enable);

    // ─── Resolver Colisiones Manualmente ───
    if (this.activeHitboxes.length > 0 && this.activeHurtboxes.length > 0) {
      this.scene.physics.overlap(
        this.activeHitboxes,
        this.activeHurtboxes,
        (hitbox, hurtbox) => {
          if (!hitbox.body.enable || !hurtbox.body.enable) return;
          if (hitbox.ownerId === hurtbox.ownerId) return; // No auto-daño
          if (hitbox.hasCollidedWith.has(hurtbox.ownerId)) return;

          hitbox.hasCollidedWith.add(hurtbox.ownerId);
          this._resolveHitboxCollision(hitbox, hurtbox);
        }
      );
    }

    return result;
  }

  /**
   * Muestra un efecto visual de impacto.
   * @param {number} x
   * @param {number} y
   * @param {boolean} blocked - Si fue bloqueado
   * @private
   */
  _showHitEffect(x, y, blocked) {
    if (blocked) {
      // Efecto de bloqueo (azul)
      const blockFx = this.scene.add.image(x, y, 'blockEffect');
      blockFx.setAlpha(0.8);
      this.scene.tweens.add({
        targets: blockFx,
        alpha: 0,
        scaleX: 1.5,
        scaleY: 1.5,
        duration: 300,
        onComplete: () => blockFx.destroy(),
      });
    } else {
      // Efecto de golpe (blanco)
      const hitFx = this.scene.add.image(x, y, 'hitEffect');
      hitFx.setAlpha(0.9);
      this.scene.tweens.add({
        targets: hitFx,
        alpha: 0,
        scaleX: 2,
        scaleY: 2,
        duration: 200,
        onComplete: () => hitFx.destroy(),
      });

      // Screen shake ligero
      this.scene.cameras.main.shake(80, 0.005);
    }
  }

  /**
   * Resetea el estado de tracking para una nueva ronda.
   */
  reset() {
    // Las hitboxes activas mueren al recargar la escena o al limpiar pools
  }

  destroy() {
    GlobalEventBus.clearByOwner(this);
  }
}
