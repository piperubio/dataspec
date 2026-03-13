import { Workspace } from '../parsing/index.js';
import {
  DependencyGraph,
  createGraph,
  addNode,
  addEdge,
} from './types.js';

export function buildDependencyGraph(workspace: Workspace): DependencyGraph {
  const graph = createGraph();

  for (const source of workspace.sources) {
    addNode(graph, {
      id: `source:${source.name}`,
      type: 'source',
      name: source.name,
      file: source.file,
      line: source.line,
    });
  }

  for (const dataset of workspace.datasets) {
    addNode(graph, {
      id: `dataset:${dataset.name}`,
      type: 'dataset',
      name: dataset.name,
      file: dataset.file,
      line: dataset.line,
    });

    if (dataset.contract) {
      addEdge(graph, {
        from: `dataset:${dataset.name}`,
        to: `contract:${dataset.contract.name}`,
        type: 'references',
      });
    }
  }

  for (const contract of workspace.contracts) {
    addNode(graph, {
      id: `contract:${contract.name}`,
      type: 'contract',
      name: contract.name,
      file: contract.file,
      line: contract.line,
    });
  }

  for (const flow of workspace.flows) {
    addNode(graph, {
      id: `flow:${flow.name}`,
      type: 'flow',
      name: flow.name,
      file: flow.file,
      line: flow.line,
    });

    for (const step of flow.steps) {
      if (step.type === 'extract') {
        addEdge(graph, {
          from: `flow:${flow.name}`,
          to: `source:${step.source}`,
          type: 'references',
        });
      } else if (step.type === 'transform') {
        for (const input of step.inputs) {
          addEdge(graph, {
            from: `flow:${flow.name}`,
            to: `dataset:${input}`,
            type: 'references',
          });
        }
      } else if (step.type === 'load') {
        addEdge(graph, {
          from: `flow:${flow.name}`,
          to: `dataset:${step.input}`,
          type: 'consumes',
        });
      }
    }
  }

  return graph;
}
