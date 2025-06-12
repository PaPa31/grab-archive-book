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
const startPages = Array.from({ length: 5 }, (_, i) => 27 + i * 2);
// const startPages = Array.from({ length: 25 }, (_, i) => 11 + i * 2);

(async () => {
  const browser = await puppeteer.launch({
    headless: false,
    devtools: true,
    defaultViewport: null,
    args: ['--start-maximized']
  });

  const page = await browser.newPage();

  for (const startPage of startPages) {  // 🔧 outer loop over pages
    for (let offset = 0; offset <= 1; offset++) {  // 🔁 loop for left & right
      const actualPage = startPage + offset;
      const selector = `div.pagediv${actualPage}.BRpage-visible > img`;

      try {
        await page.waitForFunction(
          (selector) => {
            const img = document.querySelector(selector);
            return img && img.complete && img.naturalWidth > 100;
          },
          { timeout: 15000 },
          selector
        );

        const imgSrc = await page.$eval(selector, el => el.src);
        console.log(`📸 Page ${actualPage} image src: ${imgSrc}`);

        const imgEl = await page.$(selector);
        if (imgEl) {
          const clip = await imgEl.boundingBox();
          const filename = path.join(outDir, `page_n${actualPage}.png`);
          if (fs.existsSync(filename)) {
            console.log(`⏭️ Skipping existing: ${filename}`);
            continue;
          }

          await page.screenshot({ path: filename, clip });
          console.log(`✅ Saved: ${filename}`);
        } else {
          console.warn(`⚠️ Element not found for page n${actualPage}`);
        }
      } catch (err) {
        console.warn(`⚠️ Timeout or error for page n${actualPage}:`, err.message);
      }

      await new Promise(resolve => setTimeout(resolve, 1500));
    }
  }

  console.log('🏁 Done.');
})();

