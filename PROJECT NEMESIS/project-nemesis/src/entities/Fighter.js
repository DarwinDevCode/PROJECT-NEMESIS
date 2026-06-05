/**
 * Fighter.js
 * Clase base compartida entre Player y Nemesis.
 *
 * Encapsula toda la mecánica de combate común:
 * - Sistema de vida (HP)
 * - Estados del combatiente (idle, attacking, blocking, hurt, dead)
 * - Ataques (rápido y especial) con cooldowns
 * - Bloqueo con reducción de daño
 * - Invencibilidad temporal tras recibir golpe (iframes)
 * - Dirección (facing)
 *
 * Principio rector: las estadísticas base son IGUALES para Player y Nemesis.
 * La dificultad viene del comportamiento, nunca de ventajas numéricas.
 */

import Phaser from 'phaser';
import { FIGHTER_CONFIG } from '../game/config.js';
import { FIGHTER_STATES } from '../game/constants.js';

export default class Fighter extends Phaser.Physics.Arcade.Sprite {
  /**
   * @param {Phaser.Scene} scene
   * @param {number} x
   * @param {number} y
   * @param {number} maxHP
   */
  constructor(scene, x, y, textureKey, maxHP = 100) {
    super(scene, x, y, textureKey);

    // Agregar al mundo de Phaser
    scene.add.existing(this);
    scene.physics.add.existing(this);

    // ─── Estadísticas base ──────────
    this.maxHP = maxHP;
    this.hp = this.maxHP;
    this.speed = FIGHTER_CONFIG.speed;
    this.jumpForce = FIGHTER_CONFIG.jumpForce;

    // ─── Estado ──────────────────────────────────────────
    this.state = FIGHTER_STATES.IDLE;
    this.facingRight = true;

    // ─── Cooldowns ───────────────────────────────────────
    this._dashCooldown = 0;
    this._stateTimer = 0;

    // ─── Invencibilidad ──────────────────────────────────
    this._iframeTimer = 0;
    this._isInvincible = false;

    // ─── Bloqueo ─────────────────────────────────────────
    this._isBlocking = false;

    // ─── Input Assist ─────────────────────────────────────
    this._coyoteTimer = 0;
    this._jumpBufferTimer = 0;

    /**
     * Hook llamado cuando un salto buffereado se ejecuta automáticamente.
     * Player lo sobreescribe para registrar stats y SFX.
     * @type {Function|null}
     */
    this.onJumpBufferExecuted = null;

    // ─── Configurar physics body ─────────────────────────
    this.body.setSize(FIGHTER_CONFIG.bodyWidth, FIGHTER_CONFIG.bodyHeight);
    this.body.setCollideWorldBounds(true);
    this.setOrigin(0.5, 1); // Origen en la base del sprite (pies)
  }

