/**
 * CharacterValidator.js
 * Valida la coherencia de alto nivel de CharacterData (estructuras, tipos, versionado).
 */

import { CHARACTER_SYSTEM_CONFIG } from '../../game/characterSystemConfig.js';

export default class CharacterValidator {
  /**
   * Valida un objeto CharacterData completo.
   * Lanza un error si la configuración es inválida o no soportada.
   * 
   * @param {Object} characterData 
   * @returns {Object} CharacterData validado (o migrado)
   */
  static validate(characterData) {
    if (!characterData) {
      throw new Error('[CharacterValidator] characterData es nulo o indefinido.');
    }

    // 1. Política Formal de Versionado
    if (!characterData.version) {
      throw new Error(`[CharacterValidator] El personaje ${characterData.id || 'Unknown'} no declara una versión.`);
    }

    if (!CHARACTER_SYSTEM_CONFIG.DATA.SUPPORTED_VERSIONS.includes(characterData.version)) {
      throw new Error(`[CharacterValidator] Versión no soportada (${characterData.version}) en el personaje ${characterData.id}. Versiones soportadas: ${CHARACTER_SYSTEM_CONFIG.DATA.SUPPORTED_VERSIONS.join(', ')}`);
    }

    // Simulación conceptual de Script de Migración
    // if (characterData.version === 1 && CURRENT_VERSION === 2) { characterData = migrateV1toV2(characterData); }

    // 2. Validación de campos obligatorios
    if (!characterData.id) throw new Error('[CharacterValidator] Falta el campo obligatorio: id.');
    if (!characterData.stats) throw new Error(`[CharacterValidator] Falta el objeto 'stats' en ${characterData.id}`);
    
    // 3. Validación de ataques
    if (characterData.attacks) {
      for (const [attackId, attack] of Object.entries(characterData.attacks)) {
        if (!attack.id) throw new Error(`[CharacterValidator] El ataque ${attackId} no tiene id interno.`);
        if (!attack.attackType) throw new Error(`[CharacterValidator] El ataque ${attackId} debe definir attackType (melee, projectile, area).`);
        if (attack.cooldown === undefined) throw new Error(`[CharacterValidator] El ataque ${attackId} no tiene cooldown.`);
        if (!attack.animationRef) throw new Error(`[CharacterValidator] El ataque ${attackId} no define animationRef.`);
        
        // Validar referencias cruzadas
        if (!characterData.animations || !characterData.animations[attack.animationRef]) {
          throw new Error(`[CharacterValidator] El ataque ${attackId} referencia una animación inexistente: ${attack.animationRef}`);
        }
      }
    }

    // 4. Validación de Berserk (si existe)
    if (characterData.berserkConfig) {
      const config = characterData.berserkConfig;
      if (typeof config.duration !== 'number' || config.duration <= 0) throw new Error(`[CharacterValidator] berserkConfig.duration debe ser un número > 0`);
      if (typeof config.cooldown !== 'number' || config.cooldown < 0) throw new Error(`[CharacterValidator] berserkConfig.cooldown debe ser un número >= 0`);
      
      const conditions = config.activationConditions;
      if (conditions) {
        if (conditions.lowHealthThreshold < 0 || conditions.lowHealthThreshold > 1) throw new Error(`[CharacterValidator] lowHealthThreshold debe estar entre 0 y 1`);
        if (conditions.enemyHealthAdvantage < 0 || conditions.enemyHealthAdvantage > 1) throw new Error(`[CharacterValidator] enemyHealthAdvantage debe estar entre 0 y 1`);
        if (conditions.pressureThreshold < 0 || conditions.pressureThreshold > 100) throw new Error(`[CharacterValidator] pressureThreshold debe estar entre 0 y 100`);
      }

      if (config.exhaustionEffect) {
        CharacterValidator.validateStatusEffect(config.exhaustionEffect);
      }
    }

    return characterData;
  }

  /**
   * Valida la estructura de un Status Effect para asegurar compatibilidad con StatusEffectRuntime
   * @param {Object} effect 
   */
  static validateStatusEffect(effect) {
    if (!effect.id) throw new Error(`[CharacterValidator] StatusEffect no tiene id.`);
    if (typeof effect.duration !== 'number' || effect.duration < 0) throw new Error(`[CharacterValidator] StatusEffect ${effect.id} tiene una duración inválida.`);
    if (typeof effect.priority !== 'number') throw new Error(`[CharacterValidator] StatusEffect ${effect.id} debe definir una priority numérica.`);
    
    const validPolicies = ['replace', 'refresh', 'stack'];
    if (!validPolicies.includes(effect.stackPolicy)) {
      throw new Error(`[CharacterValidator] StatusEffect ${effect.id} tiene un stackPolicy inválido: ${effect.stackPolicy}`);
    }

    if (effect.modifiers && typeof effect.modifiers !== 'object') {
      throw new Error(`[CharacterValidator] StatusEffect ${effect.id} modifiers debe ser un objeto.`);
    }
    
    // Future validation for modifierAggregation could go here
  }
}
