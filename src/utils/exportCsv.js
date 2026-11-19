// src/utils/exportCsv.js
import { format } from 'date-fns';

function downloadCsvFile(csvContent, fileName) {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function escapeCsvCell(cell) {
  if (cell === null || cell === undefined) return '""';
  const str = String(cell).replace(/"/g, '""');
  return `"${str}"`;
}

/**
 * Export member list to CSV
 */
export function exportMembersToCsv(members, filterName = 'All') {
  const headers = [
    'Member ID',
    'Full Name',
    'Phone',
    'Plan',
    'Join Date',
    'Expiry Date',
    'Days Remaining/Overdue',
    'Status',
    'Emergency Contact',
  ];

  const rows = members.map((m) => [
    m.memberId,
    m.fullName,
    m.phone,
    m.plan.toUpperCase(),
    format(new Date(m.joinDate), 'yyyy-MM-dd'),
    format(new Date(m.expiryDate), 'yyyy-MM-dd'),
    m.daysLeft,
    m.status.toUpperCase(),
    m.emergencyContact || 'N/A',
  ]);

  const csvContent = [
    headers.map(escapeCsvCell).join(','),
    ...rows.map((row) => row.map(escapeCsvCell).join(',')),
  ].join('\n');

  const timestamp = format(new Date(), 'yyyy-MM-dd_HHmm');
  downloadCsvFile(csvContent, `BalchaGym_Members_${filterName}_${timestamp}.csv`);
}

/**
 * Export daily attendance to CSV
 */
export function exportAttendanceToCsv(records, dateStr) {
  const headers = [
    'Date',
    'Member ID',
    'Full Name',
    'Plan',
    'Check-In Time',
    'Check-Out Time',
    'Status',
  ];

  const rows = records.map((r) => [
    r.date,
    r.memberIdLabel,
    r.memberName,
    (r.plan || '').toUpperCase(),
    r.checkIn ? format(new Date(r.checkIn), 'hh:mm:ss a') : '—',
    r.checkOut ? format(new Date(r.checkOut), 'hh:mm:ss a') : 'Active in Gym',
    r.checkOut ? 'COMPLETED' : 'WORKING_OUT',
  ]);

  const csvContent = [
    headers.map(escapeCsvCell).join(','),
    ...rows.map((row) => row.map(escapeCsvCell).join(',')),
  ].join('\n');

  downloadCsvFile(csvContent, `BalchaGym_Attendance_${dateStr}.csv`);
}

/**
 * Export payment receipts / financial log to CSV
 */
export function exportPaymentsToCsv(payments) {
  const headers = [
    'Date',
    'Receipt ID',
    'Member ID',
    'Member Name',
    'Amount (ETB)',
    'Payment Method',
    'Covers Until',
    'Is Partial',
    'Balance Due (ETB)',
  ];

  const rows = payments.map((p) => [
    format(new Date(p.createdAt), 'yyyy-MM-dd HH:mm'),
    p._id,
    p.memberIdLabel || '—',
    p.memberName || '—',
    p.amount,
    p.method.replace('_', ' ').toUpperCase(),
    p.coversUntil ? format(new Date(p.coversUntil), 'yyyy-MM-dd') : '—',
    p.isPartial ? 'YES' : 'NO',
    p.balanceDue || 0,
  ]);

  const csvContent = [
    headers.map(escapeCsvCell).join(','),
    ...rows.map((row) => row.map(escapeCsvCell).join(',')),
  ].join('\n');

  const timestamp = format(new Date(), 'yyyy-MM-dd_HHmm');
  downloadCsvFile(csvContent, `BalchaGym_Financial_Payments_${timestamp}.csv`);
}
