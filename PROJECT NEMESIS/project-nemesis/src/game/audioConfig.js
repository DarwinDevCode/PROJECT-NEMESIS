/**
 * audioConfig.js
 * Configuración centralizada de audio para Project Nemesis.
 *
 * Agregar o quitar pistas/efectos solo requiere editar este archivo.
 * El código del juego NUNCA referencia paths directos — solo claves lógicas.
 */

// ─── CLAVES DE AUDIO ──────────────────────────────────────────

export const AUDIO_KEYS = {
  // Nemesis SFX
  NEMESIS_DASH: 'nemesis_dash',
  NEMESIS_HIT: 'nemesis_hit',
  NEMESIS_BLOCK: 'nemesis_block',
  NEMESIS_JUMP: 'nemesis_jump',
  NEMESIS_BERSERK: 'nemesis_berserk',
  NEMESIS_IMPALER: 'nemesis_impaler',
  NEMESIS_NEURO_STORM: 'nemesis_neuro_storm',
  NEMESIS_SYNAPTIC_COLLAPSE: 'nemesis_synaptic_collapse',

  // Player SFX
  PLAYER_HIT: 'player_hit',
  PLAYER_HEAVY_HIT: 'player_heavy_hit',
  PLAYER_DASH: 'player_dash',
  PLAYER_BLOCK: 'player_block',
  PLAYER_JUMP: 'player_jump',
  PLAYER_SPECIAL: 'player_special',

  // UI SFX (preparados — assets se agregan después)
  UI_HOVER: 'ui_hover',
  UI_CLICK: 'ui_click',
  UI_CONFIRM: 'ui_confirm',
  UI_CANCEL: 'ui_cancel',
  MATCH_START: 'match_start',
  MATCH_END: 'match_end',
  VICTORY: 'victory',
  DEFEAT: 'defeat',
};

// ─── LISTA GLOBAL DE MÚSICA ───────────────────────────────
// Reproducción continua global. No se reinicia entre escenas.
// Solo cambia al terminar la pista o por decisión del jugador.

export const MUSIC_TRACKS = [
  'music_track_01',
  'music_track_02',
  'music_track_03',
  'music_track_04',
  'music_track_05',
  'music_track_06',
];

// ─── MANIFEST DE CARGA ───────────────────────────────────────
// BootScene itera este array para cargar todos los assets de audio.
// Solo contiene assets que realmente existen en el proyecto.

export const AUDIO_MANIFEST = [
  // ── Música ──
  { key: 'music_track_01', path: '/src/assets/audio/music/Project Nemesis interface v8.mp3' },
  { key: 'music_track_02', path: '/src/assets/audio/music/Project Nemesis interface v9.mp3' },
  { key: 'music_track_03', path: '/src/assets/audio/music/Project Nemesis interface v10.mp3' },
  { key: 'music_track_04', path: '/src/assets/audio/music/Project Nemesis interface v11.mp3' },
  { key: 'music_track_05', path: '/src/assets/audio/music/Project Nemesis interface v12.mp3' },
  { key: 'music_track_06', path: '/src/assets/audio/music/Project Nemesis interface v13.mp3' },

  // ── SFX Nemesis ──
  { key: 'nemesis_berserk', path: '/src/assets/audio/sfx/nemesis/nemesis-berserk v2.wav' },
  { key: 'nemesis_impaler', path: '/src/assets/audio/sfx/nemesis/nemesis-crimson-impaler.wav' },
  { key: 'nemesis_dash', path: '/src/assets/audio/sfx/nemesis/nemesis-dash v2.wav' },
  { key: 'nemesis_block', path: '/src/assets/audio/sfx/nemesis/nemesis-defensive-block.wav' },
  { key: 'nemesis_hit', path: '/src/assets/audio/sfx/nemesis/nemesis-golpe v2.wav' },
  { key: 'nemesis_jump', path: '/src/assets/audio/sfx/nemesis/nemesis-jump.wav' },
  { key: 'nemesis_neuro_storm', path: '/src/assets/audio/sfx/nemesis/nemesis-neuro-storm.wav' },
  { key: 'nemesis_synaptic_collapse', path: '/src/assets/audio/sfx/nemesis/nemesis-synaptic_collapse.wav' },

  // ── SFX Player ──
  { key: 'player_hit', path: '/src/assets/audio/sfx/player/jugador-golpe.wav' },
  { key: 'player_heavy_hit', path: '/src/assets/audio/sfx/player/jugador-golpe-fuerte.wav' },
  { key: 'player_dash', path: '/src/assets/audio/sfx/player/jugador-dash.wav' },
  { key: 'player_block', path: '/src/assets/audio/sfx/player/jugador-bloqueo.wav' },
  { key: 'player_jump', path: '/src/assets/audio/sfx/player/jugador-salto.wav' },
  { key: 'player_special', path: '/src/assets/audio/sfx/player/jugador-ataque-especial.wav' },
];

