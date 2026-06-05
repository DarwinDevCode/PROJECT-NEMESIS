/**
 * AttackInstance.js
 * Almacena el estado efímero y temporal de un ataque activo sin ensuciar
 * la información general del personaje ni el AttackData inmutable.
 * Es completamente serializable.
 */

export default class AttackInstance {
  constructor(attackId) {
    this.id = `AttackInstance_${Math.floor(Math.random() * 1000000)}`; // ID único de depuración
    this.attackId = attackId;
    this.currentFrame = 0;
    this.elapsedTime = 0; // en ms
    this.spawnedHitboxes = []; // Índices de hitboxes ya procesadas (ej. [0, 1])
    this.cancelled = false;
  }

  /**
   * Serializa la instancia a un formato JSON seguro.
   */
  serialize() {
    return {
      id: this.id,
      attackId: this.attackId,
      currentFrame: this.currentFrame,
      elapsedTime: this.elapsedTime,
      spawnedHitboxes: [...this.spawnedHitboxes],
      cancelled: this.cancelled
    };
  }

  /**
   * Deserializa los datos y restaura el estado.
   */
  deserialize(data) {
    this.id = data.id;
    this.attackId = data.attackId;
    this.currentFrame = data.currentFrame;
    this.elapsedTime = data.elapsedTime;
    this.spawnedHitboxes = [...data.spawnedHitboxes];
    this.cancelled = data.cancelled;
    return this;
  }
}
