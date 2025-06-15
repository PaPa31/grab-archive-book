const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const START_PAGE = 68;
const PAGE_COUNT = 3;
const BASE_URL = 'https://archive.org/details/electroniccircui0000sent';
const SCREENSHOT_DIR = path.join(__dirname, 'screenshots');

if (!fs.existsSync(SCREENSHOT_DIR)) fs.mkdirSync(SCREENSHOT_DIR);

(async () => {
  const browser = await puppeteer.launch({ headless: false, defaultViewport: null, args: ['--start-maximized'] });
  const page = await browser.newPage();

  page.on('console', msg => {
    const text = msg.text();
    if (/(SoundManager|JSHandle@error|PSA Donation Banner|Slow network|preloaded using link preload)/.test(text)) return;
    console.log('📣 BROWSER LOG:', text);
  });

  for (let i = 0; i < PAGE_COUNT; i++) {
    const pageNum = START_PAGE + i * 2;
    const url = `${BASE_URL}/page/${pageNum}/mode/2up?view=theater`;
    console.log(`🧭 Visiting: ${url}`);

    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
      await page.waitForFunction(() => typeof window.BookReader !== 'undefined', { timeout: 40000 });
      
      await page.evaluate(() => {
        const el = document.querySelector('#BookReader');
        if (el) {
          el.scrollBy(0, 300); // Fake scroll to trigger loading
          el.dispatchEvent(new Event('mousemove'));
          el.click();
          console.log('🌀 Simulated user interaction');
        }
      });
      await new Promise(r => setTimeout(r, 3000)); // Give time to load real images

      await page.evaluate(() => {
        if (window.BookReader) {
          window.BookReader._getDataFlattened = function () {
            let i = null, o = 0;
            const flat = this.br.data.flatMap(p => p.map(pg => {
              pg.viewable = true;
              delete pg.unviewablesStart;
              pg.pageSide = pg.pageSide || (i === null ? (p.length === 2 ? 'L' : 'R') : i === 'L' ? 'R' : 'L');
              i = pg.pageSide;
              o++;
              return pg;
            }));
            this._getDataFlattenedCached = [flat, this.br.data.length];
            return flat;
          };
          console.log('✅ Patched _getDataFlattened');
        } else {
          console.log('❌ BookReader missing when patching!');
        }
      });

      let tries = 10;
      while (tries--) {
        const ok = await page.evaluate(() => {
          const imgs = Array.from(document.querySelectorAll('div.BRpagecontainer.protected.BRpage-visible > img'));
          return imgs.length === 2 && imgs.every(img => img.naturalWidth > 300 && !img.src.includes('grey.gif'));
        });
        if (ok) break;
        console.log(`🔁 Waiting for real images... tries left: ${tries}`);
        await page.waitForTimeout(1500);
      }

      const imgs = await page.$$('div.BRpagecontainer.protected.BRpage-visible > img');
      if (imgs.length === 2) {
        await imgs[0].screenshot({ path: path.join(SCREENSHOT_DIR, `page-${pageNum}-L.png`) });
        await imgs[1].screenshot({ path: path.join(SCREENSHOT_DIR, `page-${pageNum}-R.png`) });
        console.log(`✅ Saved left + right pages for ${pageNum}`);
      } else {
        console.warn(`⚠️ Only ${imgs.length} page(s) found for ${pageNum}`);
      }

    } catch (err) {
      console.error(`❌ Page ${pageNum} error:`, err.message);
    }
  }

  console.log('🏁 Done.');
  await browser.close();
})();
