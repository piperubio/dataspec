import { Command } from 'commander';
import { parseWorkspace } from '../parsing/index.js';
import { buildDependencyGraph, getUpstream, getDownstream } from '../graph/index.js';
export const showCommand = new Command()
    .name('show')
    .description('Show detailed information about a resource')
    .argument('<resource>', 'Resource type (source, dataset, contract, flow)')
    .argument('<name>', 'Resource name')
    .option('-p, --path <dir>', 'Path to the workspace directory', process.cwd())
    .option('-d, --deps', 'Show upstream and downstream dependencies', false)
    .option('-f, --format <format>', 'Output format (text, json)', 'text')
    .action(async (resource, name, options) => {
    try {
        const workspace = await parseWorkspace(options.path);
        if (resource === 'source') {
            showSource(workspace, name, options);
        }
        else if (resource === 'dataset') {
            showDataset(workspace, name, options);
        }
        else if (resource === 'contract') {
            showContract(workspace, name, options);
        }
        else if (resource === 'flow') {
            showFlow(workspace, name, options);
        }
        else {
            console.error(`Unknown resource type: ${resource}`);
            process.exit(2);
        }
    }
    catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error(`Error: ${message}`);
        process.exit(2);
    }
});
function showSource(workspace, name, options) {
    const source = workspace.sources.find((s) => s.name === name);
    if (!source) {
        console.error(`Source '${name}' not found.`);
        process.exit(2);
    }
    const output = {
        name: source.name,
        type: source.type,
        entities: source.entities,
        file: source.file,
    };
    if (options.deps) {
        const graph = buildDependencyGraph(workspace);
        const upstream = getUpstream(graph, `source:${name}`);
        const downstream = getDownstream(graph, `source:${name}`);
        output.upstream = upstream.map((n) => ({ type: n.type, name: n.name }));
        output.downstream = downstream.map((n) => ({ type: n.type, name: n.name }));
    }
    if (options.format === 'json') {
        console.log(JSON.stringify(output, null, 2));
    }
    else {
        console.log(`Source: ${source.name}`);
        console.log(`  Type: ${source.type}`);
        console.log(`  File: ${source.file}`);
        console.log('  Entities:');
        for (const entity of source.entities) {
            console.log(`    - ${entity.name}${entity.description ? `: ${entity.description}` : ''}`);
        }
    }
}
function showDataset(workspace, name, options) {
    const dataset = workspace.datasets.find((d) => d.name === name);
    if (!dataset) {
        console.error(`Dataset '${name}' not found.`);
        process.exit(2);
    }
    const output = {
        name: dataset.name,
        layer: dataset.layer,
        storage: dataset.storage,
        file: dataset.file,
    };
    if (dataset.contract) {
        output.contract = dataset.contract;
    }
    if (options.deps) {
        const graph = buildDependencyGraph(workspace);
        const upstream = getUpstream(graph, `dataset:${name}`);
        const downstream = getDownstream(graph, `dataset:${name}`);
        output.upstream = upstream.map((n) => ({ type: n.type, name: n.name }));
        output.downstream = downstream.map((n) => ({ type: n.type, name: n.name }));
    }
    if (options.format === 'json') {
        console.log(JSON.stringify(output, null, 2));
    }
    else {
        console.log(`Dataset: ${dataset.name}`);
        console.log(`  Layer: ${dataset.layer}`);
        console.log(`  Storage: ${dataset.storage.format} @ ${dataset.storage.location}`);
        if (dataset.contract) {
            console.log(`  Contract: ${dataset.contract.name} (${dataset.contract.version})`);
        }
        console.log(`  File: ${dataset.file}`);
    }
}
function showContract(workspace, name, options) {
    const contract = workspace.contracts.find((c) => c.name === name);
    if (!contract) {
        console.error(`Contract '${name}' not found.`);
        process.exit(2);
    }
    const output = {
        name: contract.name,
        version: contract.version,
        fields: contract.fields,
        file: contract.file,
    };
    if (options.format === 'json') {
        console.log(JSON.stringify(output, null, 2));
    }
    else {
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
function showFlow(workspace, name, options) {
    const flow = workspace.flows.find((f) => f.name === name);
    if (!flow) {
        console.error(`Flow '${name}' not found.`);
        process.exit(2);
    }
    const output = {
        name: flow.name,
        steps: flow.steps,
        file: flow.file,
    };
    if (options.deps) {
        const graph = buildDependencyGraph(workspace);
        const upstream = getUpstream(graph, `flow:${name}`);
        const downstream = getDownstream(graph, `flow:${name}`);
        output.upstream = upstream.map((n) => ({ type: n.type, name: n.name }));
        output.downstream = downstream.map((n) => ({ type: n.type, name: n.name }));
    }
    if (options.format === 'json') {
        console.log(JSON.stringify(output, null, 2));
    }
    else {
        console.log(`Flow: ${flow.name}`);
        console.log(`  File: ${flow.file}`);
        console.log('  Steps:');
        for (const step of flow.steps) {
            if (step.type === 'extract') {
                console.log(`    - extract: ${step.source}.${step.entity} → ${step.output}`);
            }
            else if (step.type === 'transform') {
                console.log(`    - transform: ${step.inputs.join(', ')} → ${step.output} (${step.engine})`);
            }
            else if (step.type === 'load') {
                console.log(`    - load: ${step.input} → ${step.target}`);
            }
        }
    }
}
//# sourceMappingURL=show.js.map