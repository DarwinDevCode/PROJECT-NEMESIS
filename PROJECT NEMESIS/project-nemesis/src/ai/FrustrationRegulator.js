/**
 * FrustrationRegulator.js
 * Sistema de balance dinámico que previene la frustración del jugador.
 *
 * Filosofía (Opción B):
 *   Nemesis SABE pero ELIGE CONTENERSE.
 *   - La experiencia NUNCA disminuye
 *   - Las habilidades NUNCA se bloquean
 *   - Solo se reducen las PROBABILIDADES de usar habilidades avanzadas
 *
 * Efecto percibido:
 *   Nemesis "comete más errores" — no bloquea todos los ataques,
 *   no siempre contraataca, falla algunas esquivas.
 *   Se siente natural, no como una reducción artificial.
 *
 * Escalas:
 *   0 derrotas consecutivas → multiplicador 1.0 (normal)
 *   2 derrotas consecutivas → multiplicador 0.7
 *   3 derrotas consecutivas → multiplicador 0.5
 *   4+ derrotas consecutivas → multiplicador 0.35
 *
 * Recuperación:
 *   Cada victoria del jugador sube el multiplicador en 0.15
 *   hasta volver a 1.0
 */

import { FRUSTRATION_CONFIG } from '../game/config.js';
import { COMBAT_RESULTS } from '../game/constants.js';

export default class FrustrationRegulator {
  /**
   * @param {object} frustrationData - Datos cargados desde SaveManager
   */
  constructor(frustrationData = null) {
    this.consecutiveLosses = frustrationData?.consecutiveLosses || 0;
    this.intensityMultiplier = frustrationData?.intensityMultiplier
      ?? FRUSTRATION_CONFIG.defaultMultiplier;
  }

  /**
   * Procesa el resultado de una partida y ajusta el multiplicador.
   * @param {string} result - Resultado del combate (de COMBAT_RESULTS)
   * @returns {{ multiplier: number, consecutiveLosses: number, adjusted: boolean }}
   */
  processMatchResult(result) {
    const previousMultiplier = this.intensityMultiplier;

    if (result === COMBAT_RESULTS.NEMESIS_WIN) {
      // El jugador perdió → incrementar frustración
      this.consecutiveLosses++;
      this._recalculateMultiplier();
    } else {
      // El jugador ganó o se rindió → recuperar
      if (result === COMBAT_RESULTS.PLAYER_WIN) {
        this.consecutiveLosses = 0;
        // Recuperar gradualmente
        this.intensityMultiplier = Math.min(
          FRUSTRATION_CONFIG.defaultMultiplier,
          this.intensityMultiplier + FRUSTRATION_CONFIG.recoveryRate
        );
      } else if (result === COMBAT_RESULTS.SURRENDER) {
        // La rendición no resetea las derrotas consecutivas,
        // pero no cuenta como derrota tampoco
        // El multiplicador se mantiene
      }
    }

    return {
      multiplier: this.intensityMultiplier,
      consecutiveLosses: this.consecutiveLosses,
      adjusted: this.intensityMultiplier !== previousMultiplier,
    };
  }

  /**
   * Obtiene el multiplicador de intensidad actual.
   * Aplicar a las probabilidades de acción del NemesisBrain.
   * @returns {number} 0.35-1.0
   */
  getMultiplier() {
    return this.intensityMultiplier;
  }

  /**
   * Verifica si el regulador está activo (reduciendo intensidad).
   * @returns {boolean}
   */
  isActive() {
    return this.intensityMultiplier < FRUSTRATION_CONFIG.defaultMultiplier;
  }

  /**
   * Devuelve información sobre el estado actual para depuración o UI.
   * @returns {object}
   */
  getStatus() {
    return {
      consecutiveLosses: this.consecutiveLosses,
      intensityMultiplier: this.intensityMultiplier,
      isActive: this.isActive(),
      description: this.isActive()
        ? `Nemesis se contiene (${Math.round(this.intensityMultiplier * 100)}% intensidad)`
        : 'Nemesis al máximo rendimiento',
    };
  }

  /**
   * Recalcula el multiplicador basado en las derrotas consecutivas.
   * @private
   */
  _recalculateMultiplier() {
    const thresholds = FRUSTRATION_CONFIG.thresholds;

    // Aplicar el umbral más alto que aplique
    // Los umbrales están ordenados de menor a mayor en losses
    let newMultiplier = FRUSTRATION_CONFIG.defaultMultiplier;

    for (const threshold of thresholds) {
      if (this.consecutiveLosses >= threshold.losses) {
        newMultiplier = threshold.multiplier;
      }
    }

    this.intensityMultiplier = newMultiplier;
  }

  /**
   * Serializa para persistencia.
   * @returns {object}
   */
  serialize() {
    return {
      consecutiveLosses: this.consecutiveLosses,
      intensityMultiplier: this.intensityMultiplier,
    };
  }
}
