/**
 * schema.js
 * Validación básica de datos guardados.
 * Verifica que la estructura cargada desde LocalStorage sea compatible
 * con la versión actual del juego. Si hay incompatibilidad, se puede
 * migrar o resetear de forma segura.
 */

import { SAVE_VERSION } from '../game/constants.js';
import { createDefaultSaveData } from './defaultState.js';

/**
 * Verifica que un objeto de guardado tenga la estructura mínima requerida.
 * No valida tipos profundos — solo existencia de las claves principales.
 * @param {object} data - Datos cargados desde LocalStorage
 * @returns {{ valid: boolean, reason: string|null }}
 */
export function validateSaveData(data) {
  if (!data || typeof data !== 'object') {
    return { valid: false, reason: 'Datos nulos o no son un objeto' };
  }

  if (!data.version) {
    return { valid: false, reason: 'Falta versión de datos' };
  }

  if (data.version !== SAVE_VERSION) {
    return { valid: false, reason: `Versión incompatible: ${data.version} (esperada: ${SAVE_VERSION})` };
  }

  const requiredKeys = [
    'settings',
    'playerStats',
    'nemesisComboMemory',
    'nemesisState',
    'nemesisKnowledge',
    'nemesisMemory',
    'nemesisProfile',
    'frustration',
    'matchHistory',
  ];

  for (const key of requiredKeys) {
    if (!(key in data)) {
      return { valid: false, reason: `Falta clave requerida: ${key}` };
    }
  }

  // Validar sub-estructuras críticas
  if (!data.settings.audio || !data.settings.controls || !data.settings.visuals) {
    return { valid: false, reason: 'settings inválido' };
  }

  if (typeof data.playerStats.totalMatches !== 'number') {
    return { valid: false, reason: 'playerStats.totalMatches inválido' };
  }

  if (typeof data.nemesisState.experience !== 'number') {
    return { valid: false, reason: 'nemesisState.experience inválido' };
  }

  if (!data.nemesisState.skills || typeof data.nemesisState.skills !== 'object') {
    return { valid: false, reason: 'nemesisState.skills inválido' };
  }

  if (!Array.isArray(data.nemesisMemory.events)) {
    return { valid: false, reason: 'nemesisMemory.events no es un arreglo' };
  }

  if (!Array.isArray(data.matchHistory)) {
    return { valid: false, reason: 'matchHistory no es un arreglo' };
  }

  return { valid: true, reason: null };
}

/**
 * Intenta reparar datos parcialmente corruptos mezclándolos con los defaults.
 * Útil cuando se agregan nuevos campos en actualizaciones.
 * @param {object} data - Datos potencialmente incompletos
 * @returns {object} Datos reparados con defaults aplicados
 */
export function repairSaveData(data) {
  const defaults = createDefaultSaveData();

  return {
    version: SAVE_VERSION,
    playerStats: { ...defaults.playerStats, ...(data.playerStats || {}) },
    nemesisState: {
      ...defaults.nemesisState,
      ...(data.nemesisState || {}),
      skills: {
        ...defaults.nemesisState.skills,
        ...((data.nemesisState && data.nemesisState.skills) || {}),
      },
    },
    nemesisKnowledge: { ...defaults.nemesisKnowledge, ...(data.nemesisKnowledge || {}) },
    nemesisMemory: {
      events: Array.isArray(data.nemesisMemory?.events) ? data.nemesisMemory.events : [],
    },
    nemesisProfile: {
      ...defaults.nemesisProfile,
      ...(data.nemesisProfile || {}),
      weights: {
        ...defaults.nemesisProfile.weights,
        ...((data.nemesisProfile && data.nemesisProfile.weights) || {}),
      },
      profileHistory: Array.isArray(data.nemesisProfile?.profileHistory)
        ? data.nemesisProfile.profileHistory
        : [],
    },
    frustration: { ...defaults.frustration, ...(data.frustration || {}) },
    matchHistory: Array.isArray(data.matchHistory) ? data.matchHistory : [],
  };
}
