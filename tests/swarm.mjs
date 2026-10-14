import { createServer } from 'node:http';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve, extname } from 'node:path';
import { pathToFileURL } from 'node:url';
import assert from 'node:assert/strict';
const {chromium,webkit}=await import(process.env.IMD_PLAYWRIGHT?pathToFileURL(process.env.IMD_PLAYWRIGHT).href:'playwright');
const snapshot=JSON.parse(await readFile('src/data/snapshot.json','utf8'));
const out='test/scratch/swarm';await mkdir(out,{recursive:true});
const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml'};
const server=createServer(async(req,res)=>{
 const url=new URL(req.url,'http://localhost');const name=decodeURIComponent(url.pathname.replace(/^\/preview\//,''))||'index.html';const path=resolve('dist',name);
 if(!url.pathname.startsWith('/preview/')||!path.startsWith(resolve('dist')+'/')){res.writeHead(404).end();return;}
 try {res.writeHead(200,{'Content-Type':types[extname(path)]||'application/octet-stream'}).end(await readFile(path));}catch{res.writeHead(404).end();}
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const base=`http://127.0.0.1:${server.address().port}/preview/`;
const results=[];const browsers=[];
const check=async(name,fn)=>{try{await fn();results.push({name,status:'pass'});console.log('PASS '+name);}catch(e){results.push({name,status:'fail',error:e.stack});console.error('FAIL '+name+': '+e.message);}};
const position=page=>page.locator('.crawler-actor').evaluateAll(actors=>actors.map(a=>a.getAttribute('transform')));
const load=async(page,route='overview')=>{await page.goto(base+'#'+route);await page.locator('.swarm-panel').waitFor();await page.locator('.swarm-panel').scrollIntoViewIfNeeded();};
const settle=page=>page.waitForFunction(()=>document.querySelector('.swarm-panel')?.dataset.motion==='running');
async function response(route,overview=snapshot.overview){
 const url=new URL(route.request().url());
 const body=url.pathname==='/api/network-context'?snapshot.context:url.pathname==='/api/network-activity'?snapshot.activity:url.searchParams.get('view')==='projects'?overview:snapshot.graph;
 await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(body)});
}
try {
 const browser=await chromium.launch({headless:true});browsers.push(browser);
 const context=await browser.newContext({viewport:{width:1440,height:1000}});const page=await context.newPage();
 const errors=[],requests=[];page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(!r.url().startsWith(base))requests.push(r.url());});
 await check('Seven Claus octopuses visibly travel; first load makes no network calls',async()=>{
  await load(page);await settle(page);assert.equal(await page.locator('.crawler-actor').count(),7);
  const before=await position(page);await page.waitForTimeout(350);assert.notDeepEqual(await position(page),before);
  assert.match(await page.locator('.swarm-heading').innerText(),/Demo motion/);assert.equal(requests.length,0);
  await page.locator('.swarm-panel').screenshot({path:out+'/swarm-desktop.png'});
 });
 await check('Pause freezes movement and tentacles; resume and module selection work by keyboard',async()=>{
  await page.getByRole('button',{name:'Pause motion',exact:true}).focus();await page.keyboard.press('Enter');
  const before=await position(page);await page.waitForTimeout(200);assert.deepEqual(await position(page),before);
  assert.equal(await page.locator('.swarm-panel').evaluate(e=>e.getAnimations({subtree:true}).filter(a=>a.playState==='running').length),0);
  await page.locator('#follow-agent').selectOption('5');assert.match(await page.locator('#agent-caption').innerText(),/Evidence/);
  assert.equal(await page.locator('.crawler-actor.is-followed').getAttribute('data-agent'),'5');
  await page.getByRole('button',{name:'Resume motion'}).press('Enter');await page.waitForTimeout(200);assert.notDeepEqual(await position(page),before);
 });
 await check('Route changes clean up animation and retain the chosen agent and pause preference',async()=>{
  await page.getByRole('button',{name:'Pause motion',exact:true}).click();
  await page.locator('[data-nav="directory"]').click();assert.equal(await page.locator('.swarm-panel').count(),0);
  assert.equal(await page.evaluate(()=>document.getAnimations().filter(a=>a.playState==='running').length),0);
  await page.locator('[data-nav="agents"]').click();await page.locator('.swarm-panel').waitFor();
  assert.equal(await page.locator('#follow-agent').inputValue(),'5');assert.equal(await page.getByRole('button',{name:'Resume motion'}).count(),1);
  await page.getByRole('button',{name:'Resume motion'}).click();await settle(page);
 });
 await check('Finite recorded replay has real event times, project/evidence links and pause/restart controls',async()=>{
  await load(page);await page.clock.install();
  assert.equal(await page.locator('.terminal-entry').count(),2);
  const first=snapshot.activity.events.slice().sort((a,b)=>a.at-b.at||a.id.localeCompare(b.id))[0];
  assert.equal(await page.locator('.terminal-entry time').first().getAttribute('datetime'),new Date(first.at).toISOString());
  await page.getByRole('button',{name:'Replay records',exact:true}).click();await page.clock.runFor(1500);
  assert.equal(await page.locator('.terminal-entry').count(),3);
  await page.getByRole('button',{name:'Pause replay'}).click();await page.clock.runFor(3000);assert.equal(await page.locator('.terminal-entry').count(),3);
  await page.getByRole('button',{name:'Replay records',exact:true}).click();await page.clock.runFor(38000);
  assert.equal(await page.locator('.terminal-entry').count(),snapshot.activity.events.length);
  assert.match(await page.locator('.terminal-status').innerText(),/Replay complete/);
  await page.getByRole('button',{name:'Replay from start'}).click();await page.clock.runFor(1500);assert.equal(await page.locator('.terminal-entry').count(),1);
  await page.getByRole('button',{name:'Pause replay'}).click();assert.equal(requests.length,0);
  await page.locator('.terminal-entry a').first().click();await page.locator('.project-heading').waitFor();
 });
 await context.close();
 await check('Request progress streams before the slowest source finishes; Stop preserves observations',async()=>{
  const c=await browser.newContext();const p=await c.newPage();const pending=[];
  await p.route(/^https:\/\//,async route=>{if(new URL(route.request().url()).pathname==='/api/network-context')pending.push(route);else await response(route);});
  await load(p,'agents');await p.getByRole('button',{name:'Refresh sources',exact:true}).click();
  await p.locator('.terminal-feed').getByText(/overview: public response received/).waitFor();
  assert.equal(await p.getByRole('button',{name:'Stop',exact:true}).isVisible(),true);
  assert.match(await p.locator('.crawl-log').innerText(),/overview: public response received/);
  assert.equal(await p.locator('[data-source="context"]').getAttribute('data-state'),'reading');
  await p.getByRole('button',{name:'Stop',exact:true}).click();await p.waitForFunction(()=>document.querySelector('.feedback').textContent.startsWith('Refresh stopped'));
  assert.equal(await p.locator('[data-source="context"]').getAttribute('data-state'),'stopped');
  assert.equal(await p.evaluate(()=>document.activeElement.dataset.action),'refresh');
  assert.match(await p.locator('.terminal-feed').innerText(),/Previous observations retained/);
  for(const route of pending)await route.abort().catch(()=>{});await c.close();
 });
 await check('Successful refresh followed by failure retains the latest records and their original clocks',async()=>{
  const c=await browser.newContext();const p=await c.newPage();const overview=structuredClone(snapshot.overview);
  const project=overview.nodes.find(n=>n.kind==='project');project.label='Changed in browser test';if(project.presentation)project.presentation.name='Changed in browser test';
  overview.observedAt+=1000;
  await p.route(/^https:\/\//,route=>response(route,overview));await load(p);await p.getByRole('button',{name:'Refresh sources',exact:true}).click();
  await p.waitForFunction(()=>document.querySelector('.feedback').textContent.startsWith('Public sources refreshed'));
  assert.match(await p.locator('.terminal-feed').innerText(),/public response received/);
  await p.unroute(/^https:\/\//);await p.route(/^https:\/\//,route=>route.abort());
  await p.getByRole('button',{name:'Refresh sources',exact:true}).click();await p.waitForFunction(()=>document.querySelector('.feedback').textContent.startsWith('0/4'));
  assert.match(await p.locator('#top-source').innerText(),/view source dates/);
  await p.locator('[data-nav="sources"]').click();assert.equal(await p.locator('.source-row p').filter({hasText:'Recorded'}).count(),4);
  const [download]=await Promise.all([p.waitForEvent('download'),p.evaluate(()=>{location.hash='agents';}) .then(async()=>{await p.getByRole('button',{name:'Export observations'}).click();})]);
  const report=JSON.parse(await readFile(await download.path(),'utf8'));
  assert.equal(report.projects.find(p=>p.id===project.id).name,'Changed in browser test');
  assert.equal(report.sources.overview.at,overview.observedAt);assert.equal(report.sources.overview.mode,'cached');
  assert(report.log.some(line=>line.includes('live unavailable')));await c.close();
 });
 await check('Reduced motion disables travel and tentacle animations, including preference changes',async()=>{
  const c=await browser.newContext({reducedMotion:'reduce'});const p=await c.newPage();await load(p);
  assert.equal(await p.getByRole('button',{name:'Reduced motion'}).isDisabled(),true);
  const before=await position(p);await p.waitForTimeout(200);assert.deepEqual(await position(p),before);
  assert.equal(await p.evaluate(()=>document.getAnimations().filter(a=>a.playState==='running').length),0);
  await p.emulateMedia({reducedMotion:'no-preference'});await settle(p);await p.waitForTimeout(200);assert.notDeepEqual(await position(p),before);
  await p.emulateMedia({reducedMotion:'reduce'});await p.getByRole('button',{name:'Reduced motion'}).waitFor();
  const after=await position(p);await p.waitForTimeout(200);assert.deepEqual(await position(p),after);await c.close();
 });
 await check('Offscreen illustrations suspend animation and resume without a position jump',async()=>{
  const c=await browser.newContext({viewport:{width:1440,height:800}});const p=await c.newPage();await load(p);await settle(p);
  await p.locator('footer').scrollIntoViewIfNeeded();await p.waitForFunction(()=>document.querySelector('.swarm-panel').dataset.motion==='paused');
  const before=await position(p);await p.waitForTimeout(200);assert.deepEqual(await position(p),before);
  await p.locator('.swarm-panel').scrollIntoViewIfNeeded();await settle(p);await p.waitForTimeout(200);assert.notDeepEqual(await position(p),before);await c.close();
 });
 await check('Mobile has search and visible octopuses on the first screen; swarm controls reflow at 320/390/760/1440',async()=>{
  const c=await browser.newContext();const p=await c.newPage();
  for(const width of [320,390,760,1440]) {
   await p.setViewportSize({width,height:844});await p.goto(base);await p.locator('.swarm-panel').waitFor();
   assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
   if(width===390) {
    const search=await p.locator('[data-action="search"]').boundingBox();assert(search.y+search.height<844);
    const scene=await p.locator('.swarm-scene').boundingBox();assert(scene.y<800);
    await p.screenshot({path:out+'/mobile-first-screen.png'});
    await p.locator('.swarm-panel').screenshot({path:out+'/swarm-mobile.png'});
   }
   await p.locator('#follow-agent').selectOption('6');assert.match(await p.locator('#agent-caption').innerText(),/Activity/);
   await p.locator('[data-swarm="requests"]').click();assert.match(await p.locator('.terminal-feed').innerText(),/No refresh started/);
  }
  await c.close();
 });
 await check('WebKit moves and pauses the swarm, replays records and opens project intelligence at 390',async()=>{
  const b=await webkit.launch({headless:true,timeout:15000,...(process.env.IMD_WEBKIT_EXECUTABLE?{executablePath:process.env.IMD_WEBKIT_EXECUTABLE}:{})});browsers.push(b);
  const p=await b.newPage({viewport:{width:390,height:844}});await load(p);await settle(p);
  const before=await position(p);await p.waitForTimeout(250);assert.notDeepEqual(await position(p),before);
  await p.getByRole('button',{name:'Pause motion',exact:true}).click();const stopped=await position(p);await p.waitForTimeout(200);assert.deepEqual(await position(p),stopped);
  await p.getByRole('button',{name:'Replay records',exact:true}).click();await p.waitForFunction(()=>document.querySelectorAll('.terminal-entry').length>2);
  await p.getByRole('button',{name:'Pause replay'}).click();await p.locator('.swarm-panel').screenshot({path:out+'/swarm-webkit.png'});
  await p.locator('.terminal-entry a').first().click();await p.locator('.project-heading').waitFor();assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  await b.close();
 });
 assert.deepEqual(errors,[]);
} finally {await Promise.all(browsers.map(b=>b.close()));await new Promise(r=>server.close(r));await writeFile(out+'/results.json',JSON.stringify(results,null,2));}
console.log(`${results.filter(r=>r.status==='pass').length}/${results.length} swarm checks passed`);
if(results.some(r=>r.status==='fail'))process.exitCode=1;
