/**
 * AudioManager.js
 * Gestor global de audio (Singleton).
 *
 * Responsabilidades:
 * - Música rotativa con shuffle inteligente (evita últimas 2 pistas)
 * - Fade in / fade out suave entre escenas
 * - SFX con cooldowns anti-saturación
 * - Sistema de variantes por acción
 * - Ducking de música para Berserk (enterBerserkMix / exitBerserkMix)
 * - Categorías de volumen independientes (master × categoría × override)
 * - Tolerancia total a errores (nunca rompe el juego)
 *
 * El AudioManager NO escribe estadísticas de gameplay.
 * El audio es siempre una consecuencia de acciones, nunca fuente de verdad.
 */

import {
  MUSIC_TRACKS,
  SFX_VARIANTS,
  VOLUME_CONFIG,
  SFX_CATEGORY,
  SFX_COOLDOWNS,
  DUCKING_CONFIG,
} from '../game/audioConfig.js';

export default class AudioManager {
  /**
   * @param {Phaser.Scene} scene - La escena que crea el manager (usualmente BootScene)
   * @param {object} settings - La configuración de audio de SaveManager
   */
  constructor(scene, settings) {
    if (AudioManager.instance) {
      return AudioManager.instance;
    }

    this._scene = scene;
    this._game = scene.game;
    this._soundManager = scene.game.sound; // Global — siempre activo

    this._settings = settings.audio || {
      masterVolume: 1.0,
      musicVolume: 0.8,
      effectsVolume: 0.8,
      muted: false,
    };

    // Aplicar mute global si aplica
    this._game.sound.mute = this._settings.muted;
    this._game.sound.volume = this._settings.masterVolume;

    // ─── Estado de música ──────────────────────────────────
    this._currentMusic = null;
    this._musicKey = null;
    this._musicHistory = [];          // Últimas 2 pistas (anti-repetición)
    this._handleTrackComplete = null; // Referencia al listener para limpieza
    this._activeTrackList = MUSIC_TRACKS;

    // ─── Estado de SFX ─────────────────────────────────────
    this._lastPlayedSfx = {};   // Map<key, timestamp> para cooldowns
    this._lastVariant = {};     // Map<key, lastIndex> para variantes

    // ─── Estado de ducking ─────────────────────────────────
    this._isDucking = false;
    this._preDuckVolume = 0;

    // ─── AudioContext desbloqueo ───────────────────────────
    this._unlocked = false;
    this._pendingAction = null; // { method: 'menu'|'combat' }

    // Verificar si el audio ya está disponible
    const ctx = this._game.sound.context;
    if (!ctx || ctx.state === 'running') {
      this._unlocked = true;
    } else {
      // Estrategia 1: Evento nativo de Phaser (si existe)
      if (typeof this._game.sound.once === 'function') {
        this._game.sound.once('unlocked', () => {
          this._handleUnlock();
        });
      }

      // Estrategia 2: Detectar interacción del usuario como fallback
      const onInteraction = () => {
        if (this._unlocked) return;
        if (ctx && ctx.state === 'suspended') {
          ctx.resume().then(() => this._handleUnlock()).catch(() => {});
        } else {
          this._handleUnlock();
        }
        document.removeEventListener('pointerdown', onInteraction);
        document.removeEventListener('keydown', onInteraction);
      };
      document.addEventListener('pointerdown', onInteraction);
      document.addEventListener('keydown', onInteraction);
    }

    AudioManager.instance = this;
  }

  /**
   * Maneja el desbloqueo del AudioContext.
   * Reproduce cualquier acción de música pendiente.
   * @private
   */
  _handleUnlock() {
    if (this._unlocked) return; // Evitar doble ejecución
    this._unlocked = true;
    if (this._pendingAction) {
      const action = this._pendingAction;
      this._pendingAction = null;
      if (action.method === 'start') this.startMusic();
      else if (action.method === 'next') this.nextTrack();
    }
  }

  // ─── SETTINGS ─────────────────────────────────────────────

  /**
   * Actualiza la configuración de audio y la aplica inmediatamente.
   * @param {object} newAudioSettings
   */
  updateSettings(newAudioSettings) {
    this._settings = newAudioSettings;
    this._game.sound.mute = this._settings.muted;
    this._game.sound.volume = this._settings.masterVolume;

    // Si hay música y la escena activa tiene tweens, actualizar volumen con transición
    if (this._currentMusic) {
      const activeScene = this._getActiveScene();
      if (activeScene) {
        activeScene.tweens.add({
          targets: this._currentMusic,
          volume: this._getMusicVolume(),
          duration: 200,
        });
      } else {
        this._currentMusic.setVolume(this._getMusicVolume());
      }
    }
  }

  // ─── MÚSICA ───────────────────────────────────────────

  /**
   * Inicia la música global si no hay ninguna pista reproduciéndose.
   * Llamar solo desde MenuScene (primera carga).
   */
  startMusic() {
    if (!this._unlocked) {
      this._pendingAction = { method: 'start' };
      return;
    }
    // Si ya hay música sonando, no hacer nada
    if (this._currentMusic && this._currentMusic.isPlaying) return;
    this._playNextTrack();
  }

  /**
   * Cambia a la siguiente canción con fade out + fade in.
   * Llamado por el jugador desde el menú de pausa/opciones.
   */
  nextTrack() {
    if (!this._unlocked) {
      this._pendingAction = { method: 'next' };
      return;
    }
    this.fadeOutMusic(800).then(() => this._playNextTrack());
  }

  /**
   * Mantiene compatibilidad con código existente.
   * @deprecated Usar startMusic() en su lugar.
   */
  playMenuMusic() { this.startMusic(); }
  playCombatMusic() { this.startMusic(); }

  /**
   * Detiene la música inmediatamente.
   */
  stopMusic() {
    if (this._currentMusic) {
      this._cleanupMusicListeners();
      this._currentMusic.stop();
      this._currentMusic.destroy();
      this._currentMusic = null;
      this._musicKey = null;
    }
    // Safety net: siempre resetear ducking al detener música
    this._isDucking = false;
  }

  /**
   * Hace fade out de la música actual.
   * @param {number} duration - Duración del fade en ms
   * @returns {Promise} Resuelve cuando el fade termina
   */
  fadeOutMusic(duration = 800) {
    return new Promise((resolve) => {
      if (!this._currentMusic || !this._currentMusic.isPlaying) {
        this.stopMusic();
        resolve();
        return;
      }

      try {
        const activeScene = this._getActiveScene();
        if (activeScene) {
          activeScene.tweens.add({
            targets: this._currentMusic,
            volume: 0,
            duration: duration,
            onComplete: () => {
              this.stopMusic();
              resolve();
            },
          });
        } else {
          this.stopMusic();
          resolve();
        }
      } catch (e) {
        console.warn('[AudioManager] Error en fadeOutMusic:', e.message);
        this.stopMusic();
        resolve();
      }
    });
  }

  /**
   * Selecciona y reproduce la siguiente pista con fade in.
   * @private
   */
  _playNextTrack(trackList) {
    // Guardar la lista actual para rotación automática
    if (trackList) this._activeTrackList = trackList;
    const list = this._activeTrackList;
    if (!list || list.length === 0) return;

    const track = this._selectNextTrack(list);
    if (!track) return;

    if (!this._audioExists(track)) {
      console.warn(`[AudioManager] Pista de música "${track}" no encontrada en caché.`);
      return;
    }

    try {
      // Limpiar listeners anteriores antes de crear nueva instancia
      this._cleanupMusicListeners();
      if (this._currentMusic) {
        this._currentMusic.stop();
        this._currentMusic.destroy();
      }

      this._currentMusic = this._soundManager.add(track, {
        volume: 0,
        loop: false,
      });

      // Crear listener para rotación automática
      this._handleTrackComplete = () => {
        this._playNextTrack();
      };
      this._currentMusic.on('complete', this._handleTrackComplete);

      this._currentMusic.play();
      this._musicKey = track;

      // Fade in usando la escena activa para tweens
      const targetVolume = this._isDucking
        ? DUCKING_CONFIG.berserk.targetMusicVolume * VOLUME_CONFIG.master
        : this._getMusicVolume();

      const activeScene = this._getActiveScene();
      if (activeScene) {
        activeScene.tweens.add({
          targets: this._currentMusic,
          volume: targetVolume,
          duration: 1000,
        });
      } else {
        // Sin escena activa, aplicar volumen directamente
        this._currentMusic.setVolume(targetVolume);
      }
    } catch (e) {
      console.warn(`[AudioManager] Error al reproducir pista "${track}":`, e.message);
    }
  }

