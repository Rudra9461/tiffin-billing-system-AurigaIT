function isWeekday(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  const day = d.getDay();
  return day !== 0 && day !== 6;
}

function toDate(dateStr) {
  return new Date(dateStr + 'T00:00:00');
}

function countWeekdays(startStr, endStr) {
  let start = toDate(startStr);
  let end = toDate(endStr);
  if (start > end) return 0;

  let count = 0;
  let cur = new Date(start);
  while (cur <= end) {
    const day = cur.getDay();
    if (day !== 0 && day !== 6) count++;
    cur.setDate(cur.getDate() + 1);
  }
  return count;
}

function lastDayOfMonth(year, month) {
  return new Date(year, month, 0).getDate();
}

function addDays(dateStr, delta) {
  const d = toDate(dateStr);
  d.setDate(d.getDate() + delta);
  return d.toISOString().slice(0, 10);
}

// A date is "paused" if it falls inside any pause window (open pause = end_date null = still ongoing)
function isPausedOnDate(pauses, dateStr) {
  return pauses.some(p => {
    if (dateStr < p.start_date) return false;
    if (p.end_date && dateStr > p.end_date) return false;
    return true;
  });
}

// Original single-owner bill calculation (kept for reference / simple cases)
function calculateBill(subscription, pauses, month) {
  const [year, mon] = month.split('-').map(Number);
  const monthStart = `${month}-01`;
  const lastDay = lastDayOfMonth(year, mon);
  const monthEnd = `${month}-${String(lastDay).padStart(2, '0')}`;

  const subStart = subscription.start_date;
  const effectiveStart = subStart > monthStart ? subStart : monthStart;

  if (effectiveStart > monthEnd) {
    return {
      month, eligibleWeekdays: 0, pausedWeekdays: 0, servedWeekdays: 0,
      dailyRate: 0, bill: 0, effectiveStart, effectiveEnd: monthEnd,
      pauseBreakdown: []
    };
  }

  const eligibleWeekdays = countWeekdays(effectiveStart, monthEnd);
  const dailyRate = eligibleWeekdays > 0 ? subscription.plan_price / eligibleWeekdays : 0;

  let pausedWeekdays = 0;
  const pauseBreakdown = [];

  for (const p of pauses) {
    let pStart = p.start_date > effectiveStart ? p.start_date : effectiveStart;
    let pEnd = (p.end_date && p.end_date < monthEnd) ? p.end_date : monthEnd;

    if (pStart > pEnd) continue;

    const wd = countWeekdays(pStart, pEnd);
    pausedWeekdays += wd;
    pauseBreakdown.push({ start_date: p.start_date, end_date: p.end_date, weekdaysCounted: wd, cappedStart: pStart, cappedEnd: pEnd });
  }

  pausedWeekdays = Math.min(pausedWeekdays, eligibleWeekdays);
  const servedWeekdays = eligibleWeekdays - pausedWeekdays;
  const bill = Math.round(dailyRate * servedWeekdays * 100) / 100;

  return {
    month, eligibleWeekdays, pausedWeekdays, servedWeekdays,
    dailyRate: Math.round(dailyRate * 100) / 100, bill,
    effectiveStart, effectiveEnd: monthEnd, pauseBreakdown
  };
}

// T6: bill split by whichever customer actually owned the subscription on each served day.
// Walks day-by-day through the billing window (simple and unambiguous — safest approach
// given multiple transfers can happen within one month).
function calculateBillSplit(subscription, pauses, ownerSegments, month) {
  const [year, mon] = month.split('-').map(Number);
  const monthStart = `${month}-01`;
  const lastDay = lastDayOfMonth(year, mon);
  const monthEnd = `${month}-${String(lastDay).padStart(2, '0')}`;

  const subStart = subscription.start_date;
  const effectiveStart = subStart > monthStart ? subStart : monthStart;

  if (effectiveStart > monthEnd) {
    return {
      month, eligibleWeekdays: 0, pausedWeekdays: 0, servedWeekdays: 0,
      dailyRate: 0, bill: 0, effectiveStart, effectiveEnd: monthEnd, splitByCustomer: []
    };
  }

  const eligibleWeekdays = countWeekdays(effectiveStart, monthEnd);
  const dailyRate = eligibleWeekdays > 0 ? subscription.plan_price / eligibleWeekdays : 0;

  const servedByCustomer = {};
  let pausedWeekdays = 0;

  let cur = toDate(effectiveStart);
  const end = toDate(monthEnd);

  while (cur <= end) {
    const dateStr = cur.toISOString().slice(0, 10);
    const day = cur.getDay();

    if (day !== 0 && day !== 6) {
      if (isPausedOnDate(pauses, dateStr)) {
        pausedWeekdays++;
      } else {
        const owner = ownerSegments.find(seg =>
          dateStr >= seg.start_date && (!seg.end_date || dateStr <= seg.end_date)
        );
        const ownerId = owner ? owner.customer_id : subscription.customer_id;
        servedByCustomer[ownerId] = (servedByCustomer[ownerId] || 0) + 1;
      }
    }
    cur.setDate(cur.getDate() + 1);
  }

  const servedWeekdays = eligibleWeekdays - pausedWeekdays;

  const splitByCustomer = Object.entries(servedByCustomer).map(([customer_id, days]) => ({
    customer_id: Number(customer_id),
    servedWeekdays: days,
    bill: Math.round(dailyRate * days * 100) / 100
  }));

  const bill = Math.round(splitByCustomer.reduce((sum, x) => sum + x.bill, 0) * 100) / 100;

  return {
    month, eligibleWeekdays, pausedWeekdays, servedWeekdays,
    dailyRate: Math.round(dailyRate * 100) / 100, bill,
    effectiveStart, effectiveEnd: monthEnd, splitByCustomer
  };
}

module.exports = { isWeekday, countWeekdays, calculateBill, calculateBillSplit, isPausedOnDate, addDays };