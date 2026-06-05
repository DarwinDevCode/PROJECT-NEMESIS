/**
 * PatternDetector.js
 * Analiza las estadísticas de una partida para:
 * 1. Clasificar el estilo de juego del jugador (perfil)
 * 2. Detectar patrones dominantes con nivel de confianza
 * 3. Alimentar a NemesisKnowledge con datos interpretados
 *
 * No almacena estado persistente — recibe datos y devuelve análisis.
 */

import { PLAYER_PROFILES } from '../game/constants.js';
import { PATTERN_CONFIG } from '../game/config.js';

export default class PatternDetector {
  /**
   * Clasifica el estilo del jugador basado en el resumen de una partida.
   * @param {object} matchSummary - Resumen del StatisticsSystem
   * @returns {string} Perfil del jugador (de PLAYER_PROFILES)
   */
  classifyProfile(matchSummary) {
    const {
      quickAttackRatio,
      specialAttackRatio,
      blockRatio,
      totalActions,
    } = matchSummary;

    // Sin suficientes datos, no clasificar
    if (totalActions < 5) {
      return PLAYER_PROFILES.UNKNOWN;
    }

    // Agresivo: muchos ataques rápidos, poco bloqueo
    if (
      quickAttackRatio > PATTERN_CONFIG.aggressiveThreshold &&
      blockRatio < PATTERN_CONFIG.aggressiveBlockCap
    ) {
      return PLAYER_PROFILES.AGGRESSIVE;
    }

    // Impulsivo: abusa del ataque especial
    if (specialAttackRatio > PATTERN_CONFIG.impulsiveThreshold) {
      return PLAYER_PROFILES.IMPULSIVE;
    }

    // Defensivo: bloquea mucho
    if (blockRatio > PATTERN_CONFIG.defensiveThreshold) {
      return PLAYER_PROFILES.DEFENSIVE;
    }

    // Estratégico: ningún extremo domina
    return PLAYER_PROFILES.STRATEGIC;
  }

  /**
   * Detecta patrones específicos del jugador con nivel de confianza.
   * @param {object} matchSummary - Resumen del StatisticsSystem
   * @returns {Array<{ pattern: string, description: string, confidence: number }>}
   */
  detectPatterns(matchSummary) {
    const patterns = [];
    const { totalActions } = matchSummary;

    // Confianza base según cantidad de acciones
    const baseCf = this._calculateBaseConfidence(totalActions);

    // Patrón: Ataque frontal repetitivo
    if (matchSummary.quickAttackRatio > 0.7) {
      patterns.push({
        pattern: 'front_attack_spam',
        description: 'Ataque frontal repetitivo',
        confidence: Math.min(1.0, baseCf * (matchSummary.quickAttackRatio / 0.7)),
        metric: matchSummary.quickAttackRatio,
      });
    }

    // Patrón: Salto excesivo
    if (matchSummary.jumpRatio > 0.4) {
      patterns.push({
        pattern: 'excessive_jumping',
        description: 'Salto excesivo',
        confidence: Math.min(1.0, baseCf * (matchSummary.jumpRatio / 0.4)),
        metric: matchSummary.jumpRatio,
      });
    }

    // Patrón: Dependencia de ataque especial
    if (matchSummary.specialAttackRatio > 0.3) {
      patterns.push({
        pattern: 'special_dependence',
        description: 'Dependencia de ataque especial',
        confidence: Math.min(1.0, baseCf * (matchSummary.specialAttackRatio / 0.3)),
        metric: matchSummary.specialAttackRatio,
      });
    }

    // Patrón: Tendencia direccional
    if (matchSummary.dominantDirection !== 'none') {
      const movingTime = matchSummary.timeMoving;
      const dirConfidence = movingTime > 30 ? 0.9 : movingTime > 15 ? 0.6 : 0.3;
      patterns.push({
        pattern: 'directional_tendency',
        description: `Movimiento predominante hacia la ${
          matchSummary.dominantDirection === 'left' ? 'izquierda' : 'derecha'
        }`,
        confidence: dirConfidence,
        metric: matchSummary.dominantDirection,
      });
    }

    // Patrón: Jugador pasivo (mucho tiempo quieto)
    if (matchSummary.timeIdle > matchSummary.timeMoving * 2) {
      patterns.push({
        pattern: 'passive_player',
        description: 'Jugador pasivo',
        confidence: baseCf * 0.8,
        metric: matchSummary.timeIdle / Math.max(1, matchSummary.timeMoving),
      });
    }

    // Patrón: Jugador agresivo sin defensa
    if (matchSummary.blockRatio < 0.05 && matchSummary.quickAttackRatio > 0.4) {
      patterns.push({
        pattern: 'no_defense',
        description: 'Ausencia total de defensa',
        confidence: baseCf * 0.85,
        metric: matchSummary.blockRatio,
      });
    }

    return patterns;
  }

