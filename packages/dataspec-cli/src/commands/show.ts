import { Command } from 'commander';

import {
  buildDependencyGraph,
  getUpstream,
  getDownstream,
  type GraphNode,
} from '../graph/index.js';
import { parseWorkspace, type Workspace } from '../parsing/index.js';

export const showCommand = new Command()
  .name('show')
  .description('Show detailed information about a resource')
  .argument('<resource>', 'Resource type (source, dataset, contract, flow)')
  .argument('<name>', 'Resource name')
  .option('-p, --path <dir>', 'Path to the workspace directory', process.cwd())
  .option('-d, --deps', 'Show upstream and downstream dependencies', false)
  .option('-f, --format <format>', 'Output format (text, json)', 'text')
  .action(async (resource: string, name: string, options) => {
    try {
      const workspace = await parseWorkspace(options.path);

      if (resource === 'source') {
        showSource(workspace, name, options);
      } else if (resource === 'dataset') {
        showDataset(workspace, name, options);
      } else if (resource === 'contract') {
        showContract(workspace, name, options);
      } else if (resource === 'flow') {
        showFlow(workspace, name, options);
      } else {
        console.error(`Unknown resource type: ${resource}`);
        process.exit(2);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`Error: ${message}`);
      process.exit(2);
    }
  });

function showSource(
  workspace: Workspace,
  name: string,
  options: { format: string; deps: boolean },
): void {
  const source = workspace.sources.find((s: { name: string }) => s.name === name);

  if (!source) {
    console.error(`Source '${name}' not found.`);
    process.exit(2);
  }

  const output: Record<string, unknown> = {
    name: source.name,
    type: source.type,
    entities: source.entities,
    file: source.file,
  };

  let upstream: GraphNode[] = [];
  let downstream: GraphNode[] = [];

  if (options.deps) {
    const graph = buildDependencyGraph(workspace);
    upstream = getUpstream(graph, `source:${name}`);
    downstream = getDownstream(graph, `source:${name}`);
    output.upstream = upstream.map((n: GraphNode) => ({ type: n.type, name: n.name }));
    output.downstream = downstream.map((n: GraphNode) => ({ type: n.type, name: n.name }));
  }

  if (options.format === 'json') {
    console.log(JSON.stringify(output, null, 2));
  } else {
    console.log(`Source: ${source.name}`);
    console.log(`  Type: ${source.type}`);
    console.log(`  File: ${source.file}`);
    console.log('  Entities:');
    for (const entity of source.entities) {
      console.log(`    - ${entity.name}${entity.description ? `: ${entity.description}` : ''}`);
    }
    if (options.deps) {
      console.log('  Upstream:');
      if (upstream.length === 0) {
        console.log('    (none)');
      } else {
        for (const n of upstream) {
          console.log(`    - ${n.type}:${n.name}`);
        }
      }
      console.log('  Downstream:');
      if (downstream.length === 0) {
        console.log('    (none)');
      } else {
        for (const n of downstream) {
          console.log(`    - ${n.type}:${n.name}`);
        }
      }
    }
  }
}

function showDataset(
  workspace: Workspace,
  name: string,
  options: { format: string; deps: boolean },
): void {
  const dataset = workspace.datasets.find((d: { name: string }) => d.name === name);

  if (!dataset) {
    console.error(`Dataset '${name}' not found.`);
    process.exit(2);
  }

  const output: Record<string, unknown> = {
    name: dataset.name,
    storage: dataset.storage,
    file: dataset.file,
  };

  if (dataset.contract) {
    output.contract = dataset.contract;
  }

  let upstream: GraphNode[] = [];
  let downstream: GraphNode[] = [];

  if (options.deps) {
    const graph = buildDependencyGraph(workspace);
    upstream = getUpstream(graph, `dataset:${name}`);
    downstream = getDownstream(graph, `dataset:${name}`);
    output.upstream = upstream.map((n: GraphNode) => ({ type: n.type, name: n.name }));
    output.downstream = downstream.map((n: GraphNode) => ({ type: n.type, name: n.name }));
  }

  if (options.format === 'json') {
    console.log(JSON.stringify(output, null, 2));
  } else {
    console.log(`Dataset: ${dataset.name}`);
    console.log(`  Storage: ${dataset.storage.format} @ ${dataset.storage.location}`);
    if (dataset.contract) {
      console.log(`  Contract: ${dataset.contract.name} (${dataset.contract.version})`);
    }
    console.log(`  File: ${dataset.file}`);
    if (options.deps) {
      console.log('  Upstream:');
      if (upstream.length === 0) {
        console.log('    (none)');
      } else {
        for (const n of upstream) {
          console.log(`    - ${n.type}:${n.name}`);
        }
      }
      console.log('  Downstream:');
      if (downstream.length === 0) {
        console.log('    (none)');
      } else {
        for (const n of downstream) {
          console.log(`    - ${n.type}:${n.name}`);
        }
      }
    }
  }
}

function showContract(
  workspace: Workspace,
  name: string,
  options: { format: string; deps: boolean },
): void {
  const contract = workspace.contracts.find((c: { name: string }) => c.name === name);

  if (!contract) {
    console.error(`Contract '${name}' not found.`);
    process.exit(2);
  }

  const output: Record<string, unknown> = {
    name: contract.name,
    version: contract.version,
    fields: contract.fields,
    file: contract.file,
  };

  if (options.format === 'json') {
    console.log(JSON.stringify(output, null, 2));
  } else {
    console.log(`Contract: ${contract.name}`);
    console.log(`  Version: ${contract.version}`);
    console.log(`  File: ${contract.file}`);
    console.log('  Fields:');
    for (const field of contract.fields) {
      let fieldInfo = `    - ${field.name}: ${field.type}`;
      if (field.constraints) {
        const constraints = Object.entries(field.constraints)
          .map(([k, v]) => `${k}=${v}`)
          .join(', ');
        fieldInfo += ` [${constraints}]`;
      }
      console.log(fieldInfo);
    }
  }
}

function showFlow(
  workspace: Workspace,
  name: string,
  options: { format: string; deps: boolean },
): void {
  const flow = workspace.flows.find((f: { name: string }) => f.name === name);

  if (!flow) {
    console.error(`Flow '${name}' not found.`);
    process.exit(2);
  }

  const output: Record<string, unknown> = {
    name: flow.name,
    steps: flow.steps,
    file: flow.file,
  };

  if (options.deps) {
    const graph = buildDependencyGraph(workspace);
    const upstream = getUpstream(graph, `flow:${name}`);
    const downstream = getDownstream(graph, `flow:${name}`);
    output.upstream = upstream.map((n: GraphNode) => ({ type: n.type, name: n.name }));
    output.downstream = downstream.map((n: GraphNode) => ({ type: n.type, name: n.name }));
  }

  if (options.format === 'json') {
    console.log(JSON.stringify(output, null, 2));
  } else {
    console.log(`Flow: ${flow.name}`);
    console.log(`  File: ${flow.file}`);
    console.log('  Steps:');
    for (const step of flow.steps) {
      if (step.type === 'extract') {
        console.log(`    - extract: ${step.source}.${step.entity} → ${step.output}`);
      } else if (step.type === 'transform') {
        console.log(`    - transform: ${step.inputs.join(', ')} → ${step.output} (${step.engine})`);
      } else if (step.type === 'load') {
        console.log(`    - load: ${step.input} → ${step.target}`);
      }
    }
  }
}
