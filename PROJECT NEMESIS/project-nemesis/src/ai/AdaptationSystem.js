/**
 * AdaptationSystem.js
 * Gestiona la progresión infinita de Nemesis:
 * - Experiencia basada en descubrimientos y aprendizaje.
 * - Niveles tangibles (1 al infinito).
 * - Desbloqueo progresivo de habilidades en niveles clave.
 *
 * Reglas de aprendizaje:
 * - Derrota de Nemesis = Mucha información nueva (Revela vulnerabilidades).
 * - Victoria de Nemesis = Información confirmada (Menos XP, consolida lo que ya sabe).
 * - Descubrimientos de combos/patrones = XP extra directa.
 */


import { ADAPTATION_CONFIG } from '../game/config.js';
import { COMBAT_RESULTS, NEMESIS_SKILLS } from '../game/constants.js';

export default class AdaptationSystem {
  /**
   * @param {object} nemesisState - Estado cargado (nemesisState del SaveManager)
   */
  constructor(nemesisState = null) {
    this.experience = nemesisState?.experience || 0;
    this.currentLevel = nemesisState?.currentLevel || 1;
    this.activeAdaptation = nemesisState?.activeAdaptation || 0;
    this.berserkActivations = nemesisState?.berserkActivations || 0;

    // Estado inicial de maestrías competentes
    this.masteries = nemesisState?.masteries || {
      defensiveMastery: 0.35,
      offensiveMastery: 0.35,
      dashMastery: 0.25,
      berserkMastery: 0.20,
      comboPredictionMastery: 0.15,
      counterAttackMastery: 0.20,
      spacingMastery: 0.15,
      pressureMastery: 0.20
    };

    this.adaptationHistory = nemesisState?.adaptationHistory || [];
    this.lastMainAdaptation = null;
  }

  /**
   * Crecimiento logarítmico acelerado al principio y lento al final.
   * @param {number} current - Maestría actual (0 a 1)
   * @param {number} baseGain - Ganancia base a aplicar
   * @returns {number} Nueva maestría
   */
  _applyLogarithmicGrowth(current, baseGain) {
    let multiplier = 1.0;
    if (current < 0.5) multiplier = 1.5; // Muy rápido al inicio
    else if (current < 0.8) multiplier = 0.8; // Moderado
    else multiplier = 0.3; // Lento al final

    return Math.min(1.0, current + (baseGain * multiplier));
  }

