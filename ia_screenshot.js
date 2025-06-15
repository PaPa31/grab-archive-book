const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const START_PAGE = 68;
const PAGE_COUNT = 3;
const BASE_URL = 'https://archive.org/details/electroniccircui0000sent';
const SCREENSHOT_DIR = path.join(__dirname, 'screenshots');

// Ensure output folder exists
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR);
}

(async () => {
  const browser = await puppeteer.launch({
    headless: false, // set to true if you don’t need GUI
    defaultViewport: null,
    args: ['--start-maximized']
  });

  const page = await browser.newPage();

  // Filter useful logs only
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('SoundManager') || text.startsWith('JSHandle@error')) return;
    console.log('📣 BROWSER LOG:', text);
  });

  for (let i = 0; i < PAGE_COUNT; i++) {
    const pageNum = START_PAGE + i * 2;
    const url = `${BASE_URL}/page/${pageNum}/mode/2up?view=theater`;
    console.log(`🧭 Visiting: ${url}`);

    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });

      // Wait for BookReader object
      await page.waitForFunction(() => typeof window.BookReader !== 'undefined', { timeout: 30000 });

      // Wait a little extra for rendering
      await page.waitForTimeout(2000);

      // Select the book viewer container
      const viewer = await page.$('.BRcontainer'); // you can adjust selector here if needed

      if (viewer) {
        const filename = `page-${String(pageNum).padStart(3, '0')}.png`;
        const fullPath = path.join(SCREENSHOT_DIR, filename);
        await viewer.screenshot({ path: fullPath });
        console.log(`✅ Saved screenshot: ${filename}`);
      } else {
        console.warn(`⚠️ Viewer not found on page ${pageNum}`);
      }

    } catch (err) {
      console.error(`❌ Error for page n${pageNum}:`, err.message);
    }
  }

  console.log('🏁 Done.');
//   await browser.close();
})();
