const puppeteer = require('puppeteer');

const urls = [
  'https://archive.org/details/electroniccircui0000sent/page/n11/mode/2up?view=theater',
  'https://archive.org/details/electroniccircui0000sent/page/n13/mode/2up?view=theater',
  'https://archive.org/details/electroniccircui0000sent/page/n15/mode/2up?view=theater'
];

(async () => {
  const browser = await puppeteer.launch({
    headless: false, // 🧠 GUI mode ON for manual inspection
    devtools: true,  // 🧪 Auto open DevTools
    defaultViewport: null,
    args: ['--start-maximized']
  });

  const page = await browser.newPage();

  for (const url of urls) {
    console.log(`🧭 Visiting: ${url}`);
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 0 });

    // ⏸️ Pause here forever until user closes browser manually
    console.log('⏸️ Paused — inspect the DOM, test selectors, and close browser when done.');
    await new Promise(() => {}); // Infinite wait
  }

  // Just in case: (will not be reached)
  // await browser.close();
})();
