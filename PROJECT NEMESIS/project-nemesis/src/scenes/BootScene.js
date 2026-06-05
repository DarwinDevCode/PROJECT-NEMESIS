/**
 * BootScene.js
 * Escena unificada de inicialización y carga (fusión de Boot + Preload).
 *
 * Responsabilidades:
 * 1. Carga spritesheets de personajes y fondos
 * 2. Genera texturas auxiliares programáticamente (suelo, hitbox, efectos)
 * 3. Registra todas las animaciones del juego
 * 4. Carga datos guardados desde SaveManager
 * 5. Muestra barra de carga
 * 6. Transiciona a la siguiente escena
 */

import Phaser from 'phaser';
import { SCENES } from '../game/constants.js';
import { GAME_WIDTH, GAME_HEIGHT, ARENA_CONFIG, FIGHTER_CONFIG } from '../game/config.js';
import SaveManager from '../systems/SaveManager.js';
import AudioManager from '../systems/AudioManager.js';
import { AUDIO_MANIFEST } from '../game/audioConfig.js';

export default class BootScene extends Phaser.Scene {
  constructor() {
    super(SCENES.BOOT);
  }

  preload() {
    // Mostrar texto de carga
    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;

    this.add.text(cx, cy - 40, 'PROJECT NEMESIS', {
      fontSize: '28px',
      fontFamily: 'Courier New',
      color: '#cc0000',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    this.loadingText = this.add.text(cx, cy + 10, 'Inicializando sistemas...', {
      fontSize: '14px',
      fontFamily: 'Courier New',
      color: '#666666',
    }).setOrigin(0.5);

    // Barra de carga
    const barWidth = 300;
    const barHeight = 4;
    const barX = cx - barWidth / 2;
    const barY = cy + 40;

    const progressBg = this.add.graphics();
    progressBg.fillStyle(0x222222, 1);
    progressBg.fillRect(barX, barY, barWidth, barHeight);

    const progressBar = this.add.graphics();

    this.load.on('progress', (value) => {
      progressBar.clear();
      progressBar.fillStyle(0xcc0000, 1);
      progressBar.fillRect(barX, barY, barWidth * value, barHeight);
    });

    // ─── Cargar fondos ────────────────────────────────────
    this.load.image('menu_bg', '/assets/backgrounds/menu_bg.png');
    this.load.image('arena_bg', '/assets/backgrounds/arena_bg.png');

    // ─── Cargar spritesheets de NEMESIS ───────────────────
    this.load.spritesheet('nemesis_idle', '/src/assets/sprites/nemesis/nemesis-berserk-idle.png', {
      frameWidth: 140, frameHeight: 140
    });
    this.load.spritesheet('nemesis_walk', '/src/assets/sprites/nemesis/nemesis-berserk-walk.png', {
      frameWidth: 140, frameHeight: 140
    });
    this.load.spritesheet('nemesis_jump', '/src/assets/sprites/nemesis/nemesis-berserk-jump.png', {
      frameWidth: 140, frameHeight: 140
    });
    this.load.spritesheet('nemesis_attack', '/src/assets/sprites/nemesis/nemesis-berserk-attack.png', {
      frameWidth: 140, frameHeight: 140
    });
    this.load.spritesheet('nemesis_energy_pulse', '/src/assets/sprites/nemesis/nemesis-berserk-pulso-energia.png', {
      frameWidth: 512, frameHeight: 512
    });
    this.load.spritesheet('nemesis_rayo_orbital', '/src/assets/sprites/nemesis/nemesis-berserk-rayo-orbital.png', {
      frameWidth: 512, frameHeight: 512
    });
    this.load.image('punto_mira', '/src/assets/sprites/nemesis/punto-mira.png');

    // ─── Cargar spritesheets de PLAYER ────────────────────
    // Idle: 384x384, 8 frames → frameWidth=128, frameHeight=128
    this.load.spritesheet('player_idle', '/src/assets/sprites/player/player-idle.png', {
      frameWidth: 128,
      frameHeight: 128,
    });
    // Walk: 384x384, 8 frames → frameWidth=128, frameHeight=128
    this.load.spritesheet('player_walk', '/src/assets/sprites/player/player-walk.png', {
      frameWidth: 128,
      frameHeight: 128,
    });
    // Jump: 384x384, 8 frames → frameWidth=128, frameHeight=128
    this.load.spritesheet('player_jump', '/src/assets/sprites/player/player-jump.png', {
      frameWidth: 128,
      frameHeight: 128,
    });
    // Attack: 512x384, 12 frames → frameWidth=128, frameHeight=128
    this.load.spritesheet('player_attack', '/src/assets/sprites/player/player-attack.png', {
      frameWidth: 128,
      frameHeight: 128,
    });

    // ─── Cargar todos los recursos de audio ───────────────
    AUDIO_MANIFEST.forEach(({ key, path }) => {
      this.load.audio(key, path);
    });

    // Tolerancia a errores de carga
    this.load.on('loaderror', (file) => {
      console.warn(`[BootScene] No se pudo cargar recurso: ${file.key}`);
    });
  }

  create() {
    this.loadingText.setText('Generando texturas...');

    // ─── Generar texturas auxiliares programáticamente ────
    this._generateAuxTextures();

    // ─── Registrar todas las animaciones ─────────────────
    this._registerAnimations();

    this.loadingText.setText('Cargando datos guardados...');

    // ─── Cargar datos guardados ────────────────────────────
    const saveData = SaveManager.load();
    this.registry.set('saveData', saveData);

    // ─── Inicializar Gestor de Audio ───────────────────────
    new AudioManager(this, saveData.settings);

    this.loadingText.setText('Sistemas listos.');

    // ─── Transición ────────────────────────────────────────
    this.time.delayedCall(500, () => {
      this.scene.start(SCENES.MENU);
    });
  }

  /**
   * Genera texturas auxiliares del juego (suelo, efectos, debug).
   * Ya NO genera placeholders para los personajes — esos usan spritesheets.
   * @private
   */
  _generateAuxTextures() {
    const g = this.add.graphics();

    // ─── Suelo ────────────────────────────────────────────
    g.clear();
    g.fillStyle(0x1a1a2e, 1);
    g.fillRect(0, 0, GAME_WIDTH, 60);
    // Línea superior del suelo
    g.fillStyle(0x2a2a4e, 1);
    g.fillRect(0, 0, GAME_WIDTH, 2);
    g.generateTexture('ground', GAME_WIDTH, 60);

    // ─── Hitbox de ataque (para debug visual) ─────────────
    g.clear();
    g.fillStyle(0xffff00, 0.3);
    g.fillRect(0, 0, FIGHTER_CONFIG.quickAttackRange, 50);
    g.generateTexture('attackHitbox', FIGHTER_CONFIG.quickAttackRange, 50);

    // ─── Efecto de golpe ──────────────────────────────────
    g.clear();
    g.fillStyle(0xffffff, 1);
    g.fillCircle(12, 12, 12);
    g.generateTexture('hitEffect', 24, 24);

    // ─── Efecto de bloqueo ────────────────────────────────
    g.clear();
    g.fillStyle(0x44aaff, 0.6);
    g.fillRect(0, 0, 8, FIGHTER_CONFIG.bodyHeight + 8);
    g.generateTexture('blockEffect', 8, FIGHTER_CONFIG.bodyHeight + 8);

    // Limpiar el graphics helper
    g.destroy();
  }

  /**
   * Registra TODAS las animaciones del juego para ambos personajes.
   * Las claves siguen la convención `{characterKey}_{FIGHTER_STATE}` que
   * Fighter._updateAnimation() busca automáticamente.
   * @private
   */
  _registerAnimations() {
    // ─── Definición de personajes y sus spritesheets ──────
    const characters = [
      { key: 'nemesis', prefix: 'nemesis' },
      { key: 'player',  prefix: 'player'  },
    ];

    for (const char of characters) {
      // Verificar que los spritesheets se cargaron correctamente
      if (!this.textures.exists(`${char.prefix}_idle`)) {
        console.warn(`[BootScene] Spritesheets de ${char.key} no cargados.`);
        continue;
      }

      // ─── Idle: loop infinito ─────────────────────────────
      this.anims.create({
        key: `${char.key}_idle`,
        frames: this.anims.generateFrameNumbers(`${char.prefix}_idle`, { start: 0, end: 7 }),
        frameRate: 8,
        repeat: -1,
      });

      // ─── Moving (walk): loop mientras se desplaza ────────
      this.anims.create({
        key: `${char.key}_moving`,
        frames: this.anims.generateFrameNumbers(`${char.prefix}_walk`, { start: 0, end: 7 }),
        frameRate: 10,
        repeat: -1,
      });

      // ─── Jumping: loop ───────────────────────────────────
      this.anims.create({
        key: `${char.key}_jumping`,
        frames: this.anims.generateFrameNumbers(`${char.prefix}_jump`, { start: 0, end: 7 }),
        frameRate: 10,
        repeat: -1,
      });

      // ─── Attacking (golpe rápido): una sola vez ──────────
      const attackFrames = char.key === 'nemesis' ? 7 : 11;
      this.anims.create({
        key: `${char.key}_attacking`,
        frames: this.anims.generateFrameNumbers(`${char.prefix}_attack`, { start: 0, end: attackFrames }),
        frameRate: 24,
        repeat: 0,
      });

      // ─── Special Attacking: reutilizar attack ────────────
      this.anims.create({
        key: `${char.key}_special_attacking`,
        frames: this.anims.generateFrameNumbers(`${char.prefix}_attack`, { start: 0, end: attackFrames }),
        frameRate: 20,
        repeat: 0,
      });

      if (char.key === 'nemesis') {
        // Pulso de energia (16 frames en el spritesheet, la config dice 10 frames activos)
        if (!this.anims.exists('nemesis_energy_pulse')) {
          this.anims.create({
            key: 'nemesis_energy_pulse',
            frames: this.anims.generateFrameNumbers('nemesis_energy_pulse', { start: 0, end: 15 }),
            frameRate: 20,
            repeat: 0,
          });
        }

        // Rayo orbital
        if (!this.anims.exists('nemesis_rayo_orbital')) {
          this.anims.create({
            key: 'nemesis_rayo_orbital',
            frames: this.anims.generateFrameNumbers('nemesis_rayo_orbital', { start: 0, end: 15 }),
            frameRate: 20,
            repeat: 0,
          });
        }
      }

      // ─── Blocking: mantener primer frame de idle ─────────
      this.anims.create({
        key: `${char.key}_blocking`,
        frames: this.anims.generateFrameNumbers(`${char.prefix}_idle`, { start: 0, end: 1 }),
        frameRate: 4,
        repeat: -1,
      });

      // ─── Dashing: walk acelerado ─────────────────────────
      this.anims.create({
        key: `${char.key}_dashing`,
        frames: this.anims.generateFrameNumbers(`${char.prefix}_walk`, { start: 0, end: 7 }),
        frameRate: 20,
        repeat: 0,
      });

      // ─── Hurt: frame breve de jump ───────────────────────
      this.anims.create({
        key: `${char.key}_hurt`,
        frames: this.anims.generateFrameNumbers(`${char.prefix}_jump`, { start: 0, end: 1 }),
        frameRate: 8,
        repeat: 0,
      });

        console.info(`[BootScene] Animaciones de ${char.key} registradas correctamente.`);
    }

    // Registrar animaciones de efectos especiales de Nemesis
    this.anims.create({
      key: 'nemesis_energy_pulse',
      frames: this.anims.generateFrameNumbers('nemesis_energy_pulse', { start: 0, end: 9 }),
      frameRate: 15,
      repeat: 0,
    });

    this.anims.create({
      key: 'nemesis_rayo_orbital',
      frames: this.anims.generateFrameNumbers('nemesis_rayo_orbital', { start: 0, end: 15 }),
      frameRate: 15,
      repeat: 0,
    });
  }
}
