// src/api/client.js
import axios from "axios";
import { mockMembers as initialMembers, mockAttendance as initialAttendance, mockPayments as initialPayments, initialMockLockers, getStatus, getDaysRemaining } from "../mock/data";
import { addMonths, addYears, differenceInCalendarDays, startOfDay, format } from "date-fns";
import { calculateNewExpiry, PLAN_PRICES } from "../utils/calculateNewExpiry";

const delay = (ms = 150) => new Promise((res) => setTimeout(res, ms));

const STORAGE_KEYS = {
  MEMBERS: 'balcha_gym_members',
  ATTENDANCE: 'balcha_gym_attendance',
  PAYMENTS: 'balcha_gym_payments',
  LOCKERS: 'balcha_gym_lockers',
  SMS_LOGS: 'balcha_gym_sms_logs',
};

function loadStorage(key, fallback) {
  try {
    const saved = localStorage.getItem(key);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.warn(`Could not load ${key} from storage:`, e);
  }
  return fallback;
}

function saveStorage(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.warn(`Could not save ${key} to storage:`, e);
  }
}

let mockMembers = loadStorage(STORAGE_KEYS.MEMBERS, [...initialMembers]);
let mockAttendance = loadStorage(STORAGE_KEYS.ATTENDANCE, [...initialAttendance]);
let mockPayments = loadStorage(STORAGE_KEYS.PAYMENTS, [...initialPayments]);
let mockLockers = loadStorage(STORAGE_KEYS.LOCKERS, [...initialMockLockers]);
let mockSmsLogs = loadStorage(STORAGE_KEYS.SMS_LOGS, []);


export async function getMembers({ q, status, window } = {}) {
  await delay();
  let results = mockMembers.map((m) => {
    const daysLeft = getDaysRemaining(m.expiryDate);
    return {
      ...m,
      status: getStatus(m.expiryDate),
      daysLeft,
    };
  });

  if (q && q.trim()) {
    const query = q.toLowerCase().trim();
    results = results.filter(
      (m) =>
        m.fullName.toLowerCase().includes(query) ||
        m.memberId.toLowerCase().includes(query) ||
        (m.phone && m.phone.includes(query))
    );
  }

  if (status) {
    results = results.filter((m) => m.status === status);
  }

  if (window !== undefined && window !== null && window !== '') {
    const windowNum = Number(window);
    results = results.filter((m) => {
      if (windowNum === 0) return m.daysLeft === 0;
      if (windowNum === 2) return m.daysLeft === 2;
      if (windowNum === 5) return m.daysLeft === 5;
      return m.daysLeft >= 0 && m.daysLeft <= windowNum;
    });
  }

  return results;
}

export async function getMemberById(id) {
  await delay();
  const member = mockMembers.find((m) => m._id === id || m.memberId === id);
  if (!member) throw new Error('Member not found');
  const daysLeft = getDaysRemaining(member.expiryDate);
  return { 
    ...member, 
    status: getStatus(member.expiryDate),
    daysLeft,
  };
}

export async function getDashboardSummary() {
  await delay();
  const members = mockMembers.map((m) => ({
    status: getStatus(m.expiryDate),
    daysLeft: getDaysRemaining(m.expiryDate),
  }));

  const total = members.length;
  const active = members.filter((m) => m.status === 'active').length;
  const grace = members.filter((m) => m.status === 'grace_period').length;
  const expired = members.filter((m) => m.status === 'expired').length;
  const expiringToday = members.filter((m) => m.daysLeft === 0).length;
  const expiring2 = members.filter((m) => m.daysLeft === 2).length;
  const expiring5 = members.filter((m) => m.daysLeft === 5).length;

  return {
    total,
    active,
    grace,
    expired,
    expiringToday,
    expiring2,
    expiring5,
  };
}

export async function getFinancialSummary() {
  await delay();
  const totalRevenue = mockPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
  
  const cashTotal = mockPayments
    .filter((p) => p.method === 'cash')
    .reduce((sum, p) => sum + (p.amount || 0), 0);
    
  const mobileMoneyTotal = mockPayments
    .filter((p) => p.method === 'mobile_money')
    .reduce((sum, p) => sum + (p.amount || 0), 0);
    
  const otherTotal = mockPayments
    .filter((p) => p.method === 'other')
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  const totalBalanceDue = mockPayments.reduce((sum, p) => sum + (p.balanceDue || 0), 0);

  // Today's revenue
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayRevenue = mockPayments
    .filter((p) => new Date(p.createdAt).toISOString().slice(0, 10) === todayStr)
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  return {
    totalRevenue,
    todayRevenue,
    cashTotal,
    mobileMoneyTotal,
    otherTotal,
    totalBalanceDue,
    totalTransactions: mockPayments.length,
  };
}

export async function getAllPayments() {
  await delay();
  return mockPayments.map((p) => {
    const member = mockMembers.find((m) => m._id === p.member);
    return {
      ...p,
      memberName: member?.fullName || 'Unknown',
      memberIdLabel: member?.memberId || '—',
    };
  });
}

export async function getPaymentsForMember(memberId) {
  await delay();
  return mockPayments.filter((p) => p.member === memberId);
}

export async function getAttendanceForMember(memberId) {
  await delay();
  return mockAttendance.filter((a) => a.member === memberId);
}

export function isGymOpenNow() {
  const now = new Date();
  const hour = now.getHours();
  const min = now.getMinutes();
  const timeInMinutes = hour * 60 + min;

  // 5:30 AM (330 mins) to 8:00 AM (480 mins)
  const isMorningShift = timeInMinutes >= 330 && timeInMinutes <= 480;
  // 3:00 PM (900 mins) to 8:00 PM (1200 mins)
  const isEveningShift = timeInMinutes >= 900 && timeInMinutes <= 1200;

  return isMorningShift || isEveningShift;
}

function getNextMemberId() {
  const nums = mockMembers
    .map((m) => {
      const match = (m.memberId || '').match(/GYM-(\d+)/i);
      return match ? parseInt(match[1], 10) : 0;
    })
    .filter((n) => !isNaN(n));
  const maxNum = nums.length > 0 ? Math.max(...nums, 0) : 0;
  return `GYM-${String(maxNum + 1).padStart(4, '0')}`;
}

export async function createMember(data) {
  await delay();
  const { fullName, phone, photoUrl, plan, joinDate, amount, method, address, emergencyContact } = data;

  const joinDateObj = new Date(joinDate);
  const expiryDate = calculateNewExpiry({
    plan,
    oldExpiryDate: joinDateObj,
    amount,
    today: joinDateObj,
  });

  const memberIdStr = getNextMemberId();
  const newMemberId = `m${Date.now()}`;

  let isPartial = false;
  let balanceDue = 0;

  if (plan === 'yearly') {
    const totalDaysCovered = differenceInCalendarDays(expiryDate, joinDateObj);
    const impliedPaidValue = (totalDaysCovered / 365) * PLAN_PRICES.yearly;
    balanceDue = Math.max(0, Math.round(PLAN_PRICES.yearly - impliedPaidValue));
    isPartial = balanceDue > 0;
  }

  const newMember = {
    _id: newMemberId,
    memberId: memberIdStr,
    fullName,
    phone,
    photoUrl: photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    plan,
    joinDate: joinDateObj,
    expiryDate,
    address: address || '',
    emergencyContact: emergencyContact || '',
    balanceDue,
    status: getStatus(expiryDate),
    daysLeft: getDaysRemaining(expiryDate),
  };

  mockMembers.unshift(newMember);
  saveStorage(STORAGE_KEYS.MEMBERS, mockMembers);

  mockPayments.unshift({
    _id: `p${Date.now()}`,
    member: newMemberId,
    amount,
    method,
    coversUntil: expiryDate,
    isPartial,
    balanceDue,
    createdAt: new Date(),
  });
  saveStorage(STORAGE_KEYS.PAYMENTS, mockPayments);

  return newMember;
}

export async function scanMember(memberIdOrDbId, forceAllow = false) {
  await delay();
  const trimmed = (memberIdOrDbId || '').trim();
  const member = mockMembers.find(
    (m) => m.memberId.toLowerCase() === trimmed.toLowerCase() || m._id === trimmed
  );
  
  if (!member) {
    throw new Error(`No member found with ID: ${trimmed}`);
  }

  const status = getStatus(member.expiryDate);
  const daysLeft = getDaysRemaining(member.expiryDate);
  const gymOpen = isGymOpenNow();

  if (!gymOpen && !forceAllow) {
    return {
      member: { ...member, status, daysLeft },
      blocked: true,
      blockReason: 'Gym is currently closed (Operating hours: 5:30-8:00 AM & 3:00-8:00 PM)',
      attendance: null,
      duplicateScan: false,
    };
  }

  const todayStr = new Date().toISOString().slice(0, 10);
  let record = mockAttendance.find((a) => a.member === member._id && a.date === todayStr);
  let duplicateScan = false;

  if (!record) {
    record = { 
      _id: `a${Date.now()}`, 
      member: member._id, 
      date: todayStr, 
      checkIn: new Date(),
      checkOut: null 
    };
    mockAttendance.unshift(record);
    saveStorage(STORAGE_KEYS.ATTENDANCE, mockAttendance);
  } else {
    duplicateScan = true;
  }

  const memberPayments = mockPayments.filter((p) => p.member === member._id);
  const latestPayment = memberPayments[0];
  const balanceDue = member.plan === 'yearly' && latestPayment ? latestPayment.balanceDue : 0;
  const locker = getLockerForMember(member._id);

  return {
    member: { ...member, status, daysLeft, balanceDue, locker },
    attendance: record,
    blocked: false,
    duplicateScan,
  };
}

