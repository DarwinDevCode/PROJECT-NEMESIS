import { NEMESIS_ACTIONS, FIGHTER_STATES } from '../game/constants.js';
import { BRAIN_CONFIG } from '../game/config.js';

export default class NemesisBrain {
  constructor({ adaptationSystem, knowledge, profile, frustrationRegulator, patternDetector, adaptiveMomentum }) {
    // Keep constructor signature to avoid breaking instantiation, though we only use distance for now
    this._lastDecision = NEMESIS_ACTIONS.IDLE;
    this._lastDecisionTime = 0;
    this._cooldowns = {
      energy_pulse: 0,
      orbital_strike: 0,
      attack: 0
    };
  }

  updateContinuousLogic(gameState) {
    const { delta } = gameState;
    // Tick down cooldowns
    for (const key in this._cooldowns) {
      if (this._cooldowns[key] > 0) {
        this._cooldowns[key] -= delta;
      }
    }
  }

  decide(gameState) {
    const { nemesis, player, time } = gameState;

    // Respetar intervalo de decisión (no cambiar de opinión cada frame)
    if (time - this._lastDecisionTime < BRAIN_CONFIG.decisionInterval) {
      return this._lastDecision;
    }

    // No decidir otras acciones si Nemesis está en estado no-interruptible
    if (nemesis.state === FIGHTER_STATES.HURT || nemesis.state === FIGHTER_STATES.DEAD) {
      return NEMESIS_ACTIONS.IDLE;
    }

    // Si está en medio de un ataque, no interrumpir
    if (
      nemesis.state === FIGHTER_STATES.ATTACKING ||
      nemesis.state === FIGHTER_STATES.SPECIAL_ATTACKING
    ) {
      return this._lastDecision;
    }

    // Calcular distancia
    const distance = Math.abs(nemesis.x - player.x);
    let nextAction = NEMESIS_ACTIONS.IDLE;

    // Lógica pura basada en distancia
    if (distance < 180) {
      // Close Range: Attack, Block, Energy Pulse
      // 40% de probabilidad de usar Energy Pulse si está listo (no lo espamea de inmediato)
      if (this._cooldowns.energy_pulse <= 0 && Math.random() < 0.4) {
        nextAction = NEMESIS_ACTIONS.ENERGY_PULSE; 
        this._cooldowns.energy_pulse = 9600; // Aumentado en 20%
      } else if (player.state === FIGHTER_STATES.ATTACKING && Math.random() < 0.5) {
        nextAction = NEMESIS_ACTIONS.BLOCK;
      } else if (this._cooldowns.attack <= 0) {
        nextAction = NEMESIS_ACTIONS.ATTACK_QUICK; // Mapped to standard attack
        this._cooldowns.attack = 800;
      } else {
        nextAction = NEMESIS_ACTIONS.IDLE;
      }
    } else if (distance >= 180 && distance < 300) {
      // Medium Range: Walk, Jump, Attack
      if (this._cooldowns.attack <= 0 && distance < 220) {
        nextAction = NEMESIS_ACTIONS.ATTACK_QUICK;
        this._cooldowns.attack = 800;
      } else if (Math.random() < 0.3) {
        nextAction = NEMESIS_ACTIONS.JUMP;
      } else {
        // Acercarse caminando
        nextAction = NEMESIS_ACTIONS.MOVE_TOWARDS;
      }
    } else {
      // Long Range: Orbital Strike
      // 50% de probabilidad de usar Orbital Strike si está listo
      if (this._cooldowns.orbital_strike <= 0 && Math.random() < 0.5) {
        nextAction = NEMESIS_ACTIONS.ORBITAL_STRIKE; 
        this._cooldowns.orbital_strike = 12000; // Aumentado en 20%
      } else {
        // Si el orbital está en cooldown o falló el check de probabilidad, acercarse
        nextAction = NEMESIS_ACTIONS.MOVE_TOWARDS;
      }
    }

    this._lastDecision = nextAction;
    this._lastDecisionTime = time;

    return nextAction;
  }

  forceReaction(actionType) {
    this._lastDecision = actionType;
    this._lastDecisionTime = Date.now();
  }

  setMemory(memory) {}
  setComboMemory(comboMemory) {}

  /**
   * Required for game loop compatibility
   */
  processEndOfMatch(result, matchSummary, matchNumber) {
    return {
      playerProfile: 'UNKNOWN',
      experienceGain: 0,
      totalExperience: 0
    };
  }
}
