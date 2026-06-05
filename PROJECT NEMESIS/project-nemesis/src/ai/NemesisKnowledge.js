/**
 * NemesisKnowledge.js
 * Conocimiento activo (memoria de trabajo) de Nemesis.
 *
 * A diferencia de NemesisMemory (historial de eventos),
 * NemesisKnowledge contiene las **conclusiones actuales** que Nemesis
 * tiene sobre el jugador: métricas interpretadas que se usan
 * directamente para tomar decisiones en NemesisBrain.
 *
 * Se actualiza al fin de cada partida usando suavizado exponencial
 * para no sobrereaccionar a una sola partida.
 *
 * También se actualiza en tiempo real durante el combate
 * (cuando el nivel de predicción está desbloqueado).
 */

import { PATTERN_CONFIG } from '../game/config.js';
import { DIRECTIONS } from '../game/constants.js';

export default class NemesisKnowledge {
  /**
   * @param {object} knowledgeData - Datos cargados desde SaveManager
   */
  constructor(knowledgeData = null) {
    this.frontAttackSpam = knowledgeData?.frontAttackSpam || 0.0;
    this.specialAttackDependence = knowledgeData?.specialAttackDependence || 0.0;
    this.jumpFrequency = knowledgeData?.jumpFrequency || 0.0;
    this.defensiveTendency = knowledgeData?.defensiveTendency || 0.0;
    this.dominantDirection = knowledgeData?.dominantDirection || DIRECTIONS.NONE;
    this.predictedNextAction = knowledgeData?.predictedNextAction || null;
    this.confidenceLevel = knowledgeData?.confidenceLevel || 0.0;
  }

  /**
   * Actualiza el conocimiento con los datos de una nueva partida.
   * Usa suavizado exponencial: new = old × (1-α) + observation × α
   * Esto evita que una sola partida atípica distorsione todo el conocimiento.
   *
   * @param {object} matchSummary - Resumen del StatisticsSystem
   * @param {Array<object>} patterns - Patrones detectados por PatternDetector
   */
  updateFromMatch(matchSummary, patterns) {
    const alpha = PATTERN_CONFIG.knowledgeSmoothingAlpha;

    // Actualizar métricas con suavizado exponencial
    this.frontAttackSpam = this._lerp(
      this.frontAttackSpam,
      matchSummary.quickAttackRatio,
      alpha
    );

    this.specialAttackDependence = this._lerp(
      this.specialAttackDependence,
      matchSummary.specialAttackRatio,
      alpha
    );

    this.jumpFrequency = this._lerp(
      this.jumpFrequency,
      matchSummary.jumpRatio,
      alpha
    );

    this.defensiveTendency = this._lerp(
      this.defensiveTendency,
      matchSummary.blockRatio,
      alpha
    );

    // Dirección dominante (actualizar si hay evidencia fuerte)
    if (matchSummary.dominantDirection !== DIRECTIONS.NONE) {
      this.dominantDirection = matchSummary.dominantDirection;
    }

    // Confianza basada en cantidad de datos acumulados
    // Cada partida incrementa la confianza gradualmente
    this.confidenceLevel = Math.min(1.0, this.confidenceLevel + 0.15);

    // Limpiar predicción entre partidas (se actualiza en tiempo real)
    this.predictedNextAction = null;
  }

  /**
   * Actualiza la predicción de próxima acción durante el combate.
   * Solo se usa cuando el nivel de predicción está desbloqueado (55%+).
   *
   * @param {string|null} action - Acción predicha
   * @param {number} confidence - Confianza de la predicción (0-1)
   */
  updatePrediction(action, confidence) {
    this.predictedNextAction = action;
    // No actualizar confidenceLevel general, solo la predicción puntual
  }

  /**
   * Devuelve la amenaza principal del jugador.
   * Útil para que NemesisBrain priorice su estrategia.
   * @returns {{ threat: string, value: number }}
   */
  getPrimaryThreat() {
    const threats = [
      { threat: 'front_attack', value: this.frontAttackSpam },
      { threat: 'special_attack', value: this.specialAttackDependence },
      { threat: 'jumping', value: this.jumpFrequency },
      { threat: 'defensive', value: this.defensiveTendency },
    ];

    // Ordenar por valor descendente
    threats.sort((a, b) => b.value - a.value);
    return threats[0];
  }

  /**
   * Devuelve un resumen legible del conocimiento actual.
   * Útil para la pantalla de análisis.
   * @returns {Array<{ label: string, value: number, description: string }>}
   */
  getSummary() {
    const summary = [];

    if (this.frontAttackSpam > 0.1) {
      summary.push({
        label: 'Ataques frontales',
        value: this.frontAttackSpam,
        description: this._describeLevel(this.frontAttackSpam),
      });
    }

    if (this.specialAttackDependence > 0.1) {
      summary.push({
        label: 'Dependencia de especial',
        value: this.specialAttackDependence,
        description: this._describeLevel(this.specialAttackDependence),
      });
    }

    if (this.jumpFrequency > 0.1) {
      summary.push({
        label: 'Frecuencia de salto',
        value: this.jumpFrequency,
        description: this._describeLevel(this.jumpFrequency),
      });
    }

    if (this.defensiveTendency > 0.1) {
      summary.push({
        label: 'Tendencia defensiva',
        value: this.defensiveTendency,
        description: this._describeLevel(this.defensiveTendency),
      });
    }

    return summary;
  }

  /**
   * Serializa para persistencia.
   * @returns {object}
   */
  serialize() {
    return {
      frontAttackSpam: this.frontAttackSpam,
      specialAttackDependence: this.specialAttackDependence,
      jumpFrequency: this.jumpFrequency,
      defensiveTendency: this.defensiveTendency,
      dominantDirection: this.dominantDirection,
      predictedNextAction: this.predictedNextAction,
      confidenceLevel: this.confidenceLevel,
    };
  }

  /**
   * Interpolación lineal (suavizado exponencial).
   * @param {number} current
   * @param {number} target
   * @param {number} alpha - Peso de la nueva observación (0-1)
   * @returns {number}
   * @private
   */
  _lerp(current, target, alpha) {
    return current * (1 - alpha) + target * alpha;
  }

  /**
   * Describe un nivel numérico en texto legible.
   * @param {number} value - 0-1
   * @returns {string}
   * @private
   */
  _describeLevel(value) {
    if (value >= 0.8) return 'Muy alto';
    if (value >= 0.6) return 'Alto';
    if (value >= 0.4) return 'Moderado';
    if (value >= 0.2) return 'Bajo';
    return 'Mínimo';
  }
}
