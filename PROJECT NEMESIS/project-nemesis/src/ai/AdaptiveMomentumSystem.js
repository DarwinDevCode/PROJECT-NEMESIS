/**
 * AdaptiveMomentumSystem.js
 * 
 * Gestiona el aprendizaje a CORTO PLAZO (Adaptación Inmediata y Temporal).
 * Analiza una ventana deslizante de las últimas acciones del jugador para 
 * detectar abusos tácticos en tiempo real y calcular un nivel de predictibilidad.
 * Pierde información gradualmente entre rondas.
 */

export default class AdaptiveMomentumSystem {
  /**
   * @param {object} savedData - Datos guardados para mantener la inercia temporal
   */
  constructor(savedData = {}) {
    // Ventana deslizante estricta: últimas 40 acciones
    this.maxHistorySize = 40;
    this.actionHistory = savedData.actionHistory || [];

    // Momentum Categórico (0 a 1)
    this.momentums = savedData.momentums || {
      attackMomentum: 0,
      blockMomentum: 0,
      dashMomentum: 0,
      specialMomentum: 0,
      jumpMomentum: 0
    };

    // Predictibilidad global en tiempo real (0 a 1)
    this.predictabilityScore = savedData.predictabilityScore || 0;
  }

  /**
   * Registra una acción ejecutada por el jugador en tiempo real.
   * @param {string} actionType - 'attack', 'block', 'dash', 'special', 'jump'
   */
  registerAction(actionType) {
    if (!actionType) return;

    this.actionHistory.push(actionType);

    // Mantener la ventana estricta
    if (this.actionHistory.length > this.maxHistorySize) {
      this.actionHistory.shift();
    }

    this._recalculateMomentums();
  }

  /**
   * Recalcula el nivel de predictibilidad y los momentums
   * basados exclusivamente en el historial reciente (sliding window).
   * @private
   */
  _recalculateMomentums() {
    if (this.actionHistory.length === 0) return;

    const counts = {
      attack: 0,
      block: 0,
      dash: 0,
      special: 0,
      jump: 0
    };

    // Contar ocurrencias
    for (const action of this.actionHistory) {
      if (counts[action] !== undefined) {
        counts[action]++;
      }
    }

    const total = this.actionHistory.length;

    // Calcular frecuencias puras (0 a 1)
    const frequencies = {
      attack: counts.attack / total,
      block: counts.block / total,
      dash: counts.dash / total,
      special: counts.special / total,
      jump: counts.jump / total
    };

    // Actualizar momentums categóricos con suavizado (para no ser súper errático con 2 acciones)
    // Se requiere un mínimo de historial para tener confianza
    const confidenceMultiplier = Math.min(1, total / 15); 

    this.momentums.attackMomentum = frequencies.attack * confidenceMultiplier;
    this.momentums.blockMomentum = frequencies.block * confidenceMultiplier;
    this.momentums.dashMomentum = frequencies.dash * confidenceMultiplier;
    this.momentums.specialMomentum = frequencies.special * confidenceMultiplier;
    this.momentums.jumpMomentum = frequencies.jump * confidenceMultiplier;

    // Calcular Predictability Score basado en entropía / varianza
    // Si la frecuencia de la acción más usada es muy alta, el jugador es predecible
    let maxFrequency = 0;
    for (const key in frequencies) {
      if (frequencies[key] > maxFrequency) {
        maxFrequency = frequencies[key];
      }
    }

    // Normalizamos para que una frecuencia de 0.8 de una sola acción sea 100% de predictibilidad
    // (Ya que es imposible hacer un solo movimiento el 100% del tiempo de forma efectiva en combate)
    this.predictabilityScore = Math.min(1, (maxFrequency * confidenceMultiplier) / 0.8);
  }

  /**
   * Obtiene el momentum actual de una categoría específica.
   */
  getMomentum(category) {
    return this.momentums[`${category}Momentum`] || 0;
  }

  /**
   * Llamado al finalizar la partida para reducir el momentum a corto plazo.
   * Representa la Memoria Temporal desapareciendo tras 3-5 partidas.
   */
  applyRoundDecay() {
    const DECAY_FACTOR = 0.6; // Se conserva el 60% entre rondas (-40% decaimiento)
    
    for (const key in this.momentums) {
      this.momentums[key] *= DECAY_FACTOR;
      if (this.momentums[key] < 0.05) {
        this.momentums[key] = 0;
      }
    }

    this.predictabilityScore *= DECAY_FACTOR;
    
    // Limpiamos un poco el historial para reflejar el paso del tiempo
    // Conservamos solo la mitad del buffer reciente para iniciar la siguiente ronda
    const half = Math.floor(this.actionHistory.length / 2);
    this.actionHistory = this.actionHistory.slice(half);
  }

  /**
   * Extrae insights legibles para mostrarle al jugador o al público
   * qué ha aprendido temporalmente Nemesis.
   */
  getInsights() {
    const insights = [];

    if (this.momentums.dashMomentum > 0.6) {
      insights.push('⚠ Abuso de Dash evasivo detectado.');
    }
    if (this.momentums.attackMomentum > 0.6) {
      insights.push('⚠ Dependencia excesiva de ataques rápidos.');
    }
    if (this.momentums.specialMomentum > 0.5) {
      insights.push('⚠ Uso frecuente e imprudente de ataques especiales.');
    }
    if (this.momentums.blockMomentum > 0.5) {
      insights.push('⚠ Jugador excesivamente defensivo (bloqueo constante).');
    }
    if (this.momentums.jumpMomentum > 0.5) {
      insights.push('⚠ Jugador saltarín (movimiento aéreo constante).');
    }

    return insights;
  }

  /**
   * Serializa el estado para guardar entre rondas (SaveManager).
   */
  serialize() {
    return {
      actionHistory: this.actionHistory,
      momentums: { ...this.momentums },
      predictabilityScore: this.predictabilityScore
    };
  }
}
