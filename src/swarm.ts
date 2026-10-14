import { octopusBody } from './mascot';
import { displayDate, escapeHTML as esc } from './data';
import { agentDefinitions, uniqueEvents } from './intelligence';
import type { Dataset, SourceKey, CrawlProgress } from './types';
type Point = readonly [number, number];
const points: Point[] = [[82, 64], [458, 64], [458, 216], [82, 216], [270, 140]];
const sourceNodes: { key: SourceKey; name: string; point: number }[] = [
  { key: 'overview', name: 'Registry', point: 0 }, { key: 'graph', name: 'Graph', point: 1 },
  { key: 'activity', name: 'Activity', point: 2 }, { key: 'context', name: 'Home inventory', point: 3 }
];
const trails = [[0, 4, 3, 0], [1, 4, 0, 1], [0, 1, 4, 0], [3, 4, 2, 3], [1, 2, 4, 1], [2, 4, 0, 4, 2], [2, 3, 4, 2]];
// Separate waypoints keep the small crawlers from obscuring Claus at the hub.
const waypoints: Point[] = [[198,140], [270,68], [270,52], [270,212], [342,140], [322,88], [270,228]];
const routePoint = (agent: number, point: number): Point => point===4 ? waypoints[agent] : points[point];
const shortNames = ['Launch', 'Metadata', 'Names', 'History', 'Relations', 'Evidence', 'Activity'];
const eventLabel = (kind: string) => ({ 'project.published': 'Profile published', 'project.updated': 'Profile updated', 'interface.created': 'Website released', 'result.published': 'Result published' }[kind] || kind);

/** One controller survives route renders; its DOM subscriptions never do. No network polling. */
export class CrawlerSwarm {
  private root: HTMLElement | null = null;
  private cleanup: (() => void) | undefined;
  private frame = 0;
  private elapsed = 0;
  private previousTime = 0;
  private replayTimer: ReturnType<typeof setTimeout> | undefined;
  private reduced = matchMedia('(prefers-reduced-motion: reduce)');
  private paused = false;
  private visible = true;
  private mode: 'recorded' | 'requests' = 'recorded';
  private playing = false;
  private replayCount = 2;
  private selected = 0;
  private feedMode = '';
  private renderedRows: string[] = [];
  private progress: Partial<Record<SourceKey, CrawlProgress['state'] | 'stopped'>> = {};

  constructor(private dataset: () => Dataset, private logs: () => string[], private busy: () => boolean) {}

  markup(): string {
    return `<section class="panel swarm-panel" aria-labelledby="swarm-title">
      <div class="swarm-heading"><div><h2 id="swarm-title">Claus crawler swarm</h2><p>Demo motion · real records</p></div><button type="button" class="button motion-control" data-swarm="motion">Pause motion</button></div>
      <div class="swarm-workspace"><div class="swarm-map">
        <svg class="swarm-scene" viewBox="0 0 540 280" aria-hidden="true">
          <defs><pattern id="swarm-grid" width="24" height="24" patternUnits="userSpaceOnUse"><circle class="swarm-grid-dot" cx="1" cy="1" r=".8"/></pattern></defs>
          <rect class="swarm-grid" width="540" height="280" fill="url(#swarm-grid)"/>
          <g class="swarm-trails">${trails.map((trail,i)=>`<path class="swarm-trail" data-trail="${i}" d="${trail.map((point,j)=>`${j?'L':'M'}${routePoint(i,point).join(' ')}`).join(' ')}"/>`).join('')}</g>
          ${sourceNodes.map(n => { const [x,y] = points[n.point]; return `<g class="swarm-node" data-source="${n.key}" transform="translate(${x} ${y})"><circle class="node-ring" r="22"/><circle class="node-core" r="5"/><text y="${y<140?-35:37}" text-anchor="middle">${n.name}</text><text class="node-state" y="${y<140?-20:53}" text-anchor="middle">Recorded</text></g>`; }).join('')}
          <g class="swarm-hub" transform="translate(270 140)"><circle class="hub-orbit" r="54"/><circle class="hub-disc" r="38"/><g transform="translate(-34 -36) scale(.34)">${octopusBody}</g></g>
          ${agentDefinitions.map((a,i) => `<g class="crawler-actor" data-agent="${i}" transform="translate(${points[trails[i][0]][0]} ${points[trails[i][0]][1]})"><circle class="crawler-halo" r="20"/><g class="crawler-body"><g transform="translate(-17 -19) scale(.17)">${octopusBody}</g></g><title>${esc(a.name)}</title></g>`).join('')}
        </svg>
        <div class="swarm-map-foot"><label for="follow-agent">Follow agent<select id="follow-agent">${agentDefinitions.map((a,i)=>`<option value="${i}">${String(i+1).padStart(2,'0')} · ${esc(a.name)}</option>`).join('')}</select></label><span id="motion-state">Illustrated patrol</span></div>
        <p class="agent-caption" id="agent-caption"></p>
      </div><div class="activity-terminal">
        <div class="terminal-heading"><h3>Activity terminal</h3><span class="terminal-mark" aria-hidden="true">&gt;_</span></div>
        <div class="terminal-modes" role="group" aria-label="Terminal view"><button type="button" data-swarm="recorded" aria-pressed="true">Recorded events</button><button type="button" data-swarm="requests" aria-pressed="false">Crawl log</button></div>
        <p class="terminal-context" id="terminal-context"></p>
        <div class="terminal-feed" role="log" aria-live="off" aria-label="Activity terminal entries" tabindex="0"></div>
        <div class="terminal-actions"><button type="button" class="button" data-swarm="replay">Replay records</button><button type="button" class="button" data-swarm="latest">Jump to latest</button></div>
        <p class="terminal-status" role="status" aria-live="polite"></p>
      </div></div>
      <div class="swarm-foot"><span>7 illustrated agents · reads run on demand</span><a href="#agents">Inspect crawler modules <span aria-hidden="true">↗</span></a></div>
    </section>`;
  }