export async function renewMember(memberDbId, { plan, amount, method }) {
  await delay();
  const member = mockMembers.find((m) => m._id === memberDbId);
  if (!member) throw new Error('Member not found');

  const targetPlan = plan || member.plan;

  if (targetPlan !== 'yearly' && amount < PLAN_PRICES[targetPlan]) {
    throw new Error(`${targetPlan} plan requires full payment of ${PLAN_PRICES[targetPlan]} birr`);
  }

  const newExpiry = calculateNewExpiry({ plan: targetPlan, oldExpiryDate: member.expiryDate, amount });

  let isPartial = false;
  let balanceDue = 0;

  if (targetPlan === 'yearly') {
    const totalDaysCovered = differenceInCalendarDays(newExpiry, member.joinDate);
    const impliedPaidValue = (totalDaysCovered / 365) * PLAN_PRICES.yearly;
    balanceDue = Math.max(0, Math.round(PLAN_PRICES.yearly - impliedPaidValue));
    isPartial = balanceDue > 0;
  }

  member.plan = targetPlan;
  member.expiryDate = newExpiry;
  saveStorage(STORAGE_KEYS.MEMBERS, mockMembers);

  const payment = {
    _id: `p${Date.now()}`,
    member: member._id,
    amount,
    method,
    coversUntil: newExpiry,
    isPartial,
    balanceDue,
    createdAt: new Date(),
  };
  mockPayments.unshift(payment);
  saveStorage(STORAGE_KEYS.PAYMENTS, mockPayments);

  return {
    member: { 
      ...member, 
      status: getStatus(member.expiryDate), 
      daysLeft: getDaysRemaining(member.expiryDate) 
    },
    payment,
  };
}

export async function getAttendanceByDate(dateStr) {
  await delay();
  const records = mockAttendance.filter((a) => a.date === dateStr);
  return records.map((a) => {
    const member = mockMembers.find((m) => m._id === a.member);
    return {
      ...a,
      memberName: member?.fullName || 'Unknown',
      memberIdLabel: member?.memberId || '—',
      photoUrl: member?.photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100',
      plan: member?.plan || 'monthly',
    };
  });
}

export async function checkOutAttendance(attendanceId) {
  await delay();
  const record = mockAttendance.find((a) => a._id === attendanceId);
  if (!record) throw new Error('Attendance record not found');
  record.checkOut = new Date();
  saveStorage(STORAGE_KEYS.ATTENDANCE, mockAttendance);
  return record;
}

