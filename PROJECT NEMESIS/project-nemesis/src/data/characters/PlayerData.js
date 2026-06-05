import { ANIMATION_EVENTS } from '../../game/events.js';

export const PlayerData = {
  version: 1,
  id: "player_base",
  stats: {
    maxHP: 100,
    speed: 250,
    jumpForce: 650
  },
  attacks: {
    quick_attack: {
      version: 1,
      id: "quick_attack",
      attackType: "melee",
      tags: ["melee", "light"],
      cooldown: 300,
      animationRef: "player_attack_quick",
      comboLinks: [],
      hitboxes: [
        {
          frameStart: 2,
          duration: 3,
          width: 60,
          height: 40,
          offsetX: 40,
          offsetY: 0,
          damage: 10,
          knockback: 100
        }
      ]
    }
  },
  animations: {
    player_idle: {
      version: 1,
      id: "player_idle",
      frames: 6,
      duration: 600,
      loop: true,
      rootMotion: { enabled: false },
      cancelWindows: [],
      events: []
    },
    player_attack_quick: {
      version: 1,
      id: "player_attack_quick",
      frames: 5,
      duration: 250,
      loop: false,
      rootMotion: { enabled: false },
      cancelWindows: [
        { frameStart: 3, frameEnd: 5, allowedTo: ["DASH", "JUMP"] }
      ],
      events: [
        {
          frame: 2,
          type: ANIMATION_EVENTS.SPAWN_HITBOX,
          payload: { attackId: "quick_attack", hitboxIndex: 0 }
        },
        {
          frame: 2,
          type: ANIMATION_EVENTS.PLAY_SFX,
          payload: { soundId: "hit_swoosh" }
        }
      ]
    }
  },
  sounds: {
    hit_swoosh: "player_hit_audio_key"
  },
  statusEffects: {},
  skins: {}
};
