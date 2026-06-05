/**
 * Player.js
 * Entidad del jugador — extiende Fighter con manejo de input.
 *
 * Controles:
 *   A / ← : Mover izquierda
 *   D / → : Mover derecha
 *   W / Espacio : Saltar
 *   J : Ataque rápido
 *   K : Ataque especial
 *   L : Bloquear (mantener)
 *
 * Reporta todas las acciones al StatisticsSystem para que
 * Nemesis pueda analizar el comportamiento del jugador.
 */

import Fighter from './Fighter.js';
import { DIRECTIONS } from '../game/constants.js';
import Phaser from 'phaser';
import AudioManager from '../systems/AudioManager.js';
import { AUDIO_KEYS } from '../game/audioConfig.js';
import { CHARACTER_SYSTEM_CONFIG } from '../game/characterSystemConfig.js';
import CharacterFactory from '../systems/core/CharacterFactory.js';
import { PlayerData } from '../data/characters/PlayerData.js';

export default class Player extends Fighter {
  /**
   * @param {Phaser.Scene} scene
   * @param {number} x
   * @param {number} y
   * @param {import('../systems/StatisticsSystem.js').default} statisticsSystem
   */
  constructor(scene, x, y, statisticsSystem) {
    super(scene, x, y, 'player');

    this.stats = statisticsSystem;

    // ─── Configurar teclas ────────────────────────────────
    this.keys = {
      left: scene.input.keyboard.addKey('A'),
      right: scene.input.keyboard.addKey('D'),
      arrowLeft: scene.input.keyboard.addKey('LEFT'),
      arrowRight: scene.input.keyboard.addKey('RIGHT'),
      jump: scene.input.keyboard.addKey('W'),
      jumpSpace: scene.input.keyboard.addKey('SPACE'),
      quickAttack: scene.input.keyboard.addKey('J'),
      specialAttack: scene.input.keyboard.addKey('K'),
      block: scene.input.keyboard.addKey('L'),
      dash: scene.input.keyboard.addKey('I'),
      dashShift: scene.input.keyboard.addKey('SHIFT'),
    };

    // Prevenir propagación de teclas al navegador
    scene.input.keyboard.addCapture([
      'W', 'A', 'S', 'D', 'J', 'K', 'L', 'I',
      'SPACE', 'LEFT', 'RIGHT', 'UP', 'DOWN', 'SHIFT'
    ]);

    // Dirección inicial: mirando a la derecha
    this.facingRight = true;

    // ─── Hook para Jump Buffer ─────────────────────────────
    // Cuando Fighter ejecuta un salto buffereado automáticamente,
    // esta función se llama para registrar stats y SFX.
    this.onJumpBufferExecuted = () => {
      this.stats.recordJump();
      this.scene.adaptiveMomentum?.registerAction('jump');
      AudioManager.getInstance()?.playSfx(AUDIO_KEYS.PLAYER_JUMP);
    };

    // ─── Arquitectura Data-Driven (Fase Final) ───────────────
    this.dataDriven = CharacterFactory.create(PlayerData, 'Player', this.scene, this);

    // ─── Configuración de Animaciones ──────────────────────
    // Clave base para buscar animaciones (player_idle, player_moving, etc.)
    this._animBaseKey = 'player';
    // Altura visual deseada del sprite en la arena (px).
    // Los frames son 384px de alto; escalamos a 120px para el juego.
    this._spriteDisplayHeight = 120;
  }

