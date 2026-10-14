/** Refresh the bundled public observation explicitly, before rebuilding the static export. */
import { writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { CLAUS, API, loadGraph, loadContext, publicJSON, parseActivity, parseProfile, projectsFromGraph, getWithFallback } from '../src/data.ts';
const args=process.argv.slice(2);const output=args[args.indexOf('--out')+1];
if(!args.includes('--out')||!output)throw new Error('Supply --out src/data/snapshot.json (or an external review path)');
const signal=AbortSignal.timeout(180000);
const [overview,graph,activity,context]=await Promise.all([
 loadGraph('projects',signal),loadGraph('full',signal),publicJSON(`${CLAUS}/api/network-activity`,signal).then(parseActivity),loadContext(signal)
]);
if(!overview.source.complete||!graph.source.complete||!context.source.complete||!activity.complete)throw new Error('Incomplete source observation; existing snapshot has not been changed');
const profiles={},profileErrors={};
for(const project of projectsFromGraph(overview.graph)) {
 try {
  const {raw,url}=await getWithFallback(`${CLAUS}/network.json?project=${project.slug}`,`${API}/v1/public/projects/${project.slug}`,signal);
  const parsed=parseProfile(raw,project.slug,url);if(parsed.projectId!==project.id)throw new Error('Project identity mismatch');
  profiles[project.slug]={raw,capturedAt:parsed.capturedAt,source:url};
 } catch(e) {if(signal.aborted)throw e;profileErrors[project.slug]={error:e.message};}
}
const sources={overview:overview.source,graph:graph.source,activity:{at:activity.observedAt,url:`${CLAUS}/api/network-activity`,complete:activity.complete},context:context.source};
for(const source of Object.values(sources))source.mode='cached';
const snapshot={capturedAt:Date.now(),overview:overview.graph,graph:graph.graph,activity,context:context.context,profiles,profileErrors,sources};
await writeFile(resolve(output),JSON.stringify(snapshot)+'\n');
console.log(JSON.stringify({output,projects:projectsFromGraph(overview.graph).length,profiles:Object.keys(profiles).length,profileErrors:Object.keys(profileErrors).length,capturedAt:snapshot.capturedAt}));
