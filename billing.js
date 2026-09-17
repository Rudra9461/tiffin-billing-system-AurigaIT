// Monday=1 ... Friday=5 are weekdays; Saturday=6, Sunday=0 are weekends
function isWeekday(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  const day = d.getDay();
  return day !== 0 && day !== 6;
}

function toDate(dateStr) {
  return new Date(dateStr + 'T00:00:00');
}

// Count weekdays between two dates, inclusive on both ends
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
  // month is 1-indexed (1=Jan)
  return new Date(year, month, 0).getDate();
}

// month = 'YYYY-MM'
// subscription = { start_date, plan_price }
// pauses = [{ start_date, end_date | null }]
function calculateBill(subscription, pauses, month) {
  const [year, mon] = month.split('-').map(Number);
  const monthStart = `${month}-01`;
  const lastDay = lastDayOfMonth(year, mon);
  const monthEnd = `${month}-${String(lastDay).padStart(2, '0')}`;

  // Effective billing window = overlap of subscription active period and this month
  const subStart = subscription.start_date;
  const effectiveStart = subStart > monthStart ? subStart : monthStart;

  // If subscription starts after this month entirely, nothing to bill
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
    // Cap pause window to the effective billing window (handles "pause before subscription",
    // "pause covering entire remaining month", and open-ended pauses)
    let pStart = p.start_date > effectiveStart ? p.start_date : effectiveStart;
    let pEnd = (p.end_date && p.end_date < monthEnd) ? p.end_date : monthEnd;

    if (pStart > pEnd) continue; // pause fully outside this month's billing window

    const wd = countWeekdays(pStart, pEnd);
    pausedWeekdays += wd;
    pauseBreakdown.push({ start_date: p.start_date, end_date: p.end_date, weekdaysCounted: wd, cappedStart: pStart, cappedEnd: pEnd });
  }

  // Safety: paused weekdays can't exceed eligible weekdays (overlapping pause periods safeguard)
  pausedWeekdays = Math.min(pausedWeekdays, eligibleWeekdays);

  const servedWeekdays = eligibleWeekdays - pausedWeekdays;
  const bill = Math.round(dailyRate * servedWeekdays * 100) / 100;

  return {
    month, eligibleWeekdays, pausedWeekdays, servedWeekdays,
    dailyRate: Math.round(dailyRate * 100) / 100, bill,
    effectiveStart, effectiveEnd: monthEnd, pauseBreakdown
  };
}

module.exports = { isWeekday, countWeekdays, calculateBill };