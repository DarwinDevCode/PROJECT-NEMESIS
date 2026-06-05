/**
 * AnimationController.js
 * Gestiona frames basados en delta time y despacha Animation Events.
 */

import { LOCAL_EVENTS } from '../../game/events.js';
import AnimationRuntime from '../runtimes/AnimationRuntime.js';

export default class AnimationController {
  /**
   * @param {AnimationRuntime} animationRuntime 
   * @param {Object} characterData 
   * @param {import('../../systems/core/EventBus.js').default} localEventBus 
   */
  constructor(animationRuntime, characterData, localEventBus) {
    this.runtime = animationRuntime;
    this.characterData = characterData;
    this.eventBus = localEventBus;

    // Escuchar el inicio de un ataque para sincronizar la animación
    this.eventBus.on(LOCAL_EVENTS.ATTACK_STARTED, this._onAttackStarted, this, this);
  }

  _onAttackStarted(payload) {
    const attackData = this.characterData.attacks[payload.attackId];
    if (attackData && attackData.animationRef) {
      this.playAnimation(attackData.animationRef, false);
    }
  }

  playAnimation(animationId, isLooping = false) {
    const animData = this.characterData.animations[animationId];
    if (!animData) {
      console.warn(`[AnimationController] Animación no encontrada: ${animationId}`);
      return;
    }
    
    this.runtime.play(animationId, isLooping);
    this.eventBus.emit(LOCAL_EVENTS.ANIMATION_CHANGED, { animationId });
  }

  update(delta) {
    if (this.runtime.isFinished) return;
    
    const animData = this.characterData.animations[this.runtime.currentAnimationId];
    if (!animData) return;

    this.runtime.update(delta);

    // Calcular el frame lógico actual
    const timePerFrame = animData.duration / animData.frames;
    const newFrame = Math.floor(this.runtime.elapsedMs / timePerFrame) + 1; // Frames son 1-indexed en data

    // Si avanzamos de frame (procesar todos los intermedios para no saltarnos hitboxes por lag)
    if (newFrame > this.runtime.currentFrame && newFrame <= animData.frames) {
      for (let f = this.runtime.currentFrame + 1; f <= newFrame; f++) {
        this._dispatchEventsForFrame(animData, f);
      }
      this.runtime.currentFrame = newFrame;
    }

    // Terminar o loopear
    if (this.runtime.elapsedMs >= animData.duration) {
      if (this.runtime.isLooping) {
        this.runtime.elapsedMs -= animData.duration;
        this.runtime.currentFrame = 0;
      } else {
        this.runtime.isFinished = true;
        this.eventBus.emit(LOCAL_EVENTS.ANIMATION_COMPLETED, { animationId: this.runtime.currentAnimationId });
      }
    }
  }

  _dispatchEventsForFrame(animData, frame) {
    if (!animData.events) return;
    
    for (const event of animData.events) {
      if (event.frame === frame) {
        // Enviar el tipo de evento directamente al Event Bus Local.
        // Los otros componentes deben escuchar el LOCAL_EVENTS adecuado o 
        // mapear los eventos de animación si lo necesitan.
        // Para simplificar, AnimationController emite un evento genérico
        // o re-emite los tipos especificados en el JSON de animación
        
        // Emitimos usando el tipo tal cual como fue definido (e.g. "SPAWN_HITBOX")
        this.eventBus.emit(event.type, event.payload);
      }
    }
  }
}