  mount(container: HTMLElement): void {
    this.root = container.querySelector('.swarm-panel');
    if (!this.root) return;
    this.visible = true;
    this.feedMode = '';
    this.renderedRows = [];
    const root = this.root;
    const click = (event: Event) => {
      const action = (event.target as Element).closest<HTMLElement>('[data-swarm]')?.dataset.swarm;
      if (action === 'motion') { this.paused = !this.paused; this.updateMotion(); }
      if (action === 'recorded' || action === 'requests') {
        this.mode = action; this.playing = false; this.clearReplay(); this.update();
      }
      if (action === 'replay') {
        this.playing = !this.playing;
        if (this.playing && this.replayCount >= this.events().length) this.replayCount = 0;
        this.update(); this.scheduleReplay();
      }
      if (action === 'latest') { const feed = root.querySelector('.terminal-feed')!; feed.scrollTop = feed.scrollHeight; }
    };
    const select = root.querySelector<HTMLSelectElement>('#follow-agent')!;
    select.value = String(this.selected);
    const change = () => { this.selected = Number(select.value); this.updateSelection(); };
    const preference = () => { if (this.reduced.matches) { this.playing = false; this.clearReplay(); } this.update(); };
    const visibility = () => { this.updateMotion(); this.scheduleReplay(); };
    root.addEventListener('click', click);
    select.addEventListener('change', change);
    this.reduced.addEventListener('change', preference);
    document.addEventListener('visibilitychange', visibility);
    const observer = new IntersectionObserver(entries => {
      this.visible = entries[0].isIntersecting;
      this.updateMotion(); this.scheduleReplay();
    });
    observer.observe(root);
    this.cleanup = () => {
      observer.disconnect(); root.removeEventListener('click', click); select.removeEventListener('change', change);
      this.reduced.removeEventListener('change', preference); document.removeEventListener('visibilitychange', visibility);
    };
    this.paint(this.elapsed); this.update(); this.scheduleReplay();
  }

  unmount(): void {
    this.cleanup?.(); this.cleanup = undefined;
    cancelAnimationFrame(this.frame); this.frame = 0; this.previousTime = 0;
    this.clearReplay(); this.root = null;
  }

  start(): void {
    this.progress = {}; this.mode = 'requests'; this.playing = false; this.clearReplay();
    this.update();
  }

  report(progress?: CrawlProgress): void {
    if (progress) this.progress[progress.source] = progress.state;
    this.update();
  }

  finish(stopped = false): void {
    if (stopped) for (const key of Object.keys(this.progress) as SourceKey[]) if (this.progress[key] === 'reading') this.progress[key] = 'stopped';
    this.update();
  }

  private events() { return uniqueEvents(this.dataset()).sort((a,b) => a.at-b.at || a.id.localeCompare(b.id)); }

