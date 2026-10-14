import { createServer } from 'node:http';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve, extname } from 'node:path';
import { pathToFileURL } from 'node:url';
import assert from 'node:assert/strict';
const {chromium,webkit}=await import(process.env.IMD_PLAYWRIGHT?pathToFileURL(process.env.IMD_PLAYWRIGHT).href:'playwright');
const snapshot=JSON.parse(await readFile('src/data/snapshot.json','utf8'));
const out='test/scratch/interactions';await mkdir(out,{recursive:true});
const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml'};
const server=createServer(async(req,res)=>{
 const u=new URL(req.url,'http://localhost');const prefix=u.pathname.startsWith('/sandbox/')?'/sandbox/':'/preview/';
 const name=decodeURIComponent(u.pathname.slice(prefix.length))||'index.html';const path=resolve('dist',name);
 if(!u.pathname.startsWith(prefix)||!path.startsWith(resolve('dist')+'/')){res.writeHead(404).end();return;}
 try{const headers={'Content-Type':types[extname(path)]||'application/octet-stream'};
 if(prefix==='/sandbox/')headers['Content-Security-Policy']="sandbox allow-scripts allow-downloads allow-popups allow-popups-to-escape-sandbox; default-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src data:; connect-src https://claus.si https://claus-network-api.vercel.app; form-action 'none'; base-uri 'none'";
 res.writeHead(200,headers).end(await readFile(path));}catch{res.writeHead(404).end();}
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const base=`http://127.0.0.1:${server.address().port}`;
const outcomes=[],browsers=[];
async function check(name,fn){try{await fn();outcomes.push({name,status:'pass'});console.log('PASS '+name);}catch(e){outcomes.push({name,status:'fail',error:e.stack});console.error('FAIL '+name+': '+e.message);}}
async function mockSources(p){
 await p.route(/^https:\/\/(claus.si|claus-network-api.vercel.app)\//,async route=>{
  const u=new URL(route.request().url());let body;
  if(u.pathname==='/api/network-context')body=snapshot.context;
  else if(u.pathname==='/api/network-activity')body=snapshot.activity;
  else if(u.searchParams.has('project')||u.pathname.includes('/v1/public/projects/')){const slug=u.searchParams.get('project')||u.pathname.split('/').pop();body=snapshot.profiles[slug]?.raw;}
  else body=u.searchParams.get('view')==='projects'?snapshot.overview:snapshot.graph;
  await route.fulfill({status:body?200:404,contentType:'application/json',headers:{'Access-Control-Allow-Origin':'*'},body:JSON.stringify(body||{})});
 });
}
const browser=await chromium.launch({headless:true});browsers.push(browser);const context=await browser.newContext({viewport:{width:1440,height:1000}});const page=await context.newPage();
const errors=[],externalRequests=[],resourceErrors=[],consoleErrors=[];page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.url().startsWith(base)&&r.status()>=400)resourceErrors.push(r.url());});page.on('console',m=>{if(m.type()==='error')consoleErrors.push(m.text());});page.on('request',r=>{if(!r.url().startsWith(base))externalRequests.push(r.url());});
const go=async(hash='overview',p=page)=>{await p.goto(`${base}/preview/#${hash}`);await p.reload();await p.locator('h1').waitFor();};
try{
 await check('Production export loads at a subpath, with no remote requests by default',async()=>{
  await go();assert.equal(await page.title(),'Overview · Claus Crawl');assert.equal(externalRequests.length,0);assert.deepEqual(errors,[]);
  assert.equal(await page.locator('.metrics strong').first().innerText(),'9\nin this observation');
  assert.equal(await page.locator('form').count(),0);assert.equal(await page.locator('link[rel="icon"]').getAttribute('href'),'./logo.svg');
  await page.screenshot({path:`${out}/desktop-overview.png`,fullPage:true});
 });
 await check('Keyboard search finds a Claus project and opens its dedicated intelligence page',async()=>{
  await page.locator('#project-query').fill('AGENT-BLACKBOX');await page.locator('#project-query').press('Enter');
  await page.waitForURL('**/#directory');await page.locator('.directory-list').waitFor();assert.equal(await page.locator('.directory-list .project-row').count(),1);
  await page.locator('.directory-list .project-row').press('Enter');await page.waitForURL('**/#project=agent-blackbox');await page.locator('.project-heading h1').waitFor();
  assert.equal(await page.locator('h1').innerText(),'Agent Blackbox');assert.match(await page.locator('.project-facts').innerText(),/prj_d745c198/);
  assert.equal(await page.getByRole('link',{name:'Open on Claus',exact:false}).getAttribute('href'),'https://claus.si/c/agent-blackbox');
  assert.equal(await page.getByRole('link',{name:'Open website release',exact:false}).count(),1);
  assert.match(await page.locator('#main').innerText(),/Creator identity and owner wallet are not provided/);
  await page.screenshot({path:`${out}/desktop-project.png`,fullPage:true});
 });
 await check('Directory handles unmatched input, arbitrary addresses, clear and Escape',async()=>{
  await go('directory');await page.locator('#project-query').fill('0x96126Cd68400b80EB1cd1FC51A639B60BD732Fd6');
  assert.equal(await page.locator('.directory-list .project-row').count(),0);assert.match(await page.locator('.empty-state').innerText(),/No Claus projects match/);
  await page.getByRole('button',{name:'Clear search & filters'}).click();assert.equal(await page.locator('#project-query').inputValue(),'');
  assert.match(await page.locator('.result-count').innerText(),/32 matching/);
  await page.locator('#project-query').fill('not-a-claus-project');await page.locator('#project-query').press('Escape');assert.equal(await page.locator('#project-query').inputValue(),'');
 });
 await check('Scope, sorting and pagination expose the complete registry without inventing records',async()=>{
  await go('directory');await page.locator('[data-scope="all"]').click();assert.equal(await page.locator('.directory-list .project-row').count(),12);
  await page.locator('#sort').selectOption('name');const first=await page.locator('.project-label strong').first().innerText();assert.equal(first,'$ARCADE');
  await page.getByRole('button',{name:'Next',exact:true}).click();assert.match(await page.locator('.pagination').innerText(),/Page 2 of 3/);
  await page.getByRole('button',{name:'Next',exact:true}).click();assert.equal(await page.locator('.directory-list .project-row').count(),8);
  await page.locator('[data-scope="home"]').click();assert.equal(await page.locator('.directory-list .project-row').count(),9);
 });
 await check('Activity filtering preserves exact returned event counts and evidence links',async()=>{
  await go('activity');assert.equal(await page.locator('.event-row').count(),29);
  await page.locator('#event-kind').selectOption('interface.created');assert.equal(await page.locator('.event-row').count(),snapshot.activity.events.filter(e=>e.kind==='interface.created').length);
  assert.match(await page.locator('.event-list').innerText(),/Website release/);
  await page.locator('#event-kind').selectOption('project.updated');assert.equal(await page.locator('.event-row').count(),1);
 });
 await check('Verified deployment evidence links to the correct chain and quotes attributed caveats',async()=>{
  await go('project=claus-balance-lens');const body=await page.locator('#main').innerText();assert.match(body,/Ethereum Sepolia/);assert.match(body,/Not reverified on chain/);
  const href=await page.locator('.deployment>a').first().getAttribute('href');assert(href.startsWith('https://sepolia.etherscan.io/address/'));
  assert(await page.locator('.finding').count()>0);assert.match(body,/High confidence in attribution/);
 });
 await check('Agent findings distinguish hypotheses from evidence and expose actual empty log state',async()=>{
  await go('agents');assert.equal(await page.locator('.agent').count(),7);assert.match(await page.locator('.crawl-log').innerText(),/No refresh started/);
  assert.match(await page.locator('.finding').first().innerText(),/Hypothesis/);assert.match(await page.locator('.finding').first().innerText(),/not evidence of impersonation/);
  assert.match(await page.locator('.notice').innerText(),/no background service is connected/);
 });
 await check('JSON evidence export contains source clocks, project IDs and attributed findings',async()=>{
  await go('project=claus-balance-lens');const pending=page.waitForEvent('download');await page.getByRole('button',{name:'Export evidence'}).click();const download=await pending;
  const report=JSON.parse(await readFile(await download.path(),'utf8'));assert.equal(report.schema,'claus-crawl-observations/2');assert.equal(report.projects.length,1);
  assert.equal(report.projects[0].slug,'claus-balance-lens');assert.equal(report.sources.activity.mode,'cached');assert(report.findings.every(f=>f.sources.length&&f.observedAt));
 });
 await check('Tip jar copies the exact full address without connecting or initiating a transaction',async()=>{
  await context.grantPermissions(['clipboard-read','clipboard-write']);await go('support');
  const address='0x96126Cd68400b80EB1cd1FC51A639B60BD732Fd6';assert.equal(await page.locator('#tip-address').inputValue(),address);
  await page.getByRole('button',{name:'Copy Address'}).click();await page.waitForFunction(()=>document.querySelector('#copy-status').textContent.startsWith('Address copied'));
  assert.equal(await page.evaluate(()=>navigator.clipboard.readText()),address);assert.equal(await page.locator('#main select').count(),0);
  assert.match(await page.locator('.network-warning').innerText(),/Supported receiving networks have not been verified/);
  assert.equal(await page.locator('img[src="./support-qr.svg"]').evaluate(e=>e.naturalWidth>0),true);
 });
 await check('Malformed and unknown deep links have a recoverable static route',async()=>{
  await go('project=%');assert.match(await page.locator('h1').innerText(),/Project not in this observation/);
  await go('project=unknown-claus-project');assert.match(await page.locator('#main').innerText(),/Refresh sources/);
  await go('unknown-route');assert.match(await page.locator('h1').innerText(),/Every Claus launch/);
 });
 await check('320, 390, 760 and 1440 layouts reflow on every route; mobile first screen includes the main action',async()=>{
  for(const width of [320,390,760,1440]){
   await page.setViewportSize({width,height:844});
   for(const route of ['overview','directory','activity','agents','sources','support','project=claus-balance-lens']){
    await go(route);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,`${route} overflow at ${width}`);
   }
   await go();if(width===390){const box=await page.locator('[data-action="search"]').boundingBox();assert(box.y+box.height<844);await page.screenshot({path:`${out}/mobile-390.png`});}
   if(width===320)await page.screenshot({path:`${out}/mobile-320.png`});
  }
 });
 await check('Keyboard skip link, visible focus and route heading focus work',async()=>{
  await page.setViewportSize({width:390,height:844});await go();await page.keyboard.press('Tab');assert.equal(await page.evaluate(()=>document.activeElement.className),'skip-link');
  await page.keyboard.press('Enter');await page.locator('#project-query').focus();await page.keyboard.press('Tab');assert.equal(await page.evaluate(()=>document.activeElement.dataset.action),'search');
  assert.equal(await page.locator('[data-action="search"]').evaluate(e=>getComputedStyle(e).outlineWidth),'2px');await page.screenshot({path:`${out}/mobile-focus.png`});
  await page.keyboard.press('Enter');await page.waitForURL('**/#directory');await page.locator('.directory-list').waitFor();assert.equal(await page.evaluate(()=>document.activeElement.tagName),'H1');
 });
 await check('Live success uses verified public paths and source observation clocks (mocked provider)',async()=>{
  const c=await browser.newContext();const p=await c.newPage();await mockSources(p);await go('sources',p);await p.getByRole('button',{name:'Refresh sources'}).click();
  await p.waitForFunction(()=>document.querySelector('.feedback').textContent.startsWith('Public sources refreshed'));
  assert.equal(await p.locator('.source-row p').filter({hasText:'Live read'}).count(),4);
  assert.match(await p.locator('.source-row').nth(2).innerText(),/14 Oct 2026/);
  await p.goto(`${base}/preview/#project=agent-blackbox`);await p.getByRole('button',{name:'Refresh project'}).click();await p.waitForFunction(()=>document.querySelector('.feedback').textContent.startsWith('Public profile refreshed'));
  assert.match(await p.locator('.section-note').first().innerText(),/Live read/);
  await p.locator('.back-link').click();await p.goto(`${base}/preview/#project=agent-blackbox`);await p.reload(); // full reload intentionally returns recorded snapshot
  assert.match(await p.locator('.section-note').first().innerText(),/Recorded/);await c.close();
 });
 await check('Unavailable live sources visibly retain dated records and provide retry',async()=>{
  const c=await browser.newContext();const p=await c.newPage();await p.route(/^https:\/\//,r=>r.abort());await go('sources',p);
  await p.getByRole('button',{name:'Refresh sources'}).click();await p.waitForFunction(()=>document.querySelector('.feedback').textContent.startsWith('0/4 sources refreshed'));
  assert.equal(await p.locator('.source-row p').filter({hasText:'Recorded'}).count(),4);assert.match(await p.locator('.source-list').innerText(),/Live read unavailable/);
  await p.goto(`${base}/preview/#project=agent-blackbox`);await p.getByRole('button',{name:'Refresh project'}).click();await p.waitForFunction(()=>document.querySelector('.feedback').textContent.startsWith('Live profile unavailable'));
  assert.equal(await p.getByRole('button',{name:'Refresh project'}).isEnabled(),true);await c.close();
 });
 await check('Stop cancels pending reads, preserves observations and reduced motion suppresses spinning',async()=>{
  const c=await browser.newContext({reducedMotion:'reduce'});const p=await c.newPage();await p.route(/^https:\/\//,()=>{});await go('agents',p);
  await p.getByRole('button',{name:'Refresh sources'}).click();await p.getByRole('button',{name:'Stop',exact:true}).waitFor();
  assert.equal(await p.evaluate(()=>document.getAnimations().filter(a=>a.playState==='running').length),0);
  await p.getByRole('button',{name:'Stop',exact:true}).click();await p.waitForFunction(()=>document.querySelector('.feedback').textContent.startsWith('Refresh stopped'));
  assert.equal(await p.getByRole('button',{name:'Refresh sources'}).isEnabled(),true);await c.close();
 });
 await check('Malformed API data falls back without breaking the directory or executing source markup',async()=>{
  const c=await browser.newContext();const p=await c.newPage();await p.route(/^https:\/\//,r=>r.fulfill({contentType:'application/json',body:'{"nodes":"bad","events":"bad"}'}));await go('sources',p);
  await p.getByRole('button',{name:'Refresh sources'}).click();await p.waitForFunction(()=>document.querySelector('.feedback').textContent.startsWith('0/4'));
  await p.locator('a[data-nav="directory"]').click();await p.locator('.directory-list').waitFor();assert.equal(await p.locator('.directory-list .project-row').count(),9);await c.close();
 });
 await check('Opaque-origin Claus sandbox runs, routes and offers manual-copy fallback without storage',async()=>{
  const c=await browser.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const exceptions=[];p.on('pageerror',e=>exceptions.push(e.message));
  await p.goto(`${base}/sandbox/#support`);assert.equal(await p.locator('#tip-address').inputValue(),'0x96126Cd68400b80EB1cd1FC51A639B60BD732Fd6');
  await p.getByRole('button',{name:'Copy Address'}).click();await p.waitForFunction(()=>/Address copied|Address selected/.test(document.querySelector('#copy-status').textContent));
  assert.equal(await p.evaluate(()=>{try{localStorage.getItem('anything');return false;}catch{return true;}}),true);
  await p.locator('a[data-nav="directory"]').click();await p.locator('.directory-list').waitFor();assert.equal(await p.locator('.directory-list .project-row').count(),9);assert.deepEqual(exceptions,[]);await c.close();
 });
 await check('200% text enlargement retains search and support address without horizontal overflow',async()=>{
  await page.setViewportSize({width:760,height:1000});
  for(const route of ['overview','support','project=claus-balance-lens']){
   await go(route);await page.addStyleTag({content:'html {font-size:200% !important}'});
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,route);
  }
 });
 await check('WebKit mobile search, project routing and support copy fallback work',async()=>{
  const b=await webkit.launch({headless:true,timeout:15000,...(process.env.IMD_WEBKIT_EXECUTABLE?{executablePath:process.env.IMD_WEBKIT_EXECUTABLE}:{})});browsers.push(b);const p=await b.newPage({viewport:{width:390,height:844}});const exceptions=[];p.on('pageerror',e=>exceptions.push(e.message));
  await go('overview',p);await p.locator('#project-query').fill('agent-blackbox');await p.locator('#project-query').press('Enter');await p.waitForURL('**/#directory');
  assert.equal(await p.locator('.directory-list .project-row').count(),1);await p.locator('.directory-list .project-row').click();await p.locator('.project-heading h1').waitFor();assert.equal(await p.locator('h1').innerText(),'Agent Blackbox');
  await p.locator('a.support-nav').click();await p.locator('#tip-address').waitFor();await p.getByRole('button',{name:'Copy Address'}).click();await p.waitForFunction(()=>/Address copied|Address selected/.test(document.querySelector('#copy-status').textContent));
  assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);assert.deepEqual(exceptions,[]);await p.screenshot({path:`${out}/webkit-support.png`,fullPage:true});await b.close();
 });
 assert.deepEqual(errors,[]);assert.deepEqual(resourceErrors,[]);assert.deepEqual(consoleErrors,[]);
}finally{await Promise.all(browsers.map(b=>b.close()));await new Promise(r=>server.close(r));await writeFile(`${out}/results.json`,JSON.stringify(outcomes,null,2));}
console.log(`${outcomes.filter(o=>o.status==='pass').length}/${outcomes.length} interaction checks passed`);
if(outcomes.some(o=>o.status==='fail'))process.exitCode=1;
