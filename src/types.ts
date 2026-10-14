export interface Project {
  id: string; slug: string; name: string; description: string;
  status: string; updatedAt: number | null; revision: number | null;
}
export interface GraphNode {
  id: string; slug?: string; label?: string; kind: string; description?: string;
  status?: string; updatedAt?: number; revision?: number;
  presentation?: { name?: string; description?: string };
}
export interface Edge { source: string; target: string; relation: string }
export interface Graph {
  nodes: GraphNode[]; resources: { id: string; projectId?: string; kind: string }[];
  edges: Edge[]; nextCursor: string | null; observedAt?: number;
}
export interface ActivityEvent { id: string; projectId: string; project: string; kind: string; at: number; href: string }
export interface Activity { observedAt: number; complete: boolean; scanned: number; events: ActivityEvent[] }
export interface ContextProject {
  id: string; slug: string; name: string; description: string; detailStatus: string;
  interfaces?: unknown[]; services?: unknown[]; agents?: unknown[]; application?: unknown;
}
export interface NetworkContext {
  observedAt: number; projects: ContextProject[];
  graphComplete: boolean; detailsComplete: boolean; nextCursor: string | null; scope: string;
}
export interface Profile {
  slug: string; name: string; projectId: string; published: boolean; updatedAt: number | null;
  revision: number | null; description: string;
  counts: { agents: number; services: number; results: number; releases: number; signals: number; applications: number };
  source: string; capturedAt: number;
  mode?: SourceMode;
  releases?: Release[];
  agents?: { id: string; name: string }[];
  evidence?: { reviews: unknown[]; decisions: unknown[]; deployments: unknown[] };
}
export interface Release { id: string; url: string; createdAt: number; expiresAt: number | null }
export interface Finding {
  id: string; agent: string; projectIds: string[]; title: string; explanation: string;
  kind: 'observation' | 'hypothesis' | 'warning'; confidence: 'high' | 'low';
  observedAt: number; sources: string[];
  changes?: { field: string; before: string | number | null; after: string | number | null }[];
}
export type SourceMode = 'cached' | 'live';
export interface SourceInfo { mode: SourceMode; at: number; complete: boolean; url: string; note?: string }
export interface Dataset {
  projects: Project[]; graph: Graph; activity: Activity; context: NetworkContext;
  profiles: Record<string, Profile>; sources: Record<'overview' | 'graph' | 'activity' | 'context', SourceInfo>;
}
export type SourceKey = keyof Dataset['sources'];
export interface CrawlProgress { source: SourceKey; state: 'reading' | 'received' | 'cached' }
export interface ScanResult {
  project: Project; profile?: Profile; profileSource: SourceInfo;
  events: ActivityEvent[]; signal: string; latestAt: number | null; observedAt: number;
  graphResources: number; connections: number; context?: ContextProject;
}
