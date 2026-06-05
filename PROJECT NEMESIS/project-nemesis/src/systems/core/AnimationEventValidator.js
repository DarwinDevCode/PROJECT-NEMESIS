/**
 * AnimationEventValidator.js
 * Subcomponente especializado en auditar la línea de tiempo de eventos.
 */

import { ANIMATION_EVENTS } from '../../game/events.js';

export default class AnimationEventValidator {
  /**
   * Valida exhaustivamente los eventos de una animación contra los datos del personaje.
   * Lanza un error si detecta inconsistencias críticas en el arranque.
   * 
   * @param {Object} animationData 
   * @param {Object} characterData 
   */
  static validate(animationData, characterData) {
    if (!animationData.events || animationData.events.length === 0) return;

    const totalFrames = animationData.frames;

    for (const event of animationData.events) {
      // 1. Validar que el frame del evento no exceda la longitud de la animación
      if (event.frame > totalFrames) {
        throw new Error(`[AnimationEventValidator] Animación ${animationData.id}: Evento en frame ${event.frame} supera el total de frames (${totalFrames}).`);
      }

      // 2. Validar tipos de evento soportados
      if (!Object.values(ANIMATION_EVENTS).includes(event.type)) {
        throw new Error(`[AnimationEventValidator] Animación ${animationData.id}: Tipo de evento desconocido '${event.type}'.`);
      }

      // 3. Validar payload de SPAWN_HITBOX
      if (event.type === ANIMATION_EVENTS.SPAWN_HITBOX) {
        if (!event.payload || !event.payload.attackId) {
          throw new Error(`[AnimationEventValidator] Animación ${animationData.id}: Evento SPAWN_HITBOX sin attackId.`);
        }

        const attackData = characterData.attacks[event.payload.attackId];
        if (!attackData) {
          throw new Error(`[AnimationEventValidator] Animación ${animationData.id}: Evento SPAWN_HITBOX referencia un attackId inexistente ('${event.payload.attackId}').`);
        }

        if (event.payload.hitboxIndex === undefined) {
          throw new Error(`[AnimationEventValidator] Animación ${animationData.id}: Evento SPAWN_HITBOX requiere un hitboxIndex numérico.`);
        }

        if (!attackData.hitboxes || !attackData.hitboxes[event.payload.hitboxIndex]) {
          throw new Error(`[AnimationEventValidator] Animación ${animationData.id}: attackId '${event.payload.attackId}' no posee la hitboxIndex ${event.payload.hitboxIndex}.`);
        }
      }

      // 4. Validar payload de PLAY_SFX
      if (event.type === ANIMATION_EVENTS.PLAY_SFX) {
        if (!event.payload || !event.payload.soundId) {
          throw new Error(`[AnimationEventValidator] Animación ${animationData.id}: Evento PLAY_SFX sin soundId.`);
        }

        // Si existe un diccionario de sonidos en el character, validar (Opcional)
        if (characterData.sounds && !characterData.sounds[event.payload.soundId]) {
           // Lanzar un warning lógico o un error estricto
           console.warn(`[AnimationEventValidator] Animación ${animationData.id}: Evento PLAY_SFX usa un soundId ('${event.payload.soundId}') no registrado en characterData.sounds.`);
        }
      }
    }
  }
}