  /**
   * Actualización por frame. Llamar desde la escena.
   * @param {number} delta - ms desde el último frame
   */
  updateFighter(delta) {
    // Actualizar cooldowns de movimiento
    if (this._dashCooldown > 0) this._dashCooldown -= delta;

    // Actualizar timer de estado (para animaciones de ataque/hurt)
    if (this._stateTimer > 0) {
      this._stateTimer -= delta;
      if (this._stateTimer <= 0) {
        this._onStateTimerEnd();
      }
    }

    // Actualizar iframes
    if (this._iframeTimer > 0) {
      this._iframeTimer -= delta;
      if (this._iframeTimer <= 0) {
        this._isInvincible = false;
        this.setAlpha(1);
      } else {
        // Efecto visual de parpadeo durante iframes
        this.setAlpha(Math.sin(Date.now() * 0.02) > 0 ? 1 : 0.4);
      }
    }

    // ─── Gravedad asimétrica: descenso más rápido que ascenso ───
    // setGravityY es ADITIVO a la gravedad global del mundo (600)
    if (!this.body.blocked.down && this.body.velocity.y > 0) {
      this.body.setGravityY(FIGHTER_CONFIG.fallGravityBoost);
    } else {
      this.body.setGravityY(0);
    }

    // ─── Coyote Time ───
    if (this.body.blocked.down) {
      this._coyoteTimer = FIGHTER_CONFIG.coyoteTime;
    } else if (this._coyoteTimer > 0) {
      this._coyoteTimer -= delta;
    }

    // ─── Jump Buffer ───
    if (this._jumpBufferTimer > 0) {
      this._jumpBufferTimer -= delta;
      // Ejecutar salto buffereado al aterrizar
      if (this.body.blocked.down && this._jumpBufferTimer > 0) {
        this._jumpBufferTimer = 0;
        if (this.jump()) {
          // Notificar a Player para stats y SFX
          if (this.onJumpBufferExecuted) this.onJumpBufferExecuted();
        }
      }
    }

    // ─── Auto-facing Opponent ───
    // Si no se está moviendo activamente (donde la dirección dicta la orientación)
    // hace que siempre mire hacia el oponente automáticamente.
    if (this.state !== FIGHTER_STATES.MOVING && this.state !== FIGHTER_STATES.DASHING) {
      const opponent = this === this.scene.player ? this.scene.nemesis : this.scene.player;
      if (opponent) {
        this.facingRight = opponent.x > this.x;
      }
    }

    // ─── Aterrizaje del Salto ───
    // Solo regresar a IDLE si estamos cayendo o parados en el suelo, 
    // previniendo el bug donde la animación se corta al iniciar el salto.
    if (this.state === FIGHTER_STATES.JUMPING && this.body.blocked.down && this.body.velocity.y >= 0) {
      this.state = FIGHTER_STATES.IDLE;
    }

    // Actualizar animación visual basada en el estado
    this._updateAnimation();

    // Actualizar dirección visual (flip del sprite)
    // Si el sprite está dibujado mirando a la derecha por defecto (Player), invertimos cuando mira a la izquierda.
    // Si el sprite está dibujado mirando a la izquierda por defecto (Nemesis), invertimos cuando mira a la derecha.
    const nativelyFacesRight = this._nativeFaceRight !== false; // true por defecto
    this.setFlipX(nativelyFacesRight ? !this.facingRight : this.facingRight);
  }

  /**
   * Actualiza la animación activa según el estado del combatiente.
   * Busca animaciones con la convención `{_animBaseKey}_{state}`.
   * @private
   */
  _updateAnimation() {
    const baseKey = this._animBaseKey || this.texture.key;
    const animKey = `${baseKey}_${this.state}`;

    try {
      if (this.scene.anims.exists(animKey)) {
        // Reproducir animación real del spritesheet
        this.anims.play(animKey, true);

        // Aplicar tints para estados que lo requieren
        if (this.state === FIGHTER_STATES.BERSERK) {
          this.setTint(0xff00ff);
        } else if (this.state === FIGHTER_STATES.HURT) {
          this.setTint(0xff0000);
        } else if (this.state === FIGHTER_STATES.DASHING) {
          this.clearTint();
          this._createDashTrail();
        } else {
          this.clearTint();
        }

        // Calcular escala: los frames son altos (384px) y estrechos (48px).
        // Escalamos para que el personaje tenga la altura visual deseada.
        const targetH = this._spriteDisplayHeight || FIGHTER_CONFIG.bodyHeight;
        const frame = this.anims.currentFrame?.frame || this.frame;
        if (frame && frame.height > 0) {
          const scale = targetH / frame.height;
          this.setScale(scale);

          // Calcular tamaño unscaled deseado
          let unscaledBodyW = FIGHTER_CONFIG.bodyWidth;
          let unscaledBodyH = FIGHTER_CONFIG.bodyHeight;

          // Si el personaje define explícitamente sus dimensiones físicas MUNDIALES (ej: Nemesis 100x140)
          // dividimos por scale para que al escalarse queden de ese tamaño en el mundo.
          if (this._customBodyW && this._customBodyH) {
              unscaledBodyW = this._customBodyW / scale;
              unscaledBodyH = this._customBodyH / scale;
          } else if (this._spriteDisplayHeight) {
              // Comportamiento legacy para otros personajes grandes sin custom explícito
              const multiplier = this._spriteDisplayHeight / FIGHTER_CONFIG.bodyHeight;
              unscaledBodyW = (FIGHTER_CONFIG.bodyWidth * multiplier) / scale;
              unscaledBodyH = (FIGHTER_CONFIG.bodyHeight * multiplier) / scale;
          }

          // Centrar horizontalmente y anclar a los pies (usando dimensiones unscaled)
          const offsetX = (frame.width - unscaledBodyW) / 2;
          const visualOffsetY = (this._visualOffsetY || 0) / scale;
          const offsetY = frame.height - unscaledBodyH + visualOffsetY;

          // EVITAR BLOQUEOS: Si las físicas ya están correctas, no resetearlas
          // (Llamar a updateFromGameObject cada frame anula la velocidad horizontal)
          if (
            Math.abs(this.body.offset.x - offsetX) < 0.1 && 
            Math.abs(this.body.offset.y - offsetY) < 0.1
          ) {
              return;
          }

          this.body.setSize(unscaledBodyW, unscaledBodyH);
          this.body.setOffset(offsetX, offsetY);

          // Sincronizar la hitbox con la nueva escala y offset
          this.body.updateFromGameObject();
        }

        return;
      }
    } catch (e) {
      // Silenciar si no hay animaciones disponibles
    }

    // Fallback: sin animación registrada (no debería ocurrir en producción)
    this.clearTint();
    this.setScale(1);
  }

