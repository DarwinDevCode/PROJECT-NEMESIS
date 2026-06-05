import Fighter from './Fighter.js';
import { NEMESIS_ACTIONS, FIGHTER_STATES } from '../game/constants.js';
import AudioManager from '../systems/AudioManager.js';
import { AUDIO_KEYS } from '../game/audioConfig.js';
import CharacterFactory from '../systems/core/CharacterFactory.js';
import { NemesisData } from '../data/characters/NemesisData.js';

export default class Nemesis extends Fighter {
  constructor(scene, x, y, brain) {
    super(scene, x, y, 'nemesis_idle', NemesisData.stats.maxHP);

    this.brain = brain;
    this.facingRight = false; // Empieza mirando a la izquierda (hacia el jugador)

    // ─── Arquitectura Data-Driven ───────────────
    this.dataDriven = CharacterFactory.create(NemesisData, 'Nemesis', this.scene, this);

    // ─── Configuración de Animaciones ──────────────────────
    this._animBaseKey = 'nemesis';
    this._nativeFaceRight = true;

    // Decoupling Visual Scale from Physics
    // El sprite es 140x140. Su visual se ajustará a eso, pero las físicas se mantienen a 100x140.
    this._spriteDisplayHeight = 140; 
    this._visualOffsetY = 0;
    this._customBodyW = 100;
    this._customBodyH = 140;
    this.shieldGraphic = this.scene.add.graphics();
    this.shieldGraphic.lineStyle(2, 0x00ffff, 0.8);
    this.shieldGraphic.fillStyle(0x0088ff, 0.3);
    this.shieldGraphic.fillRect(-10, -70, 20, 140);
    this.shieldGraphic.setVisible(false);
  }



  _updateAnimation() {
    // Evitar que Fighter.js sobreescriba las animaciones de ataques especiales
    if (this.state === FIGHTER_STATES.SPECIAL_ATTACKING) {
      return;
    }
    super._updateAnimation();
  }

  update(delta, player, stats) {
    // Actualizar Arquitectura Data-Driven
    this.dataDriven.controllers.attack.update(delta);
    this.dataDriven.controllers.animation.update(delta);
    this.dataDriven.controllers.health.update(delta);
    if (this.dataDriven.controllers.hitboxes) this.dataDriven.controllers.hitboxes.update(delta);
    if (this.dataDriven.controllers.hurtboxes) this.dataDriven.controllers.hurtboxes.update(delta);
    this.dataDriven.runtimes.input.update(delta);
    this.dataDriven.runtimes.statusEffects.update(delta);

    // Update Shield graphic if active
    if (this.shieldGraphic.visible) {
      this.shieldGraphic.clear();
      this.shieldGraphic.lineStyle(4, 0x00ffff, 0.8);
      this.shieldGraphic.strokeCircle(this.x, this.y, 60);
    }

    // Actualizar la clase base (cooldowns, timers, iframes)
    this.updateFighter(delta);

    // No actuar si está muerto
    if (this.isDead()) return;

    // Actualizar estado de salto al aterrizar
    if (this.state === FIGHTER_STATES.JUMPING && this.body.blocked.down) {
      this.state = FIGHTER_STATES.IDLE;
    }

    const gameState = {
      nemesis: this.getStateSnapshot(),
      player: player.getStateSnapshot(),
      time: Date.now(),
      delta: delta,
      recentPlayerActions: stats ? stats.getRecentActions(15) : [],
    };

    // Actualizar lógica continua del cerebro (timers)
    this.brain.updateContinuousLogic(gameState);

    // No tomar decisiones si está bloqueado en estado
    if (this._isLockedState() && this.state !== FIGHTER_STATES.BLOCKING) {
      return; 
    }

    // Consultar al cerebro
    const action = this.brain.decide(gameState);

    // Ejecutar la acción decidida
    this._executeAction(action, player);
  }

