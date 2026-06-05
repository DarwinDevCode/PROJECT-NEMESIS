/**
 * constants.js
 * Enums, estados, mapas de teclas y constantes de identificación.
 * Punto central de referencia para evitar strings mágicos en el código.
 */

// ─── Estados del combatiente ──────────────────────────────
export const FIGHTER_STATES = {
  IDLE: 'idle',
  MOVING: 'moving',
  JUMPING: 'jumping',
  ATTACKING: 'attacking',
  SPECIAL_ATTACKING: 'special_attacking',
  BLOCKING: 'blocking',
  DASHING: 'dashing',
  BERSERK: 'berserk',
  HURT: 'hurt',
  DEAD: 'dead',
};

// ─── Resultados de combate ────────────────────────────────
export const COMBAT_RESULTS = {
  PLAYER_WIN: 'player_win',
  NEMESIS_WIN: 'nemesis_win',
  SURRENDER: 'surrender',
};

// ─── Perfiles del jugador ─────────────────────────────────
export const PLAYER_PROFILES = {
  UNKNOWN: 'DESCONOCIDO',
  AGGRESSIVE: 'AGRESIVO',
  DEFENSIVE: 'DEFENSIVO',
  IMPULSIVE: 'IMPULSIVO',
  STRATEGIC: 'ESTRATÉGICO',
};

// ─── Perfiles estratégicos de Nemesis ─────────────────────
export const NEMESIS_PROFILES = {
  AGGRESSIVE: 'AGRESIVO',
  DEFENSIVE: 'DEFENSIVO',
  BALANCED: 'EQUILIBRADO',
  ADAPTIVE: 'ADAPTATIVO',
};

// ─── Habilidades de Nemesis ───────────────────────────────
export const NEMESIS_SKILLS = {
  BLOCK: 'block',
  COUNTERATTACK: 'counterattack',
  DODGE: 'dodge',
  PREDICTION: 'prediction',
  NEMESIS_MODE: 'nemesisMode',
};

// ─── Nombres legibles de habilidades (para UI) ────────────
export const SKILL_NAMES = {
  [NEMESIS_SKILLS.BLOCK]: 'Bloqueo',
  [NEMESIS_SKILLS.COUNTERATTACK]: 'Contraataque',
  [NEMESIS_SKILLS.DODGE]: 'Esquiva',
  [NEMESIS_SKILLS.PREDICTION]: 'Predicción',
  [NEMESIS_SKILLS.NEMESIS_MODE]: 'Modo Nemesis',
};

// ─── Tipos de evento en NemesisMemory ─────────────────────
export const MEMORY_EVENT_TYPES = {
  LEARNING: 'learning',
  PATTERN: 'pattern',
  SKILL_UNLOCK: 'skill_unlock',
  MATCH: 'match',
  PROFILE_CHANGE: 'profile_change',
};

// ─── Acciones que puede ejecutar Nemesis ──────────────────
export const NEMESIS_ACTIONS = {
  IDLE: 'idle',
  MOVE_TOWARDS: 'move_towards',
  MOVE_AWAY: 'move_away',
  JUMP: 'jump',
  ATTACK_QUICK: 'attack_quick',
  ATTACK_HEAVY: 'attack_heavy',
  BLOCK: 'block',
  DASH: 'dash',
  ENERGY_PULSE: 'energy_pulse',
  ORBITAL_STRIKE: 'orbital_strike',
};

// ─── Direcciones ──────────────────────────────────────────
export const DIRECTIONS = {
  LEFT: 'left',
  RIGHT: 'right',
  NONE: 'none',
};

// ─── Teclas de control ────────────────────────────────────
export const KEY_BINDINGS = {
  MOVE_LEFT: ['A', 'LEFT'],
  MOVE_RIGHT: ['D', 'RIGHT'],
  JUMP: ['W', 'SPACE'],
  QUICK_ATTACK: ['J'],
  SPECIAL_ATTACK: ['K'],
  BLOCK: ['L'],
  DASH: ['SHIFT', 'I'],
  PAUSE: ['ESC'],
};

// ─── Escenas ──────────────────────────────────────────────
export const SCENES = {
  BOOT: 'BootScene',
  MENU: 'MenuScene',
  PREPARE: 'PrepareScene',
  ARENA: 'ArenaScene',
  PAUSE: 'PauseScene',
  RESULT: 'ResultScene',
  ANALYSIS: 'AnalysisScene',
  PROFILE: 'ProfileScene',
  NEMESIS_STATS: 'NemesisStatsScene',
  OPTIONS: 'OptionsScene',
};

// ─── Versión de datos guardados ───────────────────────────
export const SAVE_VERSION = '1.0';
export const SAVE_KEY = 'project_nemesis_save';
