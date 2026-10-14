import test from 'node:test';
import assert from 'node:assert/strict';
import { cachedDataset, filterProjects, assess, parseGraph, parseActivity, parseProfile, validSlug, escapeHTML, loadGraph, loadContext, publicJSON } from '../src/data.ts';

const dataset = cachedDataset();
test('cached demo contains real Claus records and valid project-only slugs', () => {
  assert.equal(dataset.projects.length,29);
  assert.equal(dataset.context.projects.length,6);
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
