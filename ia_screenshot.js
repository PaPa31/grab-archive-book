const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Ensure screenshots folder exists
const outDir = path.join(__dirname, 'screenshots');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir);
}

// Pages to capture: start from n11 to n15 in steps of 2 (each has left+right)
// const startPages = [11, 13, 15];
const startPages = Array.from({ length: 5 }, (_, i) => 29 + i * 2);
// const startPages = Array.from({ length: 25 }, (_, i) => 11 + i * 2);

(async () => {
  const browser = await puppeteer.launch({
    headless: false,       // Visible browser for debugging
    devtools: true,        // Open DevTools
    defaultViewport: null, // Use full screen
    args: ['--start-maximized']
  });

  const page = await browser.newPage();

  for (const startPage of startPages) {
    const url = `https://archive.org/details/electroniccircui0000sent/page/n${startPage}/mode/2up?view=theater`;
    console.log(`🧭 Visiting: ${url}`);
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 0 });
    
    const leftSelector = `div.pagediv${startPage}.BRpage-visible > img`;
    const rightSelector = `div.pagediv${startPage + 1}.BRpage-visible > img`;
    
    await page.evaluate((leftSelector, rightSelector) => {
      const leftImg = document.querySelector(leftSelector);
      const rightImg = document.querySelector(rightSelector);
      leftImg?.scrollIntoView({ behavior: "instant", block: "center" });
      rightImg?.scrollIntoView({ behavior: "instant", block: "center" });
    }, leftSelector, rightSelector);

    // Small delay to allow image rendering
    await new Promise(resolve => setTimeout(resolve, 3000));

    for (let offset = 0; offset <= 1; offset++) {
      const actualPage = startPage + offset;
      const selector = `div.pagediv${actualPage}.BRpage-visible > img`;

      try {
        await page.waitForSelector(selector, { timeout: 5000 });
        const imgEl = await page.$(selector);

        if (imgEl) {
          const clip = await imgEl.boundingBox();
          const filename = path.join(outDir, `page_n${actualPage}.png`);
          if (fs.existsSync(filename)) {
            console.log(`⏭️ Skipping existing: ${filename}`);
            continue;
          }

          await page.screenshot({
            path: filename,
            clip,
          });

          console.log(`✅ Saved: ${filename}`);
        } else {
          console.warn(`⚠️ Element not found for page n${actualPage}`);
        }
      } catch (err) {
        console.warn(`⚠️ Timeout or error finding selector for page n${actualPage}:`, err.message);
      }
      
      await new Promise(resolve => setTimeout(resolve, 1500)); // 1.5s delay
    }
  }

  console.log('🏁 Done.');
  // await browser.close(); // Leave browser open for inspection
})();