  /**
   * Crea un rastro visual durante el Dash.
   * @private
   */
  _createDashTrail() {
    // Solo generar trail cada cierto tiempo o frame para no saturar
    if (Math.random() > 0.5) return;

    const trail = this.scene.add.sprite(this.x, this.y, this.texture.key);
    trail.setOrigin(this.originX, this.originY);
    trail.setFlipX(!this.facingRight);
    trail.setTint(0xaaffaa);
    trail.setAlpha(0.5);

    this.scene.tweens.add({
      targets: trail,
      alpha: 0,
      duration: 300,
      onComplete: () => trail.destroy()
    });
  }

  // ─── MOVIMIENTO ─────────────────────────────────────────

  /**
   * Mueve al combatiente horizontalmente.
   * @param {number} direction - -1 (izquierda), 0 (parado), 1 (derecha)
   */
  move(direction) {
    if (this._isLockedState()) return;

    if (direction !== 0) {
      let speedMultiplier = this._isBlocking ? FIGHTER_CONFIG.blockMovementPenalty : 1;
      speedMultiplier *= this.getStatModifier('speed');
      
      this.body.setVelocityX(direction * this.speed * speedMultiplier);
      this.facingRight = direction > 0;

      if (this.state !== FIGHTER_STATES.JUMPING && this.state !== FIGHTER_STATES.DASHING) {
        this.state = FIGHTER_STATES.MOVING;
      }
    } else {
      this.body.setVelocityX(0);
      if (this.state === FIGHTER_STATES.MOVING) {
        this.state = FIGHTER_STATES.IDLE;
      }
    }
  }

  /**
   * Ejecuta un salto si el combatiente está en el suelo.
   * @returns {boolean} true si saltó
   */
  jump() {
    if (this._isLockedState()) return false;
    // Coyote Time: permite saltar durante un breve periodo tras dejar el suelo
    if (!this.body.blocked.down && this._coyoteTimer <= 0) return false;

    this._coyoteTimer = 0;       // Consumir coyote time
    this._jumpBufferTimer = 0;   // Consumir buffer si existía
    this.body.setVelocityY(-this.jumpForce);
    this.state = FIGHTER_STATES.JUMPING;
    return true;
  }

  /**
   * Registra intención de salto para el Jump Buffer.
   * Si el jugador no puede saltar ahora, el salto se ejecutará automáticamente
   * al tocar el suelo (dentro de jumpBufferTime ms).
   */
  requestJump() {
    this._jumpBufferTimer = FIGHTER_CONFIG.jumpBufferTime;
  }

  // ─── DASH ───────────────────────────────────────────────

  /**
   * Ejecuta un dash en la dirección en que está mirando.
   * @param {number} dirOverride - Dirección opcional (-1 o 1) para hacer backdash/forwarddash.
   * @returns {boolean} true si se ejecutó
   */
  dash(dirOverride = null) {
    if (this._isLockedState()) return false;
    if (this._dashCooldown > 0) return false;
    
    // Dejar de bloquear si estaba bloqueando
    if (this._isBlocking) this.endBlock();

    this.state = FIGHTER_STATES.DASHING;
    this._stateTimer = FIGHTER_CONFIG.dashDuration;
    this._dashCooldown = FIGHTER_CONFIG.dashCooldown;

    // Pequeña invulnerabilidad
    this._isInvincible = true;
    this._iframeTimer = FIGHTER_CONFIG.dashDuration; // Iframes durante el dash

    // Dirección del dash
    const direction = dirOverride !== null ? dirOverride : (this.facingRight ? 1 : -1);
    this.body.setVelocityX(direction * FIGHTER_CONFIG.dashSpeedX);
    
    // Ignorar la gravedad temporalmente o mantener Y 0
    this.body.setVelocityY(0);

    return true;
  }

  // ─── ATAQUES ────────────────────────────────────────────

  /**
   * Ejecuta un ataque rápido.
   * @returns {boolean} true si se ejecutó
   */
  performAttack() {
    if (this._isLockedState()) return false;
    if (this._isBlocking) return false;

    // Depender de Data-Driven para validación de cooldown y ataque
    if (!this.dataDriven.controllers.attack.tryAttack("quick_attack")) {
      return false;
    }

    this.state = FIGHTER_STATES.ATTACKING;
    this._stateTimer = FIGHTER_CONFIG.quickAttackDuration;

    // Detener movimiento durante el ataque
    this.body.setVelocityX(0);

    return true;
  }

  /**
   * Ejecuta un ataque especial.
   * @returns {boolean} true si se ejecutó
   */
  performSpecialAttack() {
    if (this._isLockedState()) return false;
    if (this._isBlocking) return false;

    const attackId = this._animBaseKey === 'nemesis' ? "heavy_attack" : "quick_attack";
    
    // Depender de Data-Driven
    if (!this.dataDriven.controllers.attack.tryAttack(attackId)) {
      return false;
    }

    this.state = FIGHTER_STATES.SPECIAL_ATTACKING;
    this._stateTimer = FIGHTER_CONFIG.specialAttackDuration;

    // Detener movimiento durante el ataque
    this.body.setVelocityX(0);

    return true;
  }

  /**
   * Verifica si el combatiente está en estado de ataque activo.
   * @returns {boolean}
   */
  isAttacking() {
    return (
      this.state === FIGHTER_STATES.ATTACKING ||
      this.state === FIGHTER_STATES.SPECIAL_ATTACKING
    );
  }

  /**
   * Devuelve el daño del ataque activo actual.
   * @returns {number}
   */
  getCurrentAttackDamage() {
    if (this.state === FIGHTER_STATES.ATTACKING) {
      return FIGHTER_CONFIG.quickAttackDamage;
    }
    if (this.state === FIGHTER_STATES.SPECIAL_ATTACKING) {
      return FIGHTER_CONFIG.specialAttackDamage;
    }
    return 0;
  }

  /**
   * Devuelve el alcance del ataque activo actual.
   * @returns {number}
   */
  getCurrentAttackRange() {
    if (this.state === FIGHTER_STATES.ATTACKING) {
      return FIGHTER_CONFIG.quickAttackRange;
    }
    if (this.state === FIGHTER_STATES.SPECIAL_ATTACKING) {
      return FIGHTER_CONFIG.specialAttackRange;
    }
    return 0;
  }

  // ─── BLOQUEO ────────────────────────────────────────────

  /**
   * Activa el bloqueo.
   */
  startBlock() {
    if (this._isLockedState()) return;
    if (this.isAttacking()) return;

    this._isBlocking = true;
    this.state = FIGHTER_STATES.BLOCKING;
    this.body.setVelocityX(0);
  }

  /**
   * Desactiva el bloqueo.
   */
  endBlock() {
    this._isBlocking = false;
    if (this.state === FIGHTER_STATES.BLOCKING) {
      this.state = FIGHTER_STATES.IDLE;
    }
  }

  /**
   * Verifica si el combatiente está bloqueando.
   * @returns {boolean}
   */
  isBlocking() {
    return this._isBlocking;
  }

  // ─── DAÑO ───────────────────────────────────────────────