function generateAutoSmsText(member, lang = 'en') {
  const expiryFormatted = format(new Date(member.expiryDate), 'MMM d, yyyy');
  const daysLeft = member.daysLeft;

  if (lang === 'am') {
    if (daysLeft === 5) return `ውድ ${member.fullName}፣ የባልቻ ጂም አባልነትዎ በ5 ቀናት ውስጥ በ${expiryFormatted} ያበቃል። ያለማቋረጥ ስፖርትዎን ለመቀጠል እባክዎ ቀድመው ያድሱ።`;
    if (daysLeft === 2) return `የባልቻ ጂም ማሳሰቢያ፡ ${member.fullName}፣ የ${member.plan.toUpperCase()} ፓስዎ ሊያበቃ 2 ቀናት ብቻ ቀርተዋል! ዛሬውኑ በሪሴፕሽን ያድሱ።`;
    if (daysLeft === 0) return `🚨 አስቸኳይ የባልቻ ጂም ማሳሰቢያ፡ ${member.fullName}፣ አባልነትዎ ዛሬ ያበቃል! የመግቢያ መቆራረጥ እንዳያጋጥምዎ አሁኑኑ ያድሱ።`;
    if (member.status === 'grace_period') return `⚠️ ባልቻ ጂም፡ ${member.fullName}፣ የ3 ቀናት የእፎይታ ጊዜ ላይ ነዎት። ካርድዎ እንዳይታገድ ዛሬውኑ በሪሴፕሽን ያድሱ!`;
    return `ውድ ${member.fullName}፣ የባልቻ ጂም አባልነትዎ አብቅቷል። አገልግሎትዎን ለመቀጠል እባክዎ በሪሴፕሽን ያድሱ።`;
  }

  if (lang === 'om') {
    if (daysLeft === 5) return `Kabajamoo ${member.fullName}, miseensummaan Balcha Gym keessanii guyyaa 5 keessatti ${expiryFormatted} irratti dhumata. Guyyaa kaffaltiin dhumuun dura haaromsadhaa!`;
    if (daysLeft === 2) return `Yaadachiisa Balcha Gym: ${member.fullName}, paasii ${member.plan.toUpperCase()} keessan irratti guyyaa 2 qofatu hafe! Har'a seensa irratti haaromsadhaa.`;
    if (daysLeft === 0) return `🚨 Beeksisa Balcha Gym: ${member.fullName}, miseensummaan keessan HAR'A dhumata! Tajaajilli akka inni hin cinneef seensa irratti haaromsadhaa.`;
    if (member.status === 'grace_period') return `⚠️ Balcha Gym: ${member.fullName}, yeroo dhiifamaa guyyaa 3 keessa jirtu. Waraqaan keessan akka hin cufamneef har'a haaromsadhaa!`;
    return `Kabajamoo ${member.fullName}, miseensummaan Balcha Gym keessanii dhumateera. Seensa (front desk) irratti haaromsadhaa.`;
  }

  // Default English
  if (daysLeft === 5) return `Dear ${member.fullName}, your Balcha Gym membership expires in 5 days on ${expiryFormatted}. Renew early at the desk to keep your workout streak uninterrupted!`;
  if (daysLeft === 2) return `Balcha Gym Reminder: ${member.fullName}, only 2 days left on your ${member.plan.toUpperCase()} pass! Visit the front desk today for fast renewal.`;
  if (daysLeft === 0) return `🚨 Balcha Gym Alert: ${member.fullName}, your membership expires TODAY! Please renew at the desk now to avoid entry interruption.`;
  if (member.status === 'grace_period') return `⚠️ Balcha Gym: ${member.fullName}, you are in your 3-day grace period. Renew today to keep your permanent card active!`;
  return `Balcha Gym Notice: ${member.fullName}, your membership has expired. Please renew at the desk to continue workout access.`;
}

export async function getPendingSmsMembers() {
  await delay();
  const todayStr = new Date().toISOString().slice(0, 10);
  const members = mockMembers.map((m) => {
    const daysLeft = getDaysRemaining(m.expiryDate);
    const status = getStatus(m.expiryDate);
    return { ...m, status, daysLeft };
  });

  return members.filter((m) => {
    const needsReminder = m.status === 'grace_period' || (m.daysLeft >= 0 && m.daysLeft <= 5);
    if (!needsReminder) return false;
    const alreadySentToday = mockSmsLogs.some(
      (log) => (log.memberId === m.memberId || log.memberId === m._id) && log.sentDate === todayStr
    );
    return !alreadySentToday;
  });
}

