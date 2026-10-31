/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { PrizeDrawConfig, DrawAnimationStyle, SnowDensity } from '../../types.js';

interface DrawSettingsPanelProps {
  config: PrizeDrawConfig;
  onSaveConfig: (updated: PrizeDrawConfig) => void;
  onResetDefaults: () => void;
  availableTables: string[];
}

export function DrawSettingsPanel({
  config,
  onSaveConfig,
  onResetDefaults,
  availableTables,
}: DrawSettingsPanelProps) {
  const [formData, setFormData] = useState<PrizeDrawConfig>({ ...config });
  const [newTable, setNewTable] = useState('');
  const [saveToast, setSaveToast] = useState(false);

  const handleToggleTable = (table: string) => {
    const set = new Set(formData.excludedTableNumbers);
    if (set.has(table)) {
      set.delete(table);
    } else {
      set.add(table);
    }
    setFormData({ ...formData, excludedTableNumbers: Array.from(set) });
  };

  const handleAddCustomTable = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTable.trim()) return;
    const trimmed = newTable.trim();
    if (!formData.excludedTableNumbers.includes(trimmed)) {
      setFormData({
        ...formData,
        excludedTableNumbers: [...formData.excludedTableNumbers, trimmed],
      });
    }
    setNewTable('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveConfig(formData);
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 2500);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h2 className="text-2xl font-serif font-bold text-white tracking-tight">
            Prize Draw Configuration & Stage Settings
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Configure eligibility algorithms, stage 3D animations, and sound effects for the 2026 Gala.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onResetDefaults}
            className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 rounded-xl border border-slate-700 transition"
          >
            Reset to Recommended
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="px-6 py-2 text-xs font-bold text-slate-950 bg-gradient-to-r from-amber-300 via-amber-400 to-yellow-500 hover:from-amber-200 hover:to-amber-400 rounded-xl shadow-lg transition"
          >
            Save Configuration
          </button>
        </div>
      </div>

      {saveToast && (
        <div className="p-4 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-200 text-sm font-medium flex items-center justify-between">
          <span>✓ Settings saved successfully and broadcasted to Stage Projector mode!</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* SECTION 1: EVENT TITLE & GENERAL */}
        <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-4">
          <h3 className="text-sm font-semibold tracking-wider uppercase text-amber-400">
            1. Event Identity
          </h3>
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Gala Event Display Title
            </label>
            <input
              type="text"
              value={formData.eventTitle}
              onChange={(e) =>
                setFormData({ ...formData, eventTitle: e.target.value })
              }
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:border-amber-400"
              placeholder="e.g. 2026 CHASE SAPPHIRE WINTER GALA"
              required
            />
          </div>
        </div>

        {/* SECTION 2: 3D ANIMATION & STAGE PRESENTATION */}
        <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-6">
          <h3 className="text-sm font-semibold tracking-wider uppercase text-amber-400">
            2. Broadcast 3D Stage Animation
          </h3>

          {/* Animation Modes */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(
              [
                {
                  id: 'ROYAL_DRUM' as DrawAnimationStyle,
                  title: '3D Sleigh Drum',
                  desc: 'Curved 3D cylinder rotating on X-axis through champagne gold spotlights with mechanical lock-in overshoot.',
                  icon: '🎰',
                },
                {
                  id: 'STARLIGHT_CAROUSEL' as DrawAnimationStyle,
                  title: '3D Foil Cards',
                  desc: 'Gold-foiled luxury gala cards whipping across a 1400px 3D arc, flipping to reveal the winning guest pass.',
                  icon: '🎴',
                },
                {
                  id: 'ORNAMENT_UNWRAP' as DrawAnimationStyle,
                  title: 'Royal Gift Box',
                  desc: '3D crimson velvet box with rotating celestial god-rays, levitating in suspense before bursting open in gold stardust.',
                  icon: '🎁',
                },
              ] as const
            ).map((mode) => (
              <label
                key={mode.id}
                onClick={() =>
                  setFormData({ ...formData, animationStyle: mode.id })
                }
                className={`cursor-pointer p-4 rounded-xl border transition-all flex flex-col justify-between ${
                  formData.animationStyle === mode.id
                    ? 'border-amber-400 bg-amber-500/10 shadow-[0_0_25px_rgba(245,158,11,0.2)]'
                    : 'border-slate-800 bg-slate-950/70 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="mb-2">
                    {mode.id === 'ORNAMENT_UNWRAP' ? (
                      <img
                        src="/assets/aistudio/image_1782da80.png"
                        alt="Royal Gift Box"
                        className="w-8 h-8 rounded-lg object-cover border border-amber-400/40 shadow-sm"
                        referrerPolicy="no-referrer"
                      />
                    ) : mode.id === 'STARLIGHT_CAROUSEL' ? (
                      <img
                        src="/assets/aistudio/image_28a835c0.png"
                        alt="Royal Gala Raffle Deck"
                        className="w-8 h-8 rounded-lg object-cover border border-amber-400/40 shadow-sm"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <span className="text-2xl">{mode.icon}</span>
                    )}
                  </div>
                  <div className="text-sm font-bold text-white mb-1">
                    {mode.title}
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {mode.desc}
                  </p>
                </div>
                <div className="mt-4 flex items-center justify-between text-xs">
                  <span
                    className={
                      formData.animationStyle === mode.id
                        ? 'text-amber-400 font-semibold'
                        : 'text-slate-500'
                    }
                  >
                    {formData.animationStyle === mode.id
                      ? '● Selected'
                      : 'Select'}
                  </span>
                </div>
              </label>
            ))}
          </div>

          {/* Spin Duration Slider */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-slate-300">
                Spin & Suspense Duration
              </label>
              <span className="text-xs font-mono font-bold text-amber-300 bg-amber-400/10 px-2.5 py-0.5 rounded-md border border-amber-400/20">
                {formData.spinDurationSeconds} seconds
              </span>
            </div>
            <input
              type="range"
              min="3"
              max="15"
              step="1"
              value={formData.spinDurationSeconds}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  spinDurationSeconds: parseInt(e.target.value, 10),
                })
              }
              className="w-full accent-amber-400 bg-slate-950 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[11px] text-slate-500">
              <span>3s (Quick Door Prize)</span>
              <span>7s (Recommended Gala Balance)</span>
              <span>15s (Grand Prize Suspense)</span>
            </div>
          </div>

          {/* Visual & Sound Options */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-800">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Snowfall & Bokeh Atmosphere
              </label>
              <select
                value={formData.snowDensity}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    snowDensity: e.target.value as SnowDensity,
                  })
                }
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-amber-400"
              >
                <option value="SUBTLE">Subtle (Quiet Candlelit Ambience)</option>
                <option value="LUSH">Lush (Recommended Holiday Wonder)</option>
                <option value="BLIZZARD">Blizzard (Dramatic Winter Vortex)</option>
              </select>
            </div>

            <div className="space-y-3">
              <label className="flex items-center gap-2.5 text-xs text-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.enableSoundEffects}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      enableSoundEffects: e.target.checked,
                    })
                  }
                  className="w-4 h-4 rounded border-slate-700 accent-amber-400"
                />
                <span>Enable Procedural Celesta Chimes & Fanfare</span>
              </label>

              <label className="flex items-center gap-2.5 text-xs text-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.showTableNumber}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      showTableNumber: e.target.checked,
                    })
                  }
                  className="w-4 h-4 rounded border-slate-700 accent-amber-400"
                />
                <span>Display Table Number on Stage Banner</span>
              </label>
            </div>
          </div>
        </div>

        {/* SECTION 3: ELIGIBILITY & RULES ENGINE */}
        <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-6">
          <h3 className="text-sm font-semibold tracking-wider uppercase text-amber-400">
            3. Eligibility & Winner Rules
          </h3>

          <div className="space-y-4">
            <label className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.requireCheckedIn}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    requireCheckedIn: e.target.checked,
                  })
                }
                className="w-4 h-4 mt-0.5 rounded border-slate-700 accent-amber-400"
              />
              <div>
                <div className="text-xs font-bold text-white">
                  Require Door Check-In (Recommended)
                </div>
                <div className="text-[11px] text-slate-400">
                  Only guests whose QR ticket has been scanned at the ballroom entrance are eligible. Prevents drawing guests who have not arrived.
                </div>
              </div>
            </label>

            <label className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.excludePreviousWinners}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    excludePreviousWinners: e.target.checked,
                  })
                }
                className="w-4 h-4 mt-0.5 rounded border-slate-700 accent-amber-400"
              />
              <div>
                <div className="text-xs font-bold text-white">
                  Exclude Previous Winners Across All Draws
                </div>
                <div className="text-[11px] text-slate-400">
                  Once a guest wins any prize during the gala, they are automatically removed from future draw reels to ensure fairness.
                </div>
              </div>
            </label>
          </div>

          {/* Table Exclusions */}
          <div className="pt-2 border-t border-slate-800 space-y-3">
            <div>
              <div className="text-xs font-bold text-white mb-1">
                Excluded Tables (Staff, Organizers, VIP Judges)
              </div>
              <p className="text-[11px] text-slate-400 mb-3">
                Guests seated at these tables are barred from the prize pool.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {availableTables.map((tbl) => {
                const isExcluded = formData.excludedTableNumbers.includes(tbl);
                return (
                  <button
                    key={tbl}
                    type="button"
                    onClick={() => handleToggleTable(tbl)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition ${
                      isExcluded
                        ? 'bg-red-950 text-red-200 border border-red-800/80'
                        : 'bg-slate-950 text-slate-400 border border-slate-800 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    Table {tbl} {isExcluded ? '✕' : ''}
                  </button>
                );
              })}
            </div>

            {/* Custom Table Exclude Input */}
            <div className="flex gap-2 pt-2">
              <input
                type="text"
                value={newTable}
                onChange={(e) => setNewTable(e.target.value)}
                placeholder="Add other table #..."
                className="w-44 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-amber-400"
              />
              <button
                type="button"
                onClick={handleAddCustomTable}
                className="px-3 py-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700"
              >
                + Exclude Table
              </button>
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-3 pt-4">
          <button
            type="submit"
            className="px-8 py-3 text-sm font-bold text-slate-950 bg-gradient-to-r from-amber-300 via-amber-400 to-yellow-500 hover:from-amber-200 hover:to-amber-400 rounded-xl shadow-xl transition hover:scale-105"
          >
            Save All Configuration Settings
          </button>
        </div>
      </form>
    </div>
  );
}
