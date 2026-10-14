/** Operator-run, read-only Claus monitor. Never runs inside the static browser bundle. */
import { mkdir, readFile, writeFile, rename, open, unlink } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { refreshDataset, getProfile, RateLimitError } from '../src/data.ts';
import { runAgents, uniqueEvents } from '../src/intelligence.ts';

export function updateHistory(previous, data, observedAt = Date.now()) {
  const firstSeen = { ...(previous?.firstSeen || {}) };
  if (data.sources.overview.mode === 'live') {
    for (const p of data.projects) firstSeen[p.id] ??= data.sources.overview.at;
  }
  const newFindings = runAgents(data, previous?.latest);
  const findings = [...new Map([...(previous?.findings || []), ...newFindings].map(f=>[f.id,f])).values()].slice(-10000);
  const events = [...new Map([...(previous?.events || []), ...uniqueEvents(data)].map(e=>[e.id,e])).values()].sort((a,b)=>a.at-b.at).slice(-10000);
  return {schema:'claus-crawl-monitor/1', observedAt, runs:(previous?.runs||0)+1, firstSeen, latest:data, events, findings,
    retention:{maxEvents:10000,maxFindings:10000}, monitoring:'operator-run; no public service implied'};
}
export async function readState(path) {
  try {
    const value=JSON.parse(await readFile(path,'utf8'));
    if(value.schema!=='claus-crawl-monitor/1'||!value.latest||!Array.isArray(value.events)||!Array.isArray(value.findings)||!Number.isInteger(value.runs)) throw new Error('Invalid monitor state; refusing to overwrite it');
    return value;
  } catch(e) {if(e.code==='ENOENT')return undefined;throw e;}
}
export async function writeState(path, state) {
  await mkdir(dirname(path),{recursive:true});
  const temporary=`${path}.next`;
  await writeFile(temporary,JSON.stringify(state)+'\n',{mode:0o600});
  await rename(temporary,path);
}
export async function collectOnce({statePath, signal = new AbortController().signal, collect=refreshDataset, profileLoader=getProfile, now=Date.now}) {
  const path=resolve(statePath);await mkdir(dirname(path),{recursive:true});
  let lock;
  try {lock=await open(`${path}.lock`,'wx',0o600);}
  catch(e) {if(e.code==='EEXIST')throw new Error('Monitor state is locked. Check the running process before removing a stale lock.');throw e;}
  try {
    const previous=await readState(path);const log=[];
    const data=await collect(signal,(message)=>log.push(message));
    // Retain the last successful observation per source, never relabel an old response as live.
    if(previous) {
      for(const key of ['overview','graph','activity','context']) if(data.sources[key].mode!=='live') {
        const old=previous.latest;
        if(key==='overview')data.projects=old.projects;else data[key]=old[key];
        data.sources[key]={...old.sources[key],mode:'cached',note:'Live read unavailable; retained previous observation'};
      }
      data.profiles=Object.fromEntries(Object.entries(previous.latest.profiles).map(([slug,profile])=>[slug,{...profile,mode:'cached'}]));
    }
    if(data.sources.overview.mode==='live') {
      // Sequential profile reads bound load. Project IDs, not names, define continuity.
      for(const project of data.projects.slice(0,100)) {
        if(signal.aborted)throw signal.reason || new Error('Stopped');
        const result=await profileLoader(project,true,data,signal);
        if(result.profile)data.profiles[project.slug]=result.profile;
        if(result.source.mode!=='live')log.push(`${project.slug}: recorded profile retained`);
      }
      if(data.projects.length>100)log.push('Profile read cap: first 100 projects only');
    }
    if(signal.aborted)throw signal.reason || new Error('Stopped');
    const state=updateHistory(previous,data,now());state.log=log;
    state.liveSources=Object.values(data.sources).filter(s=>s.mode==='live').length;
    await writeState(path,state);
    return state;
  } finally {await lock.close();await unlink(`${path}.lock`);}
}
export async function runSchedule(job,{intervalMs=300000,maxRuns=Infinity,signal=new AbortController().signal,sleep}={}) {
  if(!Number.isFinite(intervalMs)||intervalMs<1||maxRuns<1)throw new Error('Invalid schedule');
  const wait=sleep || ((ms)=>new Promise(resolve=>{const finish=()=>{clearTimeout(timer);signal.removeEventListener('abort',finish);resolve();};const timer=setTimeout(finish,ms);signal.addEventListener('abort',finish,{once:true});if(signal.aborted)finish();}));
  for(let i=0;i<maxRuns&&!signal.aborted;i++) {
    let delay=intervalMs;
    try {await job();}
    catch(e) {if(signal.aborted)break;if(e instanceof RateLimitError)delay=Math.max(delay,e.retryAt-Date.now());else delay=Math.max(intervalMs,60000);console.error(`Crawl failed: ${e.message}`);}
    if(i+1<maxRuns&&!signal.aborted)await wait(delay);
  }
}
async function cli() {
  const args=process.argv.slice(2);const option=name=>{const i=args.indexOf(name);return i>=0?args[i+1]:undefined;};
  const statePath=option('--state')||process.env.CLAUS_CRAWL_STATE;
  if(!statePath)throw new Error('Supply --state /absolute/path/outside/the/site/state.json or CLAUS_CRAWL_STATE');
  if(!statePath.startsWith('/'))throw new Error('State must use an absolute path');
  const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
  if(resolve(statePath).startsWith(root+'/'))throw new Error('Keep persistent state outside the repository and static export');
  const abort=new AbortController();process.once('SIGINT',()=>abort.abort());process.once('SIGTERM',()=>abort.abort());
  const job=async()=>{const result=await collectOnce({statePath,signal:abort.signal});console.log(JSON.stringify({observedAt:result.observedAt,runs:result.runs,liveSources:result.liveSources,retainedEvents:result.events.length,retainedFindings:result.findings.length}));};
  if(args.includes('--once'))await job();
  else {const interval=Number(option('--interval-ms')||300000);if(!Number.isFinite(interval)||interval<300000)throw new Error('Production polling must be at least 300000 ms');await runSchedule(job,{intervalMs:interval,signal:abort.signal});}
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))cli().catch(e=>{console.error(e.message);process.exitCode=1;});
