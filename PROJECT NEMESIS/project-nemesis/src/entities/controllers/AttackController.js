/**
 * AttackController.js
 * Gestión de ejecución de ataques lógicos, validación de cooldowns y ventanas de cancelación.
 */

import { LOCAL_EVENTS } from '../../game/events.js';
import CombatRuntime from '../runtimes/CombatRuntime.js';

export default class AttackController {
  /**
   * @param {CombatRuntime} combatRuntime 
   * @param {Object} characterData 
   * @param {import('../../systems/core/EventBus.js').default} localEventBus 
   */
  constructor(combatRuntime, characterData, localEventBus) {
    this.runtime = combatRuntime;
    this.characterData = characterData;
    this.eventBus = localEventBus;

    // Escuchar el final de la animación para limpiar el ataque actual
    this.eventBus.on(LOCAL_EVENTS.ANIMATION_COMPLETED, this._onAnimationCompleted, this, this);
  }

  _onAnimationCompleted(payload) {
    if (this.runtime.currentAttack) {
      const attackData = this.characterData.attacks[this.runtime.currentAttack.attackId];
      if (attackData && attackData.animationRef === payload.animationId) {
        this.endAttack();
      }
    }
  }

  /**
   * Intenta ejecutar un ataque.
   * @param {string} attackId 
   * @returns {boolean} true si el ataque se inició con éxito
   */
  tryAttack(attackId) {
    const attackData = this.characterData.attacks[attackId];
    if (!attackData) return false;

    if (this.runtime.isCooldownActive(attackId)) {
      return false; // En cooldown
    }

    // TODO: Validar si la máquina de estados actual permite atacar o cancelar
    // Para simplificar, si no hay ataque actual, iniciamos. 
    // Si hay ataque actual, habría que chequear las ventanas de cancelación.

    if (this.runtime.currentAttack && !this.runtime.currentAttack.cancelled) {
       // Simplificación: no cancelamos por ahora a menos que se expanda lógica de cancelación.
       return false;
    }

    // Iniciar ataque
    const instance = this.runtime.startAttack(attackId);
    
    // Poner en cooldown
    this.runtime.setCooldown(attackId, attackData.cooldown);

    // Emitir evento
    this.eventBus.emit(LOCAL_EVENTS.ATTACK_STARTED, { attackId, instanceId: instance.id });

    // El AnimationController o Fighter state machine debería escuchar este evento 
    // y reproducir attackData.animationRef.
    
    return true;
  }

  update(delta) {
    this.runtime.update(delta);

    // Actualizar tiempo del ataque actual
    if (this.runtime.currentAttack && !this.runtime.currentAttack.cancelled) {
      this.runtime.currentAttack.elapsedTime += delta;
      // La finalización del ataque lógicamente vendrá del EventBus cuando acabe la animación
    }
  }

  /**
   * Limpia el ataque actual al finalizar
   */
  endAttack() {
    if (this.runtime.currentAttack) {
      this.eventBus.emit(LOCAL_EVENTS.ATTACK_ENDED, { attackId: this.runtime.currentAttack.attackId });
      this.runtime.clearAttack();
    }
  }
}
