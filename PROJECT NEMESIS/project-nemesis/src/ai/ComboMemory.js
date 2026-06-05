/**
 * ComboMemory.js
 * Memoria a largo plazo de los combos del jugador.
 * Consolida combos, calcula su peligrosidad y tasa de éxito.
 */

export default class ComboMemory {
  /**
   * @param {object} comboMemoryData - Datos cargados (nemesisComboMemory)
   */
  constructor(comboMemoryData = { combos: [] }) {
    this.combos = comboMemoryData.combos || [];
  }

  /**
   * Registra un combo o actualiza sus estadísticas si ya existe.
   * @param {string[]} sequence - Secuencia de acciones, ej: ['attack', 'attack', 'special']
   * @param {boolean} success - Si el combo logró dañar a Nemesis
   * @param {number} matchNumber - En qué partida ocurrió
   */
  recordCombo(sequence, success, matchNumber) {
    if (!sequence || sequence.length < 2) return;

    const comboId = sequence.join('->');
    let combo = this.combos.find(c => c.comboId === comboId);

    if (!combo) {
      combo = {
        comboId,
        sequence,
        frequency: 0,
        successes: 0,
        successRate: 0,
        dangerLevel: 0,
        lastSeen: matchNumber
      };
      this.combos.push(combo);
    }

    combo.frequency += 1;
    if (success) combo.successes += 1;
    combo.successRate = combo.successes / combo.frequency;
    combo.lastSeen = matchNumber;

    // Peligrosidad: combina tasa de éxito con qué tan frecuente es
    // Un combo que acierta el 100% de las veces pero se usó 1 vez es menos peligroso 
    // que uno que acierta 80% y se usó 20 veces.
    const confidence = Math.min(1.0, combo.frequency / 5);
    combo.dangerLevel = combo.successRate * confidence;
  }

  /**
   * Obtiene los combos más peligrosos.
   * @param {number} limit 
   */
  getMostDangerousCombos(limit = 3) {
    return [...this.combos]
      .filter(c => c.frequency >= 2)
      .sort((a, b) => b.dangerLevel - a.dangerLevel)
      .slice(0, limit);
  }

  /**
   * Busca si una secuencia parcial es el inicio de un combo peligroso.
   * Útil para contraestrategias.
   * @param {string[]} partialSequence - Acciones recientes del jugador
   * @returns {object|null} El combo más peligroso que coincide con el inicio, o null.
   */
  matchDangerousComboPrefix(partialSequence) {
    if (!partialSequence || partialSequence.length === 0) return null;

    const prefix = partialSequence.join('->');
    const matches = this.combos.filter(c => 
      c.comboId.startsWith(prefix) && c.comboId !== prefix && c.dangerLevel > 0.4
    );

    if (matches.length > 0) {
      // Devolver el que tiene mayor dangerLevel
      return matches.sort((a, b) => b.dangerLevel - a.dangerLevel)[0];
    }
    return null;
  }

  serialize() {
    return {
      combos: [...this.combos]
    };
  }
}
