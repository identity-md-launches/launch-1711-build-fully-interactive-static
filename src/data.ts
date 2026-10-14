import snapshot from './data/snapshot.json' with { type: 'json' };
import type { Activity, Dataset, Graph, NetworkContext, Profile, Project, ScanResult, SourceInfo, CrawlProgress, SourceKey } from './types.ts';

export const CLAUS = 'https://claus.si';
export const API = 'https://claus-network-api.vercel.app';
export const SNAPSHOT_AT = snapshot.capturedAt;
export const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const validSlug = (value: string) => value.length <= 63 && SLUG.test(value);
export const record = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
export const finite = (v: unknown): v is number => typeof v === 'number' && Number.isSafeInteger(v) && v > 0 && v <= 8_640_000_000_000_000;
export function projectsFromGraph(graph: Graph): Project[] {
  return [...new Map(graph.nodes.filter(n => n.kind === 'project' && typeof n.slug === 'string' && validSlug(n.slug)).map(n => ({
    id: n.id, slug: n.slug!, name: n.presentation?.name || n.label || n.slug!,
    description: n.description || n.presentation?.description || '', status: n.status || 'unknown',
    updatedAt: finite(n.updatedAt) ? n.updatedAt : null, revision: finite(n.revision) ? n.revision : null
  })).map(p => [p.id, p])).values()];
}
export function parseGraph(raw: unknown): Graph {
  if (!record(raw) || !Array.isArray(raw.nodes) || !Array.isArray(raw.edges)) throw new Error('Unexpected graph format');
  if (!raw.nodes.every(n => record(n) && typeof n.id === 'string' && typeof n.kind === 'string')) throw new Error('Invalid graph nodes');
  if (!raw.edges.every(e => record(e) && typeof e.source === 'string' && typeof e.target === 'string' && typeof e.relation === 'string')) throw new Error('Invalid graph edges');
  if (raw.nextCursor != null && typeof raw.nextCursor !== 'string') throw new Error('Invalid graph cursor');
  if (raw.observedAt != null && !finite(raw.observedAt)) throw new Error('Invalid graph observation time');
  const text = (v: unknown) => typeof v === 'string' ? v : undefined;
  const nodes = raw.nodes.map(n => ({ id: n.id as string, kind: n.kind as string, slug: text(n.slug), label: text(n.label), description: text(n.description), status: text(n.status), updatedAt: finite(n.updatedAt) ? n.updatedAt : undefined, revision: finite(n.revision) ? n.revision : undefined, presentation: record(n.presentation) ? { name: text(n.presentation.name), description: text(n.presentation.description) } : undefined }));
  return { ...raw, nodes, resources: Array.isArray(raw.resources) ? raw.resources.filter(r => record(r) && typeof r.id === 'string' && typeof r.kind === 'string') : [], nextCursor: raw.nextCursor ?? null } as Graph;
}
export function parseActivity(raw: unknown): Activity {
  if (!record(raw) || !Array.isArray(raw.events) || !finite(raw.observedAt) || typeof raw.complete !== 'boolean') throw new Error('Unexpected activity format');
  const events = [...new Map(raw.events.filter(e => record(e) && typeof e.id === 'string' && typeof e.projectId === 'string' && typeof e.kind === 'string' && finite(e.at) && e.at <= Number(raw.observedAt)).map(e => [e.id, { ...e, project: typeof e.project === 'string' ? e.project : '', href: typeof e.href === 'string' ? e.href : '' }])).values()];
  return { observedAt: raw.observedAt, complete: raw.complete, scanned: typeof raw.scanned === 'number' ? raw.scanned : 0, events } as Activity;
}
export function parseContext(raw: unknown): NetworkContext {
  if (!record(raw) || !Array.isArray(raw.projects) || !finite(raw.observedAt)) throw new Error('Unexpected context format');
  if (raw.nextCursor != null && typeof raw.nextCursor !== 'string') throw new Error('Invalid context cursor');
  return { ...raw, projects: raw.projects.filter(p => record(p) && typeof p.id === 'string' && typeof p.slug === 'string' && validSlug(p.slug)).map(p => ({ ...p, interfaces: Array.isArray(p.interfaces) ? p.interfaces : undefined, services: Array.isArray(p.services) ? p.services : undefined, agents: Array.isArray(p.agents) ? p.agents : undefined })), nextCursor: typeof raw.nextCursor === 'string' ? raw.nextCursor : null } as NetworkContext;
}
export function parseProfile(raw: unknown, slug: string, source: string): Profile {
  if (!record(raw) || raw.slug !== slug || typeof raw.projectId !== 'string' || typeof raw.published !== 'boolean') throw new Error('Unexpected project profile');
  const count = (key: string) => Array.isArray(raw[key]) ? raw[key].length : 0;
  return {
    slug, name: typeof raw.name === 'string' ? raw.name : slug, projectId: raw.projectId,
    published: raw.published, updatedAt: finite(raw.updatedAt) ? raw.updatedAt : null,
    revision: finite(raw.revision) ? raw.revision : null, description: typeof raw.description === 'string' ? raw.description : '',
    counts: { agents: count('agents'), services: count('services'), results: count('results'), releases: count('releases'), signals: count('signals'), applications: raw.application ? 1 : 0 },
    source, capturedAt: Date.now(),
    releases: parseReleases(raw.releases),
    agents: Array.isArray(raw.agents) ? raw.agents.filter(a => record(a) && typeof a.id === 'string' && typeof a.name === 'string') as {id:string;name:string}[] : [],
    evidence: record(raw.evidence) ? { reviews: Array.isArray(raw.evidence.reviews) ? raw.evidence.reviews : [], decisions: Array.isArray(raw.evidence.decisions) ? raw.evidence.decisions : [], deployments: Array.isArray(raw.evidence.deployments) ? raw.evidence.deployments : [] } : undefined
  };
}
const cachedSource = (url: string, at = SNAPSHOT_AT, complete = true): SourceInfo => ({ mode: 'cached', at, complete, url });
export function cachedDataset(): Dataset {
  const graph = parseGraph(structuredClone(snapshot.graph));
  graph.resources = [...new Map(graph.resources.map(resource => [resource.id, resource])).values()];
  graph.edges = [...new Map(graph.edges.map(edge => [`${edge.source}:${edge.target}:${edge.relation}`, edge])).values()];
  return {
    projects: projectsFromGraph(parseGraph(snapshot.overview)), graph,
    activity: structuredClone(snapshot.activity), context: structuredClone(snapshot.context) as NetworkContext,
    profiles: Object.fromEntries(Object.entries(snapshot.profiles).map(([slug, entry]) => [slug, { ...parseProfile(entry.raw, slug, entry.source), capturedAt: entry.capturedAt, mode: 'cached' as const }])),
    sources: {
      overview: cachedSource(snapshot.sources?.overview?.url || `${CLAUS}/network.json?view=projects`, snapshot.overview.observedAt),
      graph: cachedSource(snapshot.sources?.graph?.url || `${CLAUS}/network.json`, snapshot.graph.observedAt),
      activity: cachedSource(snapshot.sources?.activity?.url || `${CLAUS}/api/network-activity`, snapshot.activity.observedAt, snapshot.activity.complete),
      context: cachedSource(snapshot.sources?.context?.url || `${CLAUS}/api/network-context`, snapshot.context.observedAt, snapshot.context.graphComplete && snapshot.context.detailsComplete)
    }
  };
}
export async function publicJSON(url: string, signal: AbortSignal): Promise<unknown> {
  const parsed = new URL(url);
  if (parsed.username || parsed.password || ![CLAUS, API].includes(parsed.origin)) throw new Error('Origin is not declared');
  if ((cooldowns.get(parsed.origin) || 0) > Date.now()) throw new RateLimitError(cooldowns.get(parsed.origin)!);
  const timeout = AbortSignal.timeout(15000);
  const response = await fetch(url, { credentials: 'omit', redirect: 'error', signal: AbortSignal.any([signal, timeout]), headers: { Accept: 'application/json' } });
  if (!response.ok) {
    if (response.status === 429) { const retry = response.headers.get('Retry-After'); const seconds = retry && /^\d+$/.test(retry) ? Number(retry) : retry ? Math.max(0, (Date.parse(retry) - Date.now()) / 1000) : 60; const until = Date.now() + Math.max(60000, Number.isFinite(seconds) ? seconds * 1000 : 60000); cooldowns.set(parsed.origin, until); throw new RateLimitError(until); }
    throw new Error(`HTTP ${response.status}`);
  }
  // Bound remote responses before parsing; never execute project-authored text or URLs.
  const limit = 2_000_000;
  if (Number(response.headers.get('Content-Length')) > limit) { await response.body?.cancel(); throw new Error('Public response exceeded the scan limit'); }
  if (!response.body) throw new Error('Empty public response');
  const reader = response.body.getReader(); const chunks: Uint8Array[] = []; let size = 0;
  try {
    for (;;) { const {done,value} = await reader.read(); if(done) break; size += value.byteLength; if(size > limit) { await reader.cancel(); throw new Error('Public response exceeded the scan limit'); } chunks.push(value); }
  } finally { reader.releaseLock(); }
  const bytes = new Uint8Array(size); let offset = 0; for(const chunk of chunks) { bytes.set(chunk,offset); offset += chunk.byteLength; }
  return JSON.parse(new TextDecoder().decode(bytes));
}
export async function getWithFallback(primary: string, fallback: string, signal: AbortSignal): Promise<{ raw: unknown; url: string }> {
  try { return { raw: await publicJSON(primary, signal), url: primary }; }
  catch (error) {
    if (signal.aborted || error instanceof RateLimitError) throw error;
    return { raw: await publicJSON(fallback, signal), url: fallback };
  }
}
export async function loadGraph(view: 'projects' | 'full', signal: AbortSignal): Promise<{ graph: Graph; source: SourceInfo }> {
  const all: Graph = { nodes: [], resources: [], edges: [], nextCursor: null };
  const seen = new Set<string>(); let cursor: string | null = null; let url = ''; let complete = true;
  for (let page = 0; page < 20; page++) {
    const params = new URLSearchParams();
    if (view === 'projects') params.set('view', 'projects');
    if (cursor) params.set('after', cursor);
    const suffix = params.size ? `?${params}` : '';
    let response: { raw: unknown; url: string };
    let graph: Graph;
    try {
      response = await getWithFallback(`${CLAUS}/network.json${suffix}`, `${API}/v1/public/graph${suffix}`, signal);
      graph = parseGraph(response.raw);
    } catch (error) {
      if (signal.aborted || page === 0) throw error;
      complete = false; break;
    }
    url = response.url;
    all.nodes.push(...graph.nodes); all.resources.push(...graph.resources); all.edges.push(...graph.edges);
    all.observedAt = all.observedAt ? Math.min(all.observedAt, graph.observedAt || Date.now()) : graph.observedAt || Date.now();
    cursor = graph.nextCursor;
    if (!cursor) break;
    if (seen.has(cursor) || page === 19) { complete = false; break; }
    seen.add(cursor);
  }
  all.nodes = [...new Map(all.nodes.map(n => [n.id, n])).values()];
  all.resources = [...new Map(all.resources.map(n => [n.id, n])).values()];
  all.edges = [...new Map(all.edges.map(e => [`${e.source}:${e.target}:${e.relation}`, e])).values()];
  all.nextCursor = cursor;
  return { graph: all, source: { mode: 'live', at: all.observedAt || Date.now(), complete, url } };
}
export async function loadContext(signal: AbortSignal): Promise<{ context: NetworkContext; source: SourceInfo }> {
  let cursor: string | null = null; let context: NetworkContext | undefined;
  const seen = new Set<string>(); let complete = true;
  for (let page = 0; page < 20; page++) {
    let next: NetworkContext;
    try { next = parseContext(await publicJSON(`${CLAUS}/api/network-context${cursor ? `?after=${encodeURIComponent(cursor)}` : ''}`, signal)); }
    catch (error) { if (signal.aborted || !context) throw error; complete = false; break; }
    if (!context) context = next;
    else { context.projects.push(...next.projects); context.observedAt = Math.min(context.observedAt, next.observedAt); }
    complete &&= next.graphComplete === true && next.detailsComplete === true;
    cursor = next.nextCursor;
    if (!cursor) break;
    if (seen.has(cursor) || page === 19) { complete = false; break; }
    seen.add(cursor);
  }
  context!.projects = [...new Map(context!.projects.map(p => [p.slug, p])).values()];
  context!.nextCursor = cursor;
  return { context: context!, source: { mode: 'live', at: context!.observedAt, complete, url: `${CLAUS}/api/network-context` } };
}
export async function refreshDataset(signal: AbortSignal, report: (message: string, warn?: boolean, progress?: CrawlProgress) => void, previous?: Dataset): Promise<Dataset> {
  const data = previous ? structuredClone(previous) : cachedDataset();
  // Report each settled request immediately; a slow endpoint must not hold back the terminal.
  const track = async <T>(key: SourceKey, request: () => Promise<T>, complete: (value: T) => boolean): Promise<T> => {
    report(`${key}: reading public source`, false, { source:key, state:'reading' });
    try {
      const value = await request();
      if (!signal.aborted) report(`${key}: public response received${complete(value)?'':' · partial coverage'}`, !complete(value), { source:key, state:'received' });
      return value;
    } catch (error) {
      if (!signal.aborted) report(`${key}: live unavailable; retaining recorded data`, true, { source:key, state:'cached' });
      throw error;
    }
  };
  const tasks = await Promise.allSettled([
    track('overview', () => loadGraph('projects', signal), value => value.source.complete),
    track('graph', () => loadGraph('full', signal), value => value.source.complete),
    track('activity', () => publicJSON(`${CLAUS}/api/network-activity`, signal).then(parseActivity), value => value.complete),
    track('context', () => loadContext(signal), value => value.source.complete)
  ]);
  if (signal.aborted) throw new DOMException('Scan stopped', 'AbortError');
  const [overview, graph, activity, context] = tasks;
  if (overview.status === 'fulfilled') { data.projects = projectsFromGraph(overview.value.graph); data.sources.overview = overview.value.source; }
  if (graph.status === 'fulfilled') { data.graph = graph.value.graph; data.sources.graph = graph.value.source; }
  if (activity.status === 'fulfilled') { data.activity = activity.value; data.sources.activity = { mode: 'live', at: activity.value.observedAt, complete: activity.value.complete, url: `${CLAUS}/api/network-activity` }; }
  if (context.status === 'fulfilled') { data.context = context.value.context; data.sources.context = context.value.source; }
  (['overview', 'graph', 'activity', 'context'] as const).forEach((key, index) => {
    const source = data.sources[key];
    if (tasks[index].status === 'rejected') {
      source.mode = 'cached';
      source.note = 'Live read unavailable; using dated cache';
    }
  });
  return data;
}
export async function getProfile(project: Project, live: boolean, data: Dataset, signal: AbortSignal): Promise<{ profile?: Profile; source: SourceInfo }> {
  if (live) {
    try {
      const { raw, url } = await getWithFallback(`${CLAUS}/network.json?project=${encodeURIComponent(project.slug)}`, `${API}/v1/public/projects/${encodeURIComponent(project.slug)}`, signal);
      const profile = { ...parseProfile(raw, project.slug, url), mode: 'live' as const };
      if (profile.projectId !== project.id) throw new Error('Project identity changed');
      return { profile, source: { mode: 'live', at: profile.capturedAt, complete: true, url } };
    } catch (error) { if (signal.aborted) throw error; }
  }
  const cached = data.profiles[project.slug];
  const profile = cached?.projectId === project.id ? { ...cached, mode:'cached' as const } : undefined;
  return { profile, source: { mode: profile?.mode || 'cached', at: profile?.capturedAt || SNAPSHOT_AT, complete: !!profile, url: `${CLAUS}/network.json?project=${project.slug}`, note: live ? 'Live profile unavailable; cached profile if present' : undefined } };
}
export function assess(project: Project, profile: Profile | undefined, profileSource: SourceInfo, data: Dataset): ScanResult {
  const events = data.activity.events.filter(e => e.projectId === project.id).sort((a,b) => b.at - a.at);
  // Activity and profile have independent clocks. Cached events never become fresh merely because a live profile was read.
  const eventAt = events[0]?.at ?? null;
  const profileAt = profile?.updatedAt ?? project.updatedAt;
  const latestAt = Math.max(eventAt || 0, profileAt || 0) || null;
  const eventRecent = eventAt !== null && data.sources.activity.at >= eventAt && data.sources.activity.at - eventAt <= 7 * 86400000;
  const profileObservedAt = profile ? profileSource.at : data.sources.overview.at;
  const profileRecent = profileAt !== null && profileObservedAt >= profileAt && profileObservedAt - profileAt <= 7 * 86400000;
  const signal = eventRecent ? 'Recent public activity' : profileRecent ? 'Recently updated' : latestAt ? 'Older public record' : 'Limited public data';
  return { project, profile, profileSource, events, signal, latestAt, observedAt: Math.max(profileSource.at, data.sources.activity.at),
    graphResources: data.graph.resources.filter(r => r.projectId === project.id).length,
    connections: data.graph.edges.filter(e => e.source === project.id || e.target === project.id).length, context: data.context.projects.find(p => p.slug === project.slug) };
}
export function filterProjects(projects: Project[], query: string): Project[] {
  const q = query.trim().toLowerCase();
  return projects.filter(p => p.slug.includes(q) || p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q));
}
export function displayDate(at: number | null): string {
  return at ? new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(at) : 'Not supplied';
}
export function displayTime(at: number): string { return new Date(at).toISOString().slice(11,19); }
export function escapeHTML(value: unknown): string { return String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]!)); }

export class RateLimitError extends Error {
  retryAt: number;
  constructor(retryAt: number) { super('Provider rate limit; retry later'); this.retryAt = retryAt; }
}
const cooldowns = new Map<string, number>();
export function releaseURL(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  try { const url = new URL(value); return url.origin === 'https://claus-network-sites.vercel.app' && /^\/r\/[a-f0-9]{64}\/index\.html$/.test(url.pathname) && !url.username && !url.password && !url.search && !url.hash ? url.href : null; } catch { return null; }
}
export function parseReleases(raw: unknown): import('./types.ts').Release[] {
  if (!Array.isArray(raw)) return [];
  return [...new Map(raw.filter(r => record(r) && typeof r.id === 'string' && /^sha256:[a-f0-9]{64}$/.test(r.id) && finite(r.createdAt) && releaseURL(r.url) && typeof r.url === 'string' && r.url.includes(r.id.slice(7)) && (r.expiresAt == null || finite(r.expiresAt))).map(r => [r.id, { id:r.id, url:r.url, createdAt:r.createdAt, expiresAt:r.expiresAt ?? null }])).values()].sort((a,b) => b.createdAt-a.createdAt);
}
