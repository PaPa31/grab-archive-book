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

    // Wait until all BRpageimage elements are fully loaded
    const loaded = await page.evaluate(async () => {
      const imgs = Array.from(document.querySelectorAll("img.BRpageimage"));
      if (imgs.length === 0) return 0;

      // Wait for each image to load
      await Promise.all(imgs.map(img => {
        return new Promise((resolve) => {
          if (img.complete && img.naturalHeight !== 0) return resolve();
          img.onload = () => resolve();
          img.onerror = () => resolve();
        });
      }));

      return imgs.length;
    });

    if (loaded === 0) {
      console.warn(`⚠️ No images loaded on page n${pageNum}`);
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
      if (buffer.length < 50 * 1024) {
        console.log(`⚠️ Blob too small (${(buffer.length / 1024).toFixed(1)} KB), skipping`);
        emptyCount++;
        continue;
      }
      const filename = `page_${++saved}.png`;
      fs.writeFileSync(path.join(outputDir, filename), buffer);
      console.log(`✅ Saved ${filename}, ${(buffer.length / 1024).toFixed(1)} KB`);
      emptyCount = 0;
    }

    pageNum += 2;
  }

  console.log(`🏁 Done. ${saved} pages saved.`);
  await browser.close();
})();
