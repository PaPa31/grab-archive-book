const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");

const startPageNum = 11;
const maxEmpty = 3;
const outputDir = "screenshots";

(async () => {
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);

  const browser = await puppeteer.launch({ headless: true, defaultViewport: null });
  const page = await browser.newPage();

  let saved = 0;
  let emptyCount = 0;
  let pageNum = startPageNum;

  while (emptyCount < maxEmpty) {
    const url = `https://archive.org/details/electroniccircui0000sent/page/n${pageNum}/mode/2up?view=theater`;
    console.log(`🧭 Visiting: ${url}`);

    await page.goto(url, { waitUntil: "networkidle2", timeout: 30000 });
    await new Promise(r => setTimeout(r, 3000));  // wait for rendering

    const blobs = await page.evaluate(() => Array.from(document.querySelectorAll("img.BRpageimage"))
      .map(img => img.src));
    console.log(`🔍 Blob URLs found: ${blobs.length}`);
    if (blobs.length === 0) {
      console.warn(`⚠️ No blob images on page n${pageNum}`);
      emptyCount++;
      pageNum += 2;
      continue;
    }

    const dataUrls = await page.evaluate(() => {
      const imgs = Array.from(document.querySelectorAll("img.BRpageimage"));
      return imgs.map(img => {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);
        return canvas.toDataURL("image/png");
      });
    });

    for (const dataUrl of dataUrls) {
      const base64 = dataUrl.split(",")[1];
      const buffer = Buffer.from(base64, "base64");
      if (buffer.length < 50 * 1024) { // at least 50 KB
        console.log(`⚠️ Blob too small (${(buffer.length/1024).toFixed(1)} KB), skipping`);
        emptyCount++;
        continue;
      }
      const filename = `page_${++saved}.png`;
      fs.writeFileSync(path.join(outputDir, filename), buffer);
      console.log(`✅ Saved ${filename}, ${(buffer.length/1024).toFixed(1)} KB`);
      emptyCount = 0;
    }

    pageNum += 2;
  }

  console.log(`🏁 Done. ${saved} pages saved.`);
  await browser.close();
})();
