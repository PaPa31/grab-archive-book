const puppeteer = require('puppeteer');

const START_PAGE = 68;
const PAGE_COUNT = 3;
const BASE_URL = 'https://archive.org/details/electroniccircui0000sent';

(async () => {
  const browser = await puppeteer.launch({
    headless: false, // Use true for no GUI
    defaultViewport: null,
    args: ['--start-maximized']
  });

  const page = await browser.newPage();

  // Intercept and clean browser logs
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

      // Wait until BookReader is loaded
      await page.waitForFunction(() => typeof window.BookReader !== 'undefined', { timeout: 30000 });

      // Now it's safe to patch or use BookReader
      await page.evaluate(() => {
        try {
          console.log('✅ BookReader is available');

          // Example: Access page data (customize as needed)
          const currentLeaf = window.BookReader?.getPageIndex(); // page number in IA logic
          console.log('🔍 Current BookReader page index:', currentLeaf);
          
          const viewer = await page.$('.BRcontainer'); // or '.pageContainer'
          await viewer.screenshot({ path: `screenshot-${pageNum}.png` });

          // Your custom patching or screenshot logic here
          // e.g., window.BookReader.patchFlattenedData() if such method exists

        } catch (err) {
          console.error('💥 BookReader patch failed:', err);
        }
      });

    } catch (err) {
      console.error(`⚠️ Timeout or error for page n${pageNum}:`, err.message);
    }
  }

  console.log('🏁 Done.');
  await browser.close();
})();
