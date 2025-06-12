const puppeteer = require('puppeteer');

(async () => {
  const url = 'https://archive.org/details/electroniccircui0000sent/page/n11/mode/2up?view=theater';
  const browser = await puppeteer.launch({ headless: false, defaultViewport: null });
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: 'networkidle2' });

  await page.waitForSelector('img.BRpageimage', { timeout: 10000 });
  await new Promise(resolve => setTimeout(resolve, 3000)); // Give extra time for JS blob loading

  const imageSrcs = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('img.BRpageimage'))
      .map(img => img.src);
  });

  console.log('Image sources:', imageSrcs);

  console.log('Done! Browser will stay open.');
  await new Promise(() => {}); // <-- Keep browser open
})();
