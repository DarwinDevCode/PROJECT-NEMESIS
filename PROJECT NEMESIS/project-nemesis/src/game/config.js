/**
 * config.js
 * Constantes de balance y configuración del juego.
 * Todos los valores numéricos ajustables se centralizan aquí
 * para facilitar el balanceo iterativo.
 */

// ─── Resolución ───────────────────────────────────────────
export const GAME_WIDTH = 960;
export const GAME_HEIGHT = 540;

// ─── Combatientes ─────────────────────────────────────────
export const FIGHTER_CONFIG = {
  maxHP: 100,
  speed: 200,
  jumpForce: 380,
  gravity: 600,

  // Gravedad extra durante la caída (se SUMA a la global)
  // Total en caída = gravity + fallGravityBoost = 1200
  fallGravityBoost: 600,

  // Ataque rápido
  quickAttackDamage: 10,
  quickAttackRange: 60,            // +20% desde 50 (iteración conservadora)
  quickAttackDuration: 500,        // 12 frames @ 24fps = 500ms
  quickAttackCooldown: 400,

  // Ataque especial
  specialAttackDamage: 25,
  specialAttackRange: 75,          // +15% desde 65 (iteración conservadora)
  specialAttackDuration: 600,      // 12 frames @ 20fps = 600ms
  specialAttackCooldown: 3000,

  // Bloqueo
  blockDamageReduction: 0.8,
  blockMovementPenalty: 0.3,

  // Dash
  dashSpeedX: 600,
  dashDuration: 250,
  dashCooldown: 1500,

  // Invencibilidad post-golpe
  iframeDuration: 500,

  // Hitbox
  bodyWidth: 40,
  bodyHeight: 64,

  // Input Assist
  coyoteTime: 100,       // ms para saltar después de abandonar el suelo
  jumpBufferTime: 100,   // ms para registrar intención de salto antes de aterrizar
};

// ─── Arena ────────────────────────────────────────────────
export const ARENA_CONFIG = {
  groundY: GAME_HEIGHT - 60,   // posición Y del suelo
  wallLeftX: 30,               // pared izquierda
  wallRightX: GAME_WIDTH - 30, // pared derecha
  playerStartX: 200,
  nemesisStartX: GAME_WIDTH - 200,
};

// ─── Adaptación de Nemesis ────────────────────────────────
// Umbrales calibrados para demo (4 desbloqueos visibles en 5 partidas)
export const ADAPTATION_CONFIG = {
  maxPerMatch: 12,             // máximo % de adaptación por partida

  // Factores de aprendizaje según resultado
  learningFactors: {
    playerWin: 1.0,            // 100% → 12% efectivo
    playerSurrender: 0.5,      // 50%  → 6% efectivo
    nemesisWin: 0.2,           // 20%  → 2.4% efectivo
  },

  // Umbrales de desbloqueo de habilidades
  thresholds: {
    block: 12,                 // Partida 1
    counterattack: 25,         // Partida 3
    dodge: 40,                 // Partida 4
    prediction: 55,            // Partida 5
    nemesisMode: 75,           // Partidas 7+
  },

  maxExperience: 100,          // techo absoluto de experiencia
};

// ─── Regulador de Frustración ─────────────────────────────
export const FRUSTRATION_CONFIG = {
  // Multiplicadores de intensidad según derrotas consecutivas
  thresholds: [
    { losses: 2, multiplier: 0.7 },
    { losses: 3, multiplier: 0.5 },
    { losses: 4, multiplier: 0.35 },
  ],
  recoveryRate: 0.15,          // cuánto sube el multiplicador por victoria
  defaultMultiplier: 1.0,
};

// ─── Detector de Patrones ─────────────────────────────────
export const PATTERN_CONFIG = {
  // Umbrales para clasificar perfil del jugador
  aggressiveThreshold: 0.5,    // >50% ataques rápidos = agresivo
  aggressiveBlockCap: 0.15,    // <15% bloqueos para ser agresivo
  defensiveThreshold: 0.3,     // >30% bloqueos = defensivo
  impulsiveThreshold: 0.3,     // >30% especiales = impulsivo

  // Muestras mínimas para confianza alta
  highConfidenceMinActions: 20,
  mediumConfidenceMinActions: 10,

  // Suavizado exponencial para NemesisKnowledge
  knowledgeSmoothingAlpha: 0.3,
};

// ─── NemesisBrain ─────────────────────────────────────────
export const BRAIN_CONFIG = {
  // Distancia para considerar "cerca" del jugador
  meleeRange: 70,
  chaseRange: 300,

  // Probabilidades base de acción (antes de multiplicadores)
  baseBlockProbability: 0.5,
  baseCounterProbability: 0.4,
  baseDodgeProbability: 0.35,
  basePredictionAccuracy: 0.6,

  // Intervalo de decisión (ms) - evita que la IA cambie de opinión cada frame
  decisionInterval: 200,

  // Tiempo de reacción mínimo (ms) - hace que la IA no sea inhumanamente rápida
  reactionTime: 150,
};
