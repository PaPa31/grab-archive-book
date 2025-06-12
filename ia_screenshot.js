const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const urls = [
  'https://archive.org/details/electroniccircui0000sent/page/n11/mode/2up?view=theater',
  'https://archive.org/details/electroniccircui0000sent/page/n13/mode/2up?view=theater',
  'https://archive.org/details/electroniccircui0000sent/page/n15/mode/2up?view=theater'
];

const screenshotDir = path.join(__dirname, 'screenshots');
if (!fs.existsSync(screenshotDir)) fs.mkdirSync(screenshotDir);

(async () => {
  const browser = await puppeteer.launch({
    headless: true,  // Set to false if you still want to debug
    defaultViewport: null,
    args: ['--start-maximized']
  });

  const page = await browser.newPage();

  for (const url of urls) {
    const match = url.match(/page\/n(\d+)/);
    const basePage = match ? match[1] : 'unknown';
    console.log(`🧭 Visiting: ${url}`);

    await page.goto(url, { waitUntil: 'networkidle2', timeout: 0 });

    // Left page
    const leftSelector = 'div.pagediv' + basePage + '.BRpage-visible > img';
    const leftHandle = await page.$(leftSelector);

    if (leftHandle) {
      const leftPath = path.join(screenshotDir, `n${basePage}-left.png`);
      await leftHandle.screenshot({ path: leftPath });
      console.log(`📸 Saved left page: ${leftPath}`);
    } else {
      console.warn(`⚠️ Left page not found for page n${basePage}`);
    }

    // Right page (assume +1)
    const rightPage = String(parseInt(basePage) + 1);
    const rightSelector = 'div.pagediv' + rightPage + '.BRpage-visible > img';
    const rightHandle = await page.$(rightSelector);

    if (rightHandle) {
      const rightPath = path.join(screenshotDir, `n${basePage}-right.png`);
      await rightHandle.screenshot({ path: rightPath });
      console.log(`📸 Saved right page: ${rightPath}`);
    } else {
      console.warn(`⚠️ Right page not found for page n${rightPage}`);
    }
  }

  await browser.close();
  console.log('🏁 Done.');
})();
