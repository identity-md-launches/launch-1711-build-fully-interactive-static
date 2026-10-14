import { CLAUS, record, finite } from './data.ts';
import type { Dataset, Finding, Profile, Project } from './types.ts';

export const agentDefinitions = [
  { id:'launch', name:'Launch discovery', description:'Reads published Claus profiles and records first observations.' },
  { id:'metadata', name:'Metadata monitor', description:'Compares stable project IDs, profile revisions and public metadata.' },
  { id:'similarity', name:'Name similarity', description:'Flags exact normalized names for review. Similarity is never ownership evidence.' },
  { id:'history', name:'Project & creator history', description:'Connects public releases to a project. Creator matching awaits a reliable public identity.' },
  { id:'relationships', name:'Relationship discovery', description:'Reads explicit Claus graph edges; does not infer common control.' },
  { id:'risk', name:'Evidence review', description:'Surfaces attributed decision caveats. Does not issue a safety score.' },
  { id:'activity', name:'Activity summary', description:'Groups returned events by UTC day, with source coverage attached.' }
];
export const uniqueEvents = (data: Dataset) => [...new Map(data.activity.events.map(e => [e.id,e])).values()];
export function homeProjects(data: Dataset): Project[] {
  const ids = new Set(data.context.projects.map(p=>p.id));
  return data.projects.filter(p=>ids.has(p.id));
}
export function launches(data: Dataset) {
  const byId = new Map(data.projects.map(p=>[p.id,p]));
  return uniqueEvents(data).filter(e=>e.kind==='project.published' && byId.has(e.projectId)).sort((a,b)=>b.at-a.at).map(e=>({event:e,project:byId.get(e.projectId)!}));
}
export function updates(data: Dataset) {
  return [...homeProjects(data)].filter(p=>p.updatedAt).sort((a,b)=>(b.updatedAt||0)-(a.updatedAt||0));
}
export function activityDays(data: Dataset, days = 7) {
  const day = 86400000, end = Math.floor(data.sources.activity.at/day)*day;
  const events = uniqueEvents(data);
  return Array.from({length:days},(_,i)=>{ const at=end-(days-1-i)*day; const returned=events.filter(e=>e.at>=at&&e.at<at+day); return {at,publications:returned.filter(e=>e.kind==='project.published').length,updates:returned.filter(e=>e.kind!=='project.published').length,total:returned.length}; });
}
export function similarityFindings(data: Dataset): Finding[] {
  const groups = new Map<string,Project[]>();
  for(const p of new Map(data.projects.map(p=>[p.id,p])).values()) { const key=p.name.normalize('NFKC').trim().toLocaleLowerCase('en-US').replace(/\s+/g,' '); if(key) groups.set(key,[...(groups.get(key)||[]),p]); }
  return [...groups.values()].filter(g=>g.length>1).map(g=>({
    id:`name:${g.map(p=>p.id).sort().join(':')}`, agent:'similarity',projectIds:g.map(p=>p.id),title:`Shared name: ${g[0].name}`,
    explanation:`${g.length} distinct Claus project IDs use this name. This is a review hypothesis, not evidence of impersonation, shared ownership or malicious behavior.`,
    kind:'hypothesis',confidence:'low',observedAt:data.sources.overview.at,sources:g.map(p=>`${CLAUS}/read/network/${p.slug}`)
  }));
}
export function publishedRiskNotes(profile: Profile | undefined): Finding[] {
  if(!profile) return [];
  return (profile.evidence?.decisions||[]).flatMap((item,i)=>{
    if(!record(item)||!Array.isArray(item.risks)||typeof item.completedAt!=='string') return [];
    const at = Date.parse(item.completedAt); if(!finite(at)||at>profile.capturedAt) return [];
    return item.risks.filter((r):r is string=>typeof r==='string'&&!!r.trim()).map((text,j)=>({
      id:`review:${profile.projectId}:${typeof item.id==='string'?item.id:i}:${j}`,agent:'risk',projectIds:[profile.projectId],title:'Published review caveat',
      explanation:text,kind:'observation' as const,confidence:'high' as const,observedAt:at,sources:[profile.source]
    }));
  });
}
export function changeFindings(data: Dataset, previous?: Dataset): Finding[] {
  if(!previous) return [];
  const before = new Map(previous.projects.map(p=>[p.id,p]));
  // A failed/partial read cannot establish deletion; compare only records actually returned live.
  if(data.sources.overview.mode!=='live') return [];
  return data.projects.flatMap(p=>{
    const old=before.get(p.id);const changes=old?(['name','description','revision','status'] as const).filter(k=>old[k]!==p[k]).map(k=>({field:k,before:old[k],after:p[k]})):[];
    if(old&&!changes.length) return [];
    return [{id:`change:${p.id}:${data.sources.overview.at}`,agent:old?'metadata':'launch',projectIds:[p.id],title:old?'Public metadata changed':'First observed in this crawler',
      changes, explanation:old?`Changed ${changes.map(c=>c.field).join(', ')}. Compared with the observation at ${new Date(previous.sources.overview.at).toISOString()}. This is a metadata change, not a security finding.`:'First seen in this local history. This does not establish the project creation time or first publication.',
      kind:'observation' as const,confidence:'high' as const,observedAt:data.sources.overview.at,sources:[data.sources.overview.url]}];
  });
}
export function verifiedRelationships(data: Dataset, project: Project) {
  const ids = new Set(data.projects.map(p=>p.id));
  return [...new Map(data.graph.edges.filter(e=>(e.source===project.id||e.target===project.id)&&ids.has(e.source)&&ids.has(e.target)).map(e=>[`${e.source}:${e.relation}:${e.target}`,e])).values()];
}
export function verifiedDeployments(profile: Profile | undefined) {
  return (profile?.evidence?.deployments||[]).filter(record).flatMap(d=>{
    if(d.verification!=='verified'||typeof d.address!=='string'||!/^0x[a-fA-F0-9]{40}$/.test(d.address)||!([1,11155111].includes(Number(d.chainId)))) return [];
    const origin=Number(d.chainId)===1?'https://etherscan.io':'https://sepolia.etherscan.io';
    const tx=typeof d.transactionHash==='string'&&/^0x[a-fA-F0-9]{64}$/.test(d.transactionHash)?d.transactionHash:null;
    return [{address:d.address,chainId:Number(d.chainId),url:`${origin}/address/${d.address}`,transaction:tx?`${origin}/tx/${tx}`:null,source:profile!.source,at:profile!.capturedAt}];
  });
}
export function runAgents(data: Dataset, previous?: Dataset): Finding[] {
  return [...new Map([...changeFindings(data,previous),...similarityFindings(data),...Object.values(data.profiles).flatMap(publishedRiskNotes)].map(f=>[f.id,f])).values()];
}
