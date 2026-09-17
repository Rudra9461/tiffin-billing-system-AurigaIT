function normalizePhone(raw) {
  if (!raw) return null;
  const digits = String(raw).replace(/\D/g, '');
  if (digits.length < 10) return null;
  return digits.slice(-10);
}

function formatDate(y, mo, d) {
  const year = String(y).padStart(4, '0');
  const month = String(mo).padStart(2, '0');
  const day = String(d).padStart(2, '0');
  if (Number(month) < 1 || Number(month) > 12) return null;
  if (Number(day) < 1 || Number(day) > 31) return null;
  const dateObj = new Date(`${year}-${month}-${day}T00:00:00`);
  if (isNaN(dateObj.getTime())) return null;
  return `${year}-${month}-${day}`;
}

function normalizeDate(raw) {
  if (!raw || String(raw).trim() === '') return null;
  const s = String(raw).trim();

  let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (m) return formatDate(m[1], m[2], m[3]);

  m = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (m) return formatDate(m[3], m[2], m[1]);

  return null;
}

function processImportRows(rows, existingPhones) {
  const imported = [];
  const deduped = [];
  const rejected = [];
  const seenInBatch = new Set();

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i] || {};
    const rowNum = i + 1;

    const name = (row.name || '').toString().trim();
    const phone = normalizePhone(row.phone);

    if (!name) { rejected.push({ row: rowNum, data: row, reason: 'Missing name' }); continue; }
    if (!phone) { rejected.push({ row: rowNum, data: row, reason: 'Invalid or missing phone number' }); continue; }

    if (seenInBatch.has(phone) || existingPhones.has(phone)) {
      deduped.push({
        row: rowNum, phone,
        reason: existingPhones.has(phone) ? 'Phone already exists in database' : 'Duplicate phone within import batch'
      });
      continue;
    }

    let start_date = null;
    if (row.start_date) {
      start_date = normalizeDate(row.start_date);
      if (!start_date) { rejected.push({ row: rowNum, data: row, reason: 'Unrecognized date format for start_date' }); continue; }
    }

    let plan_price = null;
    if (row.plan_price !== undefined && row.plan_price !== null && row.plan_price !== '') {
      const p = parseFloat(row.plan_price);
      if (!isNaN(p) && p > 0) plan_price = p;
    }
    const plan_name = (row.plan_name || '').toString().trim() || null;

    seenInBatch.add(phone);
    imported.push({
      row: rowNum, name, phone,
      address: (row.address || '').toString().trim(),
      plan_name, plan_price, start_date
    });
  }

  return { imported, deduped, rejected };
}

module.exports = { processImportRows, normalizePhone, normalizeDate };