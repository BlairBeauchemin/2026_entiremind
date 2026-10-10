const { chromium } = require('playwright');
const dir = process.argv[2];
const variants = { a: '', b: 'inter', c: 'sky' };
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1024, height: 1024 }, deviceScaleFactor: 2 });
  await p.goto('file://' + dir + '/phone.html');
  await p.evaluate(() => document.fonts.ready);
  await p.waitForTimeout(800);
  for (const [k, cls] of Object.entries(variants)) {
    await p.evaluate(c => { document.body.className = c; }, cls);
    await p.screenshot({ path: `${dir}/phone_${k}.png`, omitBackground: true });
  }
  await b.close();
})();
