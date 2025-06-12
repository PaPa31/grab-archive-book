const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const urls = [
  'https://archive.org/details/electroniccircui0000sent/page/n11/mode/2up?view=theater'
];

const screenshotDir = path.join(__dirname, 'screenshots');
if (!fs.existsSync(screenshotDir)) fs.mkdirSync(screenshotDir);

(async () => {
  const browser = await puppeteer.launch({
    headless: false,             // Open browser with GUI
    defaultViewport: null,       // Max window
    args: ['--start-maximized']
  });

  const page = await browser.newPage();

  for (const url of urls) {
    console.log(`🧭 Visiting: ${url}`);
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 0 });

    console.log(`🛑 Pausing for manual inspection. Open DevTools (F12) and explore.`);
    console.log(`📌 Press CTRL+C to exit when done.`);

    // Optional: uncomment if you want it to auto-pause with DevTools open:
    // await page.evaluate(() => { debugger; });

    // Or wait forever (until you close manually)
    await new Promise(resolve => {});  // Infinite pause
  }

  await browser.close();
})();
