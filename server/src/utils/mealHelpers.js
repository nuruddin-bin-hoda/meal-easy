function isCutoffPassed(cutoffTime, timezone = 'Asia/Dhaka') {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  const parts = formatter.formatToParts(now);
  const currentHour = parseInt(parts.find(p => p.type === 'hour').value);
  const currentMin  = parseInt(parts.find(p => p.type === 'minute').value);
  const [cutoffHour, cutoffMin] = cutoffTime.split(':').map(Number);
  return currentHour * 60 + currentMin >= cutoffHour * 60 + cutoffMin;
}

function getTodayDateString(timezone = 'Asia/Dhaka') {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return formatter.format(now); // YYYY-MM-DD
}

function getTomorrowDateString(timezone = 'Asia/Dhaka') {
  const now = new Date();
  now.setDate(now.getDate() + 1);
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return formatter.format(now); // YYYY-MM-DD
}

function getCurrentBillingMonth(timezone = 'Asia/Dhaka') {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
  });
  return formatter.format(now); // YYYY-MM
}

module.exports = { isCutoffPassed, getTodayDateString, getTomorrowDateString, getCurrentBillingMonth };
