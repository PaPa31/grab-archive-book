const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const outDir = path.join(__dirname, 'screenshots');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir);
}

// 📖 Choose Archive.org page numbers to start from (each loads 2 pages in 2-up view)
const startPages = Array.from({ length: 5 }, (_, i) => 27 + i * 2);

(async () => {
  const browser = await puppeteer.launch({
    headless: false,
    devtools: true,
    defaultViewport: null,
    args: ['--start-maximized']
  });

  const page = await browser.newPage();

  for (const startPage of startPages) {
    const url = `https://archive.org/details/electroniccircui0000sent/page/n${startPage}/mode/2up?view=theater`;
    console.log(`🧭 Visiting: ${url}`);

    try {
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    } catch (e) {
      console.warn(`❌ Failed to load page ${url}:`, e.message);
      continue;
    }

    for (let offset = 0; offset <= 1; offset++) {
      const actualPage = startPage + offset;
      const selector = `div.pagediv${actualPage}.BRpage-visible > img`;
      const filename = path.join(outDir, `page_n${actualPage}.png`);

      if (fs.existsSync(filename)) {
        console.log(`⏭️ Skipping existing: ${filename}`);
        continue;
      }

      try {
        await page.waitForFunction(
          (sel) => {
            const img = document.querySelector(sel);
            return img && img.complete && img.naturalWidth > 100;
          },
          { timeout: 15000 },
          selector
        );

        const imgEl = await page.$(selector);
        if (!imgEl) {
          console.warn(`⚠️ No element found for page ${actualPage}`);
          continue;
        }

        const clip = await imgEl.boundingBox();
        if (!clip || clip.width < 50 || clip.height < 50) {
          console.warn(`⚠️ Invalid clip size for page ${actualPage}`);
          continue;
        }

        await page.screenshot({ path: filename, clip });
        console.log(`✅ Saved: ${filename}`);
      } catch (err) {
        console.warn(`⚠️ Timeout or error for page n${actualPage}:`, err.message);
      }

      await new Promise(resolve => setTimeout(resolve, 1500));
    }
  }

  await browser.close();
  console.log('🏁 Done.');
})();
