/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  filterEligibleCandidates,
  pickRandomWinner,
  buildAnimationReel,
  easeOutWithOvershoot,
} from './prizeDrawEngine.js';
import { Guest } from '../types.js';

const mockGuests: Guest[] = [
  {
    id: 'g1',
    fullName: 'Lady Genevieve Vance',
    tableNumber: '1',
    rsvpStatus: 'ATTENDING',
    checkedInAt: '2026-12-24T18:30:00Z',
  },
  {
    id: 'g2',
    fullName: 'Sir Marcus Sterling',
    tableNumber: '2',
    rsvpStatus: 'ATTENDING',
    checkedInAt: null, // NOT checked in
  },
  {
    id: 'g3',
    fullName: 'Elena Rostova',
    tableNumber: '3',
    rsvpStatus: 'CONFIRMED',
    checkedInAt: '2026-12-24T18:45:00Z',
  },
  {
    id: 'g4',
    fullName: 'Arthur Pendelton (Staff)',
    tableNumber: '12', // Staff table
    rsvpStatus: 'ATTENDING',
    checkedInAt: '2026-12-24T18:00:00Z',
  },
  {
    id: 'g5',
    fullName: 'Julian Thorne (Declined)',
    tableNumber: '4',
    rsvpStatus: 'DECLINED',
    checkedInAt: null,
  },
];

test('filterEligibleCandidates respects checked-in requirement', () => {
  const eligibleCheckedIn = filterEligibleCandidates(mockGuests, {
    requireCheckedIn: true,
    excludePreviousWinners: false,
    excludedGuestIds: new Set(),
    excludedTableNumbers: new Set(),
  });

  const ids = eligibleCheckedIn.map((g) => g.id);
  assert.ok(ids.includes('g1'), 'g1 should be included');
  assert.ok(!ids.includes('g2'), 'g2 (not checked in) should be excluded');
  assert.ok(ids.includes('g3'), 'g3 should be included');
  assert.ok(!ids.includes('g5'), 'g5 (declined) should be excluded');
});

test('filterEligibleCandidates excludes previous winners and designated tables', () => {
  const eligible = filterEligibleCandidates(mockGuests, {
    requireCheckedIn: false,
    excludePreviousWinners: true,
    excludedGuestIds: new Set(['g1']),
    excludedTableNumbers: new Set(['12']),
  });

  const ids = eligible.map((g) => g.id);
  assert.ok(!ids.includes('g1'), 'g1 is a previous winner, must be excluded');
  assert.ok(ids.includes('g2'), 'g2 is attending and not excluded');
  assert.ok(ids.includes('g3'), 'g3 is attending and not excluded');
  assert.ok(!ids.includes('g4'), 'g4 is at table 12, must be excluded');
});

test('pickRandomWinner selects candidate deterministically with custom random fn', () => {
  const candidates = [mockGuests[0], mockGuests[2]];
  const winner = pickRandomWinner(candidates, () => 1);
  assert.equal(winner.id, 'g3');
});

test('pickRandomWinner throws error on empty pool', () => {
  assert.throws(
    () => {
      pickRandomWinner([]);
    },
    { message: 'NO_ELIGIBLE_GUESTS' }
  );
});

test('buildAnimationReel places target winner at deterministic index', () => {
  const pool = [mockGuests[0], mockGuests[1], mockGuests[2]];
  const target = mockGuests[0];
  const { sequence, winnerIndex } = buildAnimationReel(pool, target, 20, 3);

  assert.equal(sequence.length, 24);
  assert.equal(winnerIndex, 20);
  assert.equal(sequence[winnerIndex].id, target.id);
});

test('easeOutWithOvershoot starts at 0, overshoots > 1.0, and settles exactly at 1.0', () => {
  assert.equal(easeOutWithOvershoot(0), 0);
  const overshootVal = easeOutWithOvershoot(0.92);
  assert.ok(overshootVal > 1.0, `Expected > 1.0 overshoot, got ${overshootVal}`);
  const finalVal = easeOutWithOvershoot(1);
  assert.equal(Math.round(finalVal * 1000) / 1000, 1);
});