export async function autoDispatchSmsReminders(lang = 'en') {
  await delay(250);
  const todayStr = new Date().toISOString().slice(0, 10);
  const pending = await getPendingSmsMembers();

  let sentCount = 0;
  const newLogs = [];

  for (const m of pending) {
    const message = generateAutoSmsText(m, lang);
    const logEntry = {
      id: `sms-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      memberId: m.memberId,
      memberName: m.fullName,
      phone: m.phone,
      message,
      sentAt: new Date(),
      sentDate: todayStr,
      status: 'Delivered',
      type: 'Automated Expiry Dispatch',
    };
    mockSmsLogs.unshift(logEntry);
    newLogs.push(logEntry);
    sentCount++;
  }

  saveStorage(STORAGE_KEYS.SMS_LOGS, mockSmsLogs);
  return {
    sentCount,
    totalPending: pending.length,
    newLogs,
    allLogs: mockSmsLogs,
  };
}

export async function getSmsLogs() {
  await delay();
  return [...mockSmsLogs];
}

export async function sendSmsNotification(memberId, message) {
  await delay();
  const member = mockMembers.find((m) => m._id === memberId || m.memberId === memberId);
  if (!member) throw new Error('Member not found');

  const todayStr = new Date().toISOString().slice(0, 10);
  const logEntry = {
    id: `sms-${Date.now()}`,
    memberId: member.memberId,
    memberName: member.fullName,
    phone: member.phone,
    message,
    sentAt: new Date(),
    sentDate: todayStr,
    status: 'Delivered',
    type: 'Desk Portal Dispatch',
  };

  mockSmsLogs.unshift(logEntry);
  saveStorage(STORAGE_KEYS.SMS_LOGS, mockSmsLogs);
  return logEntry;
}

export function getLockerForMember(memberId) {
  if (!memberId) return null;
  for (const l of mockLockers) {
    const slotIndex = l.slots.findIndex((s) => s === memberId);
    if (slotIndex !== -1) {
      return {
        lockerNumber: l.number,
        slotIndex: slotIndex,
        slotNumber: slotIndex + 1,
        slotLabel: `Locker #${String(l.number).padStart(2, '0')} (Slot ${slotIndex + 1})`,
      };
    }
  }
  return null;
}

export async function getLockers() {
  await delay();
  return mockLockers.map((l) => {
    const populatedSlots = l.slots.map((memberId, idx) => {
      if (!memberId) return null;
      const member = mockMembers.find((m) => m._id === memberId || m.memberId === memberId);
      if (!member) return null;
      return {
        _id: member._id,
        memberId: member.memberId,
        fullName: member.fullName,
        phone: member.phone,
        photoUrl: member.photoUrl,
        status: getStatus(member.expiryDate),
        daysLeft: getDaysRemaining(member.expiryDate),
        plan: member.plan,
        slotIndex: idx,
      };
    });
    const occupiedCount = populatedSlots.filter(Boolean).length;
    return {
      ...l,
      slots: populatedSlots,
      occupiedCount,
      availableCount: l.capacity - occupiedCount,
      isFull: occupiedCount === l.capacity,
      isEmpty: occupiedCount === 0,
    };
  });
}

export async function assignLockerSlot({ lockerNumber, slotIndex, memberId }) {
  await delay();
  const locker = mockLockers.find((l) => l.number === Number(lockerNumber));
  if (!locker) throw new Error(`Locker #${lockerNumber} not found.`);
  if (slotIndex < 0 || slotIndex >= locker.capacity) throw new Error('Invalid slot index.');

  // Check if member already assigned to any locker
  for (const l of mockLockers) {
    const idx = l.slots.findIndex((s) => s === memberId);
    if (idx !== -1 && !(l.number === Number(lockerNumber) && idx === slotIndex)) {
      throw new Error(`Member is already assigned to Locker #${l.number} (Slot ${idx + 1}). Remove them first.`);
    }
  }

  locker.slots[slotIndex] = memberId;
  saveStorage(STORAGE_KEYS.LOCKERS, mockLockers);
  return getLockers();
}

export async function releaseLockerSlot({ lockerNumber, slotIndex }) {
  await delay();
  const locker = mockLockers.find((l) => l.number === Number(lockerNumber));
  if (!locker) throw new Error(`Locker #${lockerNumber} not found.`);
  locker.slots[slotIndex] = null;
  saveStorage(STORAGE_KEYS.LOCKERS, mockLockers);
  return getLockers();
}

export async function addLocker() {
  await delay();
  const nextNum = mockLockers.length > 0 ? Math.max(...mockLockers.map((l) => l.number)) + 1 : 1;
  const newLocker = {
    id: `locker-${nextNum}`,
    number: nextNum,
    capacity: 4,
    slots: [null, null, null, null],
  };
  mockLockers.push(newLocker);
  saveStorage(STORAGE_KEYS.LOCKERS, mockLockers);
  return getLockers();
}

export async function deleteLocker(lockerNumber) {
  await delay();
  const locker = mockLockers.find((l) => l.number === Number(lockerNumber));
  if (!locker) throw new Error(`Locker #${lockerNumber} not found.`);
  if (locker.slots.some(Boolean)) {
    throw new Error(`Cannot delete Locker #${lockerNumber} because it currently contains member shoe assignments.`);
  }
  mockLockers = mockLockers.filter((l) => l.number !== Number(lockerNumber));
  saveStorage(STORAGE_KEYS.LOCKERS, mockLockers);
  return getLockers();
}

const client = axios.create({
  baseURL: 'http://localhost:5000/api'
});

export default client;