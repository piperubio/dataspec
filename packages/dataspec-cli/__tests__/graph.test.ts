import { describe, it, expect } from 'bun:test';

import { buildDependencyGraph } from '../src/graph/builder';
import { createGraph, addNode, addEdge, getUpstream, getDownstream } from '../src/graph/types';
import type { Workspace } from '../src/parsing/workspace';

describe('Dependency Graph', () => {
  describe('Graph operations', () => {
    it('should create an empty graph', () => {
      const graph = createGraph();
      expect(graph.nodes.size).toBe(0);
      expect(graph.edges).toHaveLength(0);
    });

    it('should add nodes to graph', () => {
      const graph = createGraph();
      addNode(graph, {
        id: 'source:db1',
        type: 'source',
        name: 'db1',
        file: 'sources/db.yaml',
        line: 1,
      });
      expect(graph.nodes.size).toBe(1);
    });

    it('should add edges between nodes', () => {
      const graph = createGraph();
      addNode(graph, { id: 'source:db1', type: 'source', name: 'db1', file: '', line: 1 });
      addNode(graph, { id: 'flow:f1', type: 'flow', name: 'f1', file: '', line: 1 });
      addEdge(graph, { from: 'flow:f1', to: 'source:db1', type: 'references' });
      expect(graph.edges).toHaveLength(1);
    });
  });

  describe('Graph traversal', () => {
    it('should get upstream dependencies', () => {
      const graph = createGraph();
      addNode(graph, { id: 'source:db1', type: 'source', name: 'db1', file: '', line: 1 });
      addNode(graph, { id: 'flow:f1', type: 'flow', name: 'f1', file: '', line: 1 });
      addNode(graph, { id: 'dataset:d1', type: 'dataset', name: 'd1', file: '', line: 1 });
      // Edge direction: from -> to means "from uses/references to"
      // flow:f1 references source:db1 (flow uses source)
      // dataset:d1 is produced by flow:f1, so edge goes flow:f1 -> dataset:d1
      // Upstream of dataset:d1 should be flow:f1 and source:db1
      addEdge(graph, { from: 'flow:f1', to: 'source:db1', type: 'references' });
      addEdge(graph, { from: 'flow:f1', to: 'dataset:d1', type: 'produces' });

      const upstream = getUpstream(graph, 'dataset:d1');
      // Upstream traverses incoming edges, so from dataset:d1 we find edge from flow:f1
      expect(upstream.map((n) => n.id)).toContain('flow:f1');
    });

    it('should get downstream dependencies', () => {
      const graph = createGraph();
      addNode(graph, { id: 'source:db1', type: 'source', name: 'db1', file: '', line: 1 });
      addNode(graph, { id: 'flow:f1', type: 'flow', name: 'f1', file: '', line: 1 });
      addNode(graph, { id: 'dataset:d1', type: 'dataset', name: 'd1', file: '', line: 1 });
      // Edge direction: from -> to means "from uses/references to"
      // flow:f1 references source:db1 and produces dataset:d1
      // Downstream of flow:f1 should be dataset:d1
      addEdge(graph, { from: 'flow:f1', to: 'source:db1', type: 'references' });
      addEdge(graph, { from: 'flow:f1', to: 'dataset:d1', type: 'produces' });

      const downstream = getDownstream(graph, 'flow:f1');
      expect(downstream.map((n) => n.id)).toContain('dataset:d1');
    });
  });

  describe('buildDependencyGraph', () => {
    it('should build graph from workspace', () => {
      const workspace: Workspace = {
        platform: null,
        rootPath: '/test',
        sources: [
          {
            name: 'db1',
            type: 'database',
            entities: [],
            file: 'sources/db.yaml',
            line: 1,
          },
        ],
        datasets: [],
        contracts: [],
        flows: [],
      };

      const graph = buildDependencyGraph(workspace);
      expect(graph.nodes.size).toBe(1);
      expect(graph.nodes.has('source:db1')).toBe(true);
    });

    it('should create edges for dataset-contract references', () => {
      const workspace: Workspace = {
        platform: null,
        rootPath: '/test',
        sources: [],
        datasets: [
          {
            name: 'users',
            layer: 'raw',
            storage: { backend: 's3', format: 'parquet', location: 's3://bucket/users' },
            contract: { name: 'user_contract', version: '1.0.0' },
            file: 'datasets/users.yaml',
            line: 1,
          },
        ],
        contracts: [
          {
            name: 'user_contract',
            version: '1.0.0',
            fields: [],
            file: 'contracts/user.yaml',
            line: 1,
          },
        ],
        flows: [],
      };

      const graph = buildDependencyGraph(workspace);
      expect(graph.edges).toHaveLength(1);
      expect(graph.edges[0].from).toBe('dataset:users');
      expect(graph.edges[0].to).toBe('contract:user_contract');
    });
  });
});
