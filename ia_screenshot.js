const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");

const startUrl = "https://archive.org/details/electroniccircui0000sent/page/n11/mode/2up?view=theater";
const outputDir = "screenshots";
const PAGE_STEP = 2;
const MAX_EMPTY_COUNT = 3;
const MIN_VALID_SIZE = 10 * 1024; // 10 KB for debug

(async () => {
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
  }

  const browser = await puppeteer.launch({
    headless: true,
    defaultViewport: { width: 1920, height: 1080 },
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();
  let currentPageNumber = getPageNumberFromUrl(startUrl);
  let emptyCount = 0;
  let savedCount = 0;

  while (emptyCount < MAX_EMPTY_COUNT) {
    const url = buildPageUrl(currentPageNumber);
    console.log(`🧭 Visiting: ${url}`);
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });

    try {
      await page.waitForSelector(".iaBookReaderPage img", { timeout: 15000 });
    } catch {
      console.warn(`⚠️ No images found on page ${url}`);
      emptyCount++;
      currentPageNumber += PAGE_STEP;
      continue;
    }

    const imageHandles = await page.$$(".iaBookReaderPage");
    const imageSrcs = await page.$$eval(".iaBookReaderPage img", imgs => imgs.map(img => img.src));
    console.log(`🖼 Found ${imageHandles.length} image containers`);
    if (imageHandles.length === 0) {
      emptyCount++;
      currentPageNumber += PAGE_STEP;
      continue;
    }

    for (let i = 0; i < imageHandles.length; i++) {
      const fileIndex = savedCount + 1;
      const fileName = `page_${fileIndex}.png`;
      const filePath = path.join(outputDir, fileName);

      if (fs.existsSync(filePath)) {
        console.log(`⏭ Skipping ${fileName} (already exists)`);
        savedCount++;
        continue;
      }

      try {
        await imageHandles[i].screenshot({ path: filePath });
      } catch (err) {
        console.warn(`⚠️ Error capturing element ${i}, using full page fallback`);
        await page.screenshot({ path: filePath });
      }

      const stats = fs.statSync(filePath);
      const sizeKB = (stats.size / 1024).toFixed(1);

      if (stats.size < MIN_VALID_SIZE) {
        emptyCount++;
        console.log(`⚠️ Discarded ${fileName} (only ${sizeKB} KB, ${emptyCount}/${MAX_EMPTY_COUNT})`);
        fs.unlinkSync(filePath);
      } else {
        console.log(`✅ Saved ${fileName} (${sizeKB} KB)`);
        savedCount++;
        emptyCount = 0;
      }
    }

    currentPageNumber += PAGE_STEP;
  }

  console.log(`🏁 Finished. ${savedCount} pages saved.`);
  await browser.close();
})();

// Helpers
function getPageNumberFromUrl(url) {
  const match = url.match(/\/page\/n(\d+)/);
  return match ? parseInt(match[1], 10) : 1;
}

function buildPageUrl(pageNum) {
  return `https://archive.org/details/electroniccircui0000sent/page/n${pageNum}/mode/2up?view=theater`;
}
