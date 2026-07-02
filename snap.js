const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 375, height: 812 } });
  await page.goto('http://localhost:4200/');
  await page.waitForTimeout(4000);
  await page.screenshot({ path: 'snap-mobile.png', fullPage: true });
  await browser.close();
})();
