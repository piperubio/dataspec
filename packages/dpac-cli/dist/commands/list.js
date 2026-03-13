import { Command } from 'commander';
import { parseWorkspace } from '../parsing/index.js';
export const listCommand = new Command()
    .name('list')
    .description('List resources in the workspace')
    .argument('[resource]', 'Resource type to list (sources, datasets, contracts, flows)')
    .option('-p, --path <dir>', 'Path to the workspace directory', process.cwd())
    .option('-f, --format <format>', 'Output format (text, json)', 'text')
    .option('-t, --tier <tier>', 'Filter datasets by tier (raw, refined, serving)')
    .action(async (resource, options) => {
    try {
        const workspace = await parseWorkspace(options.path);
        if (!resource) {
            if (options.format === 'json') {
                console.log(JSON.stringify({
                    sources: workspace.sources.length,
                    datasets: workspace.datasets.length,
                    contracts: workspace.contracts.length,
                    flows: workspace.flows.length,
                }, null, 2));
            }
            else {
                console.log('Workspace Summary:');
                console.log(`  Sources: ${workspace.sources.length}`);
                console.log(`  Datasets: ${workspace.datasets.length}`);
                console.log(`  Contracts: ${workspace.contracts.length}`);
                console.log(`  Flows: ${workspace.flows.length}`);
            }
            return;
        }
        if (resource === 'sources') {
            listSources(workspace, options);
        }
        else if (resource === 'datasets') {
            listDatasets(workspace, options);
        }
        else if (resource === 'contracts') {
            listContracts(workspace, options);
        }
        else if (resource === 'flows') {
            listFlows(workspace, options);
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
function listSources(workspace, options) {
    const sources = workspace.sources.map((s) => ({
        name: s.name,
        type: s.type,
    }));
    if (options.format === 'json') {
        console.log(JSON.stringify(sources, null, 2));
    }
    else {
        if (sources.length === 0) {
            console.log('No sources found.');
            return;
        }
        console.log('Sources:');
        console.log('NAME'.padEnd(30), 'TYPE');
        console.log('-'.repeat(50));
        for (const source of sources) {
            console.log(source.name.padEnd(30), source.type);
        }
    }
}
function listDatasets(workspace, options) {
    let datasets = workspace.datasets.map((d) => ({
        name: d.name,
        tier: d.layer,
    }));
    if (options.tier) {
        datasets = datasets.filter((d) => d.tier === options.tier);
    }
    if (options.format === 'json') {
        console.log(JSON.stringify(datasets, null, 2));
    }
    else {
        if (datasets.length === 0) {
            console.log('No datasets found.');
            return;
        }
        console.log('Datasets:');
        console.log('NAME'.padEnd(30), 'TIER');
        console.log('-'.repeat(50));
        for (const dataset of datasets) {
            console.log(dataset.name.padEnd(30), dataset.tier);
        }
    }
}
function listContracts(workspace, options) {
    const contracts = workspace.contracts.map((c) => ({
        name: c.name,
        version: c.version,
        fields: c.fields.length,
    }));
    if (options.format === 'json') {
        console.log(JSON.stringify(contracts, null, 2));
    }
    else {
        if (contracts.length === 0) {
            console.log('No contracts found.');
            return;
        }
        console.log('Contracts:');
        console.log('NAME'.padEnd(30), 'VERSION'.padEnd(15), 'FIELDS');
        console.log('-'.repeat(60));
        for (const contract of contracts) {
            console.log(contract.name.padEnd(30), contract.version.padEnd(15), contract.fields);
        }
    }
}
function listFlows(workspace, options) {
    const flows = workspace.flows.map((f) => ({
        name: f.name,
        steps: f.steps.length,
    }));
    if (options.format === 'json') {
        console.log(JSON.stringify(flows, null, 2));
    }
    else {
        if (flows.length === 0) {
            console.log('No flows found.');
            return;
        }
        console.log('Flows:');
        console.log('NAME'.padEnd(30), 'STEPS');
        console.log('-'.repeat(50));
        for (const flow of flows) {
            console.log(flow.name.padEnd(30), flow.steps);
        }
    }
}
//# sourceMappingURL=list.js.map