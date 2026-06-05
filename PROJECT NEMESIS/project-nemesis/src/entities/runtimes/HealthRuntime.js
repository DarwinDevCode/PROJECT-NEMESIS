/**
 * HealthRuntime.js
 * Modulo del Runtime responsable de la salud, curaciones e invulnerabilidad.
 * Es completamente serializable.
 */

export default class HealthRuntime {
  constructor(maxHP) {
    this.maxHP = maxHP;
    this.currentHP = maxHP;
    this.isDead = false;
    this.invulnerableTimer = 0; // en ms
  }

  takeDamage(amount) {
    if (this.isDead || this.invulnerableTimer > 0) return 0;
    
    const actualDamage = Math.min(amount, this.currentHP);
    this.currentHP -= actualDamage;
    
    if (this.currentHP <= 0) {
      this.currentHP = 0;
      this.isDead = true;
    }
    return actualDamage;
  }

  heal(amount) {
    if (this.isDead) return 0;
    
    const actualHeal = Math.min(amount, this.maxHP - this.currentHP);
    this.currentHP += actualHeal;
    return actualHeal;
  }

  setInvulnerable(durationMs) {
    this.invulnerableTimer = Math.max(this.invulnerableTimer, durationMs);
  }

  update(delta) {
    if (this.invulnerableTimer > 0) {
      this.invulnerableTimer = Math.max(0, this.invulnerableTimer - delta);
    }
  }

  serialize() {
    return {
      maxHP: this.maxHP,
      currentHP: this.currentHP,
      isDead: this.isDead,
      invulnerableTimer: this.invulnerableTimer
    };
  }

  deserialize(data) {
    this.maxHP = data.maxHP;
    this.currentHP = data.currentHP;
    this.isDead = data.isDead;
    this.invulnerableTimer = data.invulnerableTimer;
    return this;
  }
}
