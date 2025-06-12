const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const IA_URL = 'https://archive.org/details/electroniccircui0000sent/page/1/mode/2up?view=theater';
const OUTPUT_DIR = './screenshots';
const MAX_PAGES = 100; // adjust this

(async () => {
  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR);

  const browser = await puppeteer.launch({ headless: 'new', defaultViewport: null });
  const page = await browser.newPage();
  await page.goto(IA_URL, { waitUntil: 'networkidle2' });

  let pageNum = 1;

  for (let i = 0; i < MAX_PAGES; i++) {
    try {
      // Wait for image viewer to load
      await page.waitForSelector('.BRpageimage', { timeout: 10000 });

      const filePath = path.join(OUTPUT_DIR, `page_${String(pageNum).padStart(3, '0')}.png`);
      await page.screenshot({ path: filePath });

      console.log(`📸 Saved: ${filePath}`);
      pageNum++;

      // Click "Next" button
      const nextButton = await page.$('.BRnavlink.br-right');
      if (!nextButton) {
        console.log('❌ No more pages.');
        break;
      }

      await Promise.all([
        nextButton.click(),
        page.waitForTimeout(1000), // wait briefly for animation
        page.waitForSelector('.BRpageimage'), // wait for new pages to load
      ]);
    } catch (err) {
      console.error(`⚠️ Error on page ${pageNum}:`, err.message);
      break;
    }
  }

  await browser.close();
  console.log('✅ Done!');
})();

