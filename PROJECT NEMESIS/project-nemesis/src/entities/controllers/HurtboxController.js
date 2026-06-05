/**
 * HurtboxController.js
 * Genera la caja de colisión donde el personaje puede recibir daño.
 * Para Phase 3 usamos una sola caja por personaje (Body).
 */

import { CHARACTER_SYSTEM_CONFIG } from '../../game/characterSystemConfig.js';
import ObjectPool from '../../systems/core/ObjectPool.js';
import { GlobalEventBus } from '../../systems/core/EventBus.js';

export default class HurtboxController {
  /**
   * @param {Phaser.Scene} scene 
   * @param {Object} characterData 
   * @param {import('../../systems/core/EventBus.js').default} localEventBus 
   * @param {Phaser.GameObjects.Sprite} ownerSprite 
   */
  constructor(scene, characterData, localEventBus, ownerSprite) {
    this.scene = scene;
    this.characterData = characterData;
    this.eventBus = localEventBus;
    this.owner = ownerSprite;
    
    // Pool local a la instancia (evita fugas entre reinicios de Phaser Scene)
    this.pool = new ObjectPool(() => this._createPhaserZone(), CHARACTER_SYSTEM_CONFIG.POOLING.MAX_HURTBOXES);
    
    this.bodyHurtbox = null;
    this._spawnBodyHurtbox();
  }

  _createPhaserZone() {
    const zone = this.scene.add.zone(0, 0, 10, 10);
    this.scene.physics.add.existing(zone);
    zone.body.setAllowGravity(false);
    zone.body.moves = true; // Arcade Physics optimiza si ambos son estáticos, así que lo forzamos a true
    
    zone.hurtboxData = null;
    zone.ownerId = null;
    
    zone.deactivate = function() {
      this.body.enable = false;
      this.hurtboxData = null;
      this.ownerId = null;
    };
    
    zone.deactivate();
    return zone;
  }

  _spawnBodyHurtbox() {
    this.bodyHurtbox = this.pool.get();
    this.bodyHurtbox.body.enable = true;
    
    // Tamaño estándar o personalizado desde characterData
    const hw = this.characterData.stats?.hurtbox?.width || 40;
    const hh = this.characterData.stats?.hurtbox?.height || 80;
    const yOffset = hh / 2;
    
    this.bodyHurtbox.setSize(hw, hh);
    this.bodyHurtbox.body.setSize(hw, hh);
    this.bodyHurtbox.setPosition(this.owner.x, this.owner.y - yOffset);
    
    this.bodyHurtbox.ownerId = this.characterData.id;
    this.bodyHurtbox.ownerRef = this.owner;
    this.bodyHurtbox.hurtboxData = { type: 'body' };
    
    GlobalEventBus.emit('HURTBOX_SPAWNED', this.bodyHurtbox);
  }

  update(delta) {
    if (!this.bodyHurtbox) return;
    
    // Seguir al owner
    const hh = this.characterData.stats?.hurtbox?.height || 80;
    this.bodyHurtbox.setPosition(this.owner.x, this.owner.y - (hh / 2));
    this.bodyHurtbox.body.updateFromGameObject(); // Sincronizar Físicas
  }

  destroy() {
    if (this.bodyHurtbox) {
      this.pool.release(this.bodyHurtbox);
      this.bodyHurtbox = null;
    }
  }
}
