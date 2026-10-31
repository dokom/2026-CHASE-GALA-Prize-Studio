/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Guest, Prize, PrizeDrawConfig, PrizeWinner, AuditLog } from '../types.js';

export const initialConfig: PrizeDrawConfig = {
  eventTitle: '2026 CHASE SAPPHIRE WINTER GALA',
  requireCheckedIn: true,
  excludePreviousWinners: true,
  excludedTableNumbers: ['12'], // Table 12 is Executive Staff & Committee
  animationStyle: 'ROYAL_DRUM',
  spinDurationSeconds: 7,
  showTableNumber: true,
  enableSoundEffects: true,
  snowDensity: 'LUSH',
  revealCountdown: true,
};

export const initialPrizes: Prize[] = [
  {
    id: 'prz-1',
    title: 'Aspen Private Alpine Chalet Retreat (5 Nights)',
    sponsor: 'Presented by Chase Sapphire Reserve',
    description: 'Luxury ski-in/ski-out private residence in Snowmass with personal private chef service and lift passes.',
    quantity: 1,
    sortOrder: 1,
    tier: 'GRAND',
    status: 'PENDING',
    createdAt: '2026-12-01T10:00:00Z',
  },
  {
    id: 'prz-2',
    title: 'Bespoke Rolex Oyster Perpetual Datejust 36',
    sponsor: 'Presented by J.P. Morgan Private Bank',
    description: 'Fluted bezel in 18 ct white gold, mint green dial, Jubilee bracelet, bespoke commemorative caseback engraving.',
    quantity: 1,
    sortOrder: 2,
    tier: 'LUXURY',
    status: 'PENDING',
    createdAt: '2026-12-01T10:05:00Z',
  },
  {
    id: 'prz-3',
    title: "Michelin 3-Star Chef's Table for 6 with Reserve Wine Pairing",
    sponsor: 'Presented by Chase Dining Experience',
    description: 'Private salon seating at Eleven Madison Park with bespoke 9-course tasting menu curated by the Executive Chef.',
    quantity: 1,
    sortOrder: 3,
    tier: 'LUXURY',
    status: 'PENDING',
    createdAt: '2026-12-01T10:10:00Z',
  },
  {
    id: 'prz-4',
    title: 'First-Class Global Roundtrip Airfare Pass for Two',
    sponsor: 'Presented by British Airways & OneWorld Alliance',
    description: 'Any global long-haul destination in First Suite with luxury chauffeured airport transfers.',
    quantity: 1,
    sortOrder: 4,
    tier: 'PREMIUM',
    status: 'PENDING',
    createdAt: '2026-12-01T10:15:00Z',
  },
  {
    id: 'prz-5',
    title: 'Sony FX3 Full-Frame Cinema Suite & G-Master Lenses',
    sponsor: 'Presented by Chase Commercial Technology',
    description: 'Professional cinema camera package with 24-70mm f/2.8 GM II and 70-200mm f/2.8 GM OSS II glass.',
    quantity: 1,
    sortOrder: 5,
    tier: 'PREMIUM',
    status: 'PENDING',
    createdAt: '2026-12-01T10:20:00Z',
  },
  {
    id: 'prz-6',
    title: 'Fortnum & Mason Sovereign Holiday Hamper & 2012 Dom Pérignon',
    sponsor: 'Presented by Gala Organizing Committee',
    description: 'Traditional wicker chest packed with rare British festive delicacies, bespoke truffles, and vintage prestige champagne.',
    quantity: 1,
    sortOrder: 6,
    tier: 'DOOR',
    status: 'PENDING',
    createdAt: '2026-12-01T10:25:00Z',
  },
];

