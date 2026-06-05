/**
 * StatisticsSystem.js
 * Registra todas las acciones del jugador durante un combate.
 * Se resetea al inicio de cada partida y genera un resumen al final.
 * Este resumen alimenta a PatternDetector y NemesisKnowledge.
 */

import { DIRECTIONS } from '../game/constants.js';
import ComboDetector from '../ai/ComboDetector.js';

export default class StatisticsSystem {
  constructor() {
    this.comboDetector = new ComboDetector();
    this.reset();
  }

  /**
   * Reinicia las estadísticas para una nueva partida.
   */
  reset() {
    this._startTime = Date.now();
    this._lastUpdateTime = Date.now();

    // Contadores de acciones del jugador
    this.quickAttacks = 0;
    this.specialAttacks = 0;
    this.blocks = 0;
    this.jumps = 0;
    this.dashes = 0;
    this.dashesOffensive = 0;
    this.dashesDefensive = 0;

    // Combos
    this.completedCombos = [];
    this.comboDetector.currentCombo = [];

    // Daño
    this.damageDealt = 0;
    this.damageReceived = 0;

    // Tiempo (en ms)
    this.timeMoving = 0;
    this.timeIdle = 0;

    // Dirección
    this.timeMovingLeft = 0;
    this.timeMovingRight = 0;

    // Estado del jugador (para tracking de tiempo)
    this._isMoving = false;
    this._movingDirection = DIRECTIONS.NONE;

    // Secuencia de acciones recientes (para predicción)
    this._actionHistory = [];
    this._maxHistoryLength = 50;
  }

  /**
   * Registra un ataque rápido del jugador.
   */
  recordQuickAttack() {
    this.quickAttacks++;
    this._pushAction('quick_attack');
  }

  /**
   * Registra un ataque especial del jugador.
   */
  recordSpecialAttack() {
    this.specialAttacks++;
    this._pushAction('special_attack');
  }

  /**
   * Registra un bloqueo del jugador.
   */
  recordBlock() {
    this.blocks++;
    this._pushAction('block');
  }

  /**
   * Registra un salto del jugador.
   */
  recordJump() {
    this.jumps++;
    this._pushAction('jump');
  }

  /**
   * Registra un dash del jugador.
   * @param {number} dirOverride - Dirección (-1 o 1)
   */
  recordDash(dirOverride) {
    this.dashes++;
    // Un simple heurístico para ofensivo/defensivo: si fue hacia atrás es defensivo
    if (dirOverride === -1) {
      this.dashesDefensive++;
    } else {
      this.dashesOffensive++;
    }
    this._pushAction('dash');
  }

  /**
   * Registra daño realizado por el jugador.
   * @param {number} amount 
   */
  recordDamageDealt(amount) {
    this.damageDealt += amount;
  }

  /**
   * Registra daño recibido por el jugador.
   * @param {number} amount 
   */
  recordDamageReceived(amount) {
    this.damageReceived += amount;
  }

  /**
   * Actualiza el tracking de movimiento. Llamar cada frame.
   * @param {boolean} isMoving - Si el jugador se está moviendo
   * @param {string} direction - 'left', 'right', o 'none'
   */
  updateMovement(isMoving, direction = DIRECTIONS.NONE) {
    const now = Date.now();
    const delta = now - this._lastUpdateTime;
    this._lastUpdateTime = now;

    if (isMoving) {
      this.timeMoving += delta;
      if (direction === DIRECTIONS.LEFT) {
        this.timeMovingLeft += delta;
      } else if (direction === DIRECTIONS.RIGHT) {
        this.timeMovingRight += delta;
      }
    } else {
      this.timeIdle += delta;
    }

    this._isMoving = isMoving;
    this._movingDirection = direction;
  }

  /**
   * Devuelve las últimas N acciones del jugador.
   * Útil para el sistema de predicción de Nemesis.
   * @param {number} count
   * @returns {string[]}
   */
  getRecentActions(count = 10) {
    return this._actionHistory.slice(-count);
  }

