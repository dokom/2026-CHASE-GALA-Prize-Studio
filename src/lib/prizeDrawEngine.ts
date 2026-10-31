/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Guest, PrizeDrawConfig } from '../types.js';

export interface FilterOptions {
  requireCheckedIn: boolean;
  excludePreviousWinners: boolean;
  excludedGuestIds: Set<string>;
  excludedTableNumbers: Set<string>;
}

/**
 * Filter guests based on active gala eligibility settings
 */
export function filterEligibleCandidates(
  guests: Guest[],
  options: FilterOptions
): Guest[] {
  return guests.filter((g) => {
    // Only ATTENDING or CONFIRMED guests are ever eligible
    if (g.rsvpStatus !== 'ATTENDING' && g.rsvpStatus !== 'CONFIRMED') {
      return false;
    }

    // Require door check-in if configured
    if (options.requireCheckedIn && !g.checkedInAt) {
      return false;
    }

    // Exclude guests who already won another prize this evening
    if (options.excludePreviousWinners && options.excludedGuestIds.has(g.id)) {
      return false;
    }

    // Exclude guests assigned to specific excluded tables (e.g., Staff table, Committee)
    if (g.tableNumber && options.excludedTableNumbers.has(g.tableNumber)) {
      return false;
    }

    return true;
  });
}

/**
 * Pick a random winner from the eligible pool
 */
export function pickRandomWinner(
  candidates: Guest[],
  randomIntFn?: (max: number) => number
): Guest {
  if (!candidates || candidates.length === 0) {
    throw new Error('NO_ELIGIBLE_GUESTS');
  }

  const getRandomInt =
    randomIntFn ||
    ((max: number) => {
      if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
        const array = new Uint32Array(1);
        crypto.getRandomValues(array);
        return array[0] % max;
      }
      return Math.floor(Math.random() * max);
    });

  const selectedIndex = getRandomInt(candidates.length);
  return candidates[selectedIndex];
}

/**
 * Build a decoy reel sequence for continuous 3D stage animation
 * with the winner placed deterministically at targetIndex and trailing items
 * to allow continuous 3D drum perspective without clipping.
 */
export function buildAnimationReel(
  candidates: Guest[],
  targetWinner: Guest,
  leadCount: number = 42,
  trailCount: number = 4
): { sequence: Guest[]; winnerIndex: number } {
  if (!candidates || candidates.length === 0) {
    return { sequence: [targetWinner], winnerIndex: 0 };
  }

  const pool = candidates.filter((c) => c.id !== targetWinner.id);
  const effectivePool = pool.length > 0 ? pool : [targetWinner];

  const sequence: Guest[] = [];

  // 1. Lead sequence (names rapidly whipping past)
  for (let i = 0; i < leadCount; i++) {
    sequence.push(effectivePool[i % effectivePool.length]);
  }

  // 2. The winning candidate
  const winnerIndex = sequence.length;
  sequence.push(targetWinner);

  // 3. Trailing candidates for 3D perspective realism
  for (let i = 0; i < trailCount; i++) {
    sequence.push(effectivePool[(i + 3) % effectivePool.length]);
  }

  return { sequence, winnerIndex };
}

/**
 * Custom Quintic Deceleration with Mechanical Lock-in Overshoot
 *
 * Simulates a heavy, precision-machined mechanical wheel:
 * - 0% to 92%: High speed smoothly braking down via quintic curve to ~1.008 (slight overshoot past winner)
 * - 92% to 100%: Spring tension pulls the reel back to exact 1.000 lock-in
 */
export function easeOutWithOvershoot(t: number): number {
  const clamped = Math.max(0, Math.min(1, t));
  if (clamped < 0.92) {
    const norm = clamped / 0.92;
    // Quintic ease out reaching 1.008 at 92%
    return (1 - Math.pow(1 - norm, 4.5)) * 1.008;
  } else {
    // Settle back from 1.008 down to 1.000
    const settle = (clamped - 0.92) / 0.08;
    return 1.008 - 0.008 * Math.sin((settle * Math.PI) / 2);
  }
}
