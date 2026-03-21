import type { DependencyGraph, GraphNode } from './types.js';

/**
 * Get all upstream dependencies of a node (what this node depends on)
 * @param graph - The dependency graph
 * @param nodeId - The node ID to find upstream dependencies for
 * @returns Array of nodes that the given node depends on
 */
export function getUpstream(graph: DependencyGraph, nodeId: string): GraphNode[] {
  const upstream: GraphNode[] = [];
  const visited = new Set<string>();

  function traverse(currentId: string) {
    if (visited.has(currentId)) {
      return;
    }
    visited.add(currentId);

    // Find all edges where current node is the target (depends on source)
    const incomingEdges = graph.edges.filter((e) => e.to === currentId);

    for (const edge of incomingEdges) {
      const sourceNode = graph.nodes.get(edge.from);
      if (sourceNode) {
        upstream.push(sourceNode);
        traverse(edge.from);
      }
    }
  }

  traverse(nodeId);
  return upstream;
}

/**
 * Get all downstream dependents of a node (what depends on this node)
 * @param graph - The dependency graph
 * @param nodeId - The node ID to find downstream dependents for
 * @returns Array of nodes that depend on the given node
 */
export function getDownstream(graph: DependencyGraph, nodeId: string): GraphNode[] {
  const downstream: GraphNode[] = [];
  const visited = new Set<string>();

  function traverse(currentId: string) {
    if (visited.has(currentId)) {
      return;
    }
    visited.add(currentId);

    // Find all edges where current node is the source (others depend on it)
    const outgoingEdges = graph.edges.filter((e) => e.from === currentId);

    for (const edge of outgoingEdges) {
      const targetNode = graph.nodes.get(edge.to);
      if (targetNode) {
        downstream.push(targetNode);
        traverse(edge.to);
      }
    }
  }

  traverse(nodeId);
  return downstream;
}

/**
 * Get the immediate dependencies of a node (direct upstream, not recursive)
 * @param graph - The dependency graph
 * @param nodeId - The node ID
 * @returns Array of directly connected upstream nodes
 */
export function getImmediateDependencies(graph: DependencyGraph, nodeId: string): GraphNode[] {
  const incomingEdges = graph.edges.filter((e) => e.to === nodeId);
  return incomingEdges
    .map((e) => graph.nodes.get(e.from))
    .filter((n): n is GraphNode => n !== undefined);
}

/**
 * Get the immediate dependents of a node (direct downstream, not recursive)
 * @param graph - The dependency graph
 * @param nodeId - The node ID
 * @returns Array of directly connected downstream nodes
 */
export function getImmediateDependents(graph: DependencyGraph, nodeId: string): GraphNode[] {
  const outgoingEdges = graph.edges.filter((e) => e.from === nodeId);
  return outgoingEdges
    .map((e) => graph.nodes.get(e.to))
    .filter((n): n is GraphNode => n !== undefined);
}

/**
 * Find all paths between two nodes in the graph
 * @param graph - The dependency graph
 * @param fromId - Source node ID
 * @param toId - Target node ID
 * @returns Array of paths, where each path is an array of node IDs
 */
export function findPaths(graph: DependencyGraph, fromId: string, toId: string): string[][] {
  const paths: string[][] = [];
  const visited = new Set<string>();

  function dfs(currentId: string, currentPath: string[]) {
    if (currentId === toId) {
      paths.push([...currentPath]);
      return;
    }

    if (visited.has(currentId)) {
      return;
    }
    visited.add(currentId);

    const outgoingEdges = graph.edges.filter((e) => e.from === currentId);
    for (const edge of outgoingEdges) {
      currentPath.push(edge.to);
      dfs(edge.to, currentPath);
      currentPath.pop();
    }

    visited.delete(currentId);
  }

  dfs(fromId, [fromId]);
  return paths;
}

