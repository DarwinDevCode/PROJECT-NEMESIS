/**
 * HealthComponent.js
 * Wrapper lógico sobre el HealthRuntime. Se suscribe y emite en el Local Event Bus.
 */

import HealthRuntime from '../runtimes/HealthRuntime.js';
import { LOCAL_EVENTS } from '../../game/events.js';

export default class HealthComponent {
  /**
   * @param {HealthRuntime} healthRuntime 
   * @param {import('../../systems/core/EventBus.js').default} localEventBus 
   */
  constructor(healthRuntime, localEventBus) {
    this.runtime = healthRuntime;
    this.eventBus = localEventBus;
  }

  /**
   * Aplica daño y notifica a los demás sistemas si la vida cambió o si murió.
   * @param {number} amount 
   */
  takeDamage(amount) {
    const actualDamage = this.runtime.takeDamage(amount);
    
    if (actualDamage > 0) {
      this.eventBus.emit(LOCAL_EVENTS.DAMAGE_TAKEN, { amount: actualDamage, currentHP: this.runtime.currentHP });
      
      if (this.runtime.isDead) {
        this.eventBus.emit(LOCAL_EVENTS.DIED, null);
      }
    }
    
    return actualDamage;
  }

  heal(amount) {
    const actualHeal = this.runtime.heal(amount);
    if (actualHeal > 0) {
      this.eventBus.emit(LOCAL_EVENTS.HEALED, { amount: actualHeal, currentHP: this.runtime.currentHP });
    }
    return actualHeal;
  }

  setInvulnerable(durationMs) {
    this.runtime.setInvulnerable(durationMs);
  }

  update(delta) {
    this.runtime.update(delta);
  }
}
