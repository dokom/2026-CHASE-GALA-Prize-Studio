/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type DrawAnimationStyle = 'ROYAL_DRUM' | 'STARLIGHT_CAROUSEL' | 'ORNAMENT_UNWRAP';

export type SnowDensity = 'SUBTLE' | 'LUSH' | 'BLIZZARD';

export type PrizeTier = 'GRAND' | 'LUXURY' | 'PREMIUM' | 'DOOR';

export type PrizeStatus = 'PENDING' | 'DRAWN' | 'CLAIMED' | 'FORFEITED';

export type WinnerStatus = 'SELECTED' | 'CLAIMED' | 'FORFEITED';

export type RsvpStatus = 'ATTENDING' | 'CONFIRMED' | 'DECLINED' | 'PENDING';

export interface PrizeDrawConfig {
  eventTitle: string;
  requireCheckedIn: boolean;
  excludePreviousWinners: boolean;
  excludedTableNumbers: string[];
  animationStyle: DrawAnimationStyle;
  spinDurationSeconds: number;
  showTableNumber: boolean;
  enableSoundEffects: boolean;
  snowDensity: SnowDensity;
  revealCountdown: boolean;
}

export interface Prize {
  id: string;
  title: string;
  sponsor?: string;
  description?: string;
  quantity: number;
  sortOrder: number;
  tier: PrizeTier;
  status: PrizeStatus;
  currentWinnerId?: string;
  createdAt: string;
}

export interface Guest {
  id: string;
  fullName: string;
  tableNumber?: string;
  organization?: string;
  vipTier?: string;
  rsvpStatus: RsvpStatus;
  checkedInAt?: string | null;
}

export interface PrizeWinner {
  id: string;
  prizeId: string;
  prizeTitle: string;
  guestId: string;
  guestName: string;
  tableNumber?: string;
  status: WinnerStatus;
  drawnAt: string;
  resolvedAt?: string;
  forfeitReason?: string;
  drawnBy: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  action: 'DRAW' | 'CLAIM' | 'FORFEIT' | 'REDRAW' | 'CONFIG_UPDATE' | 'CHECKIN' | 'GUEST_ADD';
  details: string;
  operator: string;
}
