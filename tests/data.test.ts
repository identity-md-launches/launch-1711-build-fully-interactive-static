import test from 'node:test';
import assert from 'node:assert/strict';
import { cachedDataset, filterProjects, assess, parseGraph, parseActivity, parseProfile, validSlug, escapeHTML, loadGraph, loadContext, publicJSON, parseReleases, releaseURL } from '../src/data.ts';

import { activityDays, similarityFindings, publishedRiskNotes, changeFindings, verifiedDeployments, verifiedRelationships, launches, runAgents } from '../src/intelligence.ts';

const dataset = cachedDataset();
test('recorded snapshot contains real Claus records and valid project-only slugs', () => {
  assert.equal(dataset.projects.length,32);
  assert.equal(dataset.context.projects.length,9);
  assert.equal(dataset.profiles['agent-blackbox'].counts.releases,1);
  assert(dataset.projects.every(p => validSlug(p.slug)));
  assert(!validSlug('https://evil.test/anything'));
  assert(!validSlug('../project'));
  assert(!validSlug('a'.repeat(64)));
});
test('search works across slug, name and public description', () => {
  assert.equal(filterProjects(dataset.projects,'AGENT-BLACKBOX')[0].slug,'agent-blackbox');
  assert(filterProjects(dataset.projects,'prediction').some(p => p.slug === 'claus-up-down'));
  assert.equal(filterProjects(dataset.projects,'no-such-project-994').length,0);
});
test('cached timestamps drive the verdict and missing events do not imply inactivity', () => {
  const project = dataset.projects.find(p => p.slug === 'agent-blackbox')!;
  const profile = dataset.profiles[project.slug];
  const source = { mode:'cached' as const, at:profile.capturedAt, complete:true, url:profile.source };
  const result = assess(project,profile,source,dataset);
  assert.equal(result.events.length,2);
  assert.equal(result.signal,'Recent public activity');
  const quiet = structuredClone(dataset); quiet.activity.events=[];
  assert.equal(assess(project,profile,source,quiet).signal,'Recently updated');
  const old = { ...source, at:profile.capturedAt+30*86400000 };
  assert.equal(assess(project,profile,old,quiet).signal,'Older public record');
  const absent = { ...project, updatedAt:null };
  assert.equal(assess(absent,undefined,old,quiet).signal,'Limited public data');
});
test('malformed public responses are rejected and source text is escaped', () => {
  assert.throws(() => parseGraph({ nodes:[],edges:'unexpected' }));
  assert.throws(() => parseActivity({ events:[], observedAt:'today' }));
  assert.throws(() => parseProfile({ slug:'other' },'agent-blackbox','https://claus.si'));
  assert.equal(escapeHTML('<img src=x onerror="alert(1)">'),'&lt;img src=x onerror=&quot;alert(1)&quot;&gt;');
});
test('graph pagination retains query, deduplicates nodes and omits credentials', async () => {
  const requests: { url:string; init?:RequestInit }[]=[];
  const original = globalThis.fetch;
  globalThis.fetch = async (input,init) => {
    const url = String(input); requests.push({url,init});
    const second = url.includes('after=next-page');
    return new Response(JSON.stringify({ nodes: [{id:'claus',kind:'coordinator'}, { id:second?'b':'a',kind:'project',slug:second?'claus-up-down':'agent-blackbox' }], edges:[],resources:[], nextCursor:second?null:'next-page', observedAt:1000 }));
  };
  try {
    const response = await loadGraph('projects',new AbortController().signal);
    assert.equal(response.graph.nodes.length,3); assert.equal(response.source.complete,true);
    assert.equal(requests.length,2);
    assert(requests[1].url.includes('view=projects&after=next-page'));
    assert(requests.every(r => r.init?.credentials === 'omit' && r.init?.redirect === 'error'));
  } finally { globalThis.fetch = original; }
});
test('repeated graph cursor is disclosed as incomplete, not an endless request loop', async () => {
  const original = globalThis.fetch; let calls=0;
  globalThis.fetch = async () => { calls++; return new Response(JSON.stringify({ nodes:[],edges:[],nextCursor:'same',observedAt:1000 })); };
  try { const response = await loadGraph('full',new AbortController().signal); assert.equal(response.source.complete,false); assert.equal(calls,2); }
  finally { globalThis.fetch = original; }
});
test('context pagination follows after=SLUG and preserves incomplete coverage', async () => {
  const original = globalThis.fetch; const requests:string[]=[];
  globalThis.fetch = async input => {
    const url = String(input); requests.push(url); const second = url.includes('after=agent-blackbox');
    return new Response(JSON.stringify({ observedAt:1000,projects:[{id:second?'b':'a',slug:second?'claus-up-down':'agent-blackbox'}],graphComplete:true,detailsComplete:!second,nextCursor:second?null:'agent-blackbox',scope:'Home' }));
  };
  try { const response = await loadContext(new AbortController().signal); assert.equal(response.context.projects.length,2); assert.equal(response.source.complete,false); assert.equal(requests.length,2); }
  finally { globalThis.fetch = original; }
});
test('public reads reject undeclared origins before fetching', async () => {
  await assert.rejects(publicJSON('https://example.com/private',new AbortController().signal),/not declared/);
});

