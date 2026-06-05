# Character Schema Documentation

Este documento define la estructura formal de los datos que componen un personaje en Project Nemesis. Cualquier nuevo personaje debe cumplir estrictamente con este contrato de datos.

## 1. CharacterData

El punto de entrada principal para definir un personaje.

```javascript
{
  version: 1, // Obligatorio. Entero que indica la versión del formato de datos.
  id: "character_id", // Obligatorio. String único.
  stats: {
    maxHP: 100, // Obligatorio. Entero > 0.
    speed: 200, // Obligatorio. Número > 0.
    jumpForce: 380 // Obligatorio. Número > 0.
  },
  attacks: {
    // Diccionario de AttackData. Llave = attackId
    "attack_id": { ... }
  },
  animations: {
    // Diccionario de AnimationData. Llave = animationId
    "animation_id": { ... }
  },
  sounds: {
    // Mapeo opcional de identificadores de sonido a claves de Phaser cache.
    "hit": "sound_hit_1"
  },
  statusEffects: {
    // Reservado para futura implementación de StatusEffectData
  },
  aiProfile: {
    // Opcional. Metadatos de comportamiento de IA.
  }
}
```

## 2. AttackData

Define las propiedades lógicas y físicas de un ataque.

```javascript
{
  version: 1, // Obligatorio.
  id: "attack_id", // Obligatorio. Coincide con la llave en CharacterData.attacks.
  attackType: "melee", // Obligatorio. Valores: "melee", "projectile", "area".
  tags: ["melee", "light"], // Opcional. Lista de strings para categorización.
  cooldown: 400, // Obligatorio. Tiempo en ms.
  animationRef: "animation_id", // Obligatorio. ID de AnimationData a reproducir.
  comboLinks: ["next_attack_id"], // Opcional. Ataques que pueden encadenarse.
  hitboxes: [
    {
      frameStart: 2, // Frame en el que se activa.
      duration: 5, // Duración en frames activa.
      width: 60, // Ancho en píxeles.
      height: 50, // Alto en píxeles.
      offsetX: 40, // Offset horizontal relativo al centro del personaje.
      offsetY: 0, // Offset vertical.
      damage: 10, // Daño infligido.
      knockback: 100 // Fuerza de empuje base.
    }
  ]
}
```

## 3. AnimationData

Define la reproducción visual y la línea de tiempo de eventos.

```javascript
{
  version: 1, // Obligatorio.
  id: "animation_id", // Obligatorio.
  frames: 6, // Obligatorio. Cantidad de frames lógicos.
  duration: 300, // Obligatorio. Duración total en ms de la animación.
  loop: false, // Obligatorio. Boolean.
  rootMotion: {
    enabled: false // Opcional. Booleano reservado para futuro.
  },
  cancelWindows: [
    {
      frameStart: 4,
      frameEnd: 6,
      allowedTo: ["DASH", "JUMP"]
    }
  ],
  events: [
    {
      frame: 2, // Frame donde se emite.
      type: "SPAWN_HITBOX", // ID del catálogo ANIMATION_EVENTS.
      payload: { attackId: "attack_id", hitboxIndex: 0 } // Datos del evento.
    }
  ]
}
```

## 4. StatusEffectData (Preparación)

Define efectos alterados persistentes sobre el personaje.

```javascript
{
  version: 1,
  id: "poison_effect",
  type: "debuff", // "buff" o "debuff"
  tags: ["poison", "dot"],
  duration: 5000, // en ms
  tickRate: 1000, // frecuencia en ms para aplicar efectos de tick
  damageModifiers: {
    multiplier: 1.0,
    flat: 0
  },
  tickEffect: {
    damage: 5
  }
}
```

## Versiones Soportadas

Actualmente, el sistema soporta:
- `SUPPORTED_VERSIONS`: `[1]`

Cualquier esquema con una `version` diferente a `1` provocará un fallo de validación en tiempo de carga.
