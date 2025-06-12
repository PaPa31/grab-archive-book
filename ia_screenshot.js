// ia_screenshot.js
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
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();

  for (const url of urls) {
    console.log(`🧭 Visiting: ${url}`);
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 0 });

    // Wait for reader container
    try {
      await page.waitForSelector('.BRpageimage[src^="blob:"]', { timeout: 15000 });
    } catch (e) {
      console.log(`⚠️ No images loaded on page ${url.split('/page/')[1]?.split('/')[0]}`);
      continue;
    }

    // Extract all BRpageimage <img> elements
    const blobs = await page.$$eval('.BRpageimage', imgs =>
      imgs.map(img => ({ src: img.src, width: img.naturalWidth, height: img.naturalHeight }))
    );

    console.log(`🔍 Blob URLs found: ${blobs.length}`);
    if (blobs.length === 0) {
      console.log(`⚠️ No <img> elements found.`);
      continue;
    }

    let valid = 0;

    for (const [i, blob] of blobs.entries()) {
      const blobSize = `${blob.width}x${blob.height}`;
      if (!blob.src.startsWith('blob:') || blob.width < 100 || blob.height < 100) {
        console.log(`⚠️ Blob too small (${blobSize}), skipping`);
        continue;
      }

      // Screenshot the specific image element
      const elHandle = (await page.$$('.BRpageimage'))[i];
      const filename = `page-${url.match(/\/n(\d+)/)[1]}-${i + 1}.png`;
      const filepath = path.join(screenshotDir, filename);

      await elHandle.screenshot({ path: filepath });
      console.log(`✅ Saved: ${filepath}`);
      valid++;
    }

    if (valid === 0) {
      console.log(`⚠️ No valid screenshots saved for page ${url}`);
    }
  }

  await browser.close();
  console.log('🏁 Done.');
})();
