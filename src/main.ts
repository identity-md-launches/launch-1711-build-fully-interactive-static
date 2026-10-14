import './style.css';
import { octopus } from './mascot';
import { cachedDataset, refreshDataset, getProfile, assess, filterProjects, displayDate, displayTime, escapeHTML as esc, SNAPSHOT_AT, validSlug, CLAUS } from './data';
import type { Dataset, Project, ScanResult, SourceMode } from './types';

const el = <T extends HTMLElement = HTMLElement>(selector: string): T => {
  const node = document.querySelector<T>(selector);
  if (!node) throw new Error(`Missing interface element: ${selector}`);
  return node;
};
const query = el<HTMLInputElement>('#project-query');
const crawlButton = el<HTMLButtonElement>('#crawl');
const log = el('#log');
const crawler = el('#crawler');
const positions = [ { x: 19, y: 17 }, { x: 50, y: 13 }, { x: 81, y: 17 }, { x: 81, y: 82 }, { x: 50, y: 87 }, { x: 19, y: 82 } ];
const origin = { x: 50, y: 47 };
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
let data: Dataset = cachedDataset();
let mode: SourceMode = 'cached';
let busy = false;
let controller: AbortController | null = null;
let listMode: 'featured' | 'all' | 'scanned' = 'featured';
let selectedSlug = 'agent-blackbox';
let mapProjects: Project[] = [];
let results = new Map<string, ScanResult>();
let following = true;
let moveAnimation: Animation | null = null;
let logEntries: { at: number; tag: string; message: string; kind: string }[] = [];
let crawlSequence = 0;
let lastCrawlMode: SourceMode = 'cached';

