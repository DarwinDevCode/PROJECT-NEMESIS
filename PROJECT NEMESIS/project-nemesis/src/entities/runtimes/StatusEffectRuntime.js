/**
 * StatusEffectRuntime.js
 * Controla temporizadores de buffs, debuffs y estados alterados.
 * Soporta prioridades, políticas de stacking y reset explícito.
 * Completamente serializable.
 */

export default class StatusEffectRuntime {
  constructor() {
    this.activeEffects = []; // Array de instancias de efectos
  }

  addEffect(effectData) {
    const { 
      id, 
      duration, 
      modifiers = {}, 
      stackPolicy = 'replace', 
      priority = 0,
      modifierAggregation = 'multiplicative'
    } = effectData;

    const existingIndex = this.activeEffects.findIndex(e => e.id === id);

    if (existingIndex !== -1) {
      const existing = this.activeEffects[existingIndex];
      
      if (stackPolicy === 'replace') {
        if (priority >= existing.priority) {
          console.log(`[StatusEffect] Replaced: ${id}`);
          this.activeEffects[existingIndex] = this._createEffectInstance(effectData);
        } else {
          console.log(`[StatusEffect] Rejected (Lower Priority): ${id}`);
        }
      } else if (stackPolicy === 'refresh') {
        console.log(`[StatusEffect] Refreshed: ${id}`);
        existing.durationRemaining = duration;
      } else if (stackPolicy === 'stack') {
        // En stack, se agrega una nueva instancia a la lista
        const stackCount = this.activeEffects.filter(e => e.id === id).length + 1;
        console.log(`[StatusEffect] Stacked: ${id} (x${stackCount})`);
        this.activeEffects.push(this._createEffectInstance(effectData));
      }
    } else {
      console.log(`[StatusEffect] Added: ${id}`);
      this.activeEffects.push(this._createEffectInstance(effectData));
    }
  }

  _createEffectInstance(effectData) {
    return {
      id: effectData.id,
      durationRemaining: effectData.duration,
      modifiers: { ...effectData.modifiers },
      priority: effectData.priority || 0,
      modifierAggregation: effectData.modifierAggregation || 'multiplicative'
    };
  }

  getModifier(statName) {
    let multiplier = 1.0;
    
    // Sort determinista por prioridad (mayor a menor)
    const sortedEffects = [...this.activeEffects].sort((a, b) => b.priority - a.priority);

    for (const effect of sortedEffects) {
      if (effect.modifiers && effect.modifiers[statName] !== undefined) {
        if (effect.modifierAggregation === 'multiplicative') {
          multiplier *= effect.modifiers[statName];
        }
        // Políticas 'additive' u 'override' podrían implementarse aquí a futuro
      }
    }
    return multiplier;
  }

  update(delta) {
    for (let i = this.activeEffects.length - 1; i >= 0; i--) {
      const effect = this.activeEffects[i];
      effect.durationRemaining -= delta;

      if (effect.durationRemaining <= 0) {
        console.log(`[StatusEffect] Removed: ${effect.id}`);
        this.activeEffects.splice(i, 1);
      }
    }
  }

  reset(options = {}) {
    if (options.reason === 'death') {
      console.log(`[StatusEffect] Reset (Reason: death) - Clearing all effects`);
      this.activeEffects = [];
    }
  }

  serialize() {
    return {
      activeEffects: this.activeEffects.map(effect => ({ ...effect, modifiers: { ...effect.modifiers } }))
    };
  }

  deserialize(data) {
    this.activeEffects = data.activeEffects.map(effect => ({ ...effect, modifiers: { ...effect.modifiers } }));
    return this;
  }
}
