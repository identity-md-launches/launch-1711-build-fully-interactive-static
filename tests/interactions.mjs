import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { resolve, extname } from 'node:path';
import { pathToFileURL } from 'node:url';
import assert from 'node:assert/strict';
const { chromium, webkit } = await import(process.env.IMD_PLAYWRIGHT ? pathToFileURL(process.env.IMD_PLAYWRIGHT).href : 'playwright');
const snapshot = JSON.parse(await readFile('src/data/snapshot.json','utf8'));
const out = 'test/scratch/interactions'; await mkdir(out,{recursive:true});
const types = { '.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml' };
const server = createServer(async (req,res) => {
  const url = new URL(req.url,'http://localhost');
  const prefix = url.pathname.startsWith('/sandbox/') ? '/sandbox/' : '/preview/';
  const name = decodeURIComponent(url.pathname.slice(prefix.length)) || 'index.html';
  const path = resolve('dist',name);
  if (!url.pathname.startsWith(prefix) || !path.startsWith(resolve('dist')+'/')) { res.writeHead(404).end(); return; }
  try {
    const headers = { 'Content-Type':types[extname(path)] || 'application/octet-stream' };
    if (prefix === '/sandbox/') headers['Content-Security-Policy'] = "sandbox allow-scripts allow-downloads allow-popups allow-popups-to-escape-sandbox; default-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src data:; connect-src https://claus.si https://claus-network-api.vercel.app; form-action 'none'; base-uri 'none'";
    res.writeHead(200,headers).end(await readFile(path));
  } catch { res.writeHead(404).end(); }
});
await new Promise(resolve => server.listen(0,'127.0.0.1',resolve));
const base = `http://127.0.0.1:${server.address().port}`;
const outcomes=[]; const browsers=[];
async function run(name,fn) {
  const start=Date.now();
  try { await fn(); outcomes.push({name,status:'pass',ms:Date.now()-start}); console.log(`PASS ${name}`); }
  catch(error) { outcomes.push({name,status:'fail',error:error.stack}); console.error(`FAIL ${name}: ${error.message}`); }
}
const browser = await chromium.launch({headless:true});browsers.push(browser);
const context = await browser.newContext({viewport:{width:1440,height:900}});
const page = await context.newPage(); const errors=[]; const defaultExternal=[];
page.on('pageerror',error=>errors.push(error.message));
page.on('request',req=>{ if (!req.url().startsWith(base)) defaultExternal.push(req.url()); });
const waitComplete = p => p.waitForFunction(()=>document.querySelector('#scan-status').textContent.includes('complete'),{},{timeout:20000});
try {
  await run('Export loads at a static subpath with no external requests',async()=>{
    await page.goto(`${base}/preview/`);
    assert.equal(await page.title(),'Claus Crawl · Explore the network');
    assert.equal(await page.locator('#project-list .project-row').count(),6);
    assert.equal(await page.locator('form').count(),0);
    assert.equal(defaultExternal.length,0); assert.deepEqual(errors,[]);
    await page.screenshot({path:`${out}/desktop-initial.png`,fullPage:true});
  });
  await run('Keyboard search starts a real cached project scan',async()=>{
    await page.locator('#project-query').focus(); await page.keyboard.insertText('agent-blackbox'); await page.keyboard.press('Enter');
    await waitComplete(page);
    assert.equal(await page.locator('#scanned-count').textContent(),'1');
    assert.match(await page.locator('#project-detail').innerText(),/Recent public activity/);
    assert.equal(await page.locator('#project-detail a').first().getAttribute('href'),'https://claus.si/c/agent-blackbox');
    assert.equal(await page.locator('.scan-progress').getAttribute('aria-valuenow'),'100');
    assert.match(await page.locator('#log').innerText(),/\[walk\] Follow registered_with/);
    await page.screenshot({path:`${out}/desktop-result.png`,fullPage:true});
  });
  await run('Project selection keeps desktop keyboard focus and opens the matching details',async()=>{
    await page.locator('[data-list="all"]').click();
    await page.locator('[data-project="oracle-drift"]').focus();await page.keyboard.press('Enter');
    assert.equal(await page.evaluate(()=>document.activeElement.dataset.project),'oracle-drift');
    assert.equal(await page.locator('#project-detail h3').textContent(),'Oracle Drift');
    assert.equal(await page.locator('#project-detail a').nth(1).getAttribute('href'),'https://claus.si/Home#project=oracle-drift');
  });
  await run('Invalid input and empty search results have a recoverable keyboard path',async()=>{
    await page.locator('#project-query').fill('no-such-project-994'); await page.locator('#project-query').press('Enter');
    assert.equal(await page.locator('#project-query').getAttribute('aria-invalid'),'true');
    assert.match(await page.locator('#input-error').innerText(),/No cached Claus projects/);
    await page.locator('#clear-search').click();assert.equal(await page.locator('#project-query').inputValue(),'');
    await page.locator('#project-query').fill('0x123456');await page.locator('#project-query').press('Enter');
    assert.match(await page.locator('#input-error').innerText(),/project slug or name/);
    await page.locator('#project-query').press('Escape');assert.equal(await page.locator('#project-query').inputValue(),'');
  });
  await run('Stop cancels movement and keeps only completed results; restart succeeds',async()=>{
    await page.locator('#demo-tour').click();
    await page.waitForFunction(()=>document.querySelector('#scanned-count').textContent==='1');
    await page.locator('#stop').click();
    await page.waitForFunction(()=>document.querySelector('#scan-status').textContent.includes('Stopped'));
    const count=await page.locator('#scanned-count').textContent();assert.equal(count,'1');
    const logs=await page.locator('#log .log-entry').count(); await page.waitForTimeout(200);
    assert.equal(await page.locator('#log .log-entry').count(),logs);
    assert.equal(await page.locator('.crawler.moving').count(),0);
    await page.locator('#project-query').fill('oracle-drift');await page.locator('#crawl').click();await waitComplete(page);
    assert.match(await page.locator('#project-detail').innerText(),/No project description has been published/);
    assert.match(await page.locator('#project-detail').innerText(),/Counts from the project profile/);
  });
  await run('Featured tour visits six recorded edges and exposes all/scanned filters',async()=>{
    await page.goto(`${base}/preview/`); await page.locator('#demo-tour').click();await waitComplete(page);
    assert.equal(await page.locator('#scanned-count').textContent(),'6');
    assert.equal(await page.locator('.map-node.visited').count(),6);
    assert.equal(await page.locator('#log .log-tag').filter({hasText:'[walk]'}).count(),6);
    assert.equal(await page.locator('#log .log-tag').filter({hasText:'[return]'}).count(),6);
    await page.locator('[data-list="all"]').click();assert.equal(await page.locator('.project-row').count(),29);
    await page.locator('[data-list="scanned"]').click();assert.equal(await page.locator('.project-row').count(),6);
    await page.locator('#follow-log').click(); assert.equal(await page.locator('#follow-log').getAttribute('aria-pressed'),'false');
    await page.locator('#follow-log').click(); assert.equal(await page.locator('#follow-log').getAttribute('aria-pressed'),'true');
  });
  await run('JSON export contains observations and independent source provenance',async()=>{
    await page.locator('#mode-live').click();assert.match(await page.locator('#source-note').textContent(),/selected/);
    await page.locator('#mode-demo').click();assert.match(await page.locator('#source-note').textContent(),/Cached demo selected/);
    const pending=page.waitForEvent('download');await page.locator('#export-results').click();const download=await pending;
    const path=await download.path(); const report=JSON.parse(await readFile(path,'utf8'));
    assert.equal(report.schema,'claus-crawl-report/1');assert.equal(report.requestedMode,'cached');assert.equal(report.results.length,6);assert.equal(report.sources.activity.mode,'cached');
    assert(report.results.find(r=>r.project.slug==='agent-blackbox').events.length===2);
    assert.match(report.method,/not a security audit/);
    await page.locator('#copy-log').click();await page.waitForFunction(()=>/Copied|selected/.test(document.querySelector('#copy-log').textContent),{},{timeout:5000});assert.match(await page.locator('#copy-log').textContent(),/Copied|selected/);
  });
  await run('320, 390, 760 and 1440 layouts reflow; main action is on first mobile screen',async()=>{
    for (const width of [320,390,760,1440]) {
      await page.setViewportSize({width,height:844});await page.goto(`${base}/preview/`);
      const metrics = await page.evaluate(()=>({ overflow:document.documentElement.scrollWidth>innerWidth, action:document.querySelector('#crawl').getBoundingClientRect().toJSON(), octopus:document.querySelector('#crawler').getBoundingClientRect().toJSON() }));
      assert.equal(metrics.overflow,false,`overflow at ${width}`);
      if(width===390) { assert(metrics.action.bottom<844);assert(metrics.octopus.bottom<844,'Octopus should be fully visible at 390');await page.screenshot({path:`${out}/mobile-390.png`}); }
      if(width===320) await page.screenshot({path:`${out}/mobile-320.png`,fullPage:true});
    }
  });
  await run('Reduced motion completes without moving animations; keyboard focus is visible',async()=>{
    const c=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'});const p=await c.newPage();await p.goto(`${base}/preview/`);
    await p.keyboard.press('Tab');assert.equal(await p.evaluate(()=>document.activeElement.className),'skip-link');
    await p.keyboard.press('Enter');await p.locator('#project-query').focus();
    await p.keyboard.press('Tab');assert.equal(await p.evaluate(()=>document.activeElement.id),'crawl');
    const outline=await p.locator('#crawl').evaluate(e=>getComputedStyle(e).outlineWidth);assert.equal(outline,'2px');
    await p.screenshot({path:`${out}/mobile-focus.png`});
    await p.keyboard.press('Enter');await waitComplete(p);
    assert.equal(await p.locator('#scanned-count').textContent(),'6');
    assert.equal(await p.evaluate(()=>document.getAnimations().filter(a=>a.playState==='running').length),0);
    await c.close();
  });
  await run('Live failure transparently falls back, including unavailable profile counts',async()=>{
    const c=await browser.newContext({reducedMotion:'reduce'});const p=await c.newPage();
    await p.route('https://claus.si/**',r=>r.abort());await p.route('https://claus-network-api.vercel.app/**',r=>r.abort());
    await p.goto(`${base}/preview/`);await p.locator('#mode-live').click();await p.locator('#project-query').fill('claus-up-down');await p.locator('#crawl').click();await waitComplete(p);
    assert.match(await p.locator('#source-note').textContent(),/0\/4 sources live/);
    assert.match(await p.locator('#project-detail').innerText(),/cached Home context/);
    assert.match(await p.locator('#project-detail').innerText(),/Profile unavailable/);
    assert.match(await p.locator('#log').innerText(),/live unavailable; cached snapshot/);
    await c.close();
  });
  await run('Stop aborts pending live reads without leaving stale result counters',async()=>{
    const c=await browser.newContext({reducedMotion:'reduce'});const p=await c.newPage();
    await p.route('https://**/*',()=>{});
    await p.goto(`${base}/preview/`);await p.locator('#demo-tour').click();await waitComplete(p);
    assert.equal(await p.locator('#scanned-count').textContent(),'6');
    await p.locator('#mode-live').click();await p.locator('#crawl').click();
    await p.waitForFunction(()=>document.querySelector('#scan-status').textContent==='Reading public sources');
    await p.locator('#stop').click();await p.waitForFunction(()=>document.querySelector('#scan-status').textContent.includes('Stopped'));
    assert.equal(await p.locator('#scanned-count').textContent(),'0');
    assert.equal(await p.locator('#crawl').isEnabled(),true);await c.close();
  });
  await run('Successful live response path uses public schemas and preserves historical observation times',async()=>{
    const c=await browser.newContext({reducedMotion:'reduce'});const p=await c.newPage();
    await p.route('https://claus.si/**',async r=>{
      const u=new URL(r.request().url());let body;
      if(u.pathname==='/api/network-context') body=snapshot.context;
      else if(u.pathname==='/api/network-activity') body=snapshot.activity;
      else if(u.searchParams.has('project')) {
        const profile=snapshot.profiles[u.searchParams.get('project')];
        body={...profile,agents:[],services:[],results:[],releases:snapshot.graph.resources.filter(n=>n.projectId===profile.projectId&&n.kind==='interface')};
      } else body=u.searchParams.get('view')==='projects'?snapshot.overview:snapshot.graph;
      await r.fulfill({status:200,contentType:'application/json',headers:{'Access-Control-Allow-Origin':'*'},body:JSON.stringify(body)});
    });
    await p.goto(`${base}/preview/`);await p.locator('#mode-live').click();await p.locator('#project-query').fill('agent-blackbox');await p.locator('#crawl').click();await waitComplete(p);
    assert.match(await p.locator('#source-note').textContent(),/Live public data/);
    assert.match(await p.locator('#project-detail').innerText(),/Activity: live, 14 Oct 2026/);
    assert.match(await p.locator('#project-detail').innerText(),/Profile: live/);
    await c.close();
  });
  await run('Opaque-origin static sandbox runs the complete cached demo',async()=>{
    const c=await browser.newContext({reducedMotion:'reduce'});const p=await c.newPage();const exceptions=[];p.on('pageerror',e=>exceptions.push(e.message));
    await p.goto(`${base}/sandbox/`);await p.locator('#demo-tour').click();await waitComplete(p);
    assert.equal(await p.locator('#scanned-count').textContent(),'6');assert.deepEqual(exceptions,[]);
    const denied = await p.evaluate(()=>{try { localStorage.getItem('anything');return false; } catch { return true; }});assert.equal(denied,true);
    await c.close();
  });
  await run('WebKit keyboard project crawl and mobile layout',async()=>{
    const b=await webkit.launch({headless:true,timeout:15000});browsers.push(b);const p=await b.newPage({viewport:{width:390,height:844}});
    await p.goto(`${base}/preview/`);await p.locator('#project-query').fill('agent-blackbox');await p.locator('#project-query').press('Enter');await waitComplete(p);
    assert.equal(await p.locator('#scanned-count').textContent(),'1');assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
    await p.screenshot({path:`${out}/webkit-mobile.png`,fullPage:true});await b.close();
  });
  assert.deepEqual(errors,[]);
} finally {
  await Promise.all(browsers.map(b=>b.close()));await new Promise(resolve=>server.close(resolve));
  await import('node:fs/promises').then(fs=>fs.writeFile(`${out}/results.json`,JSON.stringify(outcomes,null,2)));
}
if (outcomes.some(o=>o.status==='fail')) process.exitCode=1;
console.log(`${outcomes.filter(o=>o.status==='pass').length}/${outcomes.length} interaction checks passed`);
