/**
 * ArenaScene.js
 * Escena principal de combate.
 *
 * Crea la arena cerrada, instancia Player y Nemesis,
 * configura colisiones, inicializa sistemas de IA y combate,
 * y gestiona el flujo de la partida.
 */

import Phaser from 'phaser';
import { SCENES, COMBAT_RESULTS, FIGHTER_STATES } from '../game/constants.js';
import { GAME_WIDTH, GAME_HEIGHT, ARENA_CONFIG } from '../game/config.js';

// Entidades
import Player from '../entities/Player.js';
import Nemesis from '../entities/Nemesis.js';

// Sistemas
import CombatSystem from '../systems/CombatSystem.js';
import StatisticsSystem from '../systems/StatisticsSystem.js';
import SaveManager from '../systems/SaveManager.js';
import AudioManager from '../systems/AudioManager.js';

// IA
import NemesisBrain from '../ai/NemesisBrain.js';
import PatternDetector from '../ai/PatternDetector.js';
import AdaptationSystem from '../ai/AdaptationSystem.js';
import AdaptiveMomentumSystem from '../ai/AdaptiveMomentumSystem.js';
import NemesisMemory from '../ai/NemesisMemory.js';
import ComboMemory from '../ai/ComboMemory.js';
import NemesisKnowledge from '../ai/NemesisKnowledge.js';
import NemesisProfile from '../ai/NemesisProfile.js';
import FrustrationRegulator from '../ai/FrustrationRegulator.js';

// UI
import HUD from '../ui/HUD.js';
import DebugOverlay from '../ui/DebugOverlay.js';

export default class ArenaScene extends Phaser.Scene {
  constructor() {
    super(SCENES.ARENA);
  }

  create() {
    // ─── Cargar datos guardados ────────────────────────────
    const saveData = this.registry.get('saveData');

    // ─── Inicializar sistemas de IA ───────────────────────
    this.patternDetector = new PatternDetector();
    this.adaptationSystem = new AdaptationSystem(saveData.nemesisState);
    this.adaptiveMomentum = new AdaptiveMomentumSystem(saveData.nemesisMomentum);
    this.nemesisMemory = new NemesisMemory(saveData.nemesisMemory);
    this.comboMemory = new ComboMemory(saveData.nemesisComboMemory);
    this.nemesisKnowledge = new NemesisKnowledge(saveData.nemesisKnowledge);
    this.nemesisProfile = new NemesisProfile(saveData.nemesisProfile);
    this.frustrationRegulator = new FrustrationRegulator(saveData.frustration);

    this.nemesisBrain = new NemesisBrain({
      adaptationSystem: this.adaptationSystem,
      knowledge: this.nemesisKnowledge,
      profile: this.nemesisProfile,
      frustrationRegulator: this.frustrationRegulator,
      patternDetector: this.patternDetector,
      adaptiveMomentum: this.adaptiveMomentum,
    });
    this.nemesisBrain.setMemory(this.nemesisMemory);
    this.nemesisBrain.setComboMemory(this.comboMemory);

    // ─── Inicializar sistemas de combate ──────────────────
    this.statisticsSystem = new StatisticsSystem();
    this.combatSystem = new CombatSystem(this, this.statisticsSystem);

    // ─── Crear arena ──────────────────────────────────────
    this._createArena();

    // ─── Crear combatientes ───────────────────────────────
    this.player = new Player(
      this,
      ARENA_CONFIG.playerStartX,
      ARENA_CONFIG.groundY,
      this.statisticsSystem
    );

    this.nemesis = new Nemesis(
      this,
      ARENA_CONFIG.nemesisStartX,
      ARENA_CONFIG.groundY,
      this.nemesisBrain
    );

    // ─── Colisiones ───────────────────────────────────────
    this.physics.add.collider(this.player, this.ground);
    this.physics.add.collider(this.nemesis, this.ground);

    // Colisión entre combatientes (para que no se atraviesen)
    // Se comenta para permitir que el jugador atraviese a Nemesis y no se quede arrinconado
    // this.physics.add.collider(this.player, this.nemesis);

    // ─── Paredes laterales ────────────────────────────────
    this.physics.world.setBounds(
      ARENA_CONFIG.wallLeftX, 0,
      ARENA_CONFIG.wallRightX - ARENA_CONFIG.wallLeftX, GAME_HEIGHT
    );
    this.player.body.setCollideWorldBounds(true);
    this.nemesis.body.setCollideWorldBounds(true);

    // ─── HUD y Debug ──────────────────────────────────────────
    this.hud = new HUD(this);
    // this.debugOverlay = new DebugOverlay(this);

    // ─── Estado de la partida ─────────────────────────────
    this.matchActive = true;
    this.matchResult = null;

    // ─── Indicadores visuales de estado de combatientes ───
    this._createStateIndicators();

    // ─── Input de pausa (ESC) ─────────────────────────────
    this.pauseKey = this.input.keyboard.addKey('ESC');

    // ─── Texto de inicio ──────────────────────────────────
    this._showMatchStart();
  }

