import assert from 'node:assert';
import StatusEffectRuntime from '../entities/runtimes/StatusEffectRuntime.js';

// Setup
const runtime = new StatusEffectRuntime();

// Test 1: Add and Expire
runtime.addEffect({
  id: 'test_poison',
  duration: 100,
  modifiers: { healthRegen: 0.5 },
  stackPolicy: 'replace',
  priority: 10,
  modifierAggregation: 'multiplicative'
});

assert.strictEqual(runtime.activeEffects.length, 1, 'Should have 1 active effect');
assert.strictEqual(runtime.getModifier('healthRegen'), 0.5, 'Modifier should be 0.5');

// Advance time by 50ms
runtime.update(50);
assert.strictEqual(runtime.activeEffects.length, 1, 'Effect should still be active');

// Advance time by another 50ms (Total 100ms)
runtime.update(50);
assert.strictEqual(runtime.activeEffects.length, 0, 'Effect should be removed after duration');
assert.strictEqual(runtime.getModifier('healthRegen'), 1.0, 'Modifier should reset to 1.0');

// Test 2: Replace Policy & Priority
runtime.addEffect({
  id: 'test_slow',
  duration: 1000,
  modifiers: { speed: 0.8 },
  stackPolicy: 'replace',
  priority: 50
});

// Try to replace with lower priority (Should fail)
runtime.addEffect({
  id: 'test_slow',
  duration: 2000,
  modifiers: { speed: 0.1 },
  stackPolicy: 'replace',
  priority: 10
});

assert.strictEqual(runtime.activeEffects[0].durationRemaining, 1000, 'Duration should not have changed (lower priority rejected)');
assert.strictEqual(runtime.getModifier('speed'), 0.8, 'Modifier should still be 0.8');

// Try to replace with equal/higher priority (Should succeed)
runtime.addEffect({
  id: 'test_slow',
  duration: 2000,
  modifiers: { speed: 0.5 },
  stackPolicy: 'replace',
  priority: 50
});

assert.strictEqual(runtime.activeEffects[0].durationRemaining, 2000, 'Duration should be updated');
assert.strictEqual(runtime.getModifier('speed'), 0.5, 'Modifier should be updated');
runtime.reset({ reason: 'death' });

// Test 3: Refresh Policy
runtime.addEffect({
  id: 'test_burn',
  duration: 500,
  modifiers: { dot: 1.5 },
  stackPolicy: 'refresh'
});
runtime.update(400); // 100ms remaining

runtime.addEffect({
  id: 'test_burn',
  duration: 500,
  modifiers: { dot: 2.0 }, // Note: Refresh doesn't update modifiers in current implementation, just duration
  stackPolicy: 'refresh'
});

assert.strictEqual(runtime.activeEffects[0].durationRemaining, 500, 'Duration should be refreshed to 500');
runtime.reset({ reason: 'death' });

// Test 4: Stack Policy
runtime.addEffect({
  id: 'test_vuln',
  duration: 1000,
  modifiers: { damageTaken: 1.5 },
  stackPolicy: 'stack'
});

runtime.addEffect({
  id: 'test_vuln',
  duration: 1000,
  modifiers: { damageTaken: 1.5 },
  stackPolicy: 'stack'
});

assert.strictEqual(runtime.activeEffects.length, 2, 'Should have 2 stacked effects');
assert.strictEqual(runtime.getModifier('damageTaken'), 1.5 * 1.5, 'Modifiers should multiply correctly');

// Test 5: Reset
runtime.reset({ reason: 'death' });
assert.strictEqual(runtime.activeEffects.length, 0, 'Reset should clear all effects');

console.log('StatusEffectRuntime.test.js passed!');