  /**
   * Genera el resumen de la partida. Se llama al terminar el combate.
   * @returns {object} Resumen estadístico
   */
  getMatchSummary() {
    // Forzar cierre de último combo
    const finalCombo = this.comboDetector.flushCombo();
    if (finalCombo) this.completedCombos.push(finalCombo);

    const totalActions = this.quickAttacks + this.specialAttacks + this.blocks + this.jumps + this.dashes;
    const matchDuration = (Date.now() - this._startTime) / 1000; // en segundos

    // Determinar dirección predominante
    let dominantDirection = DIRECTIONS.NONE;
    if (this.timeMovingLeft > this.timeMovingRight * 1.3) {
      dominantDirection = DIRECTIONS.LEFT;
    } else if (this.timeMovingRight > this.timeMovingLeft * 1.3) {
      dominantDirection = DIRECTIONS.RIGHT;
    }

    return {
      // Contadores absolutos
      quickAttacks: this.quickAttacks,
      specialAttacks: this.specialAttacks,
      blocks: this.blocks,
      jumps: this.jumps,
      dashes: this.dashes,
      damageDealt: this.damageDealt,
      damageReceived: this.damageReceived,

      // Tiempos (en segundos)
      timeMoving: this.timeMoving / 1000,
      timeIdle: this.timeIdle / 1000,
      matchDuration,

      // Proporciones (0-1), protegidas contra división por cero
      quickAttackRatio: totalActions > 0 ? this.quickAttacks / totalActions : 0,
      specialAttackRatio: totalActions > 0 ? this.specialAttacks / totalActions : 0,
      blockRatio: totalActions > 0 ? this.blocks / totalActions : 0,
      jumpRatio: totalActions > 0 ? this.jumps / totalActions : 0,

      // Dirección
      dominantDirection,

      // Totales
      totalActions,

      // Historial de acciones (para predicción)
      actionSequence: [...this._actionHistory],
      
      // Combos detectados
      detectedCombos: [...this.completedCombos],
    };
  }

  /**
   * Acumula los datos de esta partida en las estadísticas globales del jugador.
   * @param {object} playerStats - Estadísticas globales acumuladas
   * @param {string} result - Resultado del combate (de COMBAT_RESULTS)
   * @returns {object} playerStats actualizado
   */
  accumulateToPlayerStats(playerStats, result) {
    const summary = this.getMatchSummary();

    playerStats.totalMatches++;
    playerStats.totalQuickAttacks += summary.quickAttacks;
    playerStats.totalSpecialAttacks += summary.specialAttacks;
    playerStats.totalBlocks += summary.blocks;
    playerStats.totalJumps += summary.jumps;
    playerStats.totalDashes += summary.dashes;
    playerStats.dashesOffensive += this.dashesOffensive;
    playerStats.dashesDefensive += this.dashesDefensive;
    playerStats.totalDamageDealt += summary.damageDealt;
    playerStats.totalDamageReceived += summary.damageReceived;
    playerStats.totalTimeMoving += summary.timeMoving;
    playerStats.totalTimeIdle += summary.timeIdle;

    if (result === 'player_win') {
      playerStats.wins++;
    } else if (result === 'nemesis_win') {
      playerStats.losses++;
    } else if (result === 'surrender') {
      playerStats.surrenders++;
    }

    return playerStats;
  }

  /**
   * Agrega una acción al historial interno y evalúa combos.
   * @param {string} action
   * @private
   */
  _pushAction(action) {
    this._actionHistory.push(action);
    if (this._actionHistory.length > this._maxHistoryLength) {
      this._actionHistory.shift();
    }
    
    // Evaluar combo
    const combo = this.comboDetector.recordAction(action, Date.now());
    if (combo) {
      this.completedCombos.push(combo);
    }
  }
}