  /**
   * Analiza la secuencia de acciones para detectar repeticiones.
   * Utilizado por el sistema de predicción (nivel 55%+).
   * @param {string[]} actionSequence - Últimas acciones del jugador
   * @returns {{ predictedAction: string|null, confidence: number }}
   */
  predictNextAction(actionSequence) {
    if (!actionSequence || actionSequence.length < 5) {
      return { predictedAction: null, confidence: 0 };
    }

    // Buscar patrones de 2-3 acciones que se repiten
    const last3 = actionSequence.slice(-3);
    const last2 = actionSequence.slice(-2);

    // Contar cuántas veces aparece la secuencia de 2 acciones
    let count2 = 0;
    for (let i = 0; i < actionSequence.length - 2; i++) {
      if (
        actionSequence[i] === last2[0] &&
        actionSequence[i + 1] === last2[1]
      ) {
        count2++;
      }
    }

    // Si la secuencia de 2 se repite, predecir la acción que suele seguir
    if (count2 >= 3) {
      const followingActions = {};
      for (let i = 0; i < actionSequence.length - 2; i++) {
        if (
          actionSequence[i] === last2[0] &&
          actionSequence[i + 1] === last2[1] &&
          i + 2 < actionSequence.length
        ) {
          const next = actionSequence[i + 2];
          followingActions[next] = (followingActions[next] || 0) + 1;
        }
      }

      // Encontrar la acción más frecuente después del patrón
      let bestAction = null;
      let bestCount = 0;
      for (const [action, count] of Object.entries(followingActions)) {
        if (count > bestCount) {
          bestAction = action;
          bestCount = count;
        }
      }

      if (bestAction && bestCount >= 2) {
        const confidence = Math.min(1.0, bestCount / count2);
        return { predictedAction: bestAction, confidence };
      }
    }

    // Fallback: predecir la acción más frecuente
    const freq = {};
    for (const action of actionSequence) {
      freq[action] = (freq[action] || 0) + 1;
    }
    let mostCommon = null;
    let maxFreq = 0;
    for (const [action, count] of Object.entries(freq)) {
      if (count > maxFreq) {
        mostCommon = action;
        maxFreq = count;
      }
    }

    const ratio = maxFreq / actionSequence.length;
    if (ratio > 0.5) {
      return { predictedAction: mostCommon, confidence: ratio * 0.6 };
    }

    return { predictedAction: null, confidence: 0 };
  }

  /**
   * Calcula confianza base según cantidad de acciones registradas.
   * @param {number} totalActions
   * @returns {number} 0-1
   * @private
   */
  _calculateBaseConfidence(totalActions) {
    if (totalActions >= PATTERN_CONFIG.highConfidenceMinActions) {
      return 1.0;
    }
    if (totalActions >= PATTERN_CONFIG.mediumConfidenceMinActions) {
      return 0.7;
    }
    if (totalActions >= 5) {
      return 0.4;
    }
    return 0.1;
  }
}