  /**
   * Selecciona la siguiente pista evitando las últimas 2 reproducidas.
   * @param {Array} trackList
   * @returns {string|null}
   * @private
   */
  _selectNextTrack(trackList) {
    if (!trackList || trackList.length === 0) return null;

    // Si solo hay 1 pista, no queda opción
    if (trackList.length === 1) return trackList[0];

    let available = trackList.filter((t) => !this._musicHistory.includes(t));

    // Si todas fueron reproducidas, reiniciar ciclo (solo evitar la última)
    if (available.length === 0) {
      this._musicHistory = this._musicHistory.length > 0
        ? [this._musicHistory[this._musicHistory.length - 1]]
        : [];
      available = trackList.filter((t) => !this._musicHistory.includes(t));
      if (available.length === 0) available = [...trackList];
    }

    const selected = available[Math.floor(Math.random() * available.length)];

    this._musicHistory.push(selected);
    if (this._musicHistory.length > 2) {
      this._musicHistory.shift();
    }

    return selected;
  }

  /**
   * Limpia listeners de la pista de música actual.
   * @private
   */
  _cleanupMusicListeners() {
    if (this._currentMusic && this._handleTrackComplete) {
      this._currentMusic.off('complete', this._handleTrackComplete);
      this._handleTrackComplete = null;
    }
  }

  /**
   * Calcula el volumen de música final.
   * @returns {number}
   * @private
   */
  _getMusicVolume() {
    return VOLUME_CONFIG.master * VOLUME_CONFIG.music * (this._settings.musicVolume ?? 0.8);
  }

  // ─── SFX ──────────────────────────────────────────────────

  /**
   * Reproduce un efecto de sonido con validación, cooldown, variantes y volumen por categoría.
   * @param {string} key - Clave lógica del AUDIO_KEYS
   * @param {object} opts - { volume?: number } override opcional
   */
  playSfx(key, opts = {}) {
    try {
      // Verificar cooldown
      const now = Date.now();
      const cooldown = SFX_COOLDOWNS[key] ?? SFX_COOLDOWNS.default ?? 50;
      const lastPlayed = this._lastPlayedSfx[key] || 0;

      if (now - lastPlayed < cooldown) return;

      // Resolver variante
      const resolvedKey = this._resolveVariant(key);

      // Verificar existencia en caché
      if (!this._audioExists(resolvedKey)) {
        // No warn para UI SFX que aún no existen — es esperado
        const category = SFX_CATEGORY[key] || 'combat';
        if (category !== 'ui') {
          console.warn(`[AudioManager] SFX "${resolvedKey}" no encontrado en caché.`);
        }
        return;
      }

      // Calcular volumen: master × categoría × override
      const category = SFX_CATEGORY[key] || 'combat';
      const categoryVolume = VOLUME_CONFIG[category] ?? VOLUME_CONFIG.combat;
      const volume = VOLUME_CONFIG.master * categoryVolume * (opts.volume ?? 1) * (this._settings.effectsVolume ?? 0.8);

      // Reproducir usando el pool nativo de Phaser (fire-and-forget)
      this._soundManager.play(resolvedKey, { volume });

      // Registrar timestamp para cooldown
      this._lastPlayedSfx[key] = now;
    } catch (e) {
      console.warn(`[AudioManager] Error al reproducir SFX "${key}":`, e.message);
    }
  }

  /**
   * Shortcut para sonidos de interfaz.
   * @param {string} key
   */
  playUiSfx(key) {
    this.playSfx(key);
  }

