/**
 * InputRuntime.js
 * Almacena el buffer de comandos o las directivas activas de IA.
 * Completamente serializable.
 */

export default class InputRuntime {
  constructor() {
    this.activeInputs = {
      up: false,
      down: false,
      left: false,
      right: false,
      attack: false,
      jump: false,
      dash: false
    };
    this.buffer = []; // Buffer para inputs recientes (útil para combos)
  }

  setInput(key, isDown) {
    this.activeInputs[key] = isDown;
    if (isDown) {
      this.buffer.push({ key, time: 0 }); // El tiempo se actualizará en tick
      // Mantener buffer pequeño
      if (this.buffer.length > 10) this.buffer.shift();
    }
  }

  update(delta) {
    // Actualizar tiempo en buffer para expirar inputs antiguos
    for (let i = this.buffer.length - 1; i >= 0; i--) {
      this.buffer[i].time += delta;
      if (this.buffer[i].time > 500) { // Expirar a los 500ms
        this.buffer.splice(i, 1);
      }
    }
  }

  serialize() {
    return {
      activeInputs: { ...this.activeInputs },
      buffer: this.buffer.map(b => ({ ...b }))
    };
  }

  deserialize(data) {
    this.activeInputs = { ...data.activeInputs };
    this.buffer = data.buffer.map(b => ({ ...b }));
    return this;
  }
}
