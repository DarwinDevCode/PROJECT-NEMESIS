/**
 * HitboxController.js
 * Genera hitboxes dinámicas basadas en los Animation Events (SPAWN_HITBOX).
 * Usa Object Pooling y emite GLOBAL_EVENTS.HITBOX_COLLISION sin aplicar daño.
 */

import { ANIMATION_EVENTS, GLOBAL_EVENTS } from '../../game/events.js';
import { GlobalEventBus } from '../../systems/core/EventBus.js';
import ObjectPool from '../../systems/core/ObjectPool.js';
import { CHARACTER_SYSTEM_CONFIG } from '../../game/characterSystemConfig.js';

export default class HitboxController {
  /**
   * @param {Phaser.Scene} scene 
   * @param {Object} characterData 
   * @param {import('../../systems/core/EventBus.js').default} localEventBus 
   * @param {Phaser.GameObjects.Sprite} ownerSprite - Referencia al sprite para posición
   */
  constructor(scene, characterData, localEventBus, ownerSprite) {
    this.scene = scene;
    this.characterData = characterData;
    this.eventBus = localEventBus;
    this.owner = ownerSprite;
    
    // El pool debe pertenecer a la instancia (y a la escena) para evitar que
    // sobreviva a recargas de escena y devuelva GameObjects destruidos (body=undefined)
    this.pool = new ObjectPool(() => this._createPhaserZone(), CHARACTER_SYSTEM_CONFIG.POOLING.MAX_HITBOXES);

    this.activeHitboxes = []; // Referencias de las hitboxes de este controlador

    // Suscribirse al bus local
    this.eventBus.on(ANIMATION_EVENTS.SPAWN_HITBOX, this._onSpawnHitbox, this, this);
    this.eventBus.on(ANIMATION_EVENTS.REMOVE_HITBOX, this._onRemoveHitbox, this, this);
  }

  _createPhaserZone() {
    const zone = this.scene.add.zone(0, 0, 10, 10);
    this.scene.physics.add.existing(zone);
    zone.body.setAllowGravity(false);
    zone.body.moves = true; // DEBE SER TRUE para que colisionen entre sí
    
    // Propiedad extendida para guardar la referencia de datos
    zone.hitboxData = null;
    zone.ownerId = null;
    
    zone.deactivate = function() {
      this.body.enable = false;
      this.hitboxData = null;
      this.ownerId = null;
    };
    
    // Inicia desactivado
    zone.deactivate();
    
    return zone;
  }

  _onSpawnHitbox(payload) {
    const attackData = this.characterData.attacks[payload.attackId];
    if (!attackData) return;
    
    const hitboxDef = attackData.hitboxes[payload.hitboxIndex];
    if (!hitboxDef) return;

    // Obtener del pool
    const zone = this.pool.get();
    zone.body.enable = true;
    
    // Configurar dimensiones
    zone.setSize(hitboxDef.width, hitboxDef.height);
    zone.body.setSize(hitboxDef.width, hitboxDef.height);
    
    // Calcular posición basado en facing
    const facingMultiplier = this.owner.facingRight !== false ? 1 : -1;
    zone.setPosition(this.owner.x + (hitboxDef.offsetX * facingMultiplier), this.owner.y + hitboxDef.offsetY);
    zone.body.updateFromGameObject(); // Sincronizar Inmediatamente

    // Guardar metadata para el CombatSystem
    zone.hitboxData = {
      attackId: payload.attackId,
      damage: hitboxDef.damage,
      knockback: hitboxDef.knockback,
      tags: attackData.tags || []
    };
    zone.ownerId = this.characterData.id;
    zone.ownerRef = this.owner; // Referencia al Fighter para ignore
    zone.duration = hitboxDef.duration * 16.66; // Aprox frames a ms
    zone.elapsed = 0;
    zone.hasCollidedWith = new Set(); // Prevenir colisiones múltiples por frame
    
    this.activeHitboxes.push(zone);

    // Opcional: El CombatSystem detectará la colisión, este controlador solo la expone
    GlobalEventBus.emit('HITBOX_SPAWNED', zone);
  }

  _onRemoveHitbox(payload) {
     // Lógica para remover tempranamente si el ataque se cancela
  }

  update(delta) {
    for (let i = this.activeHitboxes.length - 1; i >= 0; i--) {
      const zone = this.activeHitboxes[i];
      zone.elapsed += delta;
      
      // Actualizar posición relativa si es necesario (pegada al owner)
      const facingMultiplier = this.owner.facingRight !== false ? 1 : -1;
      const hitboxDef = this.characterData.attacks[zone.hitboxData.attackId]?.hitboxes[0];
      if (hitboxDef) {
        zone.setPosition(this.owner.x + (hitboxDef.offsetX * facingMultiplier), this.owner.y + hitboxDef.offsetY);
        zone.body.updateFromGameObject(); // SINCRONIZAR EL CUERPO FÍSICO CON EL GAMEOBJECT
      }

      // Tiempo expirado
      if (zone.elapsed >= zone.duration) {
        this.pool.release(zone);
        this.activeHitboxes.splice(i, 1);
      }
    }
  }

  // Se llama al destruir la entidad
  destroy() {
    this.eventBus.clearByOwner(this);
    for (const zone of this.activeHitboxes) {
      this.pool.release(zone);
    }
    this.activeHitboxes = [];
  }
}