/**
 * Detect cycles in the dependency graph using DFS
 * @param graph - The dependency graph
 * @returns Array of cycles, where each cycle is an array of node IDs
 */
export function detectCycles(graph: DependencyGraph): string[][] {
  const cycles: string[][] = [];
  const visited = new Set<string>();
  const recursionStack = new Set<string>();

  function dfs(nodeId: string, path: string[]) {
    if (recursionStack.has(nodeId)) {
      // Found a cycle - extract it from the path
      const cycleStart = path.indexOf(nodeId);
      const cycle = path.slice(cycleStart);
      cycle.push(nodeId); // Close the cycle
      cycles.push(cycle);
      return;
    }

    if (visited.has(nodeId)) {
      return;
    }

    visited.add(nodeId);
    recursionStack.add(nodeId);
    path.push(nodeId);

    const outgoingEdges = graph.edges.filter((e) => e.from === nodeId);
    for (const edge of outgoingEdges) {
      dfs(edge.to, path);
    }

    path.pop();
    recursionStack.delete(nodeId);
  }

  for (const nodeId of graph.nodes.keys()) {
    if (!visited.has(nodeId)) {
      dfs(nodeId, []);
    }
  }

  return cycles;
}

/**
 * Check if the graph contains any cycles
 * @param graph - The dependency graph
 * @returns True if the graph contains at least one cycle
 */
export function hasCycles(graph: DependencyGraph): boolean {
  return detectCycles(graph).length > 0;
}

/**
 * Get all root nodes (nodes with no incoming edges)
 * @param graph - The dependency graph
 * @returns Array of root nodes
 */
export function getRootNodes(graph: DependencyGraph): GraphNode[] {
  const allTargets = new Set(graph.edges.map((e) => e.to));
  const roots: GraphNode[] = [];

  for (const [id, node] of graph.nodes) {
    if (!allTargets.has(id)) {
      roots.push(node);
    }
  }

  return roots;
}

/**
 * Get all leaf nodes (nodes with no outgoing edges)
 * @param graph - The dependency graph
 * @returns Array of leaf nodes
 */
export function getLeafNodes(graph: DependencyGraph): GraphNode[] {
  const allSources = new Set(graph.edges.map((e) => e.from));
  const leaves: GraphNode[] = [];

  for (const [id, node] of graph.nodes) {
    if (!allSources.has(id)) {
      leaves.push(node);
    }
  }

  return leaves;
}

/**
 * Get the dependency chain/impact path from a node
 * Shows the full tree of what would be affected by a change to this node
 * @param graph - The dependency graph
 * @param nodeId - The starting node ID
 * @returns Tree structure showing the impact chain
 */
export interface ImpactNode {
  node: GraphNode;
  dependents: ImpactNode[];
}

export function getImpactChain(graph: DependencyGraph, nodeId: string): ImpactNode | null {
  const startNode = graph.nodes.get(nodeId);
  if (!startNode) {
    return null;
  }

  const visited = new Set<string>();

  function buildTree(currentId: string): ImpactNode {
    const node = graph.nodes.get(currentId)!;
    visited.add(currentId);

    const outgoingEdges = graph.edges.filter((e) => e.from === currentId);
    const dependents: ImpactNode[] = [];

    for (const edge of outgoingEdges) {
      if (!visited.has(edge.to)) {
        dependents.push(buildTree(edge.to));
      }
    }

    return { node, dependents };
  }

  return buildTree(nodeId);
}

/**
 * Format an impact chain for display
 * @param chain - The impact chain from getImpactChain
 * @param indent - Current indentation level
 * @returns Formatted string representation
 */
export function formatImpactChain(chain: ImpactNode, indent: number = 0): string {
  const prefix = '  '.repeat(indent);
  let result = `${prefix}→ ${chain.node.type}:${chain.node.name}\n`;

  for (const dependent of chain.dependents) {
    result += formatImpactChain(dependent, indent + 1);
  }

  return result;
}