  /**
   * Aplica daño al combatiente.
   * @param {number} amount - Daño base
   * @returns {{ actualDamage: number, blocked: boolean }} Resultado del impacto
   */
  takeDamage(amount) {
    if (this._isInvincible) return { actualDamage: 0, blocked: false };
    if (this.state === FIGHTER_STATES.DEAD) return { actualDamage: 0, blocked: false };

    let baseAmount = amount * this.getStatModifier('damageTaken');
    let actualDamage = baseAmount;
    let blocked = false;

    // Reducir daño si está bloqueando
    if (this._isBlocking) {
      actualDamage = Math.round(amount * (1 - FIGHTER_CONFIG.blockDamageReduction));
      blocked = true;
    }

    // Aplicar al Runtime
    this.dataDriven.controllers.health.takeDamage(actualDamage);
    // Sincronizar UI Legacy
    this.hp = this.dataDriven.runtimes.health.currentHP;

    // Activar iframes
    this._isInvincible = true;
    this._iframeTimer = FIGHTER_CONFIG.iframeDuration;

    // Cambiar estado a hurt (si no bloqueó)
    if (!blocked) {
      this.state = FIGHTER_STATES.HURT;
      this._stateTimer = 200; // Duración del stun
      this._isBlocking = false;

      // Knockback ligero
      const knockbackDir = this.facingRight ? -1 : 1;
      this.body.setVelocityX(knockbackDir * 100);
    }

    // Verificar muerte
    if (this.hp <= 0) {
      this.state = FIGHTER_STATES.DEAD;
      this.body.setVelocityX(0);
      this._isBlocking = false;
      
      // Propagar reset por muerte a los Runtimes
      if (this.dataDriven && this.dataDriven.runtimes) {
        if (this.dataDriven.runtimes.statusEffects) {
          this.dataDriven.runtimes.statusEffects.reset({ reason: 'death' });
        }
        if (this.dataDriven.runtimes.berserk) {
          this.dataDriven.runtimes.berserk.reset({ reason: 'death' });
        }
      }
    }

    return { actualDamage, blocked };
  }

  /**
   * Verifica si el combatiente ha muerto.
   * @returns {boolean}
   */
  isDead() {
    return this.hp <= 0;
  }

  /**
   * Resetea la vida y el estado para una nueva ronda.
   */
  resetForCombat() {
    this.hp = this.maxHP;
    this.state = FIGHTER_STATES.IDLE;
    this._isBlocking = false;
    this._isInvincible = false;
    this._iframeTimer = 0;
    this._dashCooldown = 0;
    this._stateTimer = 0;
    this.setAlpha(1);
    this.body.setVelocity(0, 0);
  }

  // ─── GETTERS PARA IA ────────────────────────────────────

  /**
   * Devuelve un snapshot del estado actual (para NemesisBrain).
   * @returns {object}
   */
  getStateSnapshot() {
    return {
      x: this.x,
      y: this.y,
      hp: this.hp,
      maxHP: this.maxHP,
      state: this.state,
      isOnGround: this.body.blocked.down,
      isAttacking: this.isAttacking(),
      isBlocking: this.isBlocking(),
      facingRight: this.facingRight,
      velocity: {
        x: this.body.velocity.x,
        y: this.body.velocity.y,
      },
    };
  }

  /**
   * Obtiene el multiplicador genérico de un stat provisto por StatusEffects.
   * @param {string} statName 
   * @returns {number}
   */
  getStatModifier(statName) {
    if (this.dataDriven && this.dataDriven.runtimes.statusEffects) {
      return this.dataDriven.runtimes.statusEffects.getModifier(statName);
    }
    return 1.0;
  }

  // ─── HELPERS PRIVADOS ───────────────────────────────────

  /**
   * Verifica si el combatiente está en un estado que no permite acciones.
   * @returns {boolean}
   * @private
   */
  _isLockedState() {
    return (
      this.state === FIGHTER_STATES.HURT ||
      this.state === FIGHTER_STATES.DEAD ||
      this.state === FIGHTER_STATES.ATTACKING ||
      this.state === FIGHTER_STATES.SPECIAL_ATTACKING ||
      this.state === FIGHTER_STATES.DASHING
    );
  }

  /**
   * Llamado cuando un timer de estado expira.
   * @private
   */
  _onStateTimerEnd() {
    if (this.state === FIGHTER_STATES.ATTACKING ||
        this.state === FIGHTER_STATES.SPECIAL_ATTACKING ||
        this.state === FIGHTER_STATES.DASHING ||
        this.state === FIGHTER_STATES.HURT) {
      this.state = FIGHTER_STATES.IDLE;
    }
  }
}
