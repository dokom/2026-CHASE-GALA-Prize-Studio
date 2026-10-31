/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AuditLog, PrizeWinner } from '../../types.js';

interface AuditLogViewProps {
  logs: AuditLog[];
  winners: PrizeWinner[];
  onClearLogs?: () => void;
}

export function AuditLogView({ logs, winners }: AuditLogViewProps) {
  const [filterAction, setFilterAction] = useState<string>('ALL');

  const filteredLogs = logs.filter((log) => {
    if (filterAction === 'ALL') return true;
    return log.action === filterAction;
  });

  const exportCSV = () => {
    const headers = ['Timestamp', 'Action', 'Operator', 'Details'];
    const rows = logs.map((l) => [
      `"${l.timestamp}"`,
      `"${l.action}"`,
      `"${l.operator}"`,
      `"${l.details.replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `2026_gala_prize_audit_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const getActionBadge = (action: AuditLog['action']) => {
    switch (action) {
      case 'DRAW':
        return 'text-amber-300 bg-amber-950/80 border border-amber-500/40';
      case 'CLAIM':
        return 'text-emerald-300 bg-emerald-950/80 border border-emerald-500/40';
      case 'FORFEIT':
      case 'REDRAW':
        return 'text-rose-300 bg-rose-950/80 border border-rose-500/40';
      case 'CONFIG_UPDATE':
        return 'text-blue-300 bg-blue-950/80 border border-blue-500/40';
      default:
        return 'text-slate-300 bg-slate-800 border border-slate-700';
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h2 className="text-2xl font-serif font-bold text-white tracking-tight">
            Gala Prize Draw Audit Trail & Compliance
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Tamper-evident log of all random draws, forfeits, redraws, and setting revisions.
          </p>
        </div>

        <button
          onClick={exportCSV}
          className="px-4 py-2 text-xs font-bold text-slate-950 bg-gradient-to-r from-amber-300 via-amber-400 to-yellow-500 rounded-xl shadow-md transition hover:scale-105"
        >
          ⬇ Export Compliance CSV
        </button>
      </div>

      {/* Official Winners Summary Strip */}
      {winners.length > 0 && (
        <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-950/40 to-slate-900/80 border border-emerald-500/30 space-y-3">
          <div className="text-xs font-bold tracking-widest uppercase text-emerald-400">
            ★ Official Gala Prize Winners Archive ({winners.length})
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {winners.map((w) => (
              <div
                key={w.id}
                className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1"
              >
                <div className="text-[11px] font-bold text-amber-300 truncate">
                  {w.prizeTitle}
                </div>
                <div className="text-sm font-serif font-black text-white">
                  {w.guestName}
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>{w.tableNumber ? `Table ${w.tableNumber}` : 'General'}</span>
                  <span
                    className={`font-semibold ${
                      w.status === 'CLAIMED'
                        ? 'text-emerald-400'
                        : w.status === 'FORFEITED'
                        ? 'text-rose-400'
                        : 'text-amber-300'
                    }`}
                  >
                    {w.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 p-1 bg-slate-900 rounded-xl border border-slate-800 text-xs w-fit">
        {['ALL', 'DRAW', 'CLAIM', 'FORFEIT', 'CONFIG_UPDATE'].map((act) => (
          <button
            key={act}
            onClick={() => setFilterAction(act)}
            className={`px-3 py-1.5 rounded-lg transition ${
              filterAction === act
                ? 'bg-slate-800 text-white font-medium shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {act}
          </button>
        ))}
      </div>

      {/* Logs Table */}
      <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/60">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-950/90 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
            <tr>
              <th className="px-5 py-3.5">Timestamp</th>
              <th className="px-4 py-3.5">Action</th>
              <th className="px-4 py-3.5">Operator</th>
              <th className="px-5 py-3.5">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {filteredLogs.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-5 py-8 text-center text-slate-500">
                  No audit logs recorded for this category.
                </td>
              </tr>
            ) : (
              filteredLogs.map((l) => (
                <tr key={l.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="px-5 py-3 font-mono text-slate-400 tabular-nums whitespace-nowrap">
                    {new Date(l.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    })}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${getActionBadge(
                        l.action
                      )}`}
                    >
                      {l.action}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-300 font-medium">
                    {l.operator}
                  </td>
                  <td className="px-5 py-3 text-slate-200">
                    {l.details}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
