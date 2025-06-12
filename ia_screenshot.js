const puppeteer = require('puppeteer');

(async () => {
  const url = 'https://archive.org/details/electroniccircui0000sent/page/n11/mode/2up?view=theater';
  const browser = await puppeteer.launch({ headless: false }); // Turn off headless to debug if needed
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: 'networkidle2' });

  // Wait for the visible page image
  await page.waitForSelector('img.BRpageimage');

  // Grab all visible page images
  const imageSrcs = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('img.BRpageimage'))
      .map(img => img.src);
  });

  console.log('Image sources:', imageSrcs);

  await browser.close();
})();