  /**
   * Procesa el fin de una partida y aplica el aprendizaje correspondiente.
   * @param {string} result - Resultado del combate (de COMBAT_RESULTS)
   * @param {object} matchSummary - Resumen de estadísticas
   * @param {number} predictabilityScore - Score del Adaptive Momentum System
   * @returns {object} Resumen de crecimiento
   */
  processMatchResult(result, matchSummary = null, predictabilityScore = 0) {
    const previousExperience = this.experience;
    const previousLevel = this.currentLevel;

    // ─── EVOLUCIÓN TRADICIONAL (XP y Niveles para Historial) ───
    let baseXP = (result === COMBAT_RESULTS.PLAYER_WIN) ? 25 : 10;
    let discoveryXP = 0;
    if (matchSummary) {
      if (matchSummary.detectedCombos && matchSummary.detectedCombos.length > 0) {
        discoveryXP += matchSummary.detectedCombos.length * 5;
      }
      if (matchSummary.dashesOffensive > 0) discoveryXP += matchSummary.dashesOffensive * 2;
    }
    const predictabilityBonus = Math.floor(predictabilityScore * 10);
    this.experience += baseXP + discoveryXP + predictabilityBonus;
    this.activeAdaptation = this.experience;

    let levelUp = false;
    let nextLevelXP = this.currentLevel * 50;
    while (this.experience >= nextLevelXP) {
      this.experience -= nextLevelXP;
      this.currentLevel++;
      levelUp = true;
      nextLevelXP = this.currentLevel * 50;
    }

    // ─── SISTEMA DE MAESTRÍAS Y TOP THREATS ───
    const growth = {
      defensiveMastery: 0,
      offensiveMastery: 0,
      dashMastery: 0,
      berserkMastery: 0,
      comboPredictionMastery: 0,
      counterAttackMastery: 0,
      spacingMastery: 0,
      pressureMastery: 0
    };

    let topThreats = [];

    if (matchSummary) {
      // Calcular pesos de amenazas basados en las acciones del jugador
      const dashThreat = (matchSummary.dashesOffensive || 0) * 0.1;
      const attackThreat = ((matchSummary.quickAttacks || 0) + (matchSummary.specialAttacks || 0)) * 0.05;
      const comboThreat = (matchSummary.detectedCombos ? matchSummary.detectedCombos.length : 0) * 0.15;

      const totalThreat = dashThreat + attackThreat + comboThreat || 1;

      topThreats.push({ threat: 'Dash', weight: dashThreat / totalThreat });
      topThreats.push({ threat: 'Ataques', weight: attackThreat / totalThreat });
      topThreats.push({ threat: 'Combos', weight: comboThreat / totalThreat });

      // Ordenar por peso
      topThreats.sort((a, b) => b.weight - a.weight);

      // Distribuir aprendizaje según Top Threats
      topThreats.forEach(t => {
        if (t.weight < 0.1) return; // Ignorar si no fue una amenaza real

        if (t.threat === 'Dash') {
          growth.dashMastery += 0.25 * t.weight;
          growth.spacingMastery += 0.15 * t.weight;
        } else if (t.threat === 'Ataques') {
          growth.defensiveMastery += 0.25 * t.weight;
          if (predictabilityScore > 0.6) growth.counterAttackMastery += 0.15 * t.weight;
        } else if (t.threat === 'Combos') {
          growth.comboPredictionMastery += 0.35 * t.weight;
          growth.counterAttackMastery += 0.20 * t.weight;
        }
      });

      // Si el jugador fue agresivo en general (mucha vida quitada a Nemesis)
      if (result === COMBAT_RESULTS.PLAYER_WIN) {
        growth.defensiveMastery += 0.10;
        growth.berserkMastery += 0.10;
      }

      // Aprendizaje Derivado del Berserk
      if (matchSummary.berserkStats) {
        if (matchSummary.berserkStats.special1Hits > 0) {
          growth.spacingMastery += 0.15;
          growth.pressureMastery += 0.10;
        }
        if (matchSummary.berserkStats.special2Hits > 0) {
          growth.offensiveMastery += 0.15;
          growth.comboPredictionMastery += 0.10;
          growth.counterAttackMastery += 0.10;
        }
        if (matchSummary.berserkStats.orbitalHits > 0) {
          growth.defensiveMastery += 0.15;
          growth.pressureMastery += 0.15;
          growth.counterAttackMastery += 0.10;
        }
      }
    }

    // Aplicar matriz de sinergias (Crecimientos Secundarios)
    growth.spacingMastery += growth.dashMastery * 0.20;
    growth.counterAttackMastery += growth.comboPredictionMastery * 0.25;
    growth.defensiveMastery += growth.spacingMastery * 0.15;
    growth.berserkMastery += growth.defensiveMastery * 0.15;
    growth.pressureMastery += (growth.offensiveMastery * 0.20) + (growth.spacingMastery * 0.15) + (growth.dashMastery * 0.10) + (growth.berserkMastery * 0.15);

    // Aplicar crecimiento logarítmico a las maestrías actuales
    const oldMasteries = { ...this.masteries };
    for (const key in this.masteries) {
      if (growth[key] > 0) {
        this.masteries[key] = this._applyLogarithmicGrowth(this.masteries[key], growth[key]);
      }
    }

    // Determinar la Adaptación Principal para la narrativa
    const mainThreat = topThreats.length > 0 ? topThreats[0] : null;
    let narrative = "Nemesis está estudiando el combate de forma general.";
    if (mainThreat && mainThreat.weight > 0.3) {
      if (mainThreat.threat === 'Dash') {
        narrative = "Nemesis detectó un uso excesivo de Dash. Ha mejorado su control de distancia (Spacing) y castigo a la evasión.";
      } else if (mainThreat.threat === 'Ataques') {
        narrative = "Nemesis identificó agresión frontal constante. Ha fortalecido su defensa y capacidad de contraataque.";
      } else if (mainThreat.threat === 'Combos') {
        narrative = "Nemesis analizó tus patrones de combos. Su predicción ha mejorado para interrumpirte antes de que termines.";
      }
    }

    // Generar MOMENTO CLAVE DEL COMBATE
    let keyMoment = "Combate estándar, Nemesis estudió la táctica general.";
    let keyMomentNarrative = "Nemesis reforzó su estilo de juego equilibrado.";

    if (matchSummary && matchSummary.berserkStats) {
      const stats = matchSummary.berserkStats;
      if (stats.brokenByDamage) {
        keyMoment = "Berserk fue cancelado por daño crítico.";
        keyMomentNarrative = "Aprendizaje derivado: Nemesis identificó vulnerabilidades defensivas en estados de alta agresividad y moderará su ceguera ofensiva.";
      } else if (stats.orbitalHits > 0) {
        keyMoment = "Rayo Orbital aniquiló la defensa del jugador.";
        keyMomentNarrative = "Aprendizaje derivado: Nemesis reforzó tácticas para castigar bloqueos repetitivos y controlar el territorio.";
      } else if (stats.special1Hits > 0) {
        keyMoment = "Rayo de Energía impactó durante una huida.";
        keyMomentNarrative = "Aprendizaje derivado: Nemesis reforzó sus estrategias de persecución y dominio del terreno.";
      } else if (stats.special2Hits > 0) {
        keyMoment = "Liberación de Energía abrumó al jugador con su onda expansiva.";
        keyMomentNarrative = "Aprendizaje derivado: Nemesis incrementó su ritmo ofensivo y capacidad para encadenar combos prolongados.";
      } else if (this.berserkActivations > 0) {
        keyMoment = "El estado Berserk se activó y llevó al jugador al límite.";
        keyMomentNarrative = "Aprendizaje derivado: Nemesis experimentó con agresión extrema, elevando su capacidad de presión general en combate.";
      }
    }

    this.lastMainAdaptation = narrative;

    // Guardar en el Historial Evolutivo
    this.adaptationHistory.push({
      match: this.adaptationHistory.length + 1,
      result: result,
      experienceGain: baseXP + discoveryXP + predictabilityBonus,
      mainThreat: mainThreat ? mainThreat.threat : 'Ninguna',
      narrative: narrative,
      keyMoment: keyMoment,
      keyMomentNarrative: keyMomentNarrative,
      masteryGained: { ...growth }
    });

    // Límite de historial
    if (this.adaptationHistory.length > 50) {
      this.adaptationHistory.shift();
    }

    return {
      experienceGain: baseXP + discoveryXP + predictabilityBonus,
      previousExperience,
      levelUp,
      masteryGrowth: growth,
      mainAdaptation: narrative
    };
  }

