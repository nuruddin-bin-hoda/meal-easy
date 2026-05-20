const fs   = require('fs');
const path = require('path');

const _fontBase64 = (() => {
  const read = (name) => {
    try {
      return fs.readFileSync(path.join(__dirname, '../assets/fonts', name)).toString('base64');
    } catch { return null; }
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
      font-weight: 400; font-style: normal;
    }`,
  _fontBase64.notoSansBengali && `
    @font-face {
      font-family: 'Noto Sans Bengali';
      src: url('data:font/truetype;base64,${_fontBase64.notoSansBengali}') format('truetype');
      font-weight: 400; font-style: normal;
    }`,
].filter(Boolean).join('\n');

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const fmt = (n) => `৳${Number(n ?? 0).toFixed(2)}`;

const fmtMonth = (m) => {
  try { return new Date(`${m}-01`).toLocaleDateString('en-US', { year: 'numeric', month: 'long' }); }
  catch { return m; }
};
const fmtDate = (d) => {
  try { return new Date(d).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }); }
  catch { return String(d ?? ''); }
};

/**
 * @param {object} opts
 * @param {object} opts.billingCycle   – BillingCycle fields + submittedByName
 * @param {Array}  opts.userBills      – { userId, mealCount, guestMealCount, mealCost, otherCostShare, totalBill }
 * @param {Array}  opts.users          – { _id, name, roomNumber }
 * @param {object} opts.depositMap     – { [userId]: totalDeposit }
 */
const generateBillingReportHTML = ({ billingCycle, userBills, users, depositMap }) => {
  const isLocked   = !!billingCycle?.isLocked;
  const month      = billingCycle?.billingMonth ?? '';
  const mealRate   = billingCycle?.mealRate ?? 0;
  const totalPurch = billingCycle?.totalItemCost ?? 0;
  const totalOther = billingCycle?.totalOtherCost ?? 0;
  const totalMeals = billingCycle?.totalMealCount ?? 0;
  const activeUsers= billingCycle?.activeUserCount ?? 0;

  const userMap = {};
  for (const u of users) userMap[u._id.toString()] = u;

  const rows = (userBills ?? []).map((bill, idx) => {
    const uid      = bill.userId?.toString();
    const u        = userMap[uid] ?? {};
    const deposits = depositMap?.[uid] ?? 0;
    const balance  = deposits - (bill.totalBill ?? 0);
    const balColor = balance >= 0 ? '#2e7d32' : '#c62828';
    const even     = idx % 2 === 0;

    return `<tr style="${even ? '' : 'background:#fafafa;'}">
      <td style="text-align:center;">${idx + 1}</td>
      <td>${esc(u.name ?? '—')}</td>
      <td style="text-align:center;">${esc(u.roomNumber ?? '—')}</td>
      <td style="text-align:center;">${bill.mealCount ?? 0}</td>
      <td style="text-align:center;">${bill.guestMealCount ?? 0}</td>
      <td style="text-align:right;">${fmt(bill.mealCost)}</td>
      <td style="text-align:right;">${fmt(bill.otherCostShare)}</td>
      <td style="text-align:right;font-weight:700;">${fmt(bill.totalBill)}</td>
      <td style="text-align:right;">${fmt(deposits)}</td>
      <td style="text-align:right;font-weight:600;color:${balColor};">${fmt(balance)}</td>
    </tr>`;
  }).join('');

  const footerNote = isLocked
    ? `Submitted by <strong>${esc(billingCycle.submittedByName ?? 'Admin')}</strong> on ${fmtDate(billingCycle.submittedAt)}`
    : '⚠ Preview — billing for this month has not been finalised.';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <title>Billing Report — ${esc(fmtMonth(month))}</title>
  <style>
    ${_fontFaceCSS}
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Hind Siliguri', 'Noto Sans Bengali', Arial, sans-serif;
      font-size: 10pt; color: #212121; background: #fff; line-height: 1.5;
    }
    .page-header {
      display: flex; align-items: flex-end; justify-content: space-between;
      border-bottom: 2.5px solid #1565c0; padding-bottom: 10px; margin-bottom: 18px;
    }
    .app-name   { font-size: 20pt; font-weight: 700; color: #1565c0; }
    .report-sub { font-size: 13pt; font-weight: 600; color: #555; }
    .meta       { font-size: 8pt; color: #888; text-align: right; }
    .month-label{ font-size: 11pt; font-weight: 600; color: #333; margin-top: 2px; }

    .summary-grid { display: flex; gap: 10px; margin-bottom: 20px; }
    .summary-card {
      flex: 1; border: 1px solid #e0e0e0; border-radius: 6px;
      padding: 10px 12px; text-align: center;
    }
    .s-label { font-size: 8pt; color: #777; margin-bottom: 4px; }
    .s-value { font-size: 13pt; font-weight: 700; }

    table { width: 100%; border-collapse: collapse; font-size: 9pt; }
    th {
      background: #e3f2fd; color: #0d47a1; font-weight: 700;
      padding: 6px 8px; text-align: left; border: 1px solid #bbdefb;
    }
    td { padding: 5px 8px; border: 1px solid #e0e0e0; vertical-align: middle; }

    .footer-note {
      margin-top: 20px; padding: 8px 12px;
      border-left: 4px solid ${isLocked ? '#1565c0' : '#f9a825'};
      background: ${isLocked ? '#e3f2fd' : '#fff8e1'};
      font-size: 9.5pt; color: ${isLocked ? '#0d47a1' : '#6d4c00'};
    }
    .page-footer {
      margin-top: 28px; border-top: 1px solid #e0e0e0;
      padding-top: 8px; font-size: 8pt; color: #aaa; text-align: center;
    }
  </style>
</head>
<body>
  <div class="page-header">
    <div>
      <div class="app-name">Meal Easy</div>
      <div class="report-sub">Billing Report</div>
      <div class="month-label">${esc(fmtMonth(month))}</div>
    </div>
    <div class="meta">
      Generated: ${fmtDate(new Date())}
    </div>
  </div>

  <div class="summary-grid">
    <div class="summary-card">
      <div class="s-label">Meal Rate</div>
      <div class="s-value">${fmt(mealRate)}/meal</div>
    </div>
    <div class="summary-card">
      <div class="s-label">Total Purchases</div>
      <div class="s-value">${fmt(totalPurch)}</div>
    </div>
    <div class="summary-card">
      <div class="s-label">Total Other Costs</div>
      <div class="s-value">${fmt(totalOther)}</div>
    </div>
    <div class="summary-card">
      <div class="s-label">Active Users</div>
      <div class="s-value">${activeUsers}</div>
    </div>
    <div class="summary-card">
      <div class="s-label">Total Meals</div>
      <div class="s-value">${totalMeals}</div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="text-align:center;">#</th>
        <th>Name</th>
        <th style="text-align:center;">Room</th>
        <th style="text-align:center;">Meals</th>
        <th style="text-align:center;">Guest Meals</th>
        <th style="text-align:right;">Meal Cost (৳)</th>
        <th style="text-align:right;">Other Cost (৳)</th>
        <th style="text-align:right;">Total Bill (৳)</th>
        <th style="text-align:right;">Deposits (৳)</th>
        <th style="text-align:right;">Balance (৳)</th>
      </tr>
    </thead>
    <tbody>
      ${rows || '<tr><td colspan="10" style="text-align:center;color:#999;padding:12px;">No billing data.</td></tr>'}
    </tbody>
  </table>

  <div class="footer-note">${footerNote}</div>

  <div class="page-footer">Meal Easy &mdash; Generated: ${new Date().toISOString()}</div>
</body>
</html>`;
};

module.exports = { generateBillingReportHTML };
