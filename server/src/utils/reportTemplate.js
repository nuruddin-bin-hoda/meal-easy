const fs   = require('fs');
const path = require('path');

// Fonts are read once at module load so each PDF render doesn't hit disk.
const _fontBase64 = (() => {
  const read = (name) => {
    try {
      const p = path.join(__dirname, '../assets/fonts', name);
      return fs.readFileSync(p).toString('base64');
    } catch {
      return null;
    }
  };
  return {
    hindSiliguri:    read('HindSiliguri-Regular.ttf'),
    notoSansBengali: read('NotoSansBengali-Regular.ttf'),
  };
})();

const _fontFaceCSS = [
  _fontBase64.hindSiliguri && `
    @font-face {
      font-family: 'Hind Siliguri';
      src: url('data:font/truetype;base64,${_fontBase64.hindSiliguri}') format('truetype');
      font-weight: 400;
      font-style: normal;
    }`,
  _fontBase64.notoSansBengali && `
    @font-face {
      font-family: 'Noto Sans Bengali';
      src: url('data:font/truetype;base64,${_fontBase64.notoSansBengali}') format('truetype');
      font-weight: 400;
      font-style: normal;
    }`,
].filter(Boolean).join('\n');

/**
 * Generates the full HTML string for a user's monthly report PDF.
 * @param {object} data  - same shape as getReportData response
 * @param {string} lang  - 'en' or 'bn'
 * @returns {string}
 */
