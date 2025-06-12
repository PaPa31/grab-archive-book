const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const BOOK_URL = 'https://archive.org/details/electroniccircui0000sent';
const OUT_DIR = __dirname;

(async () => {
  const browser = await puppeteer.launch({ headless: false, defaultViewport: null });
  const page = await browser.newPage();

  let saved = 0;
  let pageNum = 11; // Start at some known readable page (n11 is good)

  while (pageNum < 50) { // Adjust this upper limit as needed
    const fullUrl = `${BOOK_URL}/page/n${pageNum}/mode/2up?view=theater`;
    console.log(`🧭 Visiting: ${fullUrl}`);
    await page.goto(fullUrl, { waitUntil: 'networkidle2' });

    await page.waitForSelector('img.BRpageimage', { timeout: 10000 });
    await new Promise(resolve => setTimeout(resolve, 5000)); // Let it render fully

    const images = await page.evaluate(() => {
      return Promise.all(
        Array.from(document.querySelectorAll('img.BRpageimage')).map(async (img) => {
          const canvas = document.createElement('canvas');
          canvas.width = img.naturalWidth;
          canvas.height = img.naturalHeight;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0);
          return canvas.toDataURL('image/png');
        })
      );
    });

    for (let i = 0; i < images.length; i++) {
      const dataUrl = images[i];
      const base64 = dataUrl.replace(/^data:image\/png;base64,/, '');

      // Skip if suspiciously small (blank or placeholder)
      const sizeKb = Buffer.from(base64, 'base64').length / 1024;
      if (sizeKb < 30) {
        console.log(`⚠️  Skipping empty/placeholder image (${sizeKb.toFixed(1)} KB)`);
        continue;
      }

      const filename = `page_${saved + 1}.png`;
      fs.writeFileSync(path.join(OUT_DIR, filename), base64, 'base64');
      console.log(`✅ Saved ${filename} (${sizeKb.toFixed(1)} KB)`);
      saved++;
    }

    pageNum += 2; // next 2-up pair (each step loads two pages)
  }

  console.log(`🏁 Done! Saved ${saved} images.`);
  await browser.close();
})();