  /**
   * Actualización por frame — lee input y ejecuta acciones.
   * @param {number} delta - ms desde el último frame
   */
  update(delta) {
    // Actualizar Arquitectura Data-Driven
    this.dataDriven.controllers.attack.update(delta);
    this.dataDriven.controllers.animation.update(delta);
    this.dataDriven.controllers.health.update(delta);
    if (this.dataDriven.controllers.hitboxes) this.dataDriven.controllers.hitboxes.update(delta);
    if (this.dataDriven.controllers.hurtboxes) this.dataDriven.controllers.hurtboxes.update(delta);
    this.dataDriven.runtimes.input.update(delta);
    this.dataDriven.runtimes.statusEffects.update(delta);

    // Actualizar la clase base (cooldowns, timers, iframes)
    this.updateFighter(delta);

    // No procesar input si estamos muertos
    if (this.isDead()) return;

    // ─── Bloqueo (mantener) ──────────────────────────────
    if (this.keys.block.isDown) {
      if (!this.isBlocking()) {
        this.scene.adaptiveMomentum?.registerAction('block');
        AudioManager.getInstance()?.playSfx(AUDIO_KEYS.PLAYER_BLOCK);
      }
      this.startBlock();
      this.stats.recordBlock();
      this._reportMovement(false, DIRECTIONS.NONE);
      return; // No se puede hacer nada más mientras bloquea
    } else if (this.isBlocking()) {
      this.endBlock();
    }

    // ─── Ataques ─────────────────────────────────────────
    if (Phaser.Input.Keyboard.JustDown(this.keys.quickAttack)) {
      if (this.performAttack()) {
        this.stats.recordQuickAttack();
        this.scene.adaptiveMomentum?.registerAction('attack');
        AudioManager.getInstance()?.playSfx(AUDIO_KEYS.PLAYER_HIT);
      }
    }

    if (Phaser.Input.Keyboard.JustDown(this.keys.specialAttack)) {
      if (this.performSpecialAttack()) {
        this.stats.recordSpecialAttack();
        this.scene.adaptiveMomentum?.registerAction('special');
        AudioManager.getInstance()?.playSfx(AUDIO_KEYS.PLAYER_SPECIAL);
      }
    }

    if (Phaser.Input.Keyboard.JustDown(this.keys.jump) ||
        Phaser.Input.Keyboard.JustDown(this.keys.jumpSpace)) {
      if (this.jump()) {
        this.stats.recordJump();
        this.scene.adaptiveMomentum?.registerAction('jump');
        AudioManager.getInstance()?.playSfx(AUDIO_KEYS.PLAYER_JUMP);
      } else {
        // Jump Buffer: registrar intención si no pudo saltar ahora
        this.requestJump();
      }
    }

    // ─── Dash ────────────────────────────────────────────
    if (Phaser.Input.Keyboard.JustDown(this.keys.dash) ||
        Phaser.Input.Keyboard.JustDown(this.keys.dashShift)) {
      // Determinar si es un backdash según si pulsamos dirección contraria
      const leftDown = this.keys.left.isDown || this.keys.arrowLeft.isDown;
      const rightDown = this.keys.right.isDown || this.keys.arrowRight.isDown;
      
      let dirOverride = null;
      if (leftDown && this.facingRight) dirOverride = -1; // backdash
      if (rightDown && !this.facingRight) dirOverride = 1; // backdash
      
      if (this.dash(dirOverride)) {
        this.stats.recordDash(dirOverride);
        this.scene.adaptiveMomentum?.registerAction('dash');
        AudioManager.getInstance()?.playSfx(AUDIO_KEYS.PLAYER_DASH);
      }
    }

    // ─── Movimiento horizontal ───────────────────────────
    const leftDown = this.keys.left.isDown || this.keys.arrowLeft.isDown;
    const rightDown = this.keys.right.isDown || this.keys.arrowRight.isDown;

    if (leftDown && !rightDown) {
      this.move(-1);
      this._reportMovement(true, DIRECTIONS.LEFT);
    } else if (rightDown && !leftDown) {
      this.move(1);
      this._reportMovement(true, DIRECTIONS.RIGHT);
    } else {
      this.move(0);
      this._reportMovement(false, DIRECTIONS.NONE);
    }

  }

  /**
   * Reporta el estado de movimiento al StatisticsSystem.
   * @param {boolean} isMoving
   * @param {string} direction
   * @private
   */
  _reportMovement(isMoving, direction) {
    this.stats.updateMovement(isMoving, direction);
  }
}
