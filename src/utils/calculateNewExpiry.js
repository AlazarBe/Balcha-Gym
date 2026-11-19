// src/utils/calculateNewExpiry.js
import { addDays, addMonths, differenceInCalendarDays } from 'date-fns';

// Set these to your real prices later — used to prorate yearly partial payments
export const PLAN_PRICES = {
  monthly: 800,
  quarterly: 2200,
  yearly: 8000,
};

const GRACE_DAYS = 3;

/**
 * Single source of truth for expiry math.
 * Used by both the renew flow and (later) the cron job / backend route.
 */
export function calculateNewExpiry({ plan, oldExpiryDate, amount, today = new Date() }) {
  const withinGrace = Math.abs(differenceInCalendarDays(today, oldExpiryDate)) <= GRACE_DAYS;
  const base = withinGrace ? oldExpiryDate : today;

  if (plan === 'monthly') return addMonths(base, 1);
  if (plan === 'quarterly') return addMonths(base, 3);

  if (plan === 'yearly') {
    // Access only for the portion actually paid for — prorate days by amount paid
    const daysPurchased = Math.round((amount / PLAN_PRICES.yearly) * 365);
    return addDays(base, daysPurchased);
  }

  throw new Error(`Unknown plan: ${plan}`);
}