/**
 * NemesisProfile.js
 * Perfil estratégico propio de Nemesis.
 *
 * Define CÓMO se comporta Nemesis actualmente (no qué sabe del jugador).
 * El perfil evoluciona en respuesta a los patrones del jugador:
 *   - Si el jugador es agresivo → Nemesis tiende a DEFENSIVO
 *   - Si el jugador es defensivo → Nemesis tiende a AGRESIVO
 *   - Si el jugador es estratégico → Nemesis tiende a ADAPTATIVO
 *   - A partir de 75%+ experiencia → siempre ADAPTATIVO
 *
 * Los pesos del perfil influyen en las decisiones del NemesisBrain.
 */

import { PLAYER_PROFILES, NEMESIS_PROFILES } from '../game/constants.js';

export default class NemesisProfile {
  /**
   * @param {object} profileData - Datos cargados desde SaveManager
   */
  constructor(profileData = null) {
    this.currentProfile = profileData?.currentProfile || NEMESIS_PROFILES.AGGRESSIVE;
    this.specializationBias = profileData?.specializationBias || null; // 'HUNTER' o 'DEFENDER'
    this.weights = profileData?.weights || {
      attackFrequency: 0.7,
      blockFrequency: 0.2,
      counterFrequency: 0.0,
      dodgeFrequency: 0.0,
    };
    this.profileHistory = profileData?.profileHistory || [];
  }

  /**
   * Evoluciona el perfil basándose en el perfil detectado del jugador
   * y en las maestrías de Nemesis.
   *
   * @param {string} playerProfile - Perfil del jugador (de PLAYER_PROFILES)
   * @param {object} masteries - Maestrías de Nemesis
   * @param {number} experience - Experiencia acumulada (0-100)
   * @param {number} matchNumber - Número de partida (para historial)
   * @returns {{ changed: boolean, oldProfile: string, newProfile: string }}
   */
  evolve(playerProfile, masteries, experience, matchNumber) {
    const oldProfile = this.currentProfile;

    // Modo Nemesis (75%+) → siempre ADAPTATIVO
    if (experience >= 75) {
      this.currentProfile = NEMESIS_PROFILES.ADAPTIVE;
      this._adjustWeightsForProfile(NEMESIS_PROFILES.ADAPTIVE, masteries);
    }
    // Contraestratégico: responder al estilo del jugador
    else {
      const newProfile = this._selectCounterProfile(playerProfile, masteries, matchNumber);
      this.currentProfile = newProfile;
      this._adjustWeightsForProfile(newProfile, masteries);
    }

    const changed = oldProfile !== this.currentProfile;

    if (changed) {
      this.profileHistory.push({
        match: matchNumber,
        profile: this.currentProfile,
      });
    }

    return { changed, oldProfile, newProfile: this.currentProfile };
  }

  /**
   * Selecciona un perfil que contrarreste el estilo del jugador.
   * @param {string} playerProfile
   * @param {object} masteries
   * @param {number} matchNumber
   * @returns {string}
   * @private
   */
  _selectCounterProfile(playerProfile, masteries, matchNumber) {
    // Determinar la nueva base estratégica
    let newProfile = this.currentProfile;

    if (playerProfile === PLAYER_PROFILES.AGGRESSIVE) {
      newProfile = NEMESIS_PROFILES.DEFENSIVE;
      if (!this.specializationBias && matchNumber >= 5) {
        this.specializationBias = 'DEFENDER'; // Tiende a defenderse de jugadores agresivos
      }
    } else if (playerProfile === PLAYER_PROFILES.DEFENSIVE || playerProfile === PLAYER_PROFILES.EVASIVE) {
      newProfile = NEMESIS_PROFILES.AGGRESSIVE;
      if (!this.specializationBias && matchNumber >= 5) {
        this.specializationBias = 'HUNTER'; // Tiende a cazar a jugadores pasivos
      }
    } else if (playerProfile === PLAYER_PROFILES.TACTICAL) {
      newProfile = NEMESIS_PROFILES.BALANCED;
    } else {
      // Caso por defecto para otros perfiles
      newProfile = (masteries.dashMastery > 0.1) ? NEMESIS_PROFILES.ADAPTIVE : NEMESIS_PROFILES.BALANCED;
    }

    return newProfile;
  }

  /**
   * Ajusta los pesos del perfil según el perfil seleccionado
   * y las maestrías disponibles.
   * @param {string} profile
   * @param {object} masteries
   * @private
   */
  _adjustWeightsForProfile(profile, masteries) {
    switch (profile) {
      case NEMESIS_PROFILES.AGGRESSIVE:
        this.weights = {
          attackFrequency: 0.7,
          blockFrequency: 0.15,
          counterFrequency: 0.1,
          dodgeFrequency: 0.05,
        };
        break;

      case NEMESIS_PROFILES.DEFENSIVE:
        this.weights = {
          attackFrequency: 0.25,
          blockFrequency: 0.45,
          counterFrequency: 0.25,
          dodgeFrequency: 0.05,
        };
        break;

      case NEMESIS_PROFILES.BALANCED:
        this.weights = {
          attackFrequency: 0.4,
          blockFrequency: 0.25,
          counterFrequency: 0.2,
          dodgeFrequency: 0.15,
        };
        break;

      case NEMESIS_PROFILES.ADAPTIVE:
        // En modo adaptativo, todos los pesos son moderados
        // y se ajustan dinámicamente en NemesisBrain
        this.weights = {
          attackFrequency: 0.35,
          blockFrequency: 0.25,
          counterFrequency: 0.20,
          dodgeFrequency: 0.20,
        };
        break;
    }
  }

  /**
   * Serializa el perfil para persistencia.
   * @returns {object}
   */
  serialize() {
    return {
      currentProfile: this.currentProfile,
      specializationBias: this.specializationBias,
      weights: { ...this.weights },
      profileHistory: [...this.profileHistory],
    };
  }
}