export const initialGuests: Guest[] = [
  { id: 'g-01', fullName: 'Dr. Elizabeth Montgomery', tableNumber: '1', organization: 'Vanguard Biopharma', vipTier: 'Chair', rsvpStatus: 'ATTENDING', checkedInAt: '2026-12-24T18:15:22Z' },
  { id: 'g-02', fullName: 'Jonathan St. Claire', tableNumber: '1', organization: 'Apex Capital Partners', vipTier: 'Sapphire VIP', rsvpStatus: 'ATTENDING', checkedInAt: '2026-12-24T18:18:10Z' },
  { id: 'g-03', fullName: 'Lady Jacqueline Dupond', tableNumber: '2', organization: 'Dupond Heritage Foundation', vipTier: 'Sapphire VIP', rsvpStatus: 'ATTENDING', checkedInAt: '2026-12-24T18:22:04Z' },
  { id: 'g-04', fullName: 'Marcus Aurelius Sterling', tableNumber: '2', organization: 'Sterling Maritime Holdings', vipTier: 'Executive', rsvpStatus: 'ATTENDING', checkedInAt: '2026-12-24T18:25:40Z' },
  { id: 'g-05', fullName: 'Elena Rostova-Kowalski', tableNumber: '3', organization: 'Aura Quantum Tech', vipTier: 'Sapphire VIP', rsvpStatus: 'ATTENDING', checkedInAt: '2026-12-24T18:29:15Z' },
  { id: 'g-06', fullName: 'Ambassador William Fairchild', tableNumber: '3', organization: 'Diplomatic Mission', vipTier: 'Honorary', rsvpStatus: 'ATTENDING', checkedInAt: '2026-12-24T18:31:00Z' },
  { id: 'g-07', fullName: 'Sophia Chen-Batiste', tableNumber: '4', organization: 'Constellation Media', vipTier: 'Executive', rsvpStatus: 'ATTENDING', checkedInAt: '2026-12-24T18:34:55Z' },
  { id: 'g-08', fullName: 'David O. Sutherland', tableNumber: '4', organization: 'Sutherland Infrastructure', vipTier: 'Executive', rsvpStatus: 'ATTENDING', checkedInAt: '2026-12-24T18:38:12Z' },
  { id: 'g-09', fullName: 'Amara Ndiaye', tableNumber: '5', organization: 'Helios Renewable Energy', vipTier: 'Sapphire VIP', rsvpStatus: 'ATTENDING', checkedInAt: '2026-12-24T18:40:02Z' },
  { id: 'g-10', fullName: 'Mateo De La Vega', tableNumber: '5', organization: 'De La Vega Architecture', vipTier: 'Executive', rsvpStatus: 'ATTENDING', checkedInAt: '2026-12-24T18:42:30Z' },
  { id: 'g-11', fullName: 'Charlotte Pembroke', tableNumber: '6', organization: 'Pembroke Fine Arts', vipTier: 'Patron', rsvpStatus: 'ATTENDING', checkedInAt: '2026-12-24T18:45:18Z' },
  { id: 'g-12', fullName: 'Vikram Singhania', tableNumber: '6', organization: 'Titan Aeronautics', vipTier: 'Sapphire VIP', rsvpStatus: 'ATTENDING', checkedInAt: '2026-12-24T18:48:00Z' },
  { id: 'g-13', fullName: 'Genevieve Delacroix', tableNumber: '7', organization: 'Haute Horlogerie Group', vipTier: 'Executive', rsvpStatus: 'ATTENDING', checkedInAt: '2026-12-24T18:50:45Z' },
  { id: 'g-14', fullName: 'Harrison Brooks III', tableNumber: '7', organization: 'Beacon Hill Wealth', vipTier: 'Sapphire VIP', rsvpStatus: 'ATTENDING', checkedInAt: '2026-12-24T18:52:10Z' },
  { id: 'g-15', fullName: 'Dr. Tariq Al-Mansoor', tableNumber: '8', organization: 'Gulf Horizon Robotics', vipTier: 'Executive', rsvpStatus: 'ATTENDING', checkedInAt: '2026-12-24T18:55:03Z' },
  { id: 'g-16', fullName: 'Katarina Lindqvist', tableNumber: '8', organization: 'Nordic Clean Solutions', vipTier: 'Executive', rsvpStatus: 'ATTENDING', checkedInAt: '2026-12-24T18:58:20Z' },
  { id: 'g-17', fullName: 'Senator Charles Whitmore', tableNumber: '9', organization: 'State Advisory Board', vipTier: 'Honorary', rsvpStatus: 'ATTENDING', checkedInAt: '2026-12-24T19:02:11Z' },
  { id: 'g-18', fullName: 'Vivian Kensington', tableNumber: '9', organization: 'Kensington Philanthropies', vipTier: 'Patron', rsvpStatus: 'ATTENDING', checkedInAt: '2026-12-24T19:05:40Z' },
  { id: 'g-19', fullName: 'Kenji Takahashi', tableNumber: '10', organization: 'Otsuka Advanced Materials', vipTier: 'Sapphire VIP', rsvpStatus: 'ATTENDING', checkedInAt: '2026-12-24T19:08:22Z' },
  { id: 'g-20', fullName: 'Beatrice Beaufort', tableNumber: '10', organization: 'Beaufort Estates', vipTier: 'Patron', rsvpStatus: 'ATTENDING', checkedInAt: '2026-12-24T19:12:00Z' },
  { id: 'g-21', fullName: 'Lord Alistair Crawford', tableNumber: '11', organization: 'Crawford Distilleries', vipTier: 'Executive', rsvpStatus: 'ATTENDING', checkedInAt: '2026-12-24T19:15:30Z' },
  { id: 'g-22', fullName: 'Nadia Benali', tableNumber: '11', organization: 'Atlas Cloud Infrastructure', vipTier: 'Sapphire VIP', rsvpStatus: 'ATTENDING', checkedInAt: '2026-12-24T19:18:14Z' },

  // Staff Table 12 (excluded by default config)
  { id: 'g-23', fullName: 'Thomas Wright (AV Director)', tableNumber: '12', organization: 'Gala Staff', vipTier: 'Staff', rsvpStatus: 'ATTENDING', checkedInAt: '2026-12-24T17:30:00Z' },
  { id: 'g-24', fullName: 'Jessica Miller (Stage Mgr)', tableNumber: '12', organization: 'Gala Staff', vipTier: 'Staff', rsvpStatus: 'ATTENDING', checkedInAt: '2026-12-24T17:30:00Z' },

  // Attending guests who haven't checked in at the door yet (testing eligibility filters)
  { id: 'g-25', fullName: 'Sir Colin MacAlister', tableNumber: '2', organization: 'Highland Wind Co', vipTier: 'Sapphire VIP', rsvpStatus: 'ATTENDING', checkedInAt: null },
  { id: 'g-26', fullName: 'Isabella Gomez-Santana', tableNumber: '3', organization: 'Santana Logistics', vipTier: 'Executive', rsvpStatus: 'ATTENDING', checkedInAt: null },
  { id: 'g-27', fullName: 'Pierce Remington', tableNumber: '4', organization: 'Remington Legal', vipTier: 'Executive', rsvpStatus: 'CONFIRMED', checkedInAt: null },
  { id: 'g-28', fullName: 'Lucia Bertolli', tableNumber: '5', organization: 'Bertolli Culinary Group', vipTier: 'Patron', rsvpStatus: 'ATTENDING', checkedInAt: null },
  { id: 'g-29', fullName: 'Gabriel Vance', tableNumber: '6', organization: 'Vance Cyber Defense', vipTier: 'Executive', rsvpStatus: 'ATTENDING', checkedInAt: null },
  { id: 'g-30', fullName: 'Yukihiro Tanaka', tableNumber: '7', organization: 'Neo Tokyo Interactive', vipTier: 'Sapphire VIP', rsvpStatus: 'ATTENDING', checkedInAt: null },
  { id: 'g-31', fullName: 'Claire Abernathy', tableNumber: '8', organization: 'Abernathy BioGenetics', vipTier: 'Executive', rsvpStatus: 'ATTENDING', checkedInAt: null },
  { id: 'g-32', fullName: 'Reginald Croft', tableNumber: '9', organization: 'Croft Antiquities', vipTier: 'Patron', rsvpStatus: 'ATTENDING', checkedInAt: null },

  // Declined guests
  { id: 'g-33', fullName: 'Maximilian Sterling (Declined)', tableNumber: '1', organization: 'Sterling Capital', vipTier: 'Executive', rsvpStatus: 'DECLINED', checkedInAt: null },
  { id: 'g-34', fullName: 'Baroness Fiona Campbell (Declined)', tableNumber: '5', organization: 'Campbell Trusts', vipTier: 'Patron', rsvpStatus: 'DECLINED', checkedInAt: null },
];

export const initialAuditLogs: AuditLog[] = [
  {
    id: 'log-1',
    timestamp: '2026-12-24T18:00:00Z',
    action: 'CONFIG_UPDATE',
    details: 'Holiday Gala draw configuration initialized with Royal 3D Sleigh Drum and checked-in filter active.',
    operator: 'AV Director',
  },
  {
    id: 'log-2',
    timestamp: '2026-12-24T18:15:22Z',
    action: 'CHECKIN',
    details: 'Dr. Elizabeth Montgomery checked in at Main Ballroom Entrance (Table 1).',
    operator: 'Door Scanner 1',
  },
  {
    id: 'log-3',
    timestamp: '2026-12-24T18:30:00Z',
    action: 'CONFIG_UPDATE',
    details: 'Table 12 (Staff & Production Crew) added to draw exclusion blacklist.',
    operator: 'Event Lead',
  },
];
