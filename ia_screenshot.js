const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

(async () => {
  const url = 'https://archive.org/details/electroniccircui0000sent/page/n11/mode/2up?view=theater';
  const browser = await puppeteer.launch({ headless: false, defaultViewport: null });
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: 'networkidle2' });

  // Wait until at least one real image is visible
  await page.waitForSelector('img.BRpageimage');
  await new Promise(resolve => setTimeout(resolve, 5000)); // wait extra for rendering

  const imageBuffers = await page.evaluate(() => {
    return Promise.all(
      Array.from(document.querySelectorAll('img.BRpageimage'))
        .map(async (img) => {
          // Create a canvas, draw the image, then extract as data URL
          const canvas = document.createElement('canvas');
          canvas.width = img.naturalWidth;
          canvas.height = img.naturalHeight;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0);

          const dataURL = canvas.toDataURL('image/png');
          return dataURL;
        })
    );
  });

  // Save images
  imageBuffers.forEach((dataUrl, i) => {
    const base64Data = dataUrl.replace(/^data:image\/png;base64,/, '');
    fs.writeFileSync(path.join(__dirname, `page_${i + 1}.png`), base64Data, 'base64');
    console.log(`Saved page_${i + 1}.png`);
  });

  console.log('Done! Check saved PNGs.');
})();
