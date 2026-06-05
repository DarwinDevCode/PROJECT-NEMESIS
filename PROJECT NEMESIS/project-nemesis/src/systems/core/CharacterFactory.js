/**
 * CharacterFactory.js
 * Ensambla entidades Fighter inyectando las dependencias.
 */

import EventBus from './EventBus.js';
import CharacterValidator from './CharacterValidator.js';
import AnimationEventValidator from './AnimationEventValidator.js';

import HealthRuntime from '../../entities/runtimes/HealthRuntime.js';
import CombatRuntime from '../../entities/runtimes/CombatRuntime.js';
import AnimationRuntime from '../../entities/runtimes/AnimationRuntime.js';
import InputRuntime from '../../entities/runtimes/InputRuntime.js';
import StatusEffectRuntime from '../../entities/runtimes/StatusEffectRuntime.js';

import HealthComponent from '../../entities/components/HealthComponent.js';
import AttackController from '../../entities/controllers/AttackController.js';
import AnimationController from '../../entities/controllers/AnimationController.js';
import HitboxController from '../../entities/controllers/HitboxController.js';
import HurtboxController from '../../entities/controllers/HurtboxController.js';

export default class CharacterFactory {
  
  /**
   * Crea todos los componentes lógicos de un personaje a partir de su data pura.
   * @param {Object} characterData Configuración base importada del JSON/JS
   * @param {string} id Identificador único para la entidad instanciada
   * @param {Phaser.Scene} scene Opcional, escena para dependencias gráficas
   * @param {Phaser.GameObjects.Sprite} ownerSprite Opcional, referencia al sprite
   * @returns {Object} Objeto conteniendo runtimes, componentes y el bus de eventos
   */
  static create(characterData, id, scene = null, ownerSprite = null) {
    // 1. Validar la base y versión
    const validData = CharacterValidator.validate(characterData);

    // 2. Validar eventos de animación en load time
    if (validData.animations) {
      for (const animData of Object.values(validData.animations)) {
        AnimationEventValidator.validate(animData, validData);
      }
    }

    // 3. Crear Local Event Bus
    const localEventBus = new EventBus(`${id}_LocalBus`);

    // 4. Instanciar Runtimes
    const healthRuntime = new HealthRuntime(validData.stats.maxHP);
    const combatRuntime = new CombatRuntime();
    const animationRuntime = new AnimationRuntime();
    const inputRuntime = new InputRuntime();
    const statusEffectRuntime = new StatusEffectRuntime();

    // 5. Instanciar Controladores/Componentes e Inyectar Event Bus
    const healthComponent = new HealthComponent(healthRuntime, localEventBus);
    const attackController = new AttackController(combatRuntime, validData, localEventBus);
    const animationController = new AnimationController(animationRuntime, validData, localEventBus);
    
    let hitboxController = null;
    let hurtboxController = null;
    if (scene && ownerSprite) {
      hitboxController = new HitboxController(scene, validData, localEventBus, ownerSprite);
      hurtboxController = new HurtboxController(scene, validData, localEventBus, ownerSprite);
    }

    // Retornamos la estructura empaquetada. 
    // El objeto físico (Sprite) de Phaser se unirá a este paquete después en el constructor de Fighter.
    const dataDrivenEcosystem = {
      data: validData,
      eventBus: localEventBus,
      runtimes: {
        health: healthRuntime,
        combat: combatRuntime,
        animation: animationRuntime,
        input: inputRuntime,
        statusEffects: statusEffectRuntime
      },
      controllers: {
        health: healthComponent,
        attack: attackController,
        animation: animationController,
        hitboxes: hitboxController,
        hurtboxes: hurtboxController
      }
    };

    return dataDrivenEcosystem;
  }

  /**
   * Serializa todos los runtimes del personaje para un save-state.
   */
  static serializeRuntimes(runtimes) {
    const serialized = {
      health: runtimes.health.serialize(),
      combat: runtimes.combat.serialize(),
      animation: runtimes.animation.serialize(),
      input: runtimes.input.serialize(),
      statusEffects: runtimes.statusEffects.serialize()
    };
    if (runtimes.berserk) {
      serialized.berserk = runtimes.berserk.serialize();
    }
    return serialized;
  }

  /**
   * Restaura los runtimes a partir de un save-state.
   */
  static deserializeRuntimes(runtimes, data) {
    runtimes.health.deserialize(data.health);
    runtimes.combat.deserialize(data.combat);
    runtimes.animation.deserialize(data.animation);
    runtimes.input.deserialize(data.input);
    runtimes.statusEffects.deserialize(data.statusEffects);
    if (runtimes.berserk && data.berserk) {
      runtimes.berserk.deserialize(data.berserk);
    }
  }
}
