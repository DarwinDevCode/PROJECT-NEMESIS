import assert from 'node:assert';
import EventBus from '../systems/core/EventBus.js';
import CharacterFactory from '../systems/core/CharacterFactory.js';
import NemesisBrain from '../ai/NemesisBrain.js';
import { NEMESIS_ACTIONS } from '../game/constants.js';

// Mock Data
const validData = {
  version: 1,
  id: "test_nemesis",
  stats: { maxHP: 100, speed: 200, jumpForce: 300 },
  aiProfile: { aggression: 0.8, preferredRange: 100 },
  berserkConfig: {
    duration: 1000,
    cooldown: 2000,
    activationConditions: {
      lowHealthThreshold: 0.5,
      enemyHealthAdvantage: 0.5,
      pressureThreshold: 50
    },
    exhaustionEffect: {
      id: "berserk_exhaustion",
      duration: 1500,
      tags: ["debuff"],
      modifiers: { speed: 0.5 },
      stackPolicy: "refresh",
      priority: 100,
      modifierAggregation: "multiplicative"
    }
  }
};

const mockAdaptation = { getMastery: () => 1.0 };
const mockKnowledge = {};
const mockProfile = { weights: { attackFrequency: 0.5, blockFrequency: 0.5, dodgeFrequency: 0.5, counterFrequency: 0.5 } };
const mockFrust = { getMultiplier: () => 1.0 };
const mockDetector = {};
const mockMomentum = { getMomentum: () => 0 };

// Setup
const dataDriven = CharacterFactory.create(validData, "nemesis_test");
const brain = new NemesisBrain({
  adaptationSystem: mockAdaptation,
  knowledge: mockKnowledge,
  profile: mockProfile,
  frustrationRegulator: mockFrust,
  patternDetector: mockDetector,
  adaptiveMomentum: mockMomentum
});

// Mock Fighter (Nemesis) state
const nemesis = {
  x: 0,
  y: 0,
  hp: 40, // 40% (Meets lowHealthThreshold <= 0.5)
  maxHP: 100,
  state: 'idle',
  speed: 200,
  dataDriven: dataDriven
};

const player = {
  x: 50,
  y: 0,
  hp: 100,
  maxHP: 100,
  state: 'idle'
};

const gameState = { nemesis, player, delta: 100, time: 1000 };

// --- Integration Test Execution ---

// 1. Initial State Check
assert.strictEqual(nemesis.dataDriven.runtimes.berserk.isActive, false);
assert.strictEqual(nemesis.dataDriven.runtimes.statusEffects.activeEffects.length, 0);

// 2. Trigger Activation via Brain
brain.combatPressure = 60; // Meets pressureThreshold
const action1 = brain.decide(gameState);

assert.strictEqual(action1, NEMESIS_ACTIONS.BERSERK, 'Brain should decide to Berserk');
assert.strictEqual(nemesis.dataDriven.runtimes.berserk.isActive, true, 'Berserk should be active');

// 3. Update active phase
brain.updateContinuousLogic({ ...gameState, delta: 500 });
nemesis.dataDriven.runtimes.berserk.update(500);
assert.strictEqual(nemesis.dataDriven.runtimes.berserk.isActive, true, 'Berserk still active');

// 4. End Berserk (Wait for duration: 1000ms)
brain.updateContinuousLogic({ ...gameState, delta: 500 });
nemesis.dataDriven.runtimes.berserk.update(500); // Manually push runtime update since Fighter update is decoupled here

assert.strictEqual(nemesis.dataDriven.runtimes.berserk.isActive, false, 'Berserk should be finished');
assert.strictEqual(nemesis.dataDriven.runtimes.statusEffects.activeEffects.length, 1, 'Exhaustion effect should be added');
assert.strictEqual(nemesis.dataDriven.runtimes.statusEffects.activeEffects[0].id, 'berserk_exhaustion');

// 5. Verify Modifiers
const currentSpeedModifier = nemesis.dataDriven.runtimes.statusEffects.getModifier('speed');
assert.strictEqual(currentSpeedModifier, 0.5, 'Speed modifier should be applied');

// 6. Test Re-arm Logic (Cooldown is 2000ms)
// Trying to activate during cooldown should fail
const action2 = brain.decide({ ...gameState, time: 3000 });
assert.notStrictEqual(action2, NEMESIS_ACTIONS.BERSERK, 'Cannot berserk during cooldown');

// Pass Cooldown time
nemesis.dataDriven.runtimes.berserk.update(2000);
assert.strictEqual(nemesis.dataDriven.runtimes.berserk.cooldownTimer, 0, 'Cooldown is over');

// Even though cooldown is over, condition is still met (hp: 40, pressure: 60)
// So conditionResetObserved is still false.
const action3 = brain.decide({ ...gameState, time: 5000 });
assert.notStrictEqual(action3, NEMESIS_ACTIONS.BERSERK, 'Cannot berserk before re-arming');

// 7. Make condition FALSE to re-arm
brain.combatPressure = 0; // Pressure goes down
player.hp = 40; // Player HP goes down so enemyHealthAdvantage is no longer true
brain.decide({ ...gameState, time: 6000 }); // Evaluates as false, sets conditionResetObserved to true!
assert.strictEqual(nemesis.dataDriven.runtimes.berserk.conditionResetObserved, true, 'Should be re-armed now');

// 8. Make condition TRUE again
brain.combatPressure = 60; // Pressure back up
const action4 = brain.decide({ ...gameState, time: 7000 });
assert.strictEqual(action4, NEMESIS_ACTIONS.BERSERK, 'Brain should Berserk again');
assert.strictEqual(nemesis.dataDriven.runtimes.berserk.isActive, true, 'Berserk should be active again');

console.log('Integration.test.js passed!');