  /**
   * Compatibilidad con código que usa el nombre anterior.
   * @deprecated Usar playSfx en su lugar.
   */
  playSFX(key, config = {}) {
    this.playSfx(key, config);
  }

  /**
   * Selecciona una variante aleatoria sin repetir la última.
   * @param {string} key
   * @returns {string} La clave real a reproducir
   * @private
   */
  _resolveVariant(key) {
    const variants = SFX_VARIANTS[key];

    // Sin variantes configuradas o config inválida → usar la key directamente
    if (!variants || !Array.isArray(variants) || variants.length === 0) {
      return key;
    }

    // Solo 1 variante → usarla siempre
    if (variants.length === 1) return variants[0];

    // Múltiples variantes → selección aleatoria evitando la última
    const lastIdx = this._lastVariant[key] ?? -1;
    let idx;
    do {
      idx = Math.floor(Math.random() * variants.length);
    } while (idx === lastIdx && variants.length > 1);

    this._lastVariant[key] = idx;
    return variants[idx];
  }

  // ─── DUCKING (Berserk) ────────────────────────────────────

  /**
   * Reduce el volumen de la música durante Berserk.
   * Llamar al activar Berserk. Se mantiene hasta exitBerserkMix().
   */
  enterBerserkMix() {
    if (!this._currentMusic || this._isDucking) return;

    this._isDucking = true;
    this._preDuckVolume = this._currentMusic.volume;

    const cfg = DUCKING_CONFIG.berserk;

    try {
      const activeScene = this._getActiveScene();
      if (!activeScene) return;

      activeScene.tweens.add({
        targets: this._currentMusic,
        volume: cfg.targetMusicVolume * VOLUME_CONFIG.master,
        duration: cfg.duckDuration,
      });
    } catch (e) {
      console.warn('[AudioManager] Error en enterBerserkMix:', e.message);
    }
  }

  /**
   * Restaura el volumen de la música tras finalizar Berserk.
   * Llamar al terminar Berserk (incluido fin prematuro por daño).
   */
  exitBerserkMix() {
    if (!this._isDucking) return;

    // Si la música ya no existe (cambió de escena), solo resetear flag
    if (!this._currentMusic) {
      this._isDucking = false;
      return;
    }

    const cfg = DUCKING_CONFIG.berserk;

    try {
      const activeScene = this._getActiveScene();
      if (!activeScene) {
        this._currentMusic.setVolume(this._preDuckVolume);
        this._isDucking = false;
        return;
      }

      activeScene.tweens.add({
        targets: this._currentMusic,
        volume: this._preDuckVolume,
        duration: cfg.restoreDuration,
        onComplete: () => {
          this._isDucking = false;
        },
      });
    } catch (e) {
      console.warn('[AudioManager] Error en exitBerserkMix:', e.message);
      this._isDucking = false;
    }
  }

  // ─── VOICE (preparado para expansión futura) ──────────────

  /**
   * Reproduce una voz de Nemesis. Stub delegado a playSfx.
   * @param {string} key
   * @param {object} opts
   */
  playVoice(key, opts = {}) {
    this.playSfx(key, { ...opts, category: 'voice' });
  }

  // ─── UTILIDADES ───────────────────────────────────────────

  /**
   * Verifica si un audio existe en la caché de Phaser.
   * @param {string} key
   * @returns {boolean}
   * @private
   */
  _audioExists(key) {
    try {
      return this._game && this._game.cache && this._game.cache.audio.exists(key);
    } catch (e) {
      return false;
    }
  }

  /**
   * Obtiene la escena activa actual para usar tweens.
   * @returns {Phaser.Scene|null}
   * @private
   */
  _getActiveScene() {
    try {
      const scenes = this._game.scene.getScenes(true);
      return scenes.length > 0 ? scenes[0] : null;
    } catch (e) {
      return null;
    }
  }

  /**
   * Getter estático para acceder a la instancia global.
   * @returns {AudioManager|null}
   */
  static getInstance() {
    if (!AudioManager.instance) {
      // No error — puede que BootScene aún no haya corrido
      return null;
    }
    return AudioManager.instance;
  }
}
