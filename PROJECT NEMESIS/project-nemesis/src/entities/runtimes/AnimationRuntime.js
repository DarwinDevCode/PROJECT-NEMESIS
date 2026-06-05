/**
 * AnimationRuntime.js
 * Administra el estado visual, frame activo y control de reproducción.
 * Completamente serializable.
 */

export default class AnimationRuntime {
  constructor() {
    this.currentAnimationId = "idle";
    this.currentFrame = 0;
    this.elapsedMs = 0;
    this.isLooping = false;
    this.isFinished = false;
  }

  play(animationId, isLooping = false) {
    this.currentAnimationId = animationId;
    this.currentFrame = 0;
    this.elapsedMs = 0;
    this.isLooping = isLooping;
    this.isFinished = false;
  }

  update(delta) {
    if (this.isFinished) return;
    this.elapsedMs += delta;
  }

  serialize() {
    return {
      currentAnimationId: this.currentAnimationId,
      currentFrame: this.currentFrame,
      elapsedMs: this.elapsedMs,
      isLooping: this.isLooping,
      isFinished: this.isFinished
    };
  }

  deserialize(data) {
    this.currentAnimationId = data.currentAnimationId;
    this.currentFrame = data.currentFrame;
    this.elapsedMs = data.elapsedMs;
    this.isLooping = data.isLooping;
    this.isFinished = data.isFinished;
    return this;
  }
}
