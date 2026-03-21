export type ResourceType = 'source' | 'dataset' | 'contract' | 'flow';

export interface GraphNode {
  id: string;
  type: ResourceType;
  name: string;
  file: string;
  line: number;
}

export interface GraphEdge {
  from: string;
  to: string;
  type: 'references' | 'produces' | 'consumes';
}

export interface DependencyGraph {
  nodes: Map<string, GraphNode>;
  edges: GraphEdge[];
}

export function createGraph(): DependencyGraph {
  return {
    nodes: new Map(),
    edges: [],
  };
}

export function addNode(graph: DependencyGraph, node: GraphNode): void {
  const key = `${node.type}:${node.name}`;
  graph.nodes.set(key, node);
}

export function addEdge(graph: DependencyGraph, edge: GraphEdge): void {
  graph.edges.push(edge);
}

export function getNode(
  graph: DependencyGraph,
  type: ResourceType,
  name: string,
): GraphNode | undefined {
  return graph.nodes.get(`${type}:${name}`);
}

export function getOutgoingEdges(graph: DependencyGraph, nodeId: string): GraphEdge[] {
  return graph.edges.filter((e) => e.from === nodeId);
}

export function getIncomingEdges(graph: DependencyGraph, nodeId: string): GraphEdge[] {
  return graph.edges.filter((e) => e.to === nodeId);
}

export function getUpstream(graph: DependencyGraph, startNodeId: string): GraphNode[] {
  const visited = new Set<string>();
  const result: GraphNode[] = [];

  function traverse(nodeId: string) {
    if (visited.has(nodeId)) {
      return;
    }
    visited.add(nodeId);

    if (nodeId !== startNodeId) {
      const node = graph.nodes.get(nodeId);
      if (node) {
        result.push(node);
      }
    }

    const incoming = getIncomingEdges(graph, nodeId);
    for (const edge of incoming) {
      traverse(edge.from);
    }
  }

  traverse(startNodeId);
  return result;
}

export function getDownstream(graph: DependencyGraph, startNodeId: string): GraphNode[] {
  const visited = new Set<string>();
  const result: GraphNode[] = [];

  function traverse(nodeId: string) {
    if (visited.has(nodeId)) {
      return;
    }
    visited.add(nodeId);

    if (nodeId !== startNodeId) {
      const node = graph.nodes.get(nodeId);
      if (node) {
        result.push(node);
      }
    }

    const outgoing = getOutgoingEdges(graph, nodeId);
    for (const edge of outgoing) {
      traverse(edge.to);
    }
  }

  traverse(startNodeId);
  return result;
}