  _executeAction(action, player) {
    // Siempre mirar hacia el jugador a menos que esté atacando
    if (this.state !== FIGHTER_STATES.ATTACKING && this.state !== FIGHTER_STATES.SPECIAL_ATTACKING) {
       this.facingRight = player.x > this.x;
    }

    switch (action) {
      case NEMESIS_ACTIONS.MOVE_TOWARDS:
        this._chase(player);
        break;

      case NEMESIS_ACTIONS.MOVE_AWAY:
        this._retreat(player);
        break;

      case NEMESIS_ACTIONS.JUMP:
        this.jump();
        break;

      case NEMESIS_ACTIONS.ATTACK_QUICK:
      case NEMESIS_ACTIONS.ATTACK_HEAVY:
        if (!this._isLockedState()) {
           this.state = FIGHTER_STATES.ATTACKING;
           this.body.setVelocityX(0); // Stop movement
           this._stateTimer = 500; // Attack duration from NemesisData
           this.dataDriven.controllers.attack.tryAttack('attack');
           AudioManager.getInstance()?.playSfx(AUDIO_KEYS.NEMESIS_HIT);
        }
        break;

      case NEMESIS_ACTIONS.ENERGY_PULSE:
        if (!this._isLockedState()) {
           console.log('%c[NEMESIS] Lanzando habilidad especial: ENERGY_PULSE', 'color: cyan; font-weight: bold; font-size: 14px');
           this.state = FIGHTER_STATES.SPECIAL_ATTACKING;
           this.body.setVelocity(0, 0);
           this._stateTimer = 800; // Pulse duration from NemesisData
           this.dataDriven.controllers.attack.tryAttack('energy_pulse');
           this.play('nemesis_energy_pulse', true);
           
           // Reducir tamaño visual y ajustar offsets físicos para evitar caer por el suelo
           const scale = 0.65; // Reducir a 65% porque era muy enorme
           this.setScale(scale);
           const unscaledW = 100 / scale;
           const unscaledH = 140 / scale;
           this.body.setSize(unscaledW, unscaledH);
           this.body.setOffset((512 - unscaledW) / 2, 512 - unscaledH);
        }
        break;

      case NEMESIS_ACTIONS.ORBITAL_STRIKE:
        if (!this._isLockedState()) {
          console.log('%c[NEMESIS] Lanzando habilidad especial: ORBITAL_STRIKE', 'color: magenta; font-weight: bold; font-size: 14px');
          this.state = FIGHTER_STATES.SPECIAL_ATTACKING;
          this.body.setVelocity(0, 0);
          this._stateTimer = 2600; // Orbital strike timeline duration
          this._executeOrbitalStrike(player);
          
          // Mantener físicas de idle porque el cast se hace desde idle
          this.setScale(1);
          this.body.setSize(100, 140);
          this.body.setOffset((140 - 100) / 2, 0);
        }
        break;

      case NEMESIS_ACTIONS.BLOCK:
        this.startBlock();
        break;

      case NEMESIS_ACTIONS.DASH:
        this._dashTowards(player);
        AudioManager.getInstance()?.playSfx(AUDIO_KEYS.NEMESIS_DASH);
        break;

      case NEMESIS_ACTIONS.IDLE:
      default:
        this.move(0);
        if (this.isBlocking()) this.endBlock();
        break;
    }
  }

  startBlock() {
    if (this.state === FIGHTER_STATES.ATTACKING || this.state === FIGHTER_STATES.SPECIAL_ATTACKING) return;
    
    super.startBlock(); // Llama a Fighter.js startBlock
    
    this.shieldGraphic.setVisible(true);
    AudioManager.getInstance()?.playSfx(AUDIO_KEYS.NEMESIS_BLOCK);
  }

  endBlock() {
    super.endBlock();
    this.shieldGraphic.setVisible(false);
  }

  getStateSnapshot() {
    return {
      x: this.x,
      y: this.y,
      hp: this.dataDriven ? this.dataDriven.runtimes.health.currentHP : this.hp,
      maxHP: this.dataDriven ? this.dataDriven.runtimes.health.maxHP : this.maxHP,
      state: this.state,
      isOnGround: this.body.blocked.down,
      isAttacking: this.isAttacking(),
      isBlocking: this.isBlocking(),
      velocity: { x: this.body.velocity.x, y: this.body.velocity.y },
      dataDriven: this.dataDriven
    };
  }

  _chase(player) {
    if (this.isBlocking()) this.endBlock();
    const direction = player.x > this.x ? 1 : -1;
    this.move(direction);
  }

  _retreat(player) {
    if (this.isBlocking()) this.endBlock();
    const direction = player.x > this.x ? -1 : 1;
    this.move(direction);
  }

  _dashTowards(player) {
    const towardsPlayer = player.x > this.x ? 1 : -1;
    this.dash(towardsPlayer);
  }

  _executeOrbitalStrike(player) {
    this.state = FIGHTER_STATES.SPECIAL_ATTACKING;
    this.body.setVelocity(0, 0);
    this._stateTimer = 2600; // Deterministic 2600ms sequence lock
    this.play('nemesis_idle', true); // Orbital strike is casted from idle animation physically

    const targetX = player.x;
    const targetY = player.y; // Assumes ground level
    
    // Spawn static marker at 0ms
    const marker = this.scene.add.sprite(targetX, targetY, 'punto_mira');
    marker.setDepth(20);

    // 1000ms delay before orbital strike beam spawns
    this.scene.time.delayedCall(1000, () => {
      marker.destroy();
      
      const beam = this.scene.add.sprite(targetX, targetY - 150, 'nemesis_rayo_orbital');
      beam.setDepth(25);
      beam.play('nemesis_rayo_orbital'); // 16 frames, 1600ms if 10fps. Wait, frameRate was 20 in BootScene.
      // 16 frames @ 20fps = 800ms. If we want 2600ms total, wait...
      // The timeline is 1000ms + 1600ms = 2600ms? Let's check BootScene. BootScene: frameRate: 20 -> 800ms.
      // So total sequence is 1800ms? The user said "strict 2600ms sequence lock".
      // We will set the lock to 2600ms to allow recovery time.

      beam.on('animationupdate', (anim, frame) => {
        // Damage applied at frame index 8
        if (frame.index === 8 && !beam.hasDealtDamage) {
          beam.hasDealtDamage = true;
          // Check distance to player. Energy pulse was 220, orbital is a pillar.
          if (Math.abs(this.scene.player.x - targetX) < 150) { 
             const damage = 60; // Ultimate damage
             this.scene.player.takeDamage(damage, 600, targetX > this.scene.player.x ? -1 : 1);
          }
        }
      });

      beam.on('animationcomplete', () => {
        beam.destroy();
      });
    });
  }
}
