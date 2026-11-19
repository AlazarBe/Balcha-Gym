// src/mock/data.js
import { addDays, subDays, startOfDay, differenceInCalendarDays } from 'date-fns';

const today = startOfDay(new Date());

export const mockMembers = [
  {
    _id: 'm1',
    memberId: 'GYM-0001',
    fullName: 'Abel Tesfaye',
    phone: '0911111111',
    photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
    plan: 'monthly',
    joinDate: subDays(today, 40),
    expiryDate: addDays(today, 20), // Active (20 days left)
    emergencyContact: '+251 911 223344 (Brother)',
  },
  {
    _id: 'm2',
    memberId: 'GYM-0002',
    fullName: 'Sara Mekonnen',
    phone: '0922222222',
    photoUrl: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=300&auto=format&fit=crop&q=80',
    plan: 'quarterly',
    joinDate: subDays(today, 88),
    expiryDate: addDays(today, 2), // Expiring in 2 days
    emergencyContact: '+251 922 334455 (Spouse)',
  },
  {
    _id: 'm3',
    memberId: 'GYM-0003',
    fullName: 'Dawit Alemu',
    phone: '0933333333',
    photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80',
    plan: 'monthly',
    joinDate: subDays(today, 32),
    expiryDate: subDays(today, 2), // In Grace period (2 days past expiry)
    emergencyContact: '+251 933 445566 (Friend)',
  },
  {
    _id: 'm4',
    memberId: 'GYM-0004',
    fullName: 'Hana Girma',
    phone: '0944444444',
    photoUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&auto=format&fit=crop&q=80',
    plan: 'yearly',
    joinDate: subDays(today, 400),
    expiryDate: subDays(today, 15), // Expired (> 3 days past)
    emergencyContact: '+251 944 556677 (Father)',
  },
  {
    _id: 'm5',
    memberId: 'GYM-0005',
    fullName: 'Yonas Bekele',
    phone: '0955555555',
    photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80',
    plan: 'yearly',
    joinDate: subDays(today, 100),
    expiryDate: addDays(today, 200), // Active with balance due
    emergencyContact: '+251 955 667788 (Mother)',
  },
  {
    _id: 'm6',
    memberId: 'GYM-0006',
    fullName: 'Bethelhem Tadesse',
    phone: '0966666666',
    photoUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&auto=format&fit=crop&q=80',
    plan: 'monthly',
    joinDate: subDays(today, 25),
    expiryDate: addDays(today, 5), // Expiring in 5 days
    emergencyContact: '+251 966 778899 (Sister)',
  },
  {
    _id: 'm7',
    memberId: 'GYM-0007',
    fullName: 'Natnael Haile',
    phone: '0977777777',
    photoUrl: 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=300&auto=format&fit=crop&q=80',
    plan: 'monthly',
    joinDate: subDays(today, 30),
    expiryDate: today, // Expiring Today (0 days left)
    emergencyContact: '+251 977 889900 (Uncle)',
  },
];

// Computed status helper (virtual field)
export function getStatus(expiryDate) {
  const now = startOfDay(new Date());
  const exp = startOfDay(new Date(expiryDate));
  const graceEnd = addDays(exp, 3);
  
  if (now <= exp) return 'active';
  if (now <= graceEnd) return 'grace_period';
  return 'expired';
}

// Calculate days remaining till expiry (positive = days left, negative = days past)
export function getDaysRemaining(expiryDate) {
  const now = startOfDay(new Date());
  const exp = startOfDay(new Date(expiryDate));
  return differenceInCalendarDays(exp, now);
}

export const mockPayments = [
  { 
    _id: 'p1', 
    member: 'm1', 
    amount: 800, 
    method: 'cash', 
    coversUntil: addDays(today, 20), 
    isPartial: false, 
    balanceDue: 0, 
    createdAt: subDays(today, 10) 
  },
  { 
    _id: 'p2', 
    member: 'm5', 
    amount: 5000, 
    method: 'mobile_money', 
    coversUntil: addDays(today, 200), 
    isPartial: true, 
    balanceDue: 3000, 
    createdAt: subDays(today, 100) 
  },
  { 
    _id: 'p3', 
    member: 'm2', 
    amount: 2200, 
    method: 'cash', 
    coversUntil: addDays(today, 2), 
    isPartial: false, 
    balanceDue: 0, 
    createdAt: subDays(today, 88) 
  },
  { 
    _id: 'p4', 
    member: 'm6', 
    amount: 800, 
    method: 'mobile_money', 
    coversUntil: addDays(today, 5), 
    isPartial: false, 
    balanceDue: 0, 
    createdAt: subDays(today, 25) 
  },
  { 
    _id: 'p5', 
    member: 'm7', 
    amount: 800, 
    method: 'cash', 
    coversUntil: today, 
    isPartial: false, 
    balanceDue: 0, 
    createdAt: subDays(today, 30) 
  },
];

export const mockAttendance = [
  { 
    _id: 'a1', 
    member: 'm1', 
    date: new Date().toISOString().slice(0, 10), 
    checkIn: new Date(new Date().setHours(6, 15, 0)), 
    checkOut: new Date(new Date().setHours(7, 45, 0)) 
  },
  { 
    _id: 'a2', 
    member: 'm2', 
    date: new Date().toISOString().slice(0, 10), 
    checkIn: new Date(new Date().setHours(7, 30, 0)), 
    checkOut: null 
  },
  { 
    _id: 'a3', 
    member: 'm5', 
    date: new Date().toISOString().slice(0, 10), 
    checkIn: new Date(new Date().setHours(8, 0, 0)), 
    checkOut: null 
  },
];

// Initial 16 Shoe Lockers (4 member slots each)
export const initialMockLockers = Array.from({ length: 16 }, (_, i) => {
  const num = i + 1;
  let slots = [null, null, null, null];
  if (num === 1) {
    slots = ['m1', 'm2', 'm3', null];
  } else if (num === 2) {
    slots = ['m4', 'm5', null, null];
  } else if (num === 3) {
    slots = ['m6', 'm7', null, null];
  }
  return {
    id: `locker-${num}`,
    number: num,
    capacity: 4,
    slots,
  };
});