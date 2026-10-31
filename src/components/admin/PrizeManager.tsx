/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Prize, PrizeTier, PrizeWinner } from '../../types.js';

interface PrizeManagerProps {
  prizes: Prize[];
  winners: PrizeWinner[];
  activePrizeId: string;
  onSelectActivePrize: (prizeId: string) => void;
  onAddPrize: (prize: Omit<Prize, 'id' | 'createdAt' | 'status'>) => void;
  onUpdatePrize: (prize: Prize) => void;
  onDeletePrize: (prizeId: string) => void;
  onResetPrizes: () => void;
}

export function PrizeManager({
  prizes,
  winners,
  activePrizeId,
  onSelectActivePrize,
  onAddPrize,
  onUpdatePrize,
  onDeletePrize,
  onResetPrizes,
}: PrizeManagerProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingPrize, setEditingPrize] = useState<Prize | null>(null);

  const [formTitle, setFormTitle] = useState('');
  const [formSponsor, setFormSponsor] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formTier, setFormTier] = useState<PrizeTier>('LUXURY');
  const [formQuantity, setFormQuantity] = useState(1);

  const handleOpenAdd = () => {
    setFormTitle('');
    setFormSponsor('');
    setFormDesc('');
    setFormTier('LUXURY');
    setFormQuantity(1);
    setIsAdding(true);
    setEditingPrize(null);
  };

  const handleOpenEdit = (p: Prize) => {
    setEditingPrize(p);
    setFormTitle(p.title);
    setFormSponsor(p.sponsor || '');
    setFormDesc(p.description || '');
    setFormTier(p.tier);
    setFormQuantity(p.quantity);
    setIsAdding(true);
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;

    if (editingPrize) {
      onUpdatePrize({
        ...editingPrize,
        title: formTitle.trim(),
        sponsor: formSponsor.trim() || undefined,
        description: formDesc.trim() || undefined,
        tier: formTier,
        quantity: formQuantity,
      });
    } else {
      onAddPrize({
        title: formTitle.trim(),
        sponsor: formSponsor.trim() || undefined,
        description: formDesc.trim() || undefined,
        tier: formTier,
        quantity: formQuantity,
        sortOrder: prizes.length + 1,
      });
    }

    setIsAdding(false);
    setEditingPrize(null);
  };

  const getTierBadgeStyle = (tier: PrizeTier) => {
    switch (tier) {
      case 'GRAND':
        return 'text-amber-300 bg-amber-950/80 border-amber-400/40';
      case 'LUXURY':
        return 'text-rose-300 bg-rose-950/80 border-rose-400/40';
      case 'PREMIUM':
        return 'text-emerald-300 bg-emerald-950/80 border-emerald-400/40';
      case 'DOOR':
        return 'text-blue-300 bg-blue-950/80 border-blue-400/40';
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h2 className="text-2xl font-serif font-bold text-white tracking-tight">
            Gala Prize Inventory & Order of Draw
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Manage official gala prizes, sponsor presentation credits, and select the active stage item.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onResetPrizes}
            className="px-3.5 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-900 border border-slate-800 rounded-xl transition"
          >
            Reset Default List
          </button>
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 text-xs font-bold text-slate-950 bg-gradient-to-r from-amber-300 via-amber-400 to-yellow-500 rounded-xl shadow-md transition hover:scale-105"
          >
            + Add New Gala Prize
          </button>
        </div>
      </div>

      {/* Prize Cards List */}
      <div className="grid grid-cols-1 gap-4">
        {prizes.map((p, idx) => {
          const isActive = p.id === activePrizeId;
          const winner = winners.find((w) => w.prizeId === p.id);

          return (
            <div
              key={p.id}
              className={`p-5 rounded-2xl border transition-all ${
                isActive
                  ? 'bg-slate-900 border-amber-400/70 shadow-[0_0_30px_rgba(245,158,11,0.15)] ring-1 ring-amber-400/50'
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-mono font-bold text-amber-400">
                      #{idx + 1}
                    </span>
                    <span
                      className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full border ${getTierBadgeStyle(
                        p.tier
                      )}`}
                    >
                      {p.tier} TIER
                    </span>
                    {p.sponsor && (
                      <span className="text-xs text-amber-200/80 font-medium">
                        {p.sponsor}
                      </span>
                    )}
                    {isActive && (
                      <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-amber-400 text-slate-950">
                        Active on Stage
                      </span>
                    )}
                  </div>

                  <h3 className="text-lg font-serif font-bold text-white">
                    {p.title}
                  </h3>
                  {p.description && (
                    <p className="text-xs text-slate-400 max-w-3xl">
                      {p.description}
                    </p>
                  )}

                  {winner && (
                    <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 text-xs">
                      <span>🎉 Winner Drawn:</span>
                      <strong className="text-white">{winner.guestName}</strong>
                      {winner.tableNumber && (
                        <span>(Table {winner.tableNumber})</span>
                      )}
                      <span className="text-[11px] uppercase tracking-wider text-emerald-400 ml-1">
                        [{winner.status}]
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  {!isActive && (
                    <button
                      onClick={() => onSelectActivePrize(p.id)}
                      className="px-4 py-2 text-xs font-bold text-amber-300 hover:text-slate-950 bg-amber-500/10 hover:bg-amber-400 border border-amber-400/40 rounded-xl transition"
                    >
                      Set Active on Stage
                    </button>
                  )}

                  <button
                    onClick={() => handleOpenEdit(p)}
                    className="px-3 py-2 text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700 transition"
                  >
                    Edit
                  </button>

                  <button
                    onClick={() => onDeletePrize(p.id)}
                    className="px-3 py-2 text-xs text-red-400 hover:text-red-200 bg-red-950/40 hover:bg-red-900/60 rounded-xl border border-red-900/50 transition"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Modal */}
      {isAdding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-lg p-6 rounded-3xl bg-slate-900 border border-amber-400/40 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-serif font-bold text-white">
                {editingPrize ? 'Edit Gala Prize' : 'Add New Gala Prize'}
              </h3>
              <button
                onClick={() => setIsAdding(false)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveForm} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Prize Title
                </label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-amber-400"
                  placeholder="e.g. Bespoke Rolex Oyster Perpetual Datejust"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Sponsor Presentation Credit
                </label>
                <input
                  type="text"
                  value={formSponsor}
                  onChange={(e) => setFormSponsor(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-amber-400"
                  placeholder="e.g. Presented by J.P. Morgan Private Bank"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Prize Tier
                  </label>
                  <select
                    value={formTier}
                    onChange={(e) => setFormTier(e.target.value as PrizeTier)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-amber-400"
                  >
                    <option value="GRAND">GRAND (Top Showcase)</option>
                    <option value="LUXURY">LUXURY (Exclusive)</option>
                    <option value="PREMIUM">PREMIUM (High Value)</option>
                    <option value="DOOR">DOOR (Attendance Prize)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Quantity
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={formQuantity}
                    onChange={(e) =>
                      setFormQuantity(parseInt(e.target.value, 10) || 1)
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-amber-400 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Prize Description & Experience Details
                </label>
                <textarea
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  rows={3}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-amber-400"
                  placeholder="Details displayed during the stage broadcast..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-4 py-2 text-xs text-slate-300 hover:text-white bg-slate-800 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 text-xs font-bold text-slate-950 bg-gradient-to-r from-amber-300 via-amber-400 to-yellow-500 rounded-xl shadow-lg"
                >
                  {editingPrize ? 'Save Changes' : 'Create Prize'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
