/**
 * EventBus.js
 * Sistema de eventos pub/sub con Listener Lifecycle Policy.
 * Previene Memory Leaks garantizando que los listeners se puedan
 * limpiar masivamente cuando una entidad o escena se destruye.
 */

export default class EventBus {
  constructor(id) {
    this.id = id; // Identificador para debug (ej. "PlayerLocalBus" o "GlobalBus")
    this._listeners = new Map(); // key: eventName, value: array of { callback, context, owner }
    this._metrics = {
      eventsEmitted: 0,
      activeListeners: 0
    };
  }

  /**
   * Suscribe a un evento.
   * @param {string} eventName - Nombre del evento (desde events.js)
   * @param {Function} callback - Función a ejecutar
   * @param {Object} context - Contexto (`this`) para la función
   * @param {Object} owner - Objeto propietario (para limpieza masiva)
   */
  on(eventName, callback, context = null, owner = null) {
    if (!this._listeners.has(eventName)) {
      this._listeners.set(eventName, []);
    }
    
    this._listeners.get(eventName).push({ callback, context, owner });
    this._metrics.activeListeners++;
  }

  /**
   * Emite un evento a todos los suscriptores.
   * @param {string} eventName 
   * @param {any} payload 
   */
  emit(eventName, payload = null) {
    this._metrics.eventsEmitted++;
    const listeners = this._listeners.get(eventName);
    if (!listeners) return;

    for (let i = 0; i < listeners.length; i++) {
      const { callback, context } = listeners[i];
      if (context) {
        callback.call(context, payload);
      } else {
        callback(payload);
      }
    }
  }

  /**
   * Desuscribe a un listener específico.
   */
  off(eventName, callback, context = null) {
    const listeners = this._listeners.get(eventName);
    if (!listeners) return;

    const initialLength = listeners.length;
    const filtered = listeners.filter(l => l.callback !== callback || l.context !== context);
    
    this._listeners.set(eventName, filtered);
    this._metrics.activeListeners -= (initialLength - filtered.length);
  }

  /**
   * Listener Lifecycle Policy: Limpia todos los listeners que pertenezcan a un owner específico.
   * Ideal para llamar cuando un componente o entidad es destruida.
   * @param {Object} owner 
   */
  clearByOwner(owner) {
    if (!owner) return;
    
    for (const [eventName, listeners] of this._listeners.entries()) {
      const initialLength = listeners.length;
      const filtered = listeners.filter(l => l.owner !== owner);
      
      this._listeners.set(eventName, filtered);
      this._metrics.activeListeners -= (initialLength - filtered.length);
    }
  }

  /**
   * Destruye el EventBus completamente.
   */
  destroy() {
    this._listeners.clear();
    this._metrics.activeListeners = 0;
  }

  /**
   * Retorna métricas para instrumentación.
   */
  getMetrics() {
    return { ...this._metrics };
  }
}

// Instancia Singleton para el Global Event Bus
export const GlobalEventBus = new EventBus('GlobalBus');