  update(time, delta) {
    if (!this.matchActive) return;

    // ─── Verificar pausa ──────────────────────────────────
    if (Phaser.Input.Keyboard.JustDown(this.pauseKey)) {
      // Por ahora, solo pausar/despausar (PauseScene se agrega en Fase 3)
      this._togglePause();
    }

    // ─── Actualizar combatientes ──────────────────────────
    this.player.update(delta);
    this.nemesis.update(delta, this.player, this.statisticsSystem);

    // ─── Actualizar sistema de combate ────────────────────
    this.combatSystem.update(this.player, this.nemesis);

    // ─── Actualizar HUD y Debug ───────────────────────────
    this.hud.update(delta, this.player, this.nemesis, this.adaptationSystem.experience);
    // this.debugOverlay.update(this.player, this.nemesis, this.combatSystem);

    // ─── Actualizar indicadores de estado ─────────────────
    this._updateStateIndicators();

    // ─── Verificar fin de partida ─────────────────────────
    this._checkMatchEnd();
  }

  // ─── CREACIÓN DE LA ARENA ────────────────────────────────

  /**
   * Crea el suelo y el fondo de la arena.
   * @private
   */
  _createArena() {
    // Fondo de arena generado
    const bg = this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'arena_bg').setOrigin(0.5);
    // Overlay oscuro ligero para contraste
    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.2);
    overlay.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Suelo
    this.ground = this.physics.add.staticImage(
      GAME_WIDTH / 2,
      ARENA_CONFIG.groundY + 30,
      'ground'
    );

    // Línea de arena
    const arenaLine = this.add.graphics();
    arenaLine.lineStyle(1, 0x333355, 0.5);
    arenaLine.lineBetween(ARENA_CONFIG.wallLeftX, ARENA_CONFIG.groundY,
                           ARENA_CONFIG.wallRightX, ARENA_CONFIG.groundY);

    // Marcas en las paredes
    const walls = this.add.graphics();
    walls.lineStyle(2, 0x2a2a4e, 0.6);
    walls.lineBetween(ARENA_CONFIG.wallLeftX, 0, ARENA_CONFIG.wallLeftX, ARENA_CONFIG.groundY);
    walls.lineBetween(ARENA_CONFIG.wallRightX, 0, ARENA_CONFIG.wallRightX, ARENA_CONFIG.groundY);
  }

  // ─── INDICADORES VISUALES ────────────────────────────────

  /**
   * Crea indicadores de color bajo los combatientes.
   * @private
   */
  _createStateIndicators() {
    this.playerIndicator = this.add.graphics();
    this.playerIndicator.setDepth(0);
    this.nemesisIndicator = this.add.graphics();
    this.nemesisIndicator.setDepth(0);
  }

  /**
   * Actualiza los indicadores visuales de estado.
   * @private
   */
  _updateStateIndicators() {
    // Indicador del jugador (círculo bajo los pies)
    this.playerIndicator.clear();
    let playerColor = 0x4488ff;
    if (this.player.isAttacking()) playerColor = 0xffaa00;
    if (this.player.isBlocking()) playerColor = 0x44aaff;
    if (this.player.state === FIGHTER_STATES.HURT) playerColor = 0xff4444;
    this.playerIndicator.fillStyle(playerColor, 0.3);
    this.playerIndicator.fillEllipse(this.player.x, ARENA_CONFIG.groundY + 2, 40, 8);

    // Indicador de Nemesis
    this.nemesisIndicator.clear();
    let nemesisColor = 0xcc2222;
    if (this.nemesis.isAttacking()) nemesisColor = 0xff6600;
    if (this.nemesis.isBlocking()) nemesisColor = 0xff4444;
    if (this.nemesis.state === FIGHTER_STATES.HURT) nemesisColor = 0xff8888;
    this.nemesisIndicator.fillStyle(nemesisColor, 0.3);
    this.nemesisIndicator.fillEllipse(this.nemesis.x, ARENA_CONFIG.groundY + 2, 40, 8);
  }

  // ─── INICIO DE PARTIDA ───────────────────────────────────

  /**
   * Muestra animación de inicio de partida.
   * @private
   */
  _showMatchStart() {
    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2 - 40;

    const matchNum = (this.registry.get('saveData')?.playerStats?.totalMatches || 0) + 1;

    const readyText = this.add.text(cx, cy, `COMBATE #${matchNum}`, {
      fontSize: '24px',
      fontFamily: 'Courier New',
      color: '#cc4444',
      fontStyle: 'bold',
    }).setOrigin(0.5).setAlpha(0).setDepth(200);

    const fightText = this.add.text(cx, cy + 35, '¡PELEA!', {
      fontSize: '32px',
      fontFamily: 'Courier New',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5).setAlpha(0).setDepth(200);

    // Animación de entrada
    this.tweens.add({
      targets: readyText,
      alpha: 1,
      duration: 500,
      onComplete: () => {
        this.tweens.add({
          targets: fightText,
          alpha: 1,
          scaleX: { from: 2, to: 1 },
          scaleY: { from: 2, to: 1 },
          duration: 400,
          onComplete: () => {
            this.time.delayedCall(800, () => {
              this.tweens.add({
                targets: [readyText, fightText],
                alpha: 0,
                duration: 300,
                onComplete: () => {
                  readyText.destroy();
                  fightText.destroy();
                },
              });
            });
          },
        });
      },
    });
  }

  // ─── FIN DE PARTIDA ──────────────────────────────────────

  /**
   * Verifica si algún combatiente ha muerto.
   * @private
   */
  _checkMatchEnd() {
    if (this.player.isDead()) {
      this._endMatch(COMBAT_RESULTS.NEMESIS_WIN);
    } else if (this.nemesis.isDead()) {
      this._endMatch(COMBAT_RESULTS.PLAYER_WIN);
    }
  }

  /**
   * Finaliza la partida y procesa resultados.
   * @param {string} result - Resultado del combate
   * @private
   */
  _endMatch(result) {
    if (!this.matchActive) return;

    this.matchActive = false;
    this.matchResult = result;

    // Detener combatientes
    this.player.body.setVelocity(0, 0);
    this.nemesis.body.setVelocity(0, 0);

    // ─── Procesar estadísticas ────────────────────────────
    const matchSummary = this.statisticsSystem.getMatchSummary();
    
    // Inject Berserk stats into MatchSummary
    if (this.statisticsSystem.berserkStats) {
      matchSummary.berserkStats = this.statisticsSystem.berserkStats;
    } else {
      matchSummary.berserkStats = { special1Hits: 0, special2Hits: 0, orbitalHits: 0, brokenByDamage: false };
    }
    matchSummary.berserkStats.brokenByDamage = this.nemesisBrain.berserkBrokenByDamage || false;

    const saveData = this.registry.get('saveData');
    const matchNumber = saveData.playerStats.totalMatches + 1;

    // Acumular estadísticas del jugador
    this.statisticsSystem.accumulateToPlayerStats(saveData.playerStats, result);

    // ─── Procesar IA de Nemesis ───────────────────────────
    const analysisResult = this.nemesisBrain.processEndOfMatch(
      result, matchSummary, matchNumber
    );

    // Actualizar perfil del jugador detectado
    saveData.playerStats.detectedProfile = analysisResult.playerProfile;

    // Decaimiento de la memoria temporal
    this.adaptiveMomentum.applyRoundDecay();

    // ─── Serializar estado para guardado ──────────────────
    saveData.nemesisState = this.adaptationSystem.serialize();
    saveData.nemesisMomentum = this.adaptiveMomentum.serialize();
    saveData.nemesisMemory = this.nemesisMemory.serialize();
    saveData.nemesisComboMemory = this.comboMemory.serialize();
    saveData.nemesisKnowledge = this.nemesisKnowledge.serialize();
    saveData.nemesisProfile = this.nemesisProfile.serialize();
    saveData.frustration = this.frustrationRegulator.serialize();

    // Agregar al historial
    saveData.matchHistory.push({
      match: matchNumber,
      result,
      playerProfile: analysisResult.playerProfile,
      experienceGain: analysisResult.experienceGain,
      totalExperience: analysisResult.totalExperience,
      timestamp: Date.now(),
    });

    // Guardar datos actualizados en el registry
    this.registry.set('saveData', saveData);
    this.registry.set('lastMatchSummary', matchSummary);
    this.registry.set('lastAnalysisResult', analysisResult);
    this.registry.set('lastMatchResult', result);



    // ─── Mostrar resultado ────────────────────────────────
    this._showMatchResult(result, analysisResult);
  }

  /**
   * Transiciona a ResultScene tras guardar.
   * @param {string} result
   * @param {object} analysisResult
   * @private
   */
  _showMatchResult(result, analysisResult) {
    this.time.delayedCall(1000, () => {
      this.scene.start(SCENES.RESULT);
    });
  }

  // ─── PAUSA ───────────────────────────────────────────────

  /**
   * Pausa o reanuda la partida.
   * @private
   */
  _togglePause() {
    if (this.scene.isPaused()) {
      this.scene.resume();
    } else {
      this.scene.pause();
      this.scene.launch(SCENES.PAUSE);
    }
  }
}