const generateReportHTML = (data, lang = 'en') => {
  const isBn = lang === 'bn';

  // ── translation strings ──────────────────────────────────────────────────
  const t = {
    title:          isBn ? 'মাসিক রিপোর্ট'         : 'Monthly Report',
    appName:        isBn ? 'মিল ইজি'               : 'Meal Easy',
    preview:        isBn ? 'প্রিভিউ — এই মাসের বিলিং এখনো চূড়ান্ত হয়নি।'
                         : 'Preview — billing for this month has not been finalised.',
    name:           isBn ? 'নাম'                   : 'Name',
    room:           isBn ? 'রুম'                   : 'Room',
    billingMonth:   isBn ? 'বিলিং মাস'             : 'Billing Month',
    mealRate:       isBn ? 'খাবারের রেট'            : 'Meal Rate',
    perMeal:        isBn ? '/খাবার'                 : '/meal',
    totalMeals:     isBn ? 'মোট খাবার'              : 'Total Meals',
    totalBill:      isBn ? 'মোট বিল'               : 'Total Bill',
    closingBal:     isBn ? 'সমাপনী ব্যালেন্স'       : 'Closing Balance',
    attendance:     isBn ? 'খাবার উপস্থিতি'         : 'Meal Attendance',
    date:           isBn ? 'তারিখ'                  : 'Date',
    guests:         isBn ? 'অতিথি'                  : 'Guests',
    noAttendance:   isBn ? 'এই মাসে কোনো উপস্থিতির তথ্য নেই।'
                         : 'No attendance data for this month.',
    costBreakdown:  isBn ? 'খরচের বিবরণ'            : 'Cost Breakdown',
    mealCost:       isBn ? 'খাবারের খরচ'             : 'Meal cost',
    otherCostShare: isBn ? 'অন্যান্য খরচের শেয়ার'   : 'Other cost share',
    depositsTitle:  isBn ? 'এই মাসের জমা'           : 'Deposits This Month',
    noDeposits:     isBn ? 'এই মাসে কোনো জমা নেই।' : 'No deposits this month.',
    note:           isBn ? 'নোট'                    : 'Note',
    amount:         isBn ? 'পরিমাণ'                 : 'Amount',
    balanceSummary: isBn ? 'ব্যালেন্সের সারসংক্ষেপ' : 'Balance Summary',
    openingBal:     isBn ? 'প্রারম্ভিক ব্যালেন্স'   : 'Opening Balance',
    deposits:       isBn ? 'জমা'                    : 'Deposits',
    generated:      isBn ? 'তৈরির তারিখ'            : 'Generated',
  };

  // ── helpers ──────────────────────────────────────────────────────────────
  const fmt = (n) => `৳${Number(n ?? 0).toFixed(2)}`;
  const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  const fmtMonth = (m) => {
    try {
      return new Date(`${m}-01`).toLocaleDateString(isBn ? 'bn-BD' : 'en-US', { year: 'numeric', month: 'long' });
    } catch { return m; }
  };

  const fmtDate = (d) => {
    try {
      return new Date(d).toLocaleDateString(isBn ? 'bn-BD' : 'en-US', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch { return String(d ?? ''); }
  };

  // ── gather meal types from attendance ────────────────────────────────────
  const mealTypeSet = new Set();
  (data.mealAttendance ?? []).forEach((day) =>
    (day.toggles ?? []).forEach((tg) => mealTypeSet.add(tg.mealType)),
  );
  const mealTypes = [...mealTypeSet].sort();

  const totalMeals = Object.values(data.totalMealsByType ?? {}).reduce((s, n) => s + n, 0);
  const depositsTotal = (data.deposits ?? []).reduce((s, d) => s + d.amount, 0);

  // Locally embedded fonts are used for both Bengali and Latin to ensure
  // the ৳ symbol renders correctly inside Docker (no internet at render time).
  const bodyFont = isBn
    ? "'Hind Siliguri', 'Noto Sans Bengali', sans-serif"
    : "'Hind Siliguri', 'Noto Sans Bengali', Arial, sans-serif";

  // ── attendance table rows ────────────────────────────────────────────────
  const attendanceRows = (data.mealAttendance ?? []).map((day) => {
    const dayMap = {};
    (day.toggles ?? []).forEach((tg) => { dayMap[tg.mealType] = tg; });
    const guestTotal = (day.toggles ?? []).reduce(
      (sum, tg) => sum + (tg.isOn ? (tg.guestCount ?? 0) : 0), 0,
    );
    const cells = mealTypes.map((mt) => {
      const tg = dayMap[mt];
      const on = tg?.isOn;
      return `<td style="text-align:center;color:${on ? '#2e7d32' : '#bbb'};font-weight:${on ? '700' : '400'};">${on ? '✓' : '✗'}</td>`;
    }).join('');
    return `<tr>
      <td>${esc(fmtDate(day.date + 'T00:00:00'))}</td>
      ${cells}
      <td style="text-align:center;">${guestTotal > 0 ? guestTotal : '—'}</td>
    </tr>`;
  }).join('');

  const mealTypeHeaders = mealTypes.map(
    (mt) => `<th style="text-align:center;text-transform:capitalize;">${esc(mt)}</th>`,
  ).join('');

  // ── deposits rows ─────────────────────────────────────────────────────────
  const depositRows = (data.deposits ?? []).map((d) => `
    <tr>
      <td>${esc(fmtDate(d.date))}</td>
      <td style="text-align:right;">${fmt(d.amount)}</td>
      <td>${esc(d.note ?? '—')}</td>
    </tr>`).join('');

  // ── balance summary rows ──────────────────────────────────────────────────
  const closingColor = (data.closingBalance ?? 0) >= 0 ? '#2e7d32' : '#c62828';

  // ── full HTML ─────────────────────────────────────────────────────────────
  return `<!DOCTYPE html>
<html lang="${isBn ? 'bn' : 'en'}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${esc(t.title)}</title>
  <style>
    ${_fontFaceCSS}

    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: ${bodyFont};
      font-size: 11pt;
      color: #212121;
      background: #fff;
      line-height: 1.5;
    }

    /* ── page header ─── */
    .page-header {
      display: flex;
      align-items: flex-end;
      justify-content: space-between;
      border-bottom: 2.5px solid #2e7d32;
      padding-bottom: 10px;
      margin-bottom: 18px;
    }
    .page-header .app-name {
      font-size: 20pt;
      font-weight: 700;
      color: #2e7d32;
      letter-spacing: 0.5px;
    }
    .page-header .report-title {
      font-size: 13pt;
      font-weight: 600;
      color: #555;
    }
    .page-header .meta {
      font-size: 8pt;
      color: #888;
      text-align: right;
    }

    /* ── preview banner ─── */
    .preview-banner {
      background: #fff8e1;
      border-left: 4px solid #f9a825;
      padding: 8px 12px;
      margin-bottom: 16px;
      font-size: 9.5pt;
      color: #6d4c00;
    }

    /* ── user info card ─── */
    .user-card {
      display: flex;
      gap: 32px;
      background: #f9fbe7;
      border: 1px solid #c5e1a5;
      border-radius: 6px;
      padding: 12px 16px;
      margin-bottom: 18px;
    }
    .user-card .field { display: flex; flex-direction: column; gap: 2px; }
    .user-card .label { font-size: 8pt; color: #777; }
    .user-card .value { font-size: 11pt; font-weight: 600; }

    /* ── summary cards row ─── */
    .summary-grid {
      display: flex;
      gap: 10px;
      margin-bottom: 18px;
    }
    .summary-card {
      flex: 1;
      border: 1px solid #e0e0e0;
      border-radius: 6px;
      padding: 10px 12px;
      text-align: center;
    }
    .summary-card .s-label { font-size: 8pt; color: #777; margin-bottom: 4px; }
    .summary-card .s-value { font-size: 13pt; font-weight: 700; }

    /* ── section heading ─── */
    .section-heading {
      font-size: 11pt;
      font-weight: 700;
      color: #2e7d32;
      border-bottom: 1.5px solid #c8e6c9;
      padding-bottom: 4px;
      margin-bottom: 10px;
      margin-top: 20px;
    }

    /* ── tables ─── */
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 9.5pt;
    }
    th {
      background: #e8f5e9;
      color: #1b5e20;
      font-weight: 700;
      padding: 6px 8px;
      text-align: left;
      border: 1px solid #c8e6c9;
    }
    td {
      padding: 5px 8px;
      border: 1px solid #e0e0e0;
      vertical-align: middle;
    }
    tr:nth-child(even) td { background: #fafafa; }
    .no-data {
      text-align: center;
      color: #999;
      padding: 12px;
      font-style: italic;
      font-size: 9.5pt;
    }

    /* ── cost / balance layout ─── */
    .two-col {
      display: flex;
      gap: 16px;
      margin-top: 20px;
    }
    .two-col > .col { flex: 1; }

    .balance-row {
      display: flex;
      justify-content: space-between;
      padding: 5px 0;
      border-bottom: 1px solid #eee;
      font-size: 10pt;
    }
    .balance-row:last-child { border-bottom: none; }
    .balance-row .b-label { color: #555; }
    .balance-row .b-value { font-weight: 500; }
    .balance-total {
      display: flex;
      justify-content: space-between;
      padding: 8px 0 4px;
      border-top: 2px solid #2e7d32;
      margin-top: 4px;
      font-size: 11pt;
      font-weight: 700;
    }

    /* ── footer ─── */
    .page-footer {
      margin-top: 28px;
      border-top: 1px solid #e0e0e0;
      padding-top: 8px;
      font-size: 8pt;
      color: #aaa;
      text-align: center;
    }
  </style>
</head>
<body>

  <!-- Page header -->
  <div class="page-header">
    <div>
      <div class="app-name">${esc(t.appName)}</div>
      <div class="report-title">${esc(t.title)}</div>
    </div>
    <div class="meta">
      ${esc(t.generated)}: ${new Date().toLocaleDateString(isBn ? 'bn-BD' : 'en-US', { day: '2-digit', month: 'short', year: 'numeric' })}
    </div>
  </div>

  ${data.isPreview ? `<div class="preview-banner">⚠ ${esc(t.preview)}</div>` : ''}

  <!-- User info -->
  <div class="user-card">
    <div class="field">
      <span class="label">${esc(t.name)}</span>
      <span class="value">${esc(data.user?.name)}</span>
    </div>
    <div class="field">
      <span class="label">${esc(t.room)}</span>
      <span class="value">${esc(data.user?.roomNumber)}</span>
    </div>
    <div class="field">
      <span class="label">${esc(t.billingMonth)}</span>
      <span class="value">${esc(fmtMonth(data.billingMonth))}</span>
    </div>
  </div>

  <!-- Summary cards -->
  <div class="summary-grid">
    <div class="summary-card">
      <div class="s-label">${esc(t.mealRate)}</div>
      <div class="s-value">${fmt(data.mealRate)}${esc(t.perMeal)}</div>
    </div>
    <div class="summary-card">
      <div class="s-label">${esc(t.totalMeals)}</div>
      <div class="s-value">${totalMeals}</div>
    </div>
    <div class="summary-card">
      <div class="s-label">${esc(t.totalBill)}</div>
      <div class="s-value">${fmt(data.totalBill)}</div>
    </div>
    <div class="summary-card">
      <div class="s-label">${esc(t.closingBal)}</div>
      <div class="s-value" style="color:${closingColor};">${fmt(data.closingBalance)}</div>
    </div>
  </div>

  <!-- Meal attendance -->
  <div class="section-heading">${esc(t.attendance)}</div>
  ${(data.mealAttendance ?? []).length === 0
    ? `<p class="no-data">${esc(t.noAttendance)}</p>`
    : `<table>
        <thead>
          <tr>
            <th>${esc(t.date)}</th>
            ${mealTypeHeaders}
            <th style="text-align:center;">${esc(t.guests)}</th>
          </tr>
        </thead>
        <tbody>${attendanceRows}</tbody>
      </table>`
  }

  <!-- Cost breakdown + Deposits (two-column) -->
  <div class="two-col">

    <!-- Cost breakdown -->
    <div class="col">
      <div class="section-heading" style="margin-top:0;">${esc(t.costBreakdown)}</div>
      <div class="balance-row">
        <span class="b-label">${esc(t.mealCost)}</span>
        <span class="b-value">${fmt(data.mealCost)}</span>
      </div>
      <div class="balance-row">
        <span class="b-label">${esc(t.otherCostShare)}</span>
        <span class="b-value">${fmt(data.otherCostShare)}</span>
      </div>
      <div class="balance-total">
        <span>${esc(t.totalBill)}</span>
        <span>${fmt(data.totalBill)}</span>
      </div>
    </div>

    <!-- Deposits -->
    <div class="col">
      <div class="section-heading" style="margin-top:0;">${esc(t.depositsTitle)}</div>
      ${(data.deposits ?? []).length === 0
        ? `<p class="no-data">${esc(t.noDeposits)}</p>`
        : `<table>
            <thead>
              <tr>
                <th>${esc(t.date)}</th>
                <th style="text-align:right;">${esc(t.amount)}</th>
                <th>${esc(t.note)}</th>
              </tr>
            </thead>
            <tbody>${depositRows}</tbody>
          </table>`
      }
    </div>

  </div>

  <!-- Balance summary -->
  <div class="section-heading">${esc(t.balanceSummary)}</div>
  <div style="max-width:360px;">
    <div class="balance-row">
      <span class="b-label">${esc(t.openingBal)}</span>
      <span class="b-value">${fmt(data.openingBalance)}</span>
    </div>
    <div class="balance-row">
      <span class="b-label">${esc(t.deposits)} (${esc(fmtMonth(data.billingMonth))})</span>
      <span class="b-value">+ ${fmt(depositsTotal)}</span>
    </div>
    <div class="balance-row">
      <span class="b-label">${esc(t.totalBill)}</span>
      <span class="b-value">− ${fmt(data.totalBill)}</span>
    </div>
    <div class="balance-total">
      <span>${esc(t.closingBal)}</span>
      <span style="color:${closingColor};">${fmt(data.closingBalance)}</span>
    </div>
  </div>

  <!-- Footer -->
  <div class="page-footer">
    ${esc(t.appName)} &mdash; ${esc(t.generated)}: ${new Date().toISOString()}
  </div>

</body>
</html>`;
};

module.exports = { generateReportHTML };
