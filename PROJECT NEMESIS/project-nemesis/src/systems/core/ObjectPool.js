/**
 * ObjectPool.js
 * Motor genérico de agrupación de objetos para evitar instanciación constante 
 * y recolección de basura (GC pauses) durante el combate intenso.
 */

export default class ObjectPool {
  /**
   * @param {Function} factoryFunction - Función que crea un nuevo objeto si el pool está vacío
   * @param {number} maxSize - Tamaño máximo que el pool puede alcanzar
   */
  constructor(factoryFunction, maxSize = 50) {
    this.factoryFunction = factoryFunction;
    this.maxSize = maxSize;
    
    this.activeObjects = [];
    this.inactiveObjects = [];
  }

  /**
   * Pre-instancia un número de objetos en memoria.
   * @param {number} count 
   */
  preWarm(count) {
    for (let i = 0; i < count; i++) {
      if (this.inactiveObjects.length + this.activeObjects.length < this.maxSize) {
        this.inactiveObjects.push(this.factoryFunction());
      }
    }
  }

  /**
   * Obtiene un objeto libre del pool, o crea uno nuevo si no hay libres 
   * (y no se ha alcanzado el límite máximo).
   */
  get() {
    let obj;
    if (this.inactiveObjects.length > 0) {
      obj = this.inactiveObjects.pop();
    } else if (this.activeObjects.length < this.maxSize) {
      obj = this.factoryFunction();
    } else {
      console.warn('[ObjectPool] Límite máximo alcanzado. Reutilizando objeto más antiguo por la fuerza.');
      // Opcional: Podríamos liberar el más antiguo aquí para seguridad
      obj = this.activeObjects.shift();
      if (typeof obj.deactivate === 'function') obj.deactivate();
    }

    this.activeObjects.push(obj);
    return obj;
  }

  /**
   * Devuelve un objeto al pool.
   * @param {Object} obj 
   */
  release(obj) {
    const index = this.activeObjects.indexOf(obj);
    if (index > -1) {
      this.activeObjects.splice(index, 1);
      
      // Limpiar/desactivar estado interno del objeto si lo soporta
      if (typeof obj.deactivate === 'function') {
        obj.deactivate();
      }
      
      this.inactiveObjects.push(obj);
    }
  }

  /**
   * Libera todos los objetos activos devolviéndolos al pool inactivo.
   */
  releaseAll() {
    for (let i = this.activeObjects.length - 1; i >= 0; i--) {
      this.release(this.activeObjects[i]);
    }
  }
}
