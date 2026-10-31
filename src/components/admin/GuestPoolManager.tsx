/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Guest, PrizeDrawConfig, PrizeWinner } from '../../types.js';

interface GuestPoolManagerProps {
  guests: Guest[];
  config: PrizeDrawConfig;
  winners: PrizeWinner[];
  onToggleCheckIn: (guestId: string) => void;
  onBatchCheckInAll: () => void;
  onResetCheckIns: () => void;
  onAddGuest: (guest: Omit<Guest, 'id'>) => void;
}

export function GuestPoolManager({
  guests,
  config,
  winners,
  onToggleCheckIn,
  onBatchCheckInAll,
  onResetCheckIns,
  onAddGuest,
}: GuestPoolManagerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCheckIn, setFilterCheckIn] = useState<'ALL' | 'CHECKED_IN' | 'PENDING'>('ALL');
  const [filterTable, setFilterTable] = useState<string>('ALL');
  const [isAddingGuest, setIsAddingGuest] = useState(false);

  const [formName, setFormName] = useState('');
  const [formTable, setFormTable] = useState('');
  const [formOrg, setFormOrg] = useState('');
  const [formVip, setFormVip] = useState('Executive');

  const winnerIds = useMemo(() => new Set(winners.map((w) => w.guestId)), [winners]);
  const excludedTables = useMemo(() => new Set(config.excludedTableNumbers), [config.excludedTableNumbers]);

  const uniqueTables = useMemo(() => {
    const set = new Set<string>();
    guests.forEach((g) => {
      if (g.tableNumber) set.add(g.tableNumber);
    });
    return Array.from(set).sort((a, b) => parseInt(a, 10) - parseInt(b, 10));
  }, [guests]);

  // Compute eligibility status for each guest
  const guestEligibilityMap = useMemo(() => {
    const map = new Map<string, { eligible: boolean; reason?: string }>();

    guests.forEach((g) => {
      if (g.rsvpStatus !== 'ATTENDING' && g.rsvpStatus !== 'CONFIRMED') {
        map.set(g.id, { eligible: false, reason: 'Declined / Not Attending' });
        return;
      }
      if (config.requireCheckedIn && !g.checkedInAt) {
        map.set(g.id, { eligible: false, reason: 'Not Checked In at Door' });
        return;
      }
      if (config.excludePreviousWinners && winnerIds.has(g.id)) {
        map.set(g.id, { eligible: false, reason: 'Previous Prize Winner' });
        return;
      }
      if (g.tableNumber && excludedTables.has(g.tableNumber)) {
        map.set(g.id, { eligible: false, reason: `Table ${g.tableNumber} Excluded` });
        return;
      }
      map.set(g.id, { eligible: true });
    });

    return map;
  }, [guests, config, winnerIds, excludedTables]);

  const filteredGuests = useMemo(() => {
    return guests.filter((g) => {
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        const matchName = g.fullName.toLowerCase().includes(q);
        const matchOrg = g.organization?.toLowerCase().includes(q);
        const matchTbl = g.tableNumber?.toLowerCase().includes(q);
        if (!matchName && !matchOrg && !matchTbl) return false;
      }

      if (filterCheckIn === 'CHECKED_IN' && !g.checkedInAt) return false;
      if (filterCheckIn === 'PENDING' && g.checkedInAt) return false;
      if (filterTable !== 'ALL' && g.tableNumber !== filterTable) return false;

      return true;
    });
  }, [guests, searchTerm, filterCheckIn, filterTable]);

  const totalEligible = useMemo(() => {
    let count = 0;
    guestEligibilityMap.forEach((val) => {
      if (val.eligible) count++;
    });
    return count;
  }, [guestEligibilityMap]);

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    onAddGuest({
      fullName: formName.trim(),
      tableNumber: formTable.trim() || undefined,
      organization: formOrg.trim() || undefined,
      vipTier: formVip,
      rsvpStatus: 'ATTENDING',
      checkedInAt: new Date().toISOString(),
    });

    setFormName('');
    setFormTable('');
    setFormOrg('');
    setIsAddingGuest(false);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header & Metrics Strip */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h2 className="text-2xl font-serif font-bold text-white tracking-tight">
            Gala Guest Pool & Door Check-In Scanner
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Real-time ballroom attendee management, ticket check-in simulation, and live prize eligibility auditing.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onBatchCheckInAll}
            className="px-3.5 py-2 text-xs font-semibold text-emerald-300 hover:text-white bg-emerald-950/70 border border-emerald-600/40 rounded-xl transition"
          >
            ✓ Check In All Attending
          </button>
          <button
            onClick={onResetCheckIns}
            className="px-3.5 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-900 border border-slate-800 rounded-xl transition"
          >
            Reset Check-Ins
          </button>
          <button
            onClick={() => setIsAddingGuest(true)}
            className="px-4 py-2 text-xs font-bold text-slate-950 bg-gradient-to-r from-amber-300 via-amber-400 to-yellow-500 rounded-xl shadow-md transition hover:scale-105"
          >
            + Register New Guest
          </button>
        </div>
      </div>

      {/* KPI Overview Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
          <div className="text-xs text-slate-400 font-medium">Total Registered</div>
          <div className="text-2xl font-bold font-mono text-white mt-1">
            {guests.length}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
          <div className="text-xs text-slate-400 font-medium">Checked-in at Door</div>
          <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">
            {guests.filter((g) => g.checkedInAt).length}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/60 border border-amber-400/30 bg-amber-500/5">
          <div className="text-xs text-amber-300 font-medium">Active Eligible Pool</div>
          <div className="text-2xl font-bold font-mono text-amber-300 mt-1">
            {totalEligible}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
          <div className="text-xs text-slate-400 font-medium">Prizes Awarded</div>
          <div className="text-2xl font-bold font-mono text-rose-400 mt-1">
            {winners.length}
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex-1 min-w-[240px]">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search guests by name, organization, table..."
            className="w-full px-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-amber-400"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Check-In Filter Tabs */}
          <div className="flex items-center p-1 bg-slate-950 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setFilterCheckIn('ALL')}
              className={`px-3 py-1.5 rounded-lg transition ${
                filterCheckIn === 'ALL'
                  ? 'bg-slate-800 text-white font-medium shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              All ({guests.length})
            </button>
            <button
              onClick={() => setFilterCheckIn('CHECKED_IN')}
              className={`px-3 py-1.5 rounded-lg transition ${
                filterCheckIn === 'CHECKED_IN'
                  ? 'bg-emerald-900 text-emerald-100 font-medium shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Checked In ({guests.filter((g) => g.checkedInAt).length})
            </button>
            <button
              onClick={() => setFilterCheckIn('PENDING')}
              className={`px-3 py-1.5 rounded-lg transition ${
                filterCheckIn === 'PENDING'
                  ? 'bg-amber-950 text-amber-100 font-medium shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Pending ({guests.filter((g) => !g.checkedInAt).length})
            </button>
          </div>

          {/* Table Filter Dropdown */}
          <select
            value={filterTable}
            onChange={(e) => setFilterTable(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
          >
            <option value="ALL">All Tables</option>
            {uniqueTables.map((tbl) => (
              <option key={tbl} value={tbl}>
                Table {tbl}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Guest Table */}
      <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/60">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-950/90 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
            <tr>
              <th className="px-5 py-3.5">Guest Name & Org</th>
              <th className="px-4 py-3.5">Table</th>
              <th className="px-4 py-3.5">RSVP Status</th>
              <th className="px-4 py-3.5">Door Check-In</th>
              <th className="px-4 py-3.5">Draw Eligibility</th>
              <th className="px-4 py-3.5 text-right">Quick Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {filteredGuests.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-8 text-center text-slate-500">
                  No gala guests match your current filter query.
                </td>
              </tr>
            ) : (
              filteredGuests.map((g) => {
                const elState = guestEligibilityMap.get(g.id);
                const isCheckedIn = Boolean(g.checkedInAt);

                return (
                  <tr
                    key={g.id}
                    className="hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="px-5 py-3">
                      <div className="font-semibold text-white">
                        {g.fullName}
                      </div>
                      {g.organization && (
                        <div className="text-[11px] text-slate-400">
                          {g.organization} {g.vipTier ? `· ${g.vipTier}` : ''}
                        </div>
                      )}
                    </td>

                    <td className="px-4 py-3 font-mono font-medium text-slate-300">
                      {g.tableNumber ? `Table ${g.tableNumber}` : '—'}
                    </td>

                    <td className="px-4 py-3">
                      <span
                        className={`font-semibold ${
                          g.rsvpStatus === 'ATTENDING' || g.rsvpStatus === 'CONFIRMED'
                            ? 'text-emerald-400'
                            : 'text-slate-500'
                        }`}
                      >
                        {g.rsvpStatus}
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      {isCheckedIn ? (
                        <span className="text-emerald-400 font-semibold inline-flex items-center gap-1">
                          ✓ In Ballroom
                        </span>
                      ) : (
                        <span className="text-slate-500">Not Scanned</span>
                      )}
                    </td>

                    <td className="px-4 py-3">
                      {elState?.eligible ? (
                        <span className="text-amber-300 font-bold">
                          ★ Eligible
                        </span>
                      ) : (
                        <span className="text-slate-500 text-[11px]">
                          ✕ {elState?.reason || 'Ineligible'}
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => onToggleCheckIn(g.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                          isCheckedIn
                            ? 'bg-slate-800 hover:bg-red-950/70 text-slate-300 hover:text-red-200 border border-slate-700'
                            : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow'
                        }`}
                      >
                        {isCheckedIn ? 'Undo Check-In' : 'Simulate Scan'}
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Add Guest Modal */}
      {isAddingGuest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md p-6 rounded-3xl bg-slate-900 border border-amber-400/40 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-serif font-bold text-white">
                Register New Gala Attendee
              </h3>
              <button
                onClick={() => setIsAddingGuest(false)}
                className="text-slate-400 hover:text-white font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Lady Genevieve Montgomery"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-amber-400"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Table Number
                  </label>
                  <input
                    type="text"
                    value={formTable}
                    onChange={(e) => setFormTable(e.target.value)}
                    placeholder="e.g. 5"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-amber-400 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    VIP Classification
                  </label>
                  <select
                    value={formVip}
                    onChange={(e) => setFormVip(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-amber-400"
                  >
                    <option value="Sapphire VIP">Sapphire VIP</option>
                    <option value="Executive">Executive</option>
                    <option value="Patron">Patron</option>
                    <option value="Staff">Staff</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Organization / Affiliation
                </label>
                <input
                  type="text"
                  value={formOrg}
                  onChange={(e) => setFormOrg(e.target.value)}
                  placeholder="e.g. J.P. Morgan Asset Management"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsAddingGuest(false)}
                  className="px-4 py-2 text-xs text-slate-300 bg-slate-800 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 text-xs font-bold text-slate-950 bg-gradient-to-r from-amber-300 via-amber-400 to-yellow-500 rounded-xl shadow-lg"
                >
                  Confirm & Check In
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
