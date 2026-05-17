const puppeteer = require('puppeteer-core');

/**
 * Renders HTML to a PDF buffer (A4).
 * @param {string} html
 * @returns {Promise<Buffer>}
 */
const generatePDF = async (html) => {
  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/chromium-browser',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu'
    ],
    headless: true,
  });
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const buffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '15mm', bottom: '15mm', left: '15mm', right: '15mm' },
    });
    return buffer;
  } finally {
    await browser.close();
  }
};

module.exports = { generatePDF };
