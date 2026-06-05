/**
 * ComboDetector.js
 * Detecta secuencias de acciones (combos) del jugador en tiempo real.
 * Funciona mediante una ventana de tiempo: si las acciones ocurren 
 * cerca unas de otras (ej. < 1.5s entre ellas), se consideran un combo.
 */

export default class ComboDetector {
  constructor() {
    this.actionHistory = [];
    this.comboWindow = 1500; // ms entre acciones para considerarse combo
    this.currentCombo = [];
    this.lastActionTime = 0;
  }

  /**
   * Registra una nueva acción del jugador y la evalúa para combos.
   * @param {string} action - La acción ejecutada
   * @param {number} time - Timestamp actual
   * @returns {string[] | null} El combo completado si la ventana se cierra, o null.
   */
  recordAction(action, time) {
    let completedCombo = null;

    // Si ha pasado mucho tiempo, la ventana de combo anterior se cerró
    if (this.currentCombo.length > 0 && time - this.lastActionTime > this.comboWindow) {
      if (this.currentCombo.length > 1) {
        completedCombo = [...this.currentCombo];
      }
      this.currentCombo = [];
    }

    this.currentCombo.push(action);
    this.lastActionTime = time;
    this.actionHistory.push({ action, time });

    return completedCombo;
  }

  /**
   * Forzar cierre de combo (ej. al terminar la partida o si el jugador recibe daño).
   * @returns {string[] | null}
   */
  flushCombo() {
    if (this.currentCombo.length > 1) {
      const combo = [...this.currentCombo];
      this.currentCombo = [];
      return combo;
    }
    this.currentCombo = [];
    return null;
  }
}
