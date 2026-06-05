/**
 * CombatRuntime.js
 * Registra cooldowns globales, stacks y el AttackInstance actual.
 * Es completamente serializable.
 */

import AttackInstance from './AttackInstance.js';

export default class CombatRuntime {
  constructor() {
    this.cooldowns = new Map(); // key: attackId, value: remainingMs
    this.currentAttack = null; // Instancia de AttackInstance
  }

  setCooldown(attackId, durationMs) {
    this.cooldowns.set(attackId, durationMs);
  }

  isCooldownActive(attackId) {
    return (this.cooldowns.get(attackId) || 0) > 0;
  }

  startAttack(attackId) {
    this.currentAttack = new AttackInstance(attackId);
    return this.currentAttack;
  }

  clearAttack() {
    this.currentAttack = null;
  }

  update(delta) {
    for (const [attackId, remaining] of this.cooldowns.entries()) {
      if (remaining > 0) {
        this.cooldowns.set(attackId, Math.max(0, remaining - delta));
      }
    }
  }

  serialize() {
    const serializedCooldowns = {};
    for (const [key, value] of this.cooldowns.entries()) {
      serializedCooldowns[key] = value;
    }
    
    return {
      cooldowns: serializedCooldowns,
      currentAttack: this.currentAttack ? this.currentAttack.serialize() : null
    };
  }

  deserialize(data) {
    this.cooldowns.clear();
    if (data.cooldowns) {
      for (const [key, value] of Object.entries(data.cooldowns)) {
        this.cooldowns.set(key, value);
      }
    }
    
    if (data.currentAttack) {
      this.currentAttack = new AttackInstance(data.currentAttack.attackId).deserialize(data.currentAttack);
    } else {
      this.currentAttack = null;
    }
    return this;
  }
}
