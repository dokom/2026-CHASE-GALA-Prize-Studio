/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Prize,
  Guest,
  DrawAnimationStyle,
  SnowDensity,
  PrizeWinner,
} from '../../types.js';
import {
  easeOutWithOvershoot,
  buildAnimationReel,
} from '../../lib/prizeDrawEngine.js';
import { HolidaySoundEngine } from '../../lib/soundEngine.js';

interface PrizeStageLauncherProps {
  prize: Prize;
  eligibleGuests: Guest[];
  animationMode: DrawAnimationStyle;
  spinDurationSeconds: number;
  showTableNumber: boolean;
  enableSound: boolean;
  snowDensity: SnowDensity;
  soundEngine: HolidaySoundEngine;
  onExecuteDraw: (prizeId: string) => Promise<{ winner: Guest; decoyReel: Guest[] }>;
  onForfeitAndRedraw: (winnerId: string, prizeId: string, reason: string) => Promise<{ winner: Guest; decoyReel: Guest[] }>;
  onConfirmClaim: (winner: Guest, prizeId: string) => void;
  onNextPrize?: () => void;
  onModeChange: (mode: DrawAnimationStyle) => void;
  onSoundToggle: (enabled: boolean) => void;
}

export function PrizeStageLauncher({
  prize,
  eligibleGuests,
  animationMode,
  spinDurationSeconds = 7,
  showTableNumber = true,
  enableSound = true,
  snowDensity = 'LUSH',
  soundEngine,
  onExecuteDraw,
  onForfeitAndRedraw,
  onConfirmClaim,
  onNextPrize,
  onModeChange,
  onSoundToggle,
}: PrizeStageLauncherProps) {
  const [phase, setPhase] = useState<'IDLE' | 'SPINNING' | 'REVEALED'>('IDLE');
  const [sequence, setSequence] = useState<Guest[]>([]);
  const [reelPosition, setReelPosition] = useState<number>(0);
  const [spinProgress, setSpinProgress] = useState<number>(0);
  const [winner, setWinner] = useState<Guest | null>(null);
  const [cardFlipped, setCardFlipped] = useState<boolean>(false);
  const [claimConfirmed, setClaimConfirmed] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const bgCanvasRef = useRef<HTMLCanvasElement>(null);
  const fxCanvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number | null>(null);
  const phaseRef = useRef(phase);
  const spinProgressRef = useRef(0);

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  // Reset stage to IDLE whenever the active prize changes
  useEffect(() => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    setPhase('IDLE');
    setWinner(null);
    setSequence([]);
    setReelPosition(0);
    setSpinProgress(0);
    setCardFlipped(false);
    setClaimConfirmed(false);
    setErrorMessage(null);
  }, [prize.id]);

  /* --------------------------------------------------------------------------
   * 1. AMBIENT WINTER WONDERLAND + GOLDEN BOKEH + VORTEX (Canvas 1)
   * ------------------------------------------------------------------------ */
  useEffect(() => {
    const canvas = bgCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = canvas.offsetWidth * dpr;
      canvas.height = canvas.offsetHeight * dpr;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
    };
    resize();
    window.addEventListener('resize', resize);

    const count = snowDensity === 'BLIZZARD' ? 120 : snowDensity === 'LUSH' ? 75 : 35;

    const snowflakes = Array.from({ length: count }, () => ({
      x: Math.random() * (canvas.offsetWidth || 800),
      y: Math.random() * (canvas.offsetHeight || 600),
      r: Math.random() * 3 + 1,
      speedY: Math.random() * 0.8 + 0.3,
      swayAmp: Math.random() * 0.8 + 0.2,
      swaySpeed: Math.random() * 0.02 + 0.005,
      angle: Math.random() * Math.PI * 2,
      opacity: Math.random() * 0.5 + 0.2,
      isCrystal: Math.random() > 0.7,
    }));

    const bokehOrbs = Array.from({ length: 22 }, () => ({
      x: Math.random() * (canvas.offsetWidth || 800),
      y: Math.random() * (canvas.offsetHeight || 600),
      r: Math.random() * 36 + 14,
      vy: -(Math.random() * 0.22 + 0.08),
      vx: (Math.random() - 0.5) * 0.18,
      hue: Math.random() > 0.2 ? 43 : 350, // Champagne gold or velvet crimson
      alpha: Math.random() * 0.12 + 0.03,
      pulseSpeed: Math.random() * 0.02 + 0.008,
      pulsePhase: Math.random() * Math.PI * 2,
    }));

    const drawCrystalFlake = (x: number, y: number, r: number, alpha: number, rot: number) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rot);
      ctx.strokeStyle = `rgba(255, 250, 240, ${alpha})`;
      ctx.lineWidth = 1;
      for (let i = 0; i < 6; i++) {
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, -r * 2.2);
        ctx.moveTo(0, -r * 1.2);
        ctx.lineTo(-r * 0.6, -r * 1.7);
        ctx.moveTo(0, -r * 1.2);
        ctx.lineTo(r * 0.6, -r * 1.7);
        ctx.stroke();
        ctx.rotate(Math.PI / 3);
      }
      ctx.restore();
    };

    const render = () => {
      const w = canvas.offsetWidth || 800;
      const h = canvas.offsetHeight || 600;
      ctx.clearRect(0, 0, w, h);

      const isSpinning = phaseRef.current === 'SPINNING';
      const sp = spinProgressRef.current;

      // Render Candlelit Bokeh
      bokehOrbs.forEach((orb) => {
        orb.y += orb.vy * (isSpinning ? 1 + sp * 2.5 : 1);
        orb.x += orb.vx;
        orb.pulsePhase += orb.pulseSpeed;
        if (orb.y + orb.r < 0) orb.y = h + orb.r;
        if (orb.x < -orb.r) orb.x = w + orb.r;
        if (orb.x > w + orb.r) orb.x = -orb.r;

        const currentAlpha =
          orb.alpha * (0.75 + 0.25 * Math.sin(orb.pulsePhase)) * (isSpinning ? 1.4 : 1);
        const grad = ctx.createRadialGradient(orb.x, orb.y, 0, orb.x, orb.y, orb.r);
        grad.addColorStop(0, `hsla(${orb.hue}, 92%, 68%, ${currentAlpha})`);
        grad.addColorStop(0.6, `hsla(${orb.hue}, 85%, 55%, ${currentAlpha * 0.4})`);
        grad.addColorStop(1, 'rgba(0,0,0,0)');

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(orb.x, orb.y, orb.r, 0, Math.PI * 2);
        ctx.fill();
      });

      // Render Snowflakes with Vortex gravitation during spin
      const cx = w / 2;
      const cy = h / 2;

      snowflakes.forEach((f) => {
        f.angle += f.swaySpeed;

        if (isSpinning) {
          const dx = cx - f.x;
          const dy = cy - f.y;
          const dist = Math.max(Math.hypot(dx, dy), 35);
          const pull = Math.sin(sp * Math.PI) * 1.6;
          f.x += (dx / dist) * pull - (dy / dist) * pull * 1.5;
          f.y += (dy / dist) * pull + (dx / dist) * pull * 1.5;
        } else {
          f.y += f.speedY;
          f.x += Math.sin(f.angle) * f.swayAmp;
        }

        if (f.y > h + 10) {
          f.y = -10;
          f.x = Math.random() * w;
        }
        if (f.x > w + 10) f.x = -10;
        if (f.x < -10) f.x = w + 10;

        if (f.isCrystal && f.r > 2.0) {
          drawCrystalFlake(f.x, f.y, f.r, f.opacity, f.angle);
        } else {
          ctx.fillStyle = `rgba(255, 252, 245, ${f.opacity})`;
          ctx.beginPath();
          ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, [snowDensity]);

  /* --------------------------------------------------------------------------
   * 2. TWIN STAGE CONFETTI CANNONS & GOLD SHOCKWAVE (Canvas 2)
   * ------------------------------------------------------------------------ */
  const fireTwinStageCannons = useCallback(() => {
    const canvas = fxCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const w = canvas.offsetWidth || 800;
    const h = canvas.offsetHeight || 600;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);

    const palette = [
      '#FDE68A', // Champagne gold
      '#F59E0B', // Pure amber gold
      '#D97706', // Burnished bronze
      '#DC2626', // Velvet crimson
      '#991B1B', // Deep burgundy
      '#059669', // Emerald gala green
      '#F8FAFC', // Platinum silver
    ];

    interface RibbonParticle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      w: number;
      h: number;
      color: string;
      tilt: number;
      tiltSpeed: number;
      wobble: number;
      wobbleSpeed: number;
      drag: number;
    }

    const particles: RibbonParticle[] = [];

    // Left and Right Cannons
    for (let i = 0; i < 180; i++) {
      const fromLeft = i % 2 === 0;
      const startX = fromLeft ? w * 0.05 : w * 0.95;
      const startY = h * 0.92;
      const launchAngle = fromLeft
        ? -Math.PI * (0.28 + Math.random() * 0.18)
        : -Math.PI * (0.72 - Math.random() * 0.18);
      const speed = Math.random() * 22 + 13;

      particles.push({
        x: startX,
        y: startY,
        vx: Math.cos(launchAngle) * speed,
        vy: Math.sin(launchAngle) * speed,
        w: Math.random() * 12 + 6,
        h: Math.random() * 6 + 4,
        color: palette[Math.floor(Math.random() * palette.length)],
        tilt: Math.random() * Math.PI * 2,
        tiltSpeed: (Math.random() - 0.5) * 0.25,
        wobble: Math.random() * 10,
        wobbleSpeed: Math.random() * 0.12 + 0.05,
        drag: 0.982,
      });
    }

    let shockwaveRadius = 20;
    let shockwaveAlpha = 0.85;
    let frame = 0;

    const tickConfetti = () => {
      frame++;
      ctx.clearRect(0, 0, w, h);

      // Expanding golden starlight shockwave ring
      if (shockwaveAlpha > 0.01) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(w / 2, h / 2, shockwaveRadius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(253, 230, 138, ${shockwaveAlpha})`;
        ctx.lineWidth = 5;
        ctx.shadowColor = '#F59E0B';
        ctx.shadowBlur = 24;
        ctx.stroke();
        ctx.restore();

        shockwaveRadius += 20;
        shockwaveAlpha *= 0.92;
      }

      // 3D Tumbling Foil Ribbons
      particles.forEach((p) => {
        p.vx *= p.drag;
        p.vy = p.vy * p.drag + 0.32;
        p.x += p.vx + Math.sin(p.wobble) * 1.1;
        p.y += p.vy;
        p.tilt += p.tiltSpeed;
        p.wobble += p.wobbleSpeed;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.tilt);
        ctx.scale(1, Math.cos(p.wobble));
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      });

      if (frame < 260) {
        requestAnimationFrame(tickConfetti);
      } else {
        ctx.clearRect(0, 0, w, h);
      }
    };

    requestAnimationFrame(tickConfetti);
  }, []);

  /* --------------------------------------------------------------------------
   * 3. 60/120FPS CONTINUOUS SUB-FRAME INTERPOLATION ENGINE
   * ------------------------------------------------------------------------ */
  const runSpinSequence = useCallback(
    (targetWinner: Guest, decoyReel: Guest[]) => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);

      const { sequence: fullList, winnerIndex } = buildAnimationReel(
        decoyReel,
        targetWinner,
        42,
        4
      );

      setSequence(fullList);
      setWinner(targetWinner);
      setClaimConfirmed(false);
      setCardFlipped(false);
      setPhase('SPINNING');
      setReelPosition(0);

      const durationMs = spinDurationSeconds * 1000;
      const startTime = performance.now();
      let lastIntegerIndex = 0;

      // Start suspense sound
      if (enableSound) {
        soundEngine.playSuspenseRiser(spinDurationSeconds);
      }

      const animate = (now: number) => {
        const elapsed = now - startTime;
        const rawProgress = Math.min(elapsed / durationMs, 1);
        spinProgressRef.current = rawProgress;
        setSpinProgress(rawProgress);

        const eased = easeOutWithOvershoot(rawProgress);
        const currentPos = eased * winnerIndex;
        setReelPosition(currentPos);

        const currentInt = Math.floor(currentPos);
        if (currentInt !== lastIntegerIndex) {
          lastIntegerIndex = currentInt;
          if (enableSound) {
            soundEngine.playReelTick(rawProgress);
          }
        }

        if (rawProgress < 1) {
          animFrameRef.current = requestAnimationFrame(animate);
        } else {
          setReelPosition(winnerIndex);
          spinProgressRef.current = 0;
          setPhase('REVEALED');
          setTimeout(() => setCardFlipped(true), 200);

          if (enableSound) {
            soundEngine.playWinnerFanfare();
            soundEngine.playSleighJingle();
          }
          fireTwinStageCannons();
        }
      };

      animFrameRef.current = requestAnimationFrame(animate);
    },
    [spinDurationSeconds, enableSound, soundEngine, fireTwinStageCannons]
  );

  const handleLaunchDraw = async () => {
    try {
      setErrorMessage(null);
      const res = await onExecuteDraw(prize.id);
      runSpinSequence(res.winner, res.decoyReel);
    } catch (e: unknown) {
      setErrorMessage(e instanceof Error ? e.message : 'Unable to execute prize draw.');
    }
  };

  const handleForfeitAndRedraw = async () => {
    if (!winner) return;
    try {
      setErrorMessage(null);
      const res = await onForfeitAndRedraw(
        winner.id,
        prize.id,
        'Guest not present in ballroom during prize call.'
      );
      runSpinSequence(res.winner, res.decoyReel);
    } catch (e: unknown) {
      setErrorMessage(e instanceof Error ? e.message : 'Unable to forfeit and redraw.');
    }
  };

  const handleClaim = () => {
    if (!winner) return;
    onConfirmClaim(winner, prize.id);
    setClaimConfirmed(true);
    if (enableSound) {
      soundEngine.playSleighJingle();
    }
  };

  const handleNextPrizeClick = () => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    setPhase('IDLE');
    setWinner(null);
    setSequence([]);
    setReelPosition(0);
    setSpinProgress(0);
    setCardFlipped(false);
    setClaimConfirmed(false);
    setErrorMessage(null);
    onNextPrize?.();
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  // Gala AV Technician Keyboard shortcuts
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.code === 'KeyF') toggleFullscreen();
      if (e.code === 'KeyM') onSoundToggle(!enableSound);
      if (e.code === 'Space' && phase === 'IDLE') {
        e.preventDefault();
        handleLaunchDraw();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });

  const activeCenterIndex = Math.round(reelPosition);
  const currentCandidate = sequence[activeCenterIndex] || winner;

  return (
    <div
      ref={containerRef}
      className={`relative flex flex-col items-center justify-between w-full rounded-3xl overflow-hidden select-none text-white shadow-[0_30px_100px_rgba(0,0,0,0.85)] border border-amber-400/35 transition-all ${
        isFullscreen ? 'h-screen p-8' : 'min-h-[640px] p-6 md:p-10'
      }`}
      style={{
        background:
          'radial-gradient(circle at 50% 16%, #580816 0%, #1c050a 40%, #041611 82%, #020b08 100%)',
      }}
    >
      {/* Dynamic Ambient Spotlights */}
      <div
        className="pointer-events-none absolute -top-32 left-1/4 w-96 h-[550px] opacity-25 blur-3xl transition-transform duration-1000"
        style={{
          background: 'conic-gradient(from 165deg, transparent, #fde68a, transparent)',
          transform: phase === 'SPINNING' ? 'rotate(12deg) scale(1.2)' : 'rotate(-8deg)',
        }}
      />
      <div
        className="pointer-events-none absolute -top-32 right-1/4 w-96 h-[550px] opacity-25 blur-3xl transition-transform duration-1000"
        style={{
          background: 'conic-gradient(from 195deg, transparent, #fde68a, transparent)',
          transform: phase === 'SPINNING' ? 'rotate(-12deg) scale(1.2)' : 'rotate(8deg)',
        }}
      />

      {/* Layer 1: Ambient Snow, Bokeh & Spin Vortex Canvas */}
      <canvas
        ref={bgCanvasRef}
        className="pointer-events-none absolute inset-0 w-full h-full z-10"
      />

      {/* Layer 2: Confetti Blasters & Shockwave Canvas */}
      <canvas
        ref={fxCanvasRef}
        className="pointer-events-none absolute inset-0 w-full h-full z-30"
      />

      {/* Filigree Corner Frames */}
      <GoldCornerFiligree className="top-4 left-4" />
      <GoldCornerFiligree className="top-4 right-4 scale-x-[-1]" />
      <GoldCornerFiligree className="bottom-4 left-4 scale-y-[-1]" />
      <GoldCornerFiligree className="bottom-4 right-4 scale-[-1]" />

      {/* TOP BAR: Context & Broadcast Stage Controls */}
      <div className="relative z-40 flex flex-wrap items-center justify-between w-full max-w-6xl gap-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs font-semibold tracking-widest uppercase text-amber-200 bg-emerald-950/80 px-3.5 py-1.5 rounded-full border border-amber-400/30 backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>2026 Chase Holiday Gala</span>
          </div>
          <span className="text-xs text-amber-100/70 font-mono tabular-nums bg-white/5 px-3 py-1 rounded-full border border-white/10">
            {eligibleGuests.length} Eligible Candidates
          </span>
        </div>

        {/* Mode Switcher + Audio + Fullscreen Buttons */}
        <div className="flex items-center gap-2 bg-black/45 backdrop-blur-md p-1.5 rounded-xl border border-amber-400/25">
          <button
            onClick={() => phase !== 'SPINNING' && onModeChange('ROYAL_DRUM')}
            disabled={phase === 'SPINNING'}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
              animationMode === 'ROYAL_DRUM'
                ? 'bg-gradient-to-r from-amber-300 via-amber-400 to-yellow-500 text-slate-950 shadow'
                : 'text-amber-100/70 hover:text-white'
            }`}
          >
            3D Sleigh Drum
          </button>
          <button
            onClick={() => phase !== 'SPINNING' && onModeChange('STARLIGHT_CAROUSEL')}
            disabled={phase === 'SPINNING'}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
              animationMode === 'STARLIGHT_CAROUSEL'
                ? 'bg-gradient-to-r from-amber-300 via-amber-400 to-yellow-500 text-slate-950 shadow'
                : 'text-amber-100/70 hover:text-white'
            }`}
          >
            3D Foil Cards
          </button>
          <button
            onClick={() => phase !== 'SPINNING' && onModeChange('ORNAMENT_UNWRAP')}
            disabled={phase === 'SPINNING'}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
              animationMode === 'ORNAMENT_UNWRAP'
                ? 'bg-gradient-to-r from-amber-300 via-amber-400 to-yellow-500 text-slate-950 shadow'
                : 'text-amber-100/70 hover:text-white'
            }`}
          >
            Royal Gift Box
          </button>

          <div className="h-4 w-[1px] bg-amber-400/20 mx-1" />

          <button
            onClick={() => onSoundToggle(!enableSound)}
            title="Toggle Audio (M)"
            className="px-2.5 py-1 rounded-lg text-xs font-medium text-amber-200 hover:bg-white/10 transition"
          >
            {enableSound ? '🔔 Audio On' : '🔕 Muted'}
          </button>

          <button
            onClick={toggleFullscreen}
            title="Toggle Stage View (F)"
            className="px-2.5 py-1 rounded-lg text-xs font-medium text-amber-200 hover:bg-white/10 transition"
          >
            {isFullscreen ? 'Exit Fullscreen' : '⛶ Fullscreen'}
          </button>
        </div>
      </div>

      {/* PRIZE BANNER */}
      <div className="relative z-20 text-center my-3 max-w-4xl">
        <div className="inline-flex items-center gap-2 text-amber-300 text-xs md:text-sm font-bold tracking-[0.25em] uppercase mb-1">
          <span>✦</span>
          <span>{prize.sponsor || 'OFFICIAL HOLIDAY GALA PRIZE DRAW'}</span>
          <span>✦</span>
        </div>
        <h1
          className="text-2xl sm:text-4xl md:text-5xl font-serif font-black tracking-tight text-transparent bg-clip-text"
          style={{
            backgroundImage: 'linear-gradient(180deg, #FFFFFF 0%, #FDE68A 55%, #D97706 100%)',
            filter: 'drop-shadow(0 6px 20px rgba(245, 158, 11, 0.35))',
          }}
        >
          {prize.title}
        </h1>
        {prize.description && (
          <p className="mt-2 text-xs md:text-sm text-amber-100/75 max-w-2xl mx-auto font-light">
            {prize.description}
          </p>
        )}
      </div>

      {/* CENTER STAGE VIEWPORT (Switching between the 3 3D Modes) */}
      <div className="relative z-20 flex items-center justify-center w-full max-w-5xl min-h-[350px] md:min-h-[380px] my-2">
        {/* MODE 1: 3D CYLINDRICAL GOLDEN SLEIGH DRUM */}
        {animationMode === 'ROYAL_DRUM' && (
          <div
            className="relative w-full max-w-3xl h-[280px] flex items-center justify-center"
            style={{ perspective: '1200px' }}
          >
            {/* Golden Pointer Pointers */}
            <div className="absolute -left-3 md:-left-6 z-30 text-amber-400 text-3xl drop-shadow-[0_0_12px_rgba(251,191,36,0.9)]">
              ▶
            </div>
            <div className="absolute -right-3 md:-right-6 z-30 text-amber-400 text-3xl drop-shadow-[0_0_12px_rgba(251,191,36,0.9)]">
              ◀
            </div>

            {/* Center Magnifying Glass Highlight Bezel */}
            <div
              className={`pointer-events-none absolute inset-x-0 h-28 rounded-2xl border-2 transition-all duration-500 z-20 ${
                phase === 'REVEALED'
                  ? 'border-amber-300 bg-gradient-to-r from-amber-500/20 via-amber-300/25 to-amber-500/20 shadow-[0_0_80px_rgba(251,191,36,0.55)] scale-[1.03]'
                  : 'border-amber-400/50 bg-white/[0.04] shadow-[0_0_40px_rgba(0,0,0,0.7)]'
              }`}
            />

            {phase === 'IDLE' ? (
              <div className="text-center z-10 px-6">
                <p className="text-amber-200/90 text-lg md:text-2xl font-serif tracking-widest uppercase">
                  ❄ Awaiting Grand Draw Launch ❄
                </p>
                <p className="text-amber-100/60 text-xs mt-2">
                  Press Space or click Launch to begin the draw
                </p>
              </div>
            ) : (
              <div
                className="relative w-full h-full flex items-center justify-center"
                style={{ transformStyle: 'preserve-3d' }}
              >
                {[-2, -1, 0, 1, 2].map((offset) => {
                  const baseIndex = Math.floor(reelPosition);
                  const fraction = reelPosition - baseIndex;
                  const itemIndex = baseIndex + offset;
                  const guest = sequence[itemIndex];
                  if (!guest) return null;

                  const relativeOffset = offset - fraction;
                  const angleDeg = relativeOffset * -28;
                  const radiusPx = 135;
                  const distanceFromCenter = Math.abs(relativeOffset);
                  const isWinnerSlot =
                    phase === 'REVEALED' && Math.abs(relativeOffset) < 0.15;

                  return (
                    <div
                      key={`${itemIndex}-${guest.id}`}
                      className="absolute inset-x-6 h-24 flex flex-col items-center justify-center rounded-xl px-6 select-none"
                      style={{
                        transform: `rotateX(${angleDeg}deg) translateZ(${radiusPx}px)`,
                        opacity: Math.max(0, 1 - distanceFromCenter * 0.42),
                        filter:
                          phase === 'SPINNING' && distanceFromCenter < 0.8
                            ? `blur(${Math.min((1 - spinProgress) * 1.5, 1.4)}px)`
                            : 'none',
                        backfaceVisibility: 'hidden',
                      }}
                    >
                      {isWinnerSlot && (
                        <span className="px-3 py-0.5 mb-1 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black tracking-[0.25em] uppercase shadow">
                          ★ Selected Winner ★
                        </span>
                      )}
                      <div
                        className={`font-serif font-black tracking-tight truncate max-w-full ${
                          isWinnerSlot
                            ? 'text-2xl sm:text-4xl text-amber-200 drop-shadow-[0_2px_18px_rgba(251,191,36,0.8)]'
                            : distanceFromCenter < 0.5
                            ? 'text-xl sm:text-3xl text-white'
                            : 'text-lg sm:text-xl text-amber-100/50'
                        }`}
                      >
                        {guest.fullName}
                      </div>
                      {showTableNumber && guest.tableNumber && (
                        <div
                          className={`text-xs font-semibold tracking-widest uppercase mt-0.5 ${
                            isWinnerSlot ? 'text-amber-300 font-mono' : 'text-amber-200/60 font-mono'
                          }`}
                        >
                          Table {guest.tableNumber} {guest.organization ? `· ${guest.organization}` : ''}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* MODE 2: 3D STARLIGHT FOIL INVITATION CAROUSEL */}
        {animationMode === 'STARLIGHT_CAROUSEL' && (
          <div
            className="relative w-full h-full flex items-center justify-center"
            style={{ perspective: '1400px' }}
          >
            {phase === 'IDLE' ? (
              <div className="relative group flex flex-col items-center justify-center w-72 sm:w-84 h-72 sm:h-80 rounded-3xl overflow-hidden border-2 border-amber-400/70 shadow-[0_25px_60px_rgba(0,0,0,0.85)] bg-slate-950 transition-transform duration-500 hover:scale-[1.03]">
                <img
                  src="/assets/aistudio/image_28a835c0.png"
                  alt="Royal Gala Premium Raffle Deck"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/30 to-transparent flex flex-col items-center justify-end p-5 text-center">
                  <span className="px-3.5 py-1 rounded-full bg-amber-400/25 border border-amber-400/60 text-amber-200 font-serif font-bold tracking-widest text-xs uppercase mb-1.5 backdrop-blur-md shadow-lg">
                    Royal Gala Raffle Deck
                  </span>
                  <p className="text-amber-100/90 text-xs font-light tracking-wide drop-shadow">
                    Ready to shuffle and deal winner
                  </p>
                </div>
                <div className="pointer-events-none absolute inset-0 rounded-3xl ring-1 ring-inset ring-amber-300/40" />
              </div>
            ) : (
              <div
                className="relative w-full h-full flex items-center justify-center"
                style={{ transformStyle: 'preserve-3d' }}
              >
                {[-2, -1, 0, 1, 2].map((offset) => {
                  const baseIndex = Math.floor(reelPosition);
                  const fraction = reelPosition - baseIndex;
                  const itemIndex = baseIndex + offset;
                  const guest = sequence[itemIndex];
                  if (!guest) return null;

                  const rel = offset - fraction;
                  const translateX = rel * 230;
                  const translateZ = -Math.abs(rel) * 130;
                  const rotateY = rel * -24;
                  const isCenterWinner = phase === 'REVEALED' && Math.abs(rel) < 0.15;

                  return (
                    <div
                      key={`${itemIndex}-${guest.id}`}
                      className={`absolute w-72 sm:w-88 h-56 rounded-2xl p-6 flex flex-col items-center justify-center text-center border-2 transition-shadow duration-500 ${
                        isCenterWinner
                          ? 'border-amber-300 bg-gradient-to-br from-amber-950 via-red-950 to-emerald-950 shadow-[0_0_80px_rgba(251,191,36,0.65)] z-30'
                          : 'border-amber-400/40 bg-gradient-to-br from-slate-900/95 to-red-950/90 shadow-2xl'
                      }`}
                      style={{
                        transform: `translateX(${translateX}px) translateZ(${translateZ}px) rotateY(${rotateY}deg) scale(${
                          isCenterWinner && cardFlipped ? 1.06 : 1
                        })`,
                        opacity: Math.max(0, 1 - Math.abs(rel) * 0.38),
                      }}
                    >
                      <div className="text-amber-400/80 text-[10px] font-bold tracking-[0.25em] uppercase mb-1">
                        {isCenterWinner ? '★ Selected Winner ★' : 'Gala Guest Pass'}
                      </div>
                      <div
                        className={`font-serif font-black tracking-tight ${
                          isCenterWinner
                            ? 'text-2xl sm:text-3xl text-amber-200'
                            : 'text-lg sm:text-xl text-white'
                        }`}
                      >
                        {guest.fullName}
                      </div>
                      {showTableNumber && guest.tableNumber && (
                        <div className="mt-2 px-3 py-0.5 rounded-full bg-amber-400/15 border border-amber-400/30 text-amber-200 text-xs font-mono font-semibold">
                          Table {guest.tableNumber} {guest.organization ? `· ${guest.organization}` : ''}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* MODE 3: ROYAL VELVET GIFT BOX UNWRAP */}
        {animationMode === 'ORNAMENT_UNWRAP' && (
          <div className="relative flex flex-col items-center justify-center w-full h-full">
            {phase !== 'REVEALED' ? (
              <div className="relative flex flex-col items-center justify-center">
                {/* Rotating Celestial God-Rays */}
                {phase === 'SPINNING' && (
                  <div
                    className="pointer-events-none absolute w-80 h-80 rounded-full opacity-75 blur-xl"
                    style={{
                      background:
                        'repeating-conic-gradient(from 0deg, rgba(253,230,138,0.45) 0deg 15deg, transparent 15deg 30deg)',
                      transform: `rotate(${reelPosition * 18}deg) scale(${
                        0.9 + spinProgress * 0.55
                      })`,
                    }}
                  />
                )}

                {/* Photorealistic Velvet & Gold Luxury Gift Box */}
                <div
                  className="relative z-10 flex flex-col items-center justify-center w-48 h-48 sm:w-56 sm:h-56 rounded-3xl overflow-hidden shadow-[0_25px_60px_rgba(0,0,0,0.85)] border-2 border-amber-300/60 transition-transform"
                  style={{
                    transform:
                      phase === 'SPINNING'
                        ? `translateY(${Math.sin(reelPosition * 2) * 8}px) rotate(${
                            Math.sin(reelPosition * 3.5) * (4 + spinProgress * 8)
                          }deg) scale(${1 + spinProgress * 0.16})`
                        : 'scale(1)',
                  }}
                >
                  <img
                    src="/assets/aistudio/image_1782da80.png"
                    alt="Royal Holiday Velvet & Gold Gift Box"
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div className="pointer-events-none absolute inset-0 rounded-3xl ring-1 ring-inset ring-amber-300/40 shadow-inner" />
                </div>

                {phase === 'SPINNING' && currentCandidate && (
                  <div className="mt-5 px-5 py-1.5 rounded-full bg-black/60 border border-amber-400/40 backdrop-blur-md text-amber-200 font-serif font-bold text-base tracking-wide">
                    {currentCandidate.fullName}
                  </div>
                )}
              </div>
            ) : (
              currentCandidate && (
                <div className="relative z-20 flex flex-col items-center justify-center max-w-xl w-full py-8 px-6 rounded-3xl border-2 border-amber-300 bg-gradient-to-b from-emerald-950/95 via-slate-950/95 to-red-950/95 shadow-[0_0_100px_rgba(251,191,36,0.6)]">
                  <span className="px-3.5 py-1 rounded-full bg-amber-400 text-slate-950 font-black text-[10px] uppercase tracking-[0.25em] mb-2">
                    🎄 Holiday Gala Winner 🎄
                  </span>
                  <div className="text-3xl sm:text-5xl font-serif font-black text-amber-200 text-center tracking-tight drop-shadow-[0_4px_24px_rgba(251,191,36,0.75)]">
                    {currentCandidate.fullName}
                  </div>
                  {showTableNumber && currentCandidate.tableNumber && (
                    <div className="mt-3 px-5 py-1 rounded-full bg-amber-400/15 border border-amber-400/40 text-amber-300 text-lg font-mono font-bold tracking-widest uppercase">
                      Table {currentCandidate.tableNumber} {currentCandidate.organization ? `· ${currentCandidate.organization}` : ''}
                    </div>
                  )}
                </div>
              )
            )}
          </div>
        )}
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div className="relative z-40 my-2 px-4 py-2 rounded-xl bg-red-950/90 border border-red-400/50 text-red-200 text-xs font-medium shadow-lg">
          ⚠️ {errorMessage}
        </div>
      )}

      {/* BOTTOM ACTION DECK */}
      <div className="relative z-40 flex flex-wrap items-center justify-center gap-3 mt-2">
        {phase === 'IDLE' && (
          <button
            onClick={handleLaunchDraw}
            className="px-8 py-3.5 rounded-2xl font-serif font-black text-base tracking-wider uppercase text-slate-950 bg-gradient-to-r from-amber-200 via-amber-400 to-yellow-500 hover:from-amber-100 hover:to-amber-300 shadow-[0_0_40px_rgba(251,191,36,0.55)] transition-all hover:scale-105 active:scale-95"
          >
            ✨ Launch Holiday Prize Draw ✨
          </button>
        )}



        {phase === 'REVEALED' && (
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={handleForfeitAndRedraw}
              className="px-5 py-2.5 rounded-xl bg-red-950/80 hover:bg-red-900 text-amber-100 border border-red-400/40 text-xs font-semibold tracking-wide transition hover:scale-105"
            >
              ↺ Guest Not Present — Forfeit & Redraw
            </button>

            {!claimConfirmed ? (
              <button
                onClick={handleClaim}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold tracking-wider uppercase shadow-md transition hover:scale-105"
              >
                ✓ Confirm Prize Claimed
              </button>
            ) : (
              <span className="px-4 py-2 rounded-xl bg-emerald-950 border border-emerald-400/40 text-emerald-300 text-xs font-semibold">
                ✓ Recorded as Claimed
              </span>
            )}

            {onNextPrize && (
              <button
                onClick={handleNextPrizeClick}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-300 via-amber-400 to-yellow-500 text-slate-950 font-serif font-black text-xs tracking-wider uppercase shadow-[0_0_30px_rgba(251,191,36,0.45)] transition hover:scale-105"
              >
                Next Prize Draw →
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function GoldCornerFiligree({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={`pointer-events-none absolute w-16 h-16 md:w-20 md:h-20 text-amber-400/40 z-20 ${className}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M4 96 V20 Q4 4 20 4 H96" />
      <path d="M12 80 V24 Q12 12 24 12 H80" strokeOpacity="0.6" />
      <circle cx="20" cy="20" r="4" fill="currentColor" />
      <path d="M4 40 Q28 28 40 4" strokeOpacity="0.7" />
    </svg>
  );
}
