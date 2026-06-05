/**
 * SaveManager.js
 * Gestiona la persistencia de datos en LocalStorage.
 * Proporciona guardado, carga, reset y verificación de existencia.
 * Incluye versionado para compatibilidad futura y reparación de datos.
 */

import { SAVE_KEY, SAVE_VERSION } from '../game/constants.js';
import { createDefaultSaveData } from '../data/defaultState.js';
import { validateSaveData, repairSaveData } from '../data/schema.js';

export default class SaveManager {
  /**
   * Verifica si existe un guardado previo válido.
   * @returns {boolean}
   */
  static exists() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return false;

      const data = JSON.parse(raw);
      const { valid } = validateSaveData(data);
      return valid;
    } catch (e) {
      console.warn('[SaveManager] Error al verificar guardado:', e.message);
      return false;
    }
  }

  /**
   * Carga los datos guardados desde LocalStorage.
   * Si los datos son inválidos pero reparables, los repara.
   * Si no hay datos o son irrecuperables, devuelve el estado por defecto.
   * @returns {object} Estado completo del juego
   */
  static load() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) {
        console.info('[SaveManager] No hay guardado previo. Usando estado por defecto.');
        return createDefaultSaveData();
      }

      const data = JSON.parse(raw);
      const { valid, reason } = validateSaveData(data);

      if (valid) {
        console.info('[SaveManager] Datos cargados correctamente.');
        return data;
      }

      // Intentar reparar
      console.warn(`[SaveManager] Datos inválidos: ${reason}. Intentando reparar...`);
      const repaired = repairSaveData(data);
      const { valid: repairedValid } = validateSaveData(repaired);

      if (repairedValid) {
        console.info('[SaveManager] Datos reparados exitosamente.');
        SaveManager.save(repaired); // Guardar los datos reparados
        return repaired;
      }

      console.error('[SaveManager] No se pudieron reparar los datos. Usando estado por defecto.');
      return createDefaultSaveData();
    } catch (e) {
      console.error('[SaveManager] Error al cargar:', e.message);
      return createDefaultSaveData();
    }
  }

  /**
   * Guarda el estado completo del juego en LocalStorage.
   * @param {object} data - Estado completo del juego
   * @returns {boolean} true si se guardó correctamente
   */
  static save(data) {
    try {
      // Asegurar que la versión sea la actual
      data.version = SAVE_VERSION;

      const raw = JSON.stringify(data);
      localStorage.setItem(SAVE_KEY, raw);

      console.info('[SaveManager] Datos guardados correctamente.');
      return true;
    } catch (e) {
      console.error('[SaveManager] Error al guardar:', e.message);

      // Manejar caso de LocalStorage lleno
      if (e.name === 'QuotaExceededError') {
        console.error('[SaveManager] Almacenamiento local lleno.');
      }
      return false;
    }
  }

  /**
   * Elimina el guardado actual y devuelve el estado por defecto.
   * @returns {object} Estado limpio por defecto
   */
  static reset() {
    try {
      localStorage.removeItem(SAVE_KEY);
      console.info('[SaveManager] Datos eliminados. Estado reiniciado.');
    } catch (e) {
      console.error('[SaveManager] Error al eliminar datos:', e.message);
    }
    return createDefaultSaveData();
  }

  /**
   * Exporta los datos como string JSON (útil para depuración).
   * @returns {string|null}
   */
  static export() {
    try {
      return localStorage.getItem(SAVE_KEY);
    } catch (e) {
      console.error('[SaveManager] Error al exportar:', e.message);
      return null;
    }
  }

  /**
   * Importa datos desde un string JSON (útil para depuración).
   * @param {string} jsonString
   * @returns {boolean}
   */
  static import(jsonString) {
    try {
      const data = JSON.parse(jsonString);
      const repaired = repairSaveData(data);
      return SaveManager.save(repaired);
    } catch (e) {
      console.error('[SaveManager] Error al importar:', e.message);
      return false;
    }
  }
}
