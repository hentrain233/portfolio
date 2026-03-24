/**
 * Event system helpers (pool selection, basic RNG decisions).
 */
import { EVENT_POOLS } from '../data/eventDefs.js';
import { PROBABILITY_CONFIG } from '../data/probabilities.js';

export function pickRandomEventIdSystem({
  normalPool = EVENT_POOLS.normal,
  rarePool = EVENT_POOLS.rare,
  rareChance = PROBABILITY_CONFIG.events.rareEventChance,
  rng = Math.random,
} = {}) {
  const isRare = rng() < rareChance;
  const pool = isRare ? rarePool : normalPool;
  return pool[Math.floor(rng() * pool.length)];
}


