/**
 * characterSystemConfig.js
 * Configuración centralizada para la nueva arquitectura Data-Driven de personajes.
 * Incluye Feature Flags, políticas de pooling y límites de rendimiento.
 */

export const CHARACTER_SYSTEM_CONFIG = {
  // ─── Feature Flags ──────────────────────────────────────────────
  FLAGS: {
    USE_NEW_EVENT_BUS: true,
    USE_NEW_ANIMATION_SYSTEM: true,
    USE_NEW_HITBOX_SYSTEM: true, // Phase 3 enabled
    USE_NEW_COMBAT_PIPELINE: true, // Phase 3 enabled
    ENABLE_DEBUG_OVERLAY: true,   // Overlay de métricas y cajas visuales
  },

  // ─── Versiones de Datos ─────────────────────────────────────────
  DATA: {
    CURRENT_VERSION: 1,
    SUPPORTED_VERSIONS: [1]
  },

  // ─── Políticas de Object Pooling ────────────────────────────────
  POOLING: {
    MAX_HITBOXES: 50,    // Límite de hitboxes en memoria por partida
    MAX_HURTBOXES: 20,   // Límite de hurtboxes en memoria
    MAX_VFX: 100         // Límite de partículas/efectos
  },

  // ─── Límites de Rendimiento (Performance Protections) ───────────
  LIMITS: {
    MAX_EVENTS_PER_FRAME: 50,  // Prevención de desbordamientos de eventos
    MAX_COMBO_LINKS: 5         // Máximo de profundidad de combo permitida
  }
};