  /**
   * Devuelve el nivel de maestría actual de una habilidad (0 a 1)
   * @param {string} masteryKey - ej. 'dashMastery'
   * @returns {number}
   */
  getMastery(masteryKey) {
    return this.masteries[masteryKey] || 0;
  }

  /**
   * @deprecated - Reemplazado por getMastery
   */
  hasSkill(skillKey) {
    return true; // En el nuevo sistema, todas las habilidades están desbloqueadas
  }

  /**
   * Devuelve un objeto con todas las maestrías.
   */
  getAllMasteries() {
    return { ...this.masteries };
  }

  /**
   * Devuelve el nivel evolutivo actual para UI (reemplazo de lógica anterior).
   * @returns {number}
   */
  getEvolutionLevel() {
    return this.currentLevel;
  }

  /**
   * Devuelve el nombre del nivel actual para UI según los hitos.
   * @returns {string}
   */
  getEvolutionName() {
    if (this.currentLevel >= 15) return 'Mente Maestra';
    if (this.currentLevel >= 10) return 'Predictivo';
    if (this.currentLevel >= 8) return 'Táctico';
    if (this.currentLevel >= 5) return 'Evasivo';
    if (this.currentLevel >= 3) return 'Defensivo';
    return 'Básico';
  }

  /**
   * Aplica el multiplicador de frustración a la adaptación activa.
   * Llamado por FrustrationRegulator.
   * @param {number} multiplier - 0-1
   */
  applyFrustrationMultiplier(multiplier) {
    // La adaptación activa refleja cuán concentrado está
    this.activeAdaptation = this.experience * multiplier;
  }

  /**
   * Serializa el estado para persistencia.
   * @returns {object}
   */
  serialize() {
    const lastHistory = this.adaptationHistory[this.adaptationHistory.length - 1];
    return {
      experience: this.experience,
      currentLevel: this.currentLevel,
      activeAdaptation: this.activeAdaptation,
      berserkActivations: this.berserkActivations,
      mainAdaptation: this.lastMainAdaptation,
      keyMoment: lastHistory?.keyMoment || null,
      keyMomentNarrative: lastHistory?.keyMomentNarrative || null,
      masteries: { ...this.masteries },
      adaptationHistory: [...this.adaptationHistory]
    };
  }
}