  private update(): void {
    if (!this.root) return;
    const root = this.root;
    root.querySelectorAll<HTMLElement>('.terminal-modes button').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.swarm === this.mode)));
    const source = this.dataset().sources.activity;
    root.querySelector('#terminal-context')!.textContent = this.mode === 'recorded'
      ? `Recorded replay · events observed ${displayDate(source.at)}${source.mode==='live'?' in this session':''}`
      : this.busy() ? 'Reading public sources · this browser session' : 'Actual requests · this browser session';
    const events = this.events();
    this.replayCount = Math.min(this.replayCount, events.length);
    const replay = root.querySelector<HTMLButtonElement>('[data-swarm="replay"]')!;
    replay.hidden = this.mode !== 'recorded'; replay.disabled = events.length === 0;
    replay.textContent = this.playing ? 'Pause replay' : this.replayCount >= events.length ? 'Replay from start' : 'Replay records';
    const status = this.mode === 'recorded'
      ? this.playing ? 'Playing records · no live monitoring' : this.replayCount >= events.length ? 'Replay complete · no live monitoring' : 'Replay paused · no live monitoring'
      : this.busy() ? 'Requests in progress. Stop cancels pending reads.' : 'No continuous service connected.';
    const statusRegion = root.querySelector('.terminal-status')!;
    if (statusRegion.textContent !== status) statusRegion.textContent = status;
    const rows = this.mode === 'recorded' ? events.slice(0, this.replayCount).map(event => {
      const p = this.dataset().projects.find(project => project.id === event.projectId);
      return `<div class="terminal-entry"><time datetime="${new Date(event.at).toISOString()}">${new Date(event.at).toISOString().replace('T',' ').slice(0,19)} UTC</time><span class="terminal-event">${esc(eventLabel(event.kind))}</span>${p?`<a href="#project=${encodeURIComponent(p.slug)}">${esc(p.name)}</a>`:`<span>${esc(event.project||event.projectId)}</span>`}<a class="terminal-evidence" href="${esc(source.url)}" target="_blank" rel="noopener noreferrer">Event source ↗</a></div>`;
    }) : this.logs().map(line => `<div class="terminal-entry request-entry"><code>${esc(line)}</code></div>`);
    const feed = root.querySelector<HTMLElement>('.terminal-feed')!;
    const follow = feed.scrollHeight-feed.scrollTop-feed.clientHeight < 32;
    const reset = this.feedMode !== this.mode || this.renderedRows.length > rows.length || this.renderedRows.some((row,i)=>row!==rows[i]);
    if (reset) { feed.replaceChildren(); this.renderedRows = []; }
    if (!rows.length) feed.innerHTML = `<p class="terminal-empty">${this.mode === 'requests'?'No refresh started in this session. Use Refresh sources to begin.':'No events returned. Refresh sources or inspect the activity feed.'}</p>`;
    else {
      feed.querySelector('.terminal-empty')?.remove();
      for (const row of rows.slice(this.renderedRows.length)) feed.insertAdjacentHTML('beforeend', row);
    }
    this.feedMode = this.mode; this.renderedRows = rows;
    if (follow || reset) feed.scrollTop = feed.scrollHeight;
    for (const node of sourceNodes) {
      const state = this.progress[node.key];
      const element = root.querySelector<SVGGElement>(`[data-source="${node.key}"]`)!;
      element.dataset.state = state || 'recorded';
      element.querySelector('.node-state')!.textContent = ({ reading:'Reading…', received:'Received', cached:'Recorded', stopped:'Stopped' })[state||'cached'];
    }
    this.updateSelection(); this.updateMotion();
  }

  private updateSelection(): void {
    if (!this.root) return;
    this.root.querySelectorAll<SVGElement>('.crawler-actor').forEach((actor,i) => actor.classList.toggle('is-followed', i===this.selected));
    this.root.querySelectorAll<SVGElement>('.swarm-trail').forEach((trail,i) => trail.classList.toggle('is-followed', i===this.selected));
    this.root.querySelector('#agent-caption')!.textContent = `${shortNames[this.selected]} · ${agentDefinitions[this.selected].description}`;
  }

  private clearReplay(): void { clearTimeout(this.replayTimer); this.replayTimer = undefined; }
  private scheduleReplay(): void {
    this.clearReplay();
    if (!this.root || !this.playing || document.hidden || !this.visible) return;
    this.replayTimer = setTimeout(() => {
      this.replayCount = Math.min(this.events().length, this.replayCount+1);
      if (this.replayCount >= this.events().length) this.playing = false;
      this.update(); this.scheduleReplay();
    }, 1400);
  }

  private updateMotion(): void {
    if (!this.root) return;
    const running = !this.paused && !this.reduced.matches && !document.hidden && this.visible;
    this.root.dataset.motion = running ? 'running' : 'paused';
    const button = this.root.querySelector<HTMLButtonElement>('[data-swarm="motion"]')!;
    button.disabled = this.reduced.matches;
    button.textContent = this.reduced.matches ? 'Reduced motion' : this.paused ? 'Resume motion' : 'Pause motion';
    this.root.querySelector('#motion-state')!.textContent = this.reduced.matches ? 'Motion reduced by your device' : this.paused ? 'Illustration paused' : 'Illustrated patrol';
    if (!running) { cancelAnimationFrame(this.frame); this.frame=0; this.previousTime=0; return; }
    if (!this.frame) this.frame=requestAnimationFrame(this.tick);
  }

  private tick = (at: number): void => {
    if (!this.root) return;
    if (this.previousTime) this.elapsed += Math.min(at-this.previousTime, 100);
    this.previousTime=at;
    this.paint(this.elapsed);
    this.frame=requestAnimationFrame(this.tick);
  };

  private paint(elapsed: number): void {
    this.root?.querySelectorAll<SVGElement>('.crawler-actor').forEach((actor,i) => {
      const route = trails[i]; const position = (elapsed + i*3180) / (5000+i*180);
      const leg = Math.floor(position) % (route.length-1);
      const phase = position % 1; const travel = Math.min(phase/.78,1);
      const progress = travel*travel*(3-2*travel);
      const [x,y] = routePoint(i,route[leg]); const [endX,endY] = routePoint(i,route[leg+1]);
      // SVG coordinates work without CSS motion-path support and scale with the viewBox.
      actor.setAttribute('transform', `translate(${(x+(endX-x)*progress).toFixed(2)} ${(y+(endY-y)*progress).toFixed(2)})`);
      actor.dataset.phase = phase>.78 ? 'scanning' : 'walking';
    });
  }
}