// ─── SISTEMA DE VARIANTES ─────────────────────────────────────
// Cada clave mapea a un array de sub-claves reales del manifest.
// Si solo hay 1 variante, el array tiene 1 elemento.
// Claves sin entrada aquí usan su key directamente (1 variante implícita).
//
// Futuro: ['player_hit_01', 'player_hit_02', 'player_hit_03']

export const SFX_VARIANTS = {
  // Por ahora todas tienen 1 variante, pero la arquitectura está lista
  // para agregar más sin modificar código.
};

// ─── VOLÚMENES POR CATEGORÍA ──────────────────────────────────
// Fórmula de mezcla: volumeFinal = master × categoría × overrideOpcional

export const VOLUME_CONFIG = {
  master: 1.0,       // Volumen global multiplicador
  music: 0.70,       // Música de fondo (predominante)
  ui: 0.30,          // Interfaz (hover, click, confirmaciones)
  combat: 0.35,      // Golpes, dash, bloqueo, salto
  special: 0.50,     // Berserk, Impaler, Neuro Storm, Collapse
  voice: 0.45,       // Futuro: voces de Nemesis
};

// ─── CATEGORÍA POR CLAVE ──────────────────────────────────────
// Default: 'combat' si no está listada aquí.

export const SFX_CATEGORY = {
  [AUDIO_KEYS.NEMESIS_BERSERK]: 'special',
  [AUDIO_KEYS.NEMESIS_IMPALER]: 'special',
  [AUDIO_KEYS.NEMESIS_NEURO_STORM]: 'special',
  [AUDIO_KEYS.NEMESIS_SYNAPTIC_COLLAPSE]: 'special',
  [AUDIO_KEYS.UI_HOVER]: 'ui',
  [AUDIO_KEYS.UI_CLICK]: 'ui',
  [AUDIO_KEYS.UI_CONFIRM]: 'ui',
  [AUDIO_KEYS.UI_CANCEL]: 'ui',
  [AUDIO_KEYS.MATCH_START]: 'ui',
  [AUDIO_KEYS.MATCH_END]: 'ui',
  [AUDIO_KEYS.VICTORY]: 'ui',
  [AUDIO_KEYS.DEFEAT]: 'ui',
};

// ─── COOLDOWNS ANTI-SATURACIÓN (ms) ──────────────────────────
// Tiempo mínimo entre reproducciones del mismo sonido.

export const SFX_COOLDOWNS = {
  [AUDIO_KEYS.NEMESIS_HIT]: 80,
  [AUDIO_KEYS.PLAYER_HIT]: 80,
  [AUDIO_KEYS.PLAYER_HEAVY_HIT]: 80,
  [AUDIO_KEYS.NEMESIS_DASH]: 200,
  [AUDIO_KEYS.PLAYER_DASH]: 200,
  [AUDIO_KEYS.NEMESIS_BLOCK]: 150,
  [AUDIO_KEYS.PLAYER_BLOCK]: 150,
  [AUDIO_KEYS.NEMESIS_JUMP]: 150,
  [AUDIO_KEYS.PLAYER_JUMP]: 150,
  default: 50,
};

// ─── DUCKING (reducción de música durante eventos) ────────────
// El ducking se vincula al estado real de Berserk, no a un timer fijo.

export const DUCKING_CONFIG = {
  berserk: {
    targetMusicVolume: 0.15, // Música baja a 15% del volumen de categoría
    duckDuration: 500,       // ms para bajar gradualmente
    restoreDuration: 2000,   // ms para restaurar al salir de Berserk
  },
};
