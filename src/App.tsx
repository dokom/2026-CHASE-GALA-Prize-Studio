/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  PrizeDrawConfig,
  Prize,
  Guest,
  PrizeWinner,
  AuditLog,
  DrawAnimationStyle,
} from './types.js';
import {
  initialConfig,
  initialPrizes,
  initialGuests,
  initialAuditLogs,
} from './data/seedData.js';
import {
  filterEligibleCandidates,
  pickRandomWinner,
} from './lib/prizeDrawEngine.js';
import { HolidaySoundEngine } from './lib/soundEngine.js';

import { PrizeStageLauncher } from './components/admin/PrizeStageLauncher.js';
import { DrawSettingsPanel } from './components/admin/DrawSettingsPanel.js';
import { PrizeManager } from './components/admin/PrizeManager.js';
import { GuestPoolManager } from './components/admin/GuestPoolManager.js';
import { AuditLogView } from './components/admin/AuditLogView.js';

type ActiveTab = 'STAGE' | 'SETTINGS' | 'PRIZES' | 'GUESTS' | 'AUDIT';

export default function App() {
  // State Initialization with LocalStorage fallbacks
  const [config, setConfig] = useState<PrizeDrawConfig>(() => {
    try {
      const saved = localStorage.getItem('gala_config');
      return saved ? JSON.parse(saved) : initialConfig;
    } catch {
      return initialConfig;
    }
  });

  const [prizes, setPrizes] = useState<Prize[]>(() => {
    try {
      const saved = localStorage.getItem('gala_prizes');
      return saved ? JSON.parse(saved) : initialPrizes;
    } catch {
      return initialPrizes;
    }
  });

  const [guests, setGuests] = useState<Guest[]>(() => {
    try {
      const saved = localStorage.getItem('gala_guests');
      return saved ? JSON.parse(saved) : initialGuests;
    } catch {
      return initialGuests;
    }
  });

  const [winners, setWinners] = useState<PrizeWinner[]>(() => {
    try {
      const saved = localStorage.getItem('gala_winners');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    try {
      const saved = localStorage.getItem('gala_audit_logs');
      return saved ? JSON.parse(saved) : initialAuditLogs;
    } catch {
      return initialAuditLogs;
    }
  });

  const [activeTab, setActiveTab] = useState<ActiveTab>('STAGE');
  const [activePrizeId, setActivePrizeId] = useState<string>(() => {
    return prizes[0]?.id || 'prz-1';
  });

  // Sound Engine Instance
  const soundEngineRef = useRef<HolidaySoundEngine | null>(null);
  if (!soundEngineRef.current) {
    soundEngineRef.current = new HolidaySoundEngine(!config.enableSoundEffects);
  }

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('gala_config', JSON.stringify(config));
  }, [config]);

  useEffect(() => {
    localStorage.setItem('gala_prizes', JSON.stringify(prizes));
  }, [prizes]);

  useEffect(() => {
    localStorage.setItem('gala_guests', JSON.stringify(guests));
  }, [guests]);

  useEffect(() => {
    localStorage.setItem('gala_winners', JSON.stringify(winners));
  }, [winners]);

  useEffect(() => {
    localStorage.setItem('gala_audit_logs', JSON.stringify(auditLogs));
  }, [auditLogs]);

  // Active prize object
  const activePrize = useMemo(() => {
    return prizes.find((p) => p.id === activePrizeId) || prizes[0];
  }, [prizes, activePrizeId]);

  // All unique tables for filtering & exclusion config
  const availableTables = useMemo(() => {
    const set = new Set<string>();
    guests.forEach((g) => {
      if (g.tableNumber) set.add(g.tableNumber);
    });
    return Array.from(set).sort((a, b) => parseInt(a, 10) - parseInt(b, 10));
  }, [guests]);

  // Eligible pool calculation
  const eligibleGuests = useMemo(() => {
    const winnerGuestIds = new Set(winners.map((w) => w.guestId));
    const excludedTables = new Set(config.excludedTableNumbers);

    return filterEligibleCandidates(guests, {
      requireCheckedIn: config.requireCheckedIn,
      excludePreviousWinners: config.excludePreviousWinners,
      excludedGuestIds: winnerGuestIds,
      excludedTableNumbers: excludedTables,
    });
  }, [guests, winners, config]);

  // --------------------------------------------------------------------------
  // HANDLERS
  // --------------------------------------------------------------------------

  const handleAddAuditLog = (
    action: AuditLog['action'],
    details: string,
    operator: string = 'AV Stage Admin'
  ) => {
    const newLog: AuditLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      action,
      details,
      operator,
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  };

  const handleExecuteDraw = async (prizeId: string) => {
    const targetPrize = prizes.find((p) => p.id === prizeId);
    if (!targetPrize) throw new Error('Selected prize not found.');

    if (eligibleGuests.length === 0) {
      throw new Error(
        'No eligible candidates available in the ballroom pool. Check door check-in status or table exclusion rules in Settings.'
      );
    }

    // Cryptographic random selection
    const winner = pickRandomWinner(eligibleGuests);

    // Save winner entry
    const newWinner: PrizeWinner = {
      id: `win-${Date.now()}`,
      prizeId: targetPrize.id,
      prizeTitle: targetPrize.title,
      guestId: winner.id,
      guestName: winner.fullName,
      tableNumber: winner.tableNumber,
      status: 'SELECTED',
      drawnAt: new Date().toISOString(),
      drawnBy: 'Stage Admin Controller',
    };

    setWinners((prev) => [newWinner, ...prev]);

    // Update prize status
    setPrizes((prev) =>
      prev.map((p) =>
        p.id === targetPrize.id
          ? { ...p, status: 'DRAWN', currentWinnerId: newWinner.id }
          : p
      )
    );

    handleAddAuditLog(
      'DRAW',
      `Drew winner "${winner.fullName}" (Table ${winner.tableNumber || 'N/A'}) for "${targetPrize.title}". Pool size: ${eligibleGuests.length}.`
    );

    return {
      winner,
      decoyReel: eligibleGuests,
    };
  };

  const handleForfeitAndRedraw = async (
    winnerId: string,
    prizeId: string,
    reason: string
  ) => {
    const currentWinner = winners.find((w) => w.id === winnerId || w.guestId === winnerId);
    const targetPrize = prizes.find((p) => p.id === prizeId);

    if (currentWinner) {
      setWinners((prev) =>
        prev.map((w) =>
          w.id === currentWinner.id
            ? {
                ...w,
                status: 'FORFEITED',
                resolvedAt: new Date().toISOString(),
                forfeitReason: reason,
              }
            : w
        )
      );

      handleAddAuditLog(
        'FORFEIT',
        `Forfeited draw for "${currentWinner.guestName}" on "${currentWinner.prizeTitle}". Reason: ${reason}`
      );
    }

    // Re-filter pool excluding the forfeited guest
    const winnerGuestIds = new Set(
      winners
        .filter((w) => w.status !== 'FORFEITED')
        .map((w) => w.guestId)
    );
    if (currentWinner) {
      winnerGuestIds.add(currentWinner.guestId);
    }

    const remainingPool = filterEligibleCandidates(guests, {
      requireCheckedIn: config.requireCheckedIn,
      excludePreviousWinners: config.excludePreviousWinners,
      excludedGuestIds: winnerGuestIds,
      excludedTableNumbers: new Set(config.excludedTableNumbers),
    });

    if (remainingPool.length === 0) {
      throw new Error('No remaining eligible candidates for redraw.');
    }

    const nextWinner = pickRandomWinner(remainingPool);

    const redrawnWinner: PrizeWinner = {
      id: `win-${Date.now()}`,
      prizeId: targetPrize?.id || prizeId,
      prizeTitle: targetPrize?.title || 'Holiday Prize',
      guestId: nextWinner.id,
      guestName: nextWinner.fullName,
      tableNumber: nextWinner.tableNumber,
      status: 'SELECTED',
      drawnAt: new Date().toISOString(),
      drawnBy: 'Stage Admin Controller',
    };

    setWinners((prev) => [redrawnWinner, ...prev]);

    handleAddAuditLog(
      'REDRAW',
      `Redrawn replacement winner "${nextWinner.fullName}" (Table ${nextWinner.tableNumber || 'N/A'}) for "${targetPrize?.title}".`
    );

    return {
      winner: nextWinner,
      decoyReel: remainingPool,
    };
  };

  const handleConfirmClaim = (winner: Guest, prizeId: string) => {
    setWinners((prev) =>
      prev.map((w) =>
        w.guestId === winner.id && w.prizeId === prizeId
          ? { ...w, status: 'CLAIMED', resolvedAt: new Date().toISOString() }
          : w
      )
    );

    setPrizes((prev) =>
      prev.map((p) => (p.id === prizeId ? { ...p, status: 'CLAIMED' } : p))
    );

    handleAddAuditLog(
      'CLAIM',
      `Confirmed prize claim for "${winner.fullName}" (Table ${winner.tableNumber || 'N/A'}).`
    );
  };

  const handleNextPrize = () => {
    const currentIndex = prizes.findIndex((p) => p.id === activePrizeId);
    if (currentIndex >= 0 && currentIndex < prizes.length - 1) {
      setActivePrizeId(prizes[currentIndex + 1].id);
    } else if (prizes.length > 0) {
      setActivePrizeId(prizes[0].id);
    }
  };

  const handleToggleCheckIn = (guestId: string) => {
    setGuests((prev) =>
      prev.map((g) => {
        if (g.id === guestId) {
          const nextState = g.checkedInAt ? null : new Date().toISOString();
          handleAddAuditLog(
            'CHECKIN',
            `${g.fullName} (${g.tableNumber ? `Table ${g.tableNumber}` : 'General'}) door check-in: ${
              nextState ? 'Checked In' : 'Check-In Revoked'
            }.`
          );
          return { ...g, checkedInAt: nextState };
        }
        return g;
      })
    );
  };

  const handleBatchCheckInAll = () => {
    const now = new Date().toISOString();
    setGuests((prev) =>
      prev.map((g) =>
        g.rsvpStatus === 'ATTENDING' || g.rsvpStatus === 'CONFIRMED'
          ? { ...g, checkedInAt: g.checkedInAt || now }
          : g
      )
    );
    handleAddAuditLog(
      'CHECKIN',
      'Batch door check-in performed for all attending guests.'
    );
  };

  const handleResetCheckIns = () => {
    setGuests((prev) => prev.map((g) => ({ ...g, checkedInAt: null })));
    handleAddAuditLog('CHECKIN', 'All door check-ins reset.');
  };

  const handleAddGuest = (guest: Omit<Guest, 'id'>) => {
    const newGuest: Guest = {
      ...guest,
      id: `g-${Date.now()}`,
    };
    setGuests((prev) => [newGuest, ...prev]);
    handleAddAuditLog('GUEST_ADD', `Registered new attendee "${newGuest.fullName}".`);
  };

  const handleSaveConfig = (updated: PrizeDrawConfig) => {
    setConfig(updated);
    soundEngineRef.current?.setMuted(!updated.enableSoundEffects);
    handleAddAuditLog(
      'CONFIG_UPDATE',
      `Updated settings: Mode=${updated.animationStyle}, Duration=${updated.spinDurationSeconds}s, CheckedInOnly=${updated.requireCheckedIn}.`
    );
  };

  const handleResetDefaults = () => {
    setConfig(initialConfig);
    soundEngineRef.current?.setMuted(!initialConfig.enableSoundEffects);
    handleAddAuditLog('CONFIG_UPDATE', 'Reset prize draw settings to recommended defaults.');
  };

  const handleAddPrize = (
    prizeData: Omit<Prize, 'id' | 'createdAt' | 'status'>
  ) => {
    const newPrize: Prize = {
      ...prizeData,
      id: `prz-${Date.now()}`,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
    };
    setPrizes((prev) => [...prev, newPrize]);
    handleAddAuditLog('CONFIG_UPDATE', `Added new gala prize: "${newPrize.title}".`);
  };

  const handleUpdatePrize = (updated: Prize) => {
    setPrizes((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    handleAddAuditLog('CONFIG_UPDATE', `Updated prize: "${updated.title}".`);
  };

  const handleDeletePrize = (prizeId: string) => {
    const target = prizes.find((p) => p.id === prizeId);
    setPrizes((prev) => prev.filter((p) => p.id !== prizeId));
    if (activePrizeId === prizeId && prizes.length > 1) {
      const remaining = prizes.filter((p) => p.id !== prizeId);
      setActivePrizeId(remaining[0].id);
    }
    handleAddAuditLog('CONFIG_UPDATE', `Deleted prize: "${target?.title || prizeId}".`);
  };

  const handleResetPrizes = () => {
    setPrizes(initialPrizes);
    setActivePrizeId(initialPrizes[0].id);
    handleAddAuditLog('CONFIG_UPDATE', 'Reset gala prize inventory to default showcase list.');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* --------------------------------------------------------------------
       * TOP BAR CONTRACT (§2: Brand title, single line — 4-5 nav links — 1 action)
       * ------------------------------------------------------------------ */}
      <header className="sticky top-0 z-50 flex items-center justify-between gap-8 px-6 py-4 bg-slate-950/90 backdrop-blur-md border-b border-slate-800">
        {/* Zone 1: Single text element wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-xl font-serif font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-yellow-500 whitespace-nowrap">
            2026 CHASE GALA
          </span>
          <span className="hidden md:inline text-xs text-amber-300/80 tracking-widest uppercase font-mono">
            / Prize Studio
          </span>
        </div>

        {/* Zone 2: 4–5 clean single-line text navigation links */}
        <nav className="hidden lg:flex items-center gap-6 text-xs font-semibold uppercase tracking-wider text-slate-400">
          <button
            onClick={() => setActiveTab('STAGE')}
            className={`transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'STAGE'
                ? 'text-amber-400 border-b-2 border-amber-400 pb-0.5'
                : 'hover:text-slate-200'
            }`}
          >
            Stage Projector View
          </button>
          <button
            onClick={() => setActiveTab('SETTINGS')}
            className={`transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'SETTINGS'
                ? 'text-amber-400 border-b-2 border-amber-400 pb-0.5'
                : 'hover:text-slate-200'
            }`}
          >
            Draw Settings
          </button>
          <button
            onClick={() => setActiveTab('PRIZES')}
            className={`transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'PRIZES'
                ? 'text-amber-400 border-b-2 border-amber-400 pb-0.5'
                : 'hover:text-slate-200'
            }`}
          >
            Prizes ({prizes.length})
          </button>
          <button
            onClick={() => setActiveTab('GUESTS')}
            className={`transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'GUESTS'
                ? 'text-amber-400 border-b-2 border-amber-400 pb-0.5'
                : 'hover:text-slate-200'
            }`}
          >
            Guest Pool & Check-in ({eligibleGuests.length}/{guests.length})
          </button>
          <button
            onClick={() => setActiveTab('AUDIT')}
            className={`transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'AUDIT'
                ? 'text-amber-400 border-b-2 border-amber-400 pb-0.5'
                : 'hover:text-slate-200'
            }`}
          >
            Audit Log ({auditLogs.length})
          </button>
        </nav>

        {/* Zone 3: 1 primary action button */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setActiveTab('STAGE')}
            className="px-4 py-2 text-xs font-bold text-slate-950 bg-gradient-to-r from-amber-300 via-amber-400 to-yellow-500 hover:from-amber-200 hover:to-amber-400 rounded-xl shadow-md transition hover:scale-105 whitespace-nowrap shrink-0"
          >
            ★ Launch Stage View
          </button>
        </div>
      </header>

      {/* Mobile Nav Scroller (when screen is smaller than lg) */}
      <div className="lg:hidden flex items-center gap-2 p-2 px-4 bg-slate-900 border-b border-slate-800 overflow-x-auto text-xs">
        {(
          [
            { id: 'STAGE', label: 'Stage View' },
            { id: 'SETTINGS', label: 'Settings' },
            { id: 'PRIZES', label: `Prizes (${prizes.length})` },
            { id: 'GUESTS', label: `Guests (${eligibleGuests.length})` },
            { id: 'AUDIT', label: 'Audit Log' },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap shrink-0 font-medium transition ${
              activeTab === t.id
                ? 'bg-amber-400 text-slate-950 font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Main Workspace Body */}
      <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto">
        {activeTab === 'STAGE' && activePrize && (
          <div className="space-y-6">
            {/* Quick Prize Selector Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-slate-900/80 border border-slate-800">
              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-400">Current Prize:</span>
                <select
                  value={activePrizeId}
                  onChange={(e) => setActivePrizeId(e.target.value)}
                  className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-amber-200 font-semibold focus:outline-none focus:border-amber-400"
                >
                  {prizes.map((p, idx) => (
                    <option key={p.id} value={p.id}>
                      #{idx + 1} {p.title} [{p.status}]
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-3 text-xs">
                <span className="text-slate-400">
                  Animation Mode:{' '}
                  <strong className="text-white">{config.animationStyle}</strong>
                </span>
                <button
                  onClick={() => setActiveTab('SETTINGS')}
                  className="text-amber-400 hover:underline font-medium"
                >
                  Configure Stage Settings →
                </button>
              </div>
            </div>

            {/* The God-Like Christmas Stage Component */}
            <PrizeStageLauncher
              prize={activePrize}
              eligibleGuests={eligibleGuests}
              animationMode={config.animationStyle}
              spinDurationSeconds={config.spinDurationSeconds}
              showTableNumber={config.showTableNumber}
              enableSound={config.enableSoundEffects}
              snowDensity={config.snowDensity}
              soundEngine={soundEngineRef.current!}
              onExecuteDraw={handleExecuteDraw}
              onForfeitAndRedraw={handleForfeitAndRedraw}
              onConfirmClaim={handleConfirmClaim}
              onNextPrize={handleNextPrize}
              onModeChange={(mode: DrawAnimationStyle) =>
                setConfig((c) => ({ ...c, animationStyle: mode }))
              }
              onSoundToggle={(enabled: boolean) => {
                setConfig((c) => ({ ...c, enableSoundEffects: enabled }));
                soundEngineRef.current?.setMuted(!enabled);
              }}
            />
          </div>
        )}

        {activeTab === 'SETTINGS' && (
          <DrawSettingsPanel
            config={config}
            onSaveConfig={handleSaveConfig}
            onResetDefaults={handleResetDefaults}
            availableTables={availableTables}
          />
        )}

        {activeTab === 'PRIZES' && (
          <PrizeManager
            prizes={prizes}
            winners={winners}
            activePrizeId={activePrizeId}
            onSelectActivePrize={(id) => {
              setActivePrizeId(id);
              setActiveTab('STAGE');
            }}
            onAddPrize={handleAddPrize}
            onUpdatePrize={handleUpdatePrize}
            onDeletePrize={handleDeletePrize}
            onResetPrizes={handleResetPrizes}
          />
        )}

        {activeTab === 'GUESTS' && (
          <GuestPoolManager
            guests={guests}
            config={config}
            winners={winners}
            onToggleCheckIn={handleToggleCheckIn}
            onBatchCheckInAll={handleBatchCheckInAll}
            onResetCheckIns={handleResetCheckIns}
            onAddGuest={handleAddGuest}
          />
        )}

        {activeTab === 'AUDIT' && (
          <AuditLogView logs={auditLogs} winners={winners} />
        )}
      </main>

      {/* Footer */}
      <footer className="py-6 px-6 border-t border-slate-900 text-center text-xs text-slate-500">
        <p>2026 Chase Holiday Gala · Broadcast-Grade Prize Draw & Stage System · All Rights Reserved</p>
      </footer>
    </div>
  );
}
