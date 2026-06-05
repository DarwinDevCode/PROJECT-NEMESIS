/**
 * defaultState.js
 * Estado inicial limpio para todas las estructuras de datos del juego.
 * Se usa al crear una nueva simulación o cuando no existe guardado previo.
 */

import { PLAYER_PROFILES, NEMESIS_PROFILES, SAVE_VERSION } from '../game/constants.js';

/**
 * Crea un objeto de estadísticas del jugador con valores iniciales.
 */
export function createDefaultPlayerStats() {
  return {
    totalMatches: 0,
    wins: 0,
    losses: 0,
    surrenders: 0,
    totalQuickAttacks: 0,
    totalSpecialAttacks: 0,
    totalBlocks: 0,
    totalJumps: 0,
    totalDashes: 0,
    dashesOffensive: 0,
    dashesDefensive: 0,
    dashSuccessRate: 0,
    totalDamageDealt: 0,
    totalDamageReceived: 0,
    totalTimeMoving: 0,
    totalTimeIdle: 0,
    detectedProfile: PLAYER_PROFILES.UNKNOWN,
  };
}

/**
 * Crea el estado inicial de Nemesis.
 */
export function createDefaultNemesisState() {
  return {
    experience: 0,
    currentLevel: 1,
    activeAdaptation: 0,
    berserkActivations: 0,
    skills: {
      block: false,
      counterattack: false,
      dodge: false,
      prediction: false,
      nemesisMode: false,
    },
  };
}

/**
 * Crea el conocimiento activo inicial de Nemesis.
 */
export function createDefaultNemesisKnowledge() {
  return {
    frontAttackSpam: 0.0,
    specialAttackDependence: 0.0,
    jumpFrequency: 0.0,
    defensiveTendency: 0.0,
    dominantDirection: 'none',
    predictedNextAction: null,
    confidenceLevel: 0.0,
  };
}

/**
 * Crea la memoria de combos inicial de Nemesis.
 */
export function createDefaultNemesisComboMemory() {
  return {
    combos: [],
  };
}

/**
 * Crea la memoria histórica inicial de Nemesis.
 */
export function createDefaultNemesisMemory() {
  return {
    events: [],
  };
}

/**
 * Crea el perfil estratégico inicial de Nemesis.
 */
export function createDefaultNemesisProfile() {
  return {
    currentProfile: NEMESIS_PROFILES.AGGRESSIVE,
    specializationBias: null,
    weights: {
      attackFrequency: 0.7,
      blockFrequency: 0.2,
      counterFrequency: 0.0,
      dodgeFrequency: 0.0,
    },
    profileHistory: [],
  };
}

/**
 * Crea el estado inicial del regulador de frustración.
 */
export function createDefaultFrustrationState() {
  return {
    consecutiveLosses: 0,
    intensityMultiplier: 1.0,
  };
}

/**
 * Crea el estado completo de guardado con todos los subsistemas.
 */
export function createDefaultSaveData() {
  return {
    version: SAVE_VERSION,
    settings: {
      audio: {
        masterVolume: 1.0,
        musicVolume: 0.8,
        effectsVolume: 0.8,
        muted: false,
      },
      controls: {
        customBindings: false,
      },
      visuals: {
        playerSkin: 'default',
        nemesisSkin: 'default',
      }
    },
    playerStats: createDefaultPlayerStats(),
    nemesisState: createDefaultNemesisState(),
    nemesisKnowledge: createDefaultNemesisKnowledge(),
    nemesisComboMemory: createDefaultNemesisComboMemory(),
    nemesisMemory: createDefaultNemesisMemory(),
    nemesisProfile: createDefaultNemesisProfile(),
    frustration: createDefaultFrustrationState(),
    matchHistory: [],
  };
}
