import { ANIMATION_EVENTS } from '../../game/events.js';

export const NemesisData = {
  version: 1,
  id: "nemesis_base",
  stats: {
    maxHP: 100,
    speed: 180,
    jumpForce: 350,
    hurtbox: { width: 80, height: 120 }
  },
  skills: ['block'], // Habilita lógica nativa de guard en hurtboxes
  attacks: {
    attack: {
      version: 1, id: "attack", attackType: "melee", tags: ["melee"],
      cooldown: 1200, animationRef: "nemesis_attacking", comboLinks: [],
      hitboxes: [{ frameStart: 4, duration: 4, width: 80, height: 80, offsetX: 60, offsetY: -20, damage: 12, knockback: 300 }]
    },
    energy_pulse: {
      version: 1, id: "energy_pulse", attackType: "aoe", tags: ["aoe", "energy"],
      cooldown: 8000, animationRef: "nemesis_energy_pulse", comboLinks: [],
      // Explicit Radii Mapping: Derivado del frame visual de 512x512.
      // visualRadius: 256, collisionRadius: 220, damageRadius: 220
      hitboxes: [{ frameStart: 8, duration: 8, width: 300, height: 300, offsetX: 0, offsetY: 0, damage: 25, knockback: 500, circular: true, radius: 150 }]
    },
    orbital_strike: {
      version: 1, id: "orbital_strike", attackType: "ultimate", tags: ["ultimate", "energy", "ranged"],
      cooldown: 12000, animationRef: "nemesis_idle", comboLinks: [],
      hitboxes: [] // Las hitboxes del orbital beam se generan dinámicamente en coordenadas congeladas en Nemesis.js
    }
  },
  animations: {
    nemesis_idle: { version: 1, id: "nemesis_idle", frames: 8, duration: 800, loop: true, rootMotion: { enabled: false }, cancelWindows: [], events: [] },
    nemesis_walk: { version: 1, id: "nemesis_walk", frames: 8, duration: 800, loop: true, rootMotion: { enabled: false }, cancelWindows: [], events: [] },
    nemesis_jump: { version: 1, id: "nemesis_jump", frames: 8, duration: 800, loop: false, rootMotion: { enabled: false }, cancelWindows: [], events: [] },
    nemesis_attacking: {
      version: 1, id: "nemesis_attacking", frames: 8, duration: 500, loop: false, rootMotion: { enabled: false },
      cancelWindows: [],
      events: [{ frame: 4, type: ANIMATION_EVENTS.SPAWN_HITBOX, payload: { attackId: "attack", hitboxIndex: 0 } }]
    },
    nemesis_energy_pulse: {
      version: 1, id: "nemesis_energy_pulse", frames: 10, duration: 800, loop: false, rootMotion: { enabled: false },
      cancelWindows: [],
      events: [{ frame: 5, type: ANIMATION_EVENTS.SPAWN_HITBOX, payload: { attackId: "energy_pulse", hitboxIndex: 0 } }]
    }
    // Rayo Orbital (16 frames) se lanza dinámicamente desde el marcador, por lo que su animación principal de casteo es 'nemesis_idle'
  },
  sounds: {
    hit_swoosh: "hit_swoosh_audio_key",
    hit_heavy: "hit_heavy_audio_key",
    dash_swoosh: "dash_audio_key"
  },
  statusEffects: {},
  skins: {},
  aiProfile: { aggression: 0.8, preferredRange: 100 }
};