function announce(message: string) { el('#announcement').textContent = message; }
function featuredProjects(): Project[] {
  const preferred = ['agent-blackbox', 'claus-up-down', 'agent-minimum', 'oracle-drift', 'sepolia-wallet-7be29de3', 'blackbox-notary-7be29de3'];
  const visible = new Set(data.context.projects.map(p => p.slug));
  return [...data.projects.filter(p => visible.has(p.slug))].sort((a,b) => {
    const ai = preferred.indexOf(a.slug); const bi = preferred.indexOf(b.slug);
    return (ai < 0 ? 999 : ai) - (bi < 0 ? 999 : bi);
  }).slice(0,6);
}
function addLog(tag: string, message: string, kind = '') {
  const entry = { at: Date.now(), tag, message, kind };
  logEntries.push(entry);
  el('#copy-log').textContent = 'Copy log';
  const row = document.createElement('div'); row.className = `log-entry ${kind}`;
  const time = document.createElement('time'); time.dateTime = new Date(entry.at).toISOString(); time.textContent = displayTime(entry.at).slice(3);
  const code = document.createElement('code');
  const label = document.createElement('span'); label.className = 'log-tag'; label.textContent = `[${tag}] `;
  code.append(label, document.createTextNode(message)); row.append(time, code); log.append(row);
  if (following) log.scrollTop = log.scrollHeight;
  el('#log-count').textContent = `${logEntries.length} steps recorded`;
}
function setMode(next: SourceMode) {
  if (busy) return;
  mode = next;
  el('#mode-demo').setAttribute('aria-pressed', String(mode === 'cached'));
  el('#mode-live').setAttribute('aria-pressed', String(mode === 'live'));
  renderSourceNote(false);
}
function renderSourceNote(afterRead = true) {
  const note = el('#source-note'); note.classList.remove('is-warning');
  if (mode === 'cached') note.textContent = afterRead ? `Cached · ${displayDate(SNAPSHOT_AT)} · Offline ready` : `Cached demo selected · Replays ${displayDate(SNAPSHOT_AT)} on crawl`;
  else if (!afterRead) note.textContent = 'Live data selected · Public sources refresh when you crawl';
  else {
    const live = Object.values(data.sources).filter(s => s.mode === 'live').length;
    note.textContent = live === 4 ? 'Live public data · Source observation times are in the report' : `${live}/4 sources live · Remaining sources use the ${displayDate(SNAPSHOT_AT)} cache`;
    note.classList.toggle('is-warning', live < 4);
  }
}
function renderSources() {
  el('#source-table').innerHTML = `<table class="source-table"><thead><tr><th scope="col">Source</th><th scope="col">Mode / observed</th><th scope="col">Coverage</th></tr></thead><tbody>${Object.entries(data.sources).map(([key, s]) => `<tr><td><a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(key)} ↗</a></td><td>${s.mode}<br>${displayDate(s.at)}</td><td>${s.complete ? 'Complete response' : 'Partial response'}</td></tr>`).join('')}</tbody></table>`;
}
function edgeFor(project: Project) { return data.graph.edges.find(e => e.relation === 'registered_with' && ((e.source === project.id && e.target === 'claus') || (e.target === project.id && e.source === 'claus'))); }
function renderMap(projects: Project[]) {
  mapProjects = projects.slice(0,6);
  crawler.style.left = `${origin.x}%`; crawler.style.top = `${origin.y}%`;
  el('#map-nodes').innerHTML = mapProjects.map((p,i) => `<button type="button" class="map-node${results.has(p.slug) ? ' visited' : ''}" data-node="${esc(p.slug)}" style="left:${positions[i].x}%;top:${positions[i].y}%" aria-label="Inspect ${esc(p.name)}"><span class="node-core" aria-hidden="true">${results.has(p.slug) ? '✓' : String(i+1).padStart(2,'0')}</span><span class="node-label">${esc(p.slug)}</span></button>`).join('');
  const edgeSVG = mapProjects.map((p,i) => edgeFor(p) ? `<line id="edge-${i}" class="graph-edge${results.has(p.slug) ? ' visited' : ''}" x1="500" y1="282" x2="${positions[i].x*10}" y2="${positions[i].y*6 - 9}"/>` : '').join('');
  const projectEdges = data.graph.edges.filter(e => e.relation !== 'registered_with' && mapProjects.some(p => p.id === e.source) && mapProjects.some(p => p.id === e.target));
  el('#connections').innerHTML = edgeSVG + projectEdges.map(e => {
    const a = positions[mapProjects.findIndex(p => p.id === e.source)]; const b = positions[mapProjects.findIndex(p => p.id === e.target)];
    return `<line class="graph-edge service" x1="${a.x*10}" y1="${a.y*6-9}" x2="${b.x*10}" y2="${b.y*6-9}"/>`;
  }).join('');
  el('#map-count').textContent = `${mapProjects.length} project node${mapProjects.length === 1 ? '' : 's'}`;
}
function currentProjects() {
  const search = query.value.trim();
  if (search) return filterProjects(data.projects, search);
  if (listMode === 'featured') return featuredProjects();
  if (listMode === 'scanned') return [...results.values()].map(r => r.project);
  return data.projects;
}
function renderList() {
  const focusedSlug = document.activeElement instanceof HTMLElement ? document.activeElement.dataset.project : undefined;
  const projects = currentProjects();
  el('#featured-count').textContent = String(featuredProjects().length);
  el('#total-count').textContent = String(data.projects.length);
  el('#scanned-count').textContent = String(results.size);
  el('#list-caption').textContent = query.value.trim() ? `${projects.length} search match${projects.length === 1 ? '' : 'es'}` : listMode === 'featured' ? 'From the public Home feed' : listMode === 'scanned' ? 'This session only' : 'Includes technical references';
  document.querySelectorAll<HTMLButtonElement>('[data-list]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.list === listMode)));
  if (!projects.length) {
    el('#project-list').innerHTML = `<div class="list-empty"><p>${query.value.trim() ? `No projects match “${esc(query.value.trim())}”.` : 'Your scanned projects will appear here.'}</p><button type="button" class="outline-button" id="clear-search">${query.value.trim() ? 'Clear search' : 'Explore featured projects'} →</button></div>`;
    return;
  }
  el('#project-list').innerHTML = projects.map((p,i) => `<button type="button" class="project-row" data-project="${esc(p.slug)}" aria-pressed="${p.slug === selectedSlug}"><span class="row-number">${String(i+1).padStart(2,'0')}</span><span><span class="row-name">${esc(p.name)}</span><span class="row-slug">${esc(p.slug)}</span></span><span class="row-state">${results.has(p.slug) ? '✓ scanned' : '↗'}<span class="sr-only">${results.has(p.slug) ? '' : ' Inspect project'}</span></span></button>`).join('');
  if (focusedSlug) document.querySelector<HTMLButtonElement>(`[data-project="${focusedSlug}"]`)?.focus({ preventScroll: true });
}
function renderDetail() {
  const p = data.projects.find(p => p.slug === selectedSlug) || [...results.values()].find(r => r.project.slug === selectedSlug)?.project;
  if (!p) { el('#project-detail').innerHTML = '<p class="muted">Choose a project to inspect its public record.</p>'; return; }
  const result = results.get(p.slug);
  const profile = result?.profile;
  const description = profile?.description ?? p.description;
  const links = `<div class="detail-links"><a href="${CLAUS}/c/${encodeURIComponent(p.slug)}" target="_blank" rel="noopener noreferrer">Open project ↗</a><a href="${CLAUS}/Home#project=${encodeURIComponent(p.slug)}" target="_blank" rel="noopener noreferrer">Find on Claus map ↗</a></div>`;
  let report = '';
  if (result) {
    report = `<div class="signal-box"><div class="signal-heading"><strong>${esc(result.signal)}</strong><span>Public signal</span></div><p>Latest observed update: ${displayDate(result.latestAt)}. Recency is measured against each source’s observation, including cached sources.</p></div>
      <dl class="evidence-grid"><div><dt>Published interfaces</dt><dd>${profile?.counts.releases ?? result.context?.interfaces?.length ?? 'Unknown'}</dd></div><div><dt>Public services</dt><dd>${profile?.counts.services ?? result.context?.services?.length ?? 'Unknown'}</dd></div><div><dt>Feed events</dt><dd>${result.events.length}</dd></div></dl>
      <div class="detail-events"><h4>Observed activity</h4>${result.events.length ? `<ul>${result.events.slice(0,4).map(e => `<li><span>${esc(e.kind)}</span><time datetime="${new Date(e.at).toISOString()}">${displayDate(e.at)}</time></li>`).join('')}</ul>${result.events.length > 4 ? `<p class="detail-source">Showing 4 of ${result.events.length} events. Export the report for all returned events.</p>` : ''}` : '<p class="muted">No events for this project in the returned feed. This does not establish inactivity.</p>'}</div>
      <p class="detail-source">Profile: ${result.profileSource.mode}, ${displayDate(result.profileSource.at)}${result.profileSource.complete ? '' : ' (unavailable)'}. Activity: ${data.sources.activity.mode}, ${displayDate(data.sources.activity.at)}${data.sources.activity.complete ? '' : ' (partial)'}. Graph: ${data.sources.graph.mode}, ${displayDate(data.sources.graph.at)}.</p>
      <p class="detail-source">${profile ? 'Counts from the project profile.' : result.context ? `Counts from the ${data.sources.context.mode} Home context (${displayDate(data.sources.context.at)}).` : 'Profile counts unavailable.'} ${result.connections} recorded graph connection${result.connections === 1 ? '' : 's'} · ${result.graphResources} graph resource${result.graphResources === 1 ? '' : 's'}. Project-authored descriptions are not endorsements.</p>
      <div class="detail-links"><a href="${CLAUS}/read/network/${encodeURIComponent(p.slug)}" target="_blank" rel="noopener noreferrer">Read source profile ↗</a><button type="button" class="text-button" data-crawl-project="${esc(p.slug)}" ${busy ? 'disabled' : ''}>Crawl again ↻</button></div>`;
  } else {
    report = `<div class="detail-prompt"><p>Ready for a closer look?</p><p class="detail-source">Crawl this project to inspect its public profile, activity, and connections.</p><button type="button" class="outline-button" data-crawl-project="${esc(p.slug)}" ${busy ? 'disabled' : ''}>Crawl this project <span aria-hidden="true">→</span></button></div>`;
  }
  el('#project-detail').innerHTML = `<div class="detail-heading"><div><h3 tabindex="-1">${esc(profile?.name || p.name)}</h3><span class="detail-slug">/${esc(p.slug)}</span></div><div class="detail-mark">${octopus()}</div></div><div class="detail-meta"><span>Status <strong>${esc(p.status)}</strong></span><span>Profile <strong>${profile ? profile.published ? 'published' : 'unpublished' : result ? 'unavailable' : 'not yet scanned'}</strong></span><span>Revision <strong>${profile?.revision ?? p.revision ?? 'unknown'}</strong></span></div><p class="detail-description">${esc(description || 'No project description has been published.')}</p>${links}${report}`;
}
function renderAll() { renderList(); renderDetail(); renderSources(); }
function selectProject(slug: string, scroll = false) {
  selectedSlug = slug; renderList(); renderDetail();
  if (scroll) { el('#project-detail h3').focus({ preventScroll: true }); el('#project-detail').scrollIntoView({ behavior: reducedMotion.matches ? 'instant' : 'smooth', block: 'nearest' }); }
}
function setBusy(next: boolean) {
  busy = next;
  crawlButton.disabled = next;
  crawlButton.innerHTML = next ? 'crawling<span aria-hidden="true">…</span>' : 'crawl <span aria-hidden="true">→</span>';
  el<HTMLButtonElement>('#stop').disabled = !next;
  query.disabled = next;
  document.querySelectorAll<HTMLButtonElement>('#mode-demo, #mode-live, #demo-tour, [data-trail], [data-crawl-project]').forEach(button => button.disabled = next);
}
function setProgress(done: number, total: number) {
  const value = total ? Math.round(done/total*100) : 0;
  el('#progress-fill').style.width = `${value}%`;
  el('.scan-progress').setAttribute('aria-valuenow', String(value));
  el('.scan-progress').setAttribute('aria-valuetext', `${done} of ${total} projects scanned`);
}
function failInput(message: string) {
  query.disabled = false; el('#input-error').textContent = message; el('#input-error').hidden = false; query.setAttribute('aria-invalid','true'); query.focus();
}
function clearError() { el('#input-error').hidden = true; query.removeAttribute('aria-invalid'); }
async function move(to: { x: number; y: number }, signal: AbortSignal, duration = 850) {
  if (signal.aborted) throw new DOMException('Stopped', 'AbortError');
  if (reducedMotion.matches) { crawler.style.left = `${to.x}%`; crawler.style.top = `${to.y}%`; return; }
  crawler.classList.add('moving');
  moveAnimation = crawler.animate([{ left: crawler.style.left || '50%', top: crawler.style.top || '47%' }, { left: `${to.x}%`, top: `${to.y}%` }], { duration, easing: 'cubic-bezier(.4,0,.2,1)', fill: 'forwards' });
  const cancel = () => moveAnimation?.cancel(); signal.addEventListener('abort', cancel, { once: true });
  try { await moveAnimation.finished; crawler.style.left = `${to.x}%`; crawler.style.top = `${to.y}%`; }
  finally { signal.removeEventListener('abort', cancel); moveAnimation?.cancel(); moveAnimation = null; crawler.classList.remove('moving'); }
}
reducedMotion.addEventListener('change', () => { if (reducedMotion.matches) moveAnimation?.finish(); });
async function startCrawl(forceSlug?: string) {
  if (busy) return;
  if (forceSlug) query.value = forceSlug;
  const search = query.value.trim();
  clearError();
  if (/^0x/i.test(search) || search.includes('://')) { failInput('Enter a Claus project slug or name, such as agent-blackbox.'); return; }
  if (mode === 'cached' && search && !filterProjects(data.projects,search).length) { failInput('No cached Claus projects match. Clear the search or choose Live data and try again.'); renderList(); return; }
  controller = new AbortController(); const signal = controller.signal;
  setBusy(true); setProgress(0,0); crawlSequence++; lastCrawlMode = mode;
  el('#scan-status').textContent = mode === 'live' ? 'Reading public sources' : 'Starting crawl';
  addLog('start', `Crawl ${crawlSequence} · ${mode === 'cached' ? 'cached demo' : 'live reads'}${search ? ` · ${search}` : ' · featured tour'}`);
  try {
    results = new Map(); renderList(); renderDetail(); renderMap(featuredProjects());
    el<HTMLButtonElement>('#export-results').disabled = true;
    data = mode === 'live' ? await refreshDataset(signal, (message,warn) => addLog('source', message, warn ? 'warn' : '')) : cachedDataset();
    renderSourceNote(); renderAll();
    const exact = data.projects.find(p => p.slug === search.toLowerCase() || p.name.toLowerCase() === search.toLowerCase());
    let queue = search ? exact ? [exact] : filterProjects(data.projects,search) : featuredProjects();
    if (!queue.length) { addLog('search','No matching project in the available public registry.','warn'); failInput('No Claus project matched. Try a shorter name or run the demo tour.'); el('#scan-status').textContent = 'No matching project'; return; }
    if (queue.length > 6) addLog('scope', `Scanning the first 6 of ${queue.length} matches. Narrow your search to visit another project.`, 'warn');
    queue = queue.slice(0,6); renderMap(queue); setProgress(0,queue.length);
    addLog('read', `${data.projects.length} registry projects; ${data.context.projects.length} in the returned Home feed.`, 'system');
    // Request profiles together, then inspect each one as Claus visits its node.
    const profiles = queue.map(p => getProfile(p,mode === 'live',data,signal).then(value => ({ value }), error => ({ error })));
    addLog('read', `${mode === 'live' ? 'Requesting public' : 'Opening cached'} profiles for ${queue.length} project${queue.length === 1 ? '' : 's'}.`);
    let done = 0;
    for (let i = 0; i < queue.length; i++) {
      if (signal.aborted) throw new DOMException('Stopped','AbortError');
      const project = queue[i];
      el('#scan-status').textContent = `Visiting ${i+1} / ${queue.length}`;
      el('#map-caption').textContent = `Visiting /${project.slug}`;
      const node = document.querySelector<HTMLElement>(`[data-node="${project.slug}"]`)!;
      const edge = document.getElementById(`edge-${i}`);
      node.classList.add('active'); edge?.classList.add('active');
      if (edgeFor(project)) {
        addLog('walk', `Follow registered_with → ${project.slug}`);
        await move({ x: positions[i].x, y: positions[i].y - 5 },signal);
      } else {
        addLog('inspect', `${project.slug}: no coordinator edge in this graph; inspecting without a walk.`, 'warn');
      }
      const loaded = await profiles[i];
      if ('error' in loaded) throw loaded.error;
      if (signal.aborted) throw new DOMException('Stopped','AbortError');
      const { profile, source } = loaded.value;
      addLog('profile', `${project.slug} · ${profile ? profile.published ? 'published profile' : 'profile not published' : 'profile unavailable'} · ${source.mode}`, source.note || !profile ? 'warn' : '');
      const result = assess(project,profile,source,data); results.set(project.slug,result);
      addLog('activity', `${result.events.length} returned feed event${result.events.length === 1 ? '' : 's'} · ${result.signal.toLowerCase()}`);
      selectedSlug = project.slug; renderAll();
      node.classList.remove('active'); node.classList.add('visited'); node.querySelector('.node-core')!.textContent = '✓';
      done++; setProgress(done,queue.length); el<HTMLButtonElement>('#export-results').disabled = false;
      if (edgeFor(project)) {
        addLog('return', `${project.slug} inspected; return along registered_with`);
        await move(origin,signal,600);
      }
      edge?.classList.remove('active'); edge?.classList.add('visited');
    }
    el('#scan-status').textContent = `${done} scanned · complete`;
    el('#map-caption').textContent = 'Trail complete. The signals are below.';
    addLog('done', `${done} public project${done === 1 ? '' : 's'} inspected. Select a result to explore.`, 'completed');
    announce(`Crawl complete. ${done} projects inspected. Results are in Read the signals.`);
    listMode = 'scanned'; renderList();
  } catch (error) {
    if (signal.aborted) { addLog('stop', `Crawl stopped. ${results.size} completed results kept.`, 'warn'); el('#scan-status').textContent = 'Stopped · results kept'; el('#map-caption').textContent = 'Claus is resting. Start a new trail.'; announce('Crawl stopped. Completed results were kept.'); }
    else { addLog('error', 'The crawl could not finish. Try the cached demo or start again.', 'warn'); el('#scan-status').textContent = 'Unable to finish'; announce('Unable to finish. Try the cached demo.'); console.error('Crawl failed:', error instanceof Error ? error.message : 'Unexpected public data'); }
  } finally {
    busy = false; controller = null; crawler.classList.remove('moving');
    document.querySelectorAll('.map-node.active, .graph-edge.active').forEach(node => node.classList.remove('active'));
    setBusy(false); renderDetail();
  }
}
query.addEventListener('input', () => { clearError(); renderList(); });
query.addEventListener('keydown', event => { if (event.key === 'Enter') { event.preventDefault(); void startCrawl(); } if (event.key === 'Escape') { query.value = ''; clearError(); renderList(); } });
crawlButton.addEventListener('click', () => void startCrawl());
el('#mode-demo').addEventListener('click', () => setMode('cached'));
el('#mode-live').addEventListener('click', () => setMode('live'));
el('#demo-tour').addEventListener('click', () => { setMode('cached'); query.value = ''; void startCrawl(); });
el('#stop').addEventListener('click', () => controller?.abort());
el('#follow-log').addEventListener('click', () => { following = !following; el('#follow-log').setAttribute('aria-pressed', String(following)); el('#follow-log').textContent = following ? 'Following ↓' : 'Follow log ↓'; if (following) log.scrollTop = log.scrollHeight; });
el('#copy-log').addEventListener('click', async () => {
  const text = logEntries.map(e => `${new Date(e.at).toISOString()} [${e.tag}] ${e.message}`).join('\n');
  try { await navigator.clipboard.writeText(text); announce('Scan log copied.'); el('#copy-log').textContent = 'Copied ✓'; }
  catch { const selection = window.getSelection(); const range = document.createRange(); range.selectNodeContents(log); selection?.removeAllRanges(); selection?.addRange(range); announce('Clipboard unavailable. Log selected; use your browser’s Copy action.'); el('#copy-log').textContent = 'Log selected'; }
});
el('#export-results').addEventListener('click', () => {
  if (!results.size) return;
  const report = { schema: 'claus-crawl-report/1', createdAt: new Date().toISOString(), requestedMode: lastCrawlMode, snapshotAt: new Date(SNAPSHOT_AT).toISOString(),
    method: 'Recent means a public update or event within seven days of its own source observation. This is not a security audit. Missing events do not prove inactivity.',
    sources: data.sources, results: [...results.values()], log: logEntries };
  const url = URL.createObjectURL(new Blob([JSON.stringify(report,null,2)], { type: 'application/json' }));
  const a = document.createElement('a'); a.href = url; a.download = 'claus-crawl-report.json'; a.textContent = 'Download report'; a.hidden = true; document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 30000); announce('Report download requested.');
});
document.addEventListener('click', event => {
  const target = (event.target as Element).closest<HTMLButtonElement>('button');
  if (!target || target.disabled) return;
  if (target.dataset.trail) void startCrawl(target.dataset.trail);
  if (target.dataset.crawlProject) { void startCrawl(target.dataset.crawlProject); el('#crawl-title').scrollIntoView({ behavior: reducedMotion.matches ? 'instant' : 'smooth', block: 'start' }); }
  if (target.dataset.node) selectProject(target.dataset.node,true);
  if (target.dataset.project) selectProject(target.dataset.project,matchMedia('(max-width: 760px)').matches);
  if (target.dataset.list) { listMode = target.dataset.list as typeof listMode; query.value = ''; clearError(); renderList(); }
  if (target.id === 'clear-search') { query.value = ''; listMode = 'featured'; clearError(); renderList(); query.focus(); }
});
function readHash() {
  const params = new URLSearchParams(location.hash.slice(1));
  const slug = params.get('project');
  if (slug && validSlug(slug) && data.projects.some(p => p.slug === slug)) { query.value = slug; selectedSlug = slug; renderAll(); }
}
window.addEventListener('hashchange',readHash);
crawler.innerHTML = octopus('', 'Claus, the black ink octopus crawler');
renderMap(featuredProjects()); renderAll(); renderSourceNote(); readHash();
addLog('boot', 'Claus Crawl ready.', 'system');
addLog('cache', `Public snapshot · ${displayDate(SNAPSHOT_AT)}`, 'system');
addLog('index', `${data.projects.length} registered projects loaded.`);
addLog('ready', 'Give Claus a project, or run the demo tour.', 'system');
