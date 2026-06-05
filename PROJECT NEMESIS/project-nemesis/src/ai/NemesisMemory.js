/**
 * NemesisMemory.js
 * Memoria episódica de Nemesis.
 * Registra eventos históricos inmutables: aprendizaje, patrones detectados,
 * desbloqueos de habilidades y cambios de perfil.
 *
 * Diferencia clave con NemesisKnowledge:
 *   Memory  = "qué pasó" (historial, nunca se borra excepto al resetear)
 *   Knowledge = "qué sabe ahora" (estado actual, se actualiza cada partida)
 *
 * Proporciona los datos para:
 *   - NemesisStatsScene (pantalla de estadísticas)
 *   - Registro Histórico de Aprendizaje (timeline)
 */

import { MEMORY_EVENT_TYPES, SKILL_NAMES } from '../game/constants.js';

export default class NemesisMemory {
  /**
   * @param {object} memoryData - Datos cargados desde SaveManager (nemesisMemory)
   */
  constructor(memoryData = null) {
    this.events = memoryData?.events || [];
  }

  /**
   * Registra un evento de aprendizaje genérico.
   * @param {number} matchNumber - Número de partida
   * @param {string} description - Descripción legible del evento
   * @param {number} adaptationLevel - Nivel de adaptación al momento del evento
   */
  recordLearning(matchNumber, description, adaptationLevel) {
    this.events.push({
      match: matchNumber,
      type: MEMORY_EVENT_TYPES.LEARNING,
      event: description,
      adaptation: Math.round(adaptationLevel),
      timestamp: Date.now(),
    });
  }

  /**
   * Registra un patrón detectado con alta confianza.
   * @param {number} matchNumber
   * @param {string} patternDescription
   * @param {number} confidence - 0-1
   */
  recordPattern(matchNumber, patternDescription, confidence) {
    this.events.push({
      match: matchNumber,
      type: MEMORY_EVENT_TYPES.PATTERN,
      event: `Detecté patrón: ${patternDescription}`,
      confidence: Math.round(confidence * 100),
      timestamp: Date.now(),
    });
  }

  /**
   * Registra el desbloqueo de una nueva habilidad.
   * @param {number} matchNumber
   * @param {string} skillKey - Clave de la habilidad (de NEMESIS_SKILLS)
   * @param {number} adaptationLevel
   */
  recordSkillUnlock(matchNumber, skillKey, adaptationLevel) {
    const skillName = SKILL_NAMES[skillKey] || skillKey;
    this.events.push({
      match: matchNumber,
      type: MEMORY_EVENT_TYPES.SKILL_UNLOCK,
      event: `Aprendí a ${skillName.toLowerCase()}`,
      skill: skillKey,
      adaptation: Math.round(adaptationLevel),
      timestamp: Date.now(),
    });
  }

  /**
   * Registra un resumen de partida.
   * @param {number} matchNumber
   * @param {string} result - Resultado del combate
   * @param {string} playerProfile - Perfil detectado del jugador
   */
  recordMatch(matchNumber, result, playerProfile) {
    const resultText = {
      player_win: 'Fui derrotado',
      nemesis_win: 'Logré vencer',
      surrender: 'El jugador se rindió',
    };

    this.events.push({
      match: matchNumber,
      type: MEMORY_EVENT_TYPES.MATCH,
      event: resultText[result] || result,
      playerProfile,
      timestamp: Date.now(),
    });
  }

  /**
   * Registra un cambio en el perfil estratégico de Nemesis.
   * @param {number} matchNumber
   * @param {string} oldProfile
   * @param {string} newProfile
   */
  recordProfileChange(matchNumber, oldProfile, newProfile) {
    this.events.push({
      match: matchNumber,
      type: MEMORY_EVENT_TYPES.PROFILE_CHANGE,
      event: `Cambié mi estrategia de ${oldProfile} a ${newProfile}`,
      oldProfile,
      newProfile,
      timestamp: Date.now(),
    });
  }

  /**
   * Obtiene todos los eventos de desbloqueo de habilidades.
   * @returns {Array<object>}
   */
  getSkillUnlocks() {
    return this.events.filter(e => e.type === MEMORY_EVENT_TYPES.SKILL_UNLOCK);
  }

  /**
   * Obtiene todos los patrones detectados.
   * @returns {Array<object>}
   */
  getDetectedPatterns() {
    return this.events.filter(e => e.type === MEMORY_EVENT_TYPES.PATTERN);
  }

  /**
   * Obtiene los últimos N eventos para mostrar en la UI.
   * @param {number} count
   * @returns {Array<object>}
   */
  getRecentEvents(count = 10) {
    return this.events.slice(-count);
  }

  /**
   * Obtiene el total de partidas registradas.
   * @returns {number}
   */
  getTotalMatchesRecorded() {
    return this.events.filter(e => e.type === MEMORY_EVENT_TYPES.MATCH).length;
  }

  /**
   * Serializa la memoria para persistencia.
   * @returns {object}
   */
  serialize() {
    return {
      events: [...this.events],
    };
  }
}
