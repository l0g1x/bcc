/**
 * Types for Beads IDE graph visualization and metrics.
 * These types map to bv CLI robot command outputs.
 */

/**
 * A bead node in the graph.
 */
export interface GraphNode {
  id: string;
  title: string;
  status: string;
  priority?: number;
  labels?: string[];
  type?: string;
}

/**
 * A dependency edge in the graph.
 */
export interface GraphEdge {
  from: string;
  to: string;
  type: string;
}

/**
 * Graph statistics from bv.
 */
export interface GraphStats {
  nodes: number;
  edges: number;
  density: number;
  avgDegree?: number;
}

/**
 * Graph export from bv --robot-graph.
 */
export interface GraphExport {
  generated_at: string;
  data_hash: string;
  format: 'json' | 'dot' | 'mermaid';
  nodes: GraphNode[];
  edges: GraphEdge[];
  stats: GraphStats;
}

/**
 * A ranked metric entry (used for PageRank, betweenness, etc.)
 */
export interface RankedMetric {
  id: string;
  title: string;
  score: number;
  rank?: number;
}

/**
 * HITS scores (authorities and hubs).
 */
export interface HITSScores {
  authorities: RankedMetric[];
  hubs: RankedMetric[];
}

/**
 * Cycle information from graph analysis.
 */
export interface CycleInfo {
  count: number;
  cycles: string[][];
}

/**
 * Degree metrics for a node.
 */
export interface DegreeMetrics {
  id: string;
  title: string;
  inDegree: number;
  outDegree: number;
  totalDegree: number;
}

/**
 * Critical path information.
 */
export interface CriticalPath {
  length: number;
  path: string[];
  slack: Record<string, number>;
}

/**
 * Topological sort order.
 */
export interface TopoSort {
  order: string[];
  levels: Record<string, number>;
}

/**
 * The 9 graph metrics exposed by the backend.
 * Maps bv robot-insights output to a normalized structure.
 */
export interface GraphMetrics {
  /** ISO timestamp when metrics were generated */
  generated_at: string;
  /** Hash of source data for cache validation */
  data_hash: string;

  /** 1. PageRank - influence scores */
  pagerank: RankedMetric[];

  /** 2. Betweenness centrality - bottleneck nodes */
  betweenness: RankedMetric[];

  /** 3. HITS scores - authorities and hubs */
  hits: HITSScores;

  /** 4. Critical path length and slack */
  criticalPath: CriticalPath;

  /** 5. Eigenvector centrality - keystone nodes */
  eigenvector: RankedMetric[];

  /** 6. Degree metrics (in/out degree) */
  degree: DegreeMetrics[];

  /** 7. Graph density (edges / max possible edges) */
  density: number;

  /** 8. Cycle count and cycle details */
  cycles: CycleInfo;

  /** 9. Topological sort order */
  topoSort: TopoSort;

  /** Graph statistics summary */
  stats: GraphStats;

  /** Raw status from bv */
  status?: Record<string, unknown>;

  /** Usage hints for agents */
  usageHints?: string[];
}

/**
 * Error response when bv is unavailable or fails.
 */
export interface GraphError {
  ok: false;
  error: string;
  code: 'BV_NOT_FOUND' | 'BV_ERROR' | 'PARSE_ERROR' | 'NO_BEADS';
}

/**
 * Successful graph metrics response.
 */
export interface GraphMetricsResponse {
  ok: true;
  metrics: GraphMetrics;
}

/**
 * Successful graph export response.
 */
export interface GraphExportResponse {
  ok: true;
  graph: GraphExport;
}

/** Union type for graph metrics endpoint */
export type GraphMetricsResult = GraphMetricsResponse | GraphError;

/** Union type for graph export endpoint */
export type GraphExportResult = GraphExportResponse | GraphError;
