const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");

const startUrl = "https://archive.org/details/electroniccircui0000sent/page/n11/mode/2up?view=theater";
const outputDir = "screenshots";

const MAX_EMPTY_COUNT = 3;
const PAGE_STEP = 2;

(async () => {
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
  }

  const browser = await puppeteer.launch({
    headless: true,
    defaultViewport: null,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();
  let currentPageNumber = getPageNumberFromUrl(startUrl);
  let emptyCount = 0;
  let savedCount = 0;

  while (emptyCount < MAX_EMPTY_COUNT) {
    const url = buildPageUrl(currentPageNumber);
    console.log(`🧭 Visiting: ${url}`);
    await page.goto(url, { waitUntil: "networkidle2", timeout: 30000 });

    // Wait for images to load
    await page.waitForSelector(".iaBookReaderPage img", { timeout: 10000 }).catch(() => null);
    const images = await page.$$eval(".iaBookReaderPage img", imgs => imgs.map(img => img.src));

    for (let i = 0; i < images.length; i++) {
      const fileIndex = savedCount + 1;
      const fileName = `page_${fileIndex}.png`;
      const filePath = path.join(outputDir, fileName);

      if (fs.existsSync(filePath)) {
        console.log(`⚠️  Skipping ${fileName} (already exists)`);
        savedCount++;
        continue;
      }

      const imageElement = (await page.$$(".iaBookReaderPage"))[i];
      if (!imageElement) continue;

      await imageElement.screenshot({ path: filePath });
      const stats = fs.statSync(filePath);
      const sizeKB = (stats.size / 1024).toFixed(1);

      if (stats.size < 40000) {
        emptyCount++;
        console.log(`⚠️  Skipping low-content page_${fileIndex}.png (${sizeKB} KB, ${emptyCount}/${MAX_EMPTY_COUNT} empty)`);
        fs.unlinkSync(filePath);
        continue;
      }

      console.log(`✅ Saved ${fileName} (${sizeKB} KB)`);
      savedCount++;
      emptyCount = 0;
    }

    currentPageNumber += PAGE_STEP;
  }

  console.log(`🏁 Done! Saved ${savedCount} images.`);
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
