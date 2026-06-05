/**
 * events.js
 * Catálogo centralizado de identificadores de eventos (Event Bus).
 * Se divide en eventos globales (Arena/Match), locales (por Fighter) 
 * y los permitidos como Animation Events.
 */

export const GLOBAL_EVENTS = {
  CAMERA_SHAKE: 'global_camera_shake',
  PLAY_GLOBAL_SFX: 'global_play_sfx',
  MATCH_STARTED: 'global_match_started',
  MATCH_ENDED: 'global_match_ended',
  PLAYER_DEFEATED: 'global_player_defeated',
  NEMESIS_DEFEATED: 'global_nemesis_defeated',
  HITBOX_COLLISION: 'global_hitbox_collision', // Emitido por HitboxController
  STATISTICS_UPDATED: 'global_statistics_updated',
  UI_UPDATE: 'global_ui_update',
  
  // Telemetry Hooks
  TELEMETRY_DAMAGE_DEALT: 'telemetry_damage_dealt',
  TELEMETRY_COMBO_FINISHED: 'telemetry_combo_finished',
  TELEMETRY_BERSERK_ACTIVATED: 'telemetry_berserk_activated',
};

export const LOCAL_EVENTS = {
  ATTACK_STARTED: 'local_attack_started',
  ATTACK_ENDED: 'local_attack_ended',
  ATTACK_CANCELLED: 'local_attack_cancelled',
  ANIMATION_CHANGED: 'local_animation_changed',
  ANIMATION_COMPLETED: 'local_animation_completed',
  SPAWN_HITBOX: 'local_spawn_hitbox',
  REMOVE_HITBOX: 'local_remove_hitbox',
  STATE_CHANGED: 'local_state_changed',
  DAMAGE_TAKEN: 'local_damage_taken',
  HEALED: 'local_healed',
  DIED: 'local_died',
  BERSERK_STARTED: 'local_berserk_started',
  BERSERK_ENDED: 'local_berserk_ended',
};

export const ANIMATION_EVENTS = {
  SPAWN_HITBOX: 'SPAWN_HITBOX',
  REMOVE_HITBOX: 'REMOVE_HITBOX',
  PLAY_SFX: 'PLAY_SFX',
  STOP_SFX: 'STOP_SFX',
  SPAWN_VFX: 'SPAWN_VFX',
  REMOVE_VFX: 'REMOVE_VFX',
  CAMERA_SHAKE: 'CAMERA_SHAKE',
  FREEZE_FRAME: 'FREEZE_FRAME', // Hitstop
  START_ATTACK: 'START_ATTACK',
  END_ATTACK: 'END_ATTACK',
  ENABLE_CANCEL: 'ENABLE_CANCEL',
  DISABLE_CANCEL: 'DISABLE_CANCEL',
  ENABLE_MOVEMENT: 'ENABLE_MOVEMENT',
  DISABLE_MOVEMENT: 'DISABLE_MOVEMENT',
  ENABLE_INPUT: 'ENABLE_INPUT',
  DISABLE_INPUT: 'DISABLE_INPUT',
};
