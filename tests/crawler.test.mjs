import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { cachedDataset } from '../src/data.ts';
import { collectOnce, updateHistory, runSchedule, readState } from '../server/crawler.mjs';
const fresh=()=>{const d=cachedDataset();for(const s of Object.values(d.sources))s.mode='live';return d;};
const profileLoader=async(p,live,d)=>({profile:d.profiles[p.slug],source:{mode:'live'}});
test('crawler persists, reloads and deduplicates events across two independent runs',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'claus-monitor-'));const path=join(dir,'state.json');
 try {
  const options={statePath:path,collect:async()=>fresh(),profileLoader};
  const first=await collectOnce(options);const second=await collectOnce(options);
  assert.equal(first.runs,1);assert.equal(second.runs,2);assert.equal(second.events.length,first.events.length);
  assert.equal(Object.keys(second.firstSeen).length,32);assert.equal((await readState(path)).runs,2);
  assert.equal(second.findings.filter(f=>f.agent==='launch').length,0);
 } finally {await rm(dir,{recursive:true,force:true});}
});
test('failed reads retain last observations without pretending they are live or new',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'claus-monitor-'));const statePath=join(dir,'state.json');
 try {
  const live=fresh();live.projects[0].name='Last successful observation';
  await collectOnce({statePath,collect:async()=>live,profileLoader});
  const result=await collectOnce({statePath,collect:async()=>cachedDataset(),profileLoader});
  assert.equal(result.latest.projects[0].name,'Last successful observation');assert.equal(result.liveSources,0);
  assert.equal(result.latest.sources.overview.mode,'cached');assert.equal(result.findings.filter(f=>f.agent==='metadata').length,0);
 } finally {await rm(dir,{recursive:true,force:true});}
});
test('persistent monitor records changed metadata with sources, baseline and timestamp',()=>{
 const original=updateHistory(undefined,fresh(),1000);const changed=fresh();changed.projects[0].description='Updated description';changed.sources.overview.at+=1000;
 const result=updateHistory(original,changed,2000);const finding=result.findings.find(f=>f.agent==='metadata');
 assert(finding);assert.match(finding.explanation,/Compared with the observation/);assert.equal(finding.observedAt,changed.sources.overview.at);
 assert.equal(finding.sources[0],changed.sources.overview.url);
});
test('malformed state and concurrent lock fail closed without overwriting history',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'claus-monitor-'));const statePath=join(dir,'state.json');
 try {
  await writeFile(statePath,'{invalid');await assert.rejects(collectOnce({statePath,collect:async()=>fresh(),profileLoader}));
  assert.equal(await readFile(statePath,'utf8'),'{invalid');await writeFile(statePath+'.lock','');
  await assert.rejects(collectOnce({statePath,collect:async()=>fresh(),profileLoader}),/locked/);
 } finally {await rm(dir,{recursive:true,force:true});}
});
test('scheduler performs repeated nonoverlapping jobs with a short actual interval',async()=>{
 let active=0,max=0,calls=0;const started=Date.now();
 await runSchedule(async()=>{active++;max=Math.max(max,active);calls++;await new Promise(r=>setTimeout(r,2));active--;},{intervalMs:10,maxRuns:3});
 assert.equal(calls,3);assert.equal(max,1);assert(Date.now()-started>=20);
});
test('aborted scheduler exits without another run',async()=>{
 const abort=new AbortController();let calls=0;
 await runSchedule(async()=>{calls++;abort.abort();},{intervalMs:10,maxRuns:5,signal:abort.signal});
 assert.equal(calls,1);
});