test('partial graph pages survive a later provider failure with incomplete coverage', async () => {
  const original = globalThis.fetch; let calls=0;
  globalThis.fetch = async input => { calls++; if(String(input).includes('after=')) throw new Error('provider unavailable'); return new Response(JSON.stringify({nodes:[{id:'claus',kind:'coordinator'}],edges:[],nextCursor:'next-page',observedAt:1000})); };
  try { const response = await loadGraph('full',new AbortController().signal);assert.equal(response.graph.nodes.length,1);assert.equal(response.source.complete,false);assert.equal(calls,3); }
  finally { globalThis.fetch = original; }
});
test('malformed optional project text cannot become executable markup or break search',()=>{
  const graph=parseGraph({nodes:[{id:'a',kind:'project',slug:'agent-blackbox',label:{unsafe:'value'},presentation:{name:42}}],edges:[],nextCursor:null});
  assert.equal(graph.nodes[0].label,undefined);assert.equal(graph.nodes[0].presentation?.name,undefined);
});

test('profile releases validate source, ID correspondence and deduplicate immutable releases', () => {
  const raw={id:'sha256:'+'a'.repeat(64),url:'https://claus-network-sites.vercel.app/r/'+'a'.repeat(64)+'/index.html',createdAt:1000,expiresAt:null};
  assert.equal(parseReleases([raw,raw]).length,1);
  assert.equal(parseReleases([{...raw,url:'javascript:alert(1)'},{...raw,url:raw.url.replace('/r/a','/r/b')},{...raw,createdAt:-1}]).length,0);
  assert.equal(releaseURL('https://evil.test/r/'+'a'.repeat(64)+'/index.html'),null);
  assert.equal(releaseURL('https://claus-network-sites.vercel.app/r/'+'a'.repeat(64)+'/index.html?redirect=evil'),null);
});
test('activity rejects invalid clocks, deduplicates IDs and ignores future events',()=>{
  const event={id:'event',projectId:'p',project:'Claus project',kind:'project.published',at:900,href:'/c/project'};
  const parsed=parseActivity({observedAt:1000,complete:true,events:[event,event,{...event,id:'future',at:1001},{id:'bad',at:'today'}]});
  assert.equal(parsed.events.length,1);
  assert.throws(()=>parseActivity({observedAt:0,complete:true,events:[]}));
});
test('launches only use reported profile publication events, never website releases or updatedAt',()=>{
  const result=launches(dataset);assert(result.length>0);assert(result.every(x=>x.event.kind==='project.published'));
  const noPublications=structuredClone(dataset);noPublications.activity.events=noPublications.activity.events.filter(e=>e.kind!=='project.published');
  assert.equal(launches(noPublications).length,0);
});
test('trend calculations count unique returned events, bounded by the source clock',()=>{
  const changed=structuredClone(dataset);changed.activity.events.push(changed.activity.events[0]);
  const days=activityDays(changed);
  assert.equal(days.length,7);assert.equal(days.reduce((n,d)=>n+d.total,0),29);
  assert.equal(days.reduce((n,d)=>n+d.publications+d.updates,0),29);
});
test('duplicate name detection is explicitly uncertain and never asserts shared ownership',()=>{
  const input=structuredClone(dataset);input.projects=[{...input.projects[0],name:'Same Name'},{...input.projects[1],name:'  SAME  NAME '}];
  const findings=similarityFindings(input);assert.equal(findings.length,1);
  assert.equal(findings[0].kind,'hypothesis');assert.equal(findings[0].confidence,'low');assert.equal(findings[0].sources.length,2);
  assert.match(findings[0].explanation,/not evidence of impersonation, shared ownership/);
  input.projects[1].name='Some Other Name';assert.equal(similarityFindings(input).length,0);
});
test('risk notes quote only explicitly published, timestamped caveats with provenance',()=>{
  const profile=structuredClone(dataset.profiles['claus-balance-lens']);
  const findings=publishedRiskNotes(profile);assert(findings.length>0);
  assert(findings.every(f=>f.sources[0]===profile.source&&f.kind==='observation'&&f.confidence==='high'));
  assert.deepEqual(publishedRiskNotes(undefined),[]);
  profile.evidence!.decisions=[{id:'invalid',risks:['unsupported claim'],completedAt:'not a date'},{risks:['future'],completedAt:new Date(profile.capturedAt+86400000).toISOString()}];
  assert.deepEqual(publishedRiskNotes(profile),[]);
});
test('unknown evidence never becomes a zero-risk score or a verified deployment',()=>{
  const profile={...dataset.profiles['agent-blackbox'],evidence:{reviews:[],decisions:[],deployments:[{address:'0x'+'1'.repeat(40),chainId:1,verification:'unverified'},{address:'javascript:evil',chainId:1,verification:'verified'}]}};
  assert.deepEqual(verifiedDeployments(profile),[]);assert.deepEqual(publishedRiskNotes(profile),[]);
  const real=verifiedDeployments(dataset.profiles['claus-balance-lens']);assert(real.length>0);
  assert(real.every(d=>d.chainId===11155111&&d.url.startsWith('https://sepolia.etherscan.io/address/')));
});
test('metadata comparisons require live observations and do not infer deletion from absence',()=>{
  const next=structuredClone(dataset);next.projects[0].name='Changed name';
  assert.equal(changeFindings(next,dataset).length,0);
  next.sources.overview.mode='live';assert.equal(changeFindings(next,dataset).length,1);assert.deepEqual(changeFindings(next,dataset)[0].changes,[{field:'name',before:dataset.projects[0].name,after:'Changed name'}]);
  next.projects=[];assert.equal(changeFindings(next,dataset).length,0);
  assert.deepEqual(changeFindings(next),[]);
});
test('a newly observed project is not represented as newly created',()=>{
  const before=structuredClone(dataset);before.projects=before.projects.slice(1);
  const next=structuredClone(dataset);next.sources.overview.mode='live';
  const finding=changeFindings(next,before)[0];assert.equal(finding.title,'First observed in this crawler');assert.match(finding.explanation,/does not establish.*creation time/);
});
test('relationship module excludes shared coordinator edges as ownership evidence',()=>{
  const p=dataset.projects.find(p=>p.slug==='agent-blackbox')!;
  assert.deepEqual(verifiedRelationships(dataset,p),[]);
  assert(runAgents(dataset).every(f=>f.sources.length&&Number.isFinite(f.observedAt)&&f.explanation));
});
test('public reads reject embedded userinfo and oversized streamed responses',async()=>{
  await assert.rejects(publicJSON('https://username@claus.si/network.json',new AbortController().signal),/not declared/);
  const original=globalThis.fetch;
  globalThis.fetch=async()=>new Response('a'.repeat(2000001));
  try {await assert.rejects(publicJSON('https://claus.si/network.json',new AbortController().signal),/exceeded/);}finally{globalThis.fetch=original;}
});
test('429 responses establish a cooldown; retries do not hammer the provider',async()=>{
  const original=globalThis.fetch;let calls=0;
  globalThis.fetch=async()=>{calls++;return new Response('{}',{status:429,headers:{'Retry-After':'120'}});};
  try {
    const url='https://claus-network-api.vercel.app/v1/public/graph';
    await assert.rejects(publicJSON(url,new AbortController().signal),/rate limit/);
    await assert.rejects(publicJSON(url,new AbortController().signal),/rate limit/);
    assert.equal(calls,1);
  } finally {globalThis.fetch=original;}
});

test('unrenderable observation clocks are rejected, and repeated project IDs do not create a hypothesis',()=>{
  assert.throws(()=>parseGraph({nodes:[],edges:[],observedAt:1e50}),/observation time/);
  assert.throws(()=>parseGraph({nodes:[],edges:[],observedAt:'today'}),/observation time/);
  assert.throws(()=>parseActivity({events:[],complete:true,observedAt:1e50}));
  const input=structuredClone(dataset);input.projects=[input.projects[0],input.projects[0]];assert.deepEqual(similarityFindings(input),[]);
});
