import {
  DataHubClient,
  loadConfigWithOverrides,
  syncDatasets,
  syncSources,
  syncLineage,
  loadLastSyncTimestamp,
  saveLastSyncTimestamp,
  type DataHubConfig,
} from '@dataspec/dataspec-datahub';
import { Command } from 'commander';

import { parseWorkspaceWithStructure } from '../parsing/index.js';

function resolveConfig(
  workspacePath: string,
  overrides: { gmsUrl?: string; token?: string },
): DataHubConfig {
  return loadConfigWithOverrides(workspacePath, {
    gms_url: overrides.gmsUrl,
    token: overrides.token,
  });
}

function createClient(config: DataHubConfig): DataHubClient {
  return new DataHubClient(config);
}

function outputJson(data: unknown): void {
  console.log(JSON.stringify(data, null, 2));
}

const connectCommand = new Command('connect')
  .description('Test connection to DataHub')
  .option('-p, --path <dir>', 'Path to the workspace directory', process.cwd())
  .option('--format <format>', 'Output format (text|json)', 'text')
  .action(async (options, command) => {
    const parentOpts = command.parent?.opts() ?? {};
    try {
      const config = resolveConfig(options.path, parentOpts);
      const client = createClient(config);
      const result = await client.healthCheck();
      if (options.format === 'json') {
        outputJson({ connected: true, version: result.version.version });
      } else {
        console.log(`Connected to DataHub ${result.version.version}`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (options.format === 'json') {
        outputJson({ connected: false, error: message });
      } else {
        console.error(`Connection failed: ${message}`);
      }
      process.exit(1);
    }
  });

const syncDatasetsCmd = new Command('datasets')
  .description('Sync datasets to DataHub')
  .option('-p, --path <dir>', 'Path to the workspace directory', process.cwd())
  .option('--name <name>', 'Sync a specific dataset by name')
  .option('--incremental', 'Only sync changed datasets')
  .option('--dry-run', 'Show what would be synced without making changes')
  .option('--format <format>', 'Output format (text|json)', 'text')
  .action(async (options, command) => {
    const parentOpts = command.parent?.parent?.opts() ?? {};
    try {
      const config = resolveConfig(options.path, parentOpts);
      const { workspace } = await parseWorkspaceWithStructure(options.path);

      if (workspace.datasets.length === 0) {
        if (options.format === 'json') {
          outputJson({ synced: 0, skipped: 0, failed: 0, errors: [], dryRun: !!options.dryRun });
        } else {
          console.log('No datasets found in workspace.');
        }
        return;
      }

      if (options.dryRun) {
        const filtered = options.name
          ? workspace.datasets.filter((d) => d.name === options.name)
          : workspace.datasets;
        if (options.format === 'json') {
          outputJson({
            dryRun: true,
            datasets: filtered.map((d) => ({
              name: d.name,
              platform: d.storage.backend,
              format: d.storage.format,
            })),
          });
        } else {
          console.log('Dry run - would sync the following datasets:');
          for (const d of filtered) {
            console.log(`  - ${d.name} (${d.storage.backend}/${d.storage.format})`);
          }
        }
        return;
      }

      const client = createClient(config);

      // Load last sync timestamp for incremental sync
      const lastSyncTimestamp = options.incremental
        ? loadLastSyncTimestamp(options.path)
        : undefined;

      if (options.incremental && !lastSyncTimestamp) {
        console.log('No previous sync found. Running full sync.');
      }

      const result = await syncDatasets({
        client,
        datasets: workspace.datasets as any,
        name: options.name,
        incremental: options.incremental,
        lastSyncTimestamp,
      });

      // Persist sync timestamp on success
      if (result.synced > 0 && result.failed === 0) {
        saveLastSyncTimestamp(options.path, result.lastSyncTimestamp);
      }

      if (options.format === 'json') {
        outputJson(result);
      } else {
        console.log(
          `Datasets synced: ${result.synced}, skipped: ${result.skipped}, failed: ${result.failed}`,
        );
        for (const err of result.errors) {
          console.error(`  Error syncing ${err.dataset}: ${err.error}`);
        }
      }

      if (result.failed > 0) {
        process.exit(1);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (options.format === 'json') {
        outputJson({ error: message });
      } else {
        console.error(`Error: ${message}`);
      }
      process.exit(2);
    }
  });

const syncSourcesCmd = new Command('sources')
  .description('Sync sources to DataHub')
  .option('-p, --path <dir>', 'Path to the workspace directory', process.cwd())
  .option('--name <name>', 'Sync a specific source by name')
  .option('--dry-run', 'Show what would be synced without making changes')
  .option('--format <format>', 'Output format (text|json)', 'text')
  .action(async (options, command) => {
    const parentOpts = command.parent?.parent?.opts() ?? {};
    try {
      const config = resolveConfig(options.path, parentOpts);
      const { workspace } = await parseWorkspaceWithStructure(options.path);

      if (workspace.sources.length === 0) {
        if (options.format === 'json') {
          outputJson({
            synced: 0,
            skipped: 0,
            failed: 0,
            errors: [],
            warnings: [],
            dryRun: !!options.dryRun,
          });
        } else {
          console.log('No sources found in workspace.');
        }
        return;
      }

      if (options.dryRun) {
        const filtered = options.name
          ? workspace.sources.filter((s) => s.name === options.name)
          : workspace.sources;
        if (options.format === 'json') {
          outputJson({
            dryRun: true,
            sources: filtered.map((s) => ({ name: s.name, type: s.type })),
          });
        } else {
          console.log('Dry run - would sync the following sources:');
          for (const s of filtered) {
            console.log(`  - ${s.name} (type: ${s.type})`);
          }
        }
        return;
      }

      const client = createClient(config);
      const result = await syncSources({
        client,
        sources: workspace.sources as any,
        name: options.name,
      });

      if (options.format === 'json') {
        outputJson(result);
      } else {
        console.log(
          `Sources synced: ${result.synced}, skipped: ${result.skipped}, failed: ${result.failed}`,
        );
        for (const w of result.warnings) {
          console.warn(`  Warning: ${w}`);
        }
        for (const err of result.errors) {
          console.error(`  Error syncing ${err.source}: ${err.error}`);
        }
      }

      if (result.failed > 0) {
        process.exit(1);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (options.format === 'json') {
        outputJson({ error: message });
      } else {
        console.error(`Error: ${message}`);
      }
      process.exit(2);
    }
  });

const syncLineageCmd = new Command('lineage')
  .description('Sync lineage to DataHub')
  .option('-p, --path <dir>', 'Path to the workspace directory', process.cwd())
  .option('--flow <name>', 'Sync lineage for a specific flow')
  .option('--dry-run', 'Show what would be synced without making changes')
  .option('--format <format>', 'Output format (text|json)', 'text')
  .action(async (options, command) => {
    const parentOpts = command.parent?.parent?.opts() ?? {};
    try {
      const config = resolveConfig(options.path, parentOpts);
      const { workspace } = await parseWorkspaceWithStructure(options.path);

      if (workspace.flows.length === 0) {
        if (options.format === 'json') {
          outputJson({
            synced: 0,
            skipped: 0,
            failed: 0,
            errors: [],
            warnings: [],
            dryRun: !!options.dryRun,
          });
        } else {
          console.log('No flows found in workspace.');
        }
        return;
      }

      if (options.dryRun) {
        const filtered = options.flow
          ? workspace.flows.filter((f) => f.name === options.flow)
          : workspace.flows;
        const edgeCount = filtered.reduce((count, f) => {
          return count + f.steps.filter((s) => s.type === 'transform' || s.type === 'load').length;
        }, 0);
        if (options.format === 'json') {
          outputJson({
            dryRun: true,
            flows: filtered.map((f) => ({ name: f.name, steps: f.steps.length })),
            estimatedEdges: edgeCount,
          });
        } else {
          console.log('Dry run - would sync lineage for the following flows:');
          for (const f of filtered) {
            console.log(`  - ${f.name} (${f.steps.length} steps)`);
          }
        }
        return;
      }

      const client = createClient(config);
      const result = await syncLineage({
        client,
        flows: workspace.flows as any,
        datasets: workspace.datasets as any,
        flowName: options.flow,
      });

      if (options.format === 'json') {
        outputJson(result);
      } else {
        console.log(
          `Lineage edges synced: ${result.synced}, skipped: ${result.skipped}, failed: ${result.failed}`,
        );
        for (const w of result.warnings) {
          console.warn(`  Warning: ${w}`);
        }
        for (const err of result.errors) {
          console.error(`  Error syncing ${err.flow}: ${err.error}`);
        }
      }

      if (result.failed > 0) {
        process.exit(1);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (options.format === 'json') {
        outputJson({ error: message });
      } else {
        console.error(`Error: ${message}`);
      }
      process.exit(2);
    }
  });

const syncCommand = new Command('sync').description('Sync resources to DataHub');

syncCommand.addCommand(syncDatasetsCmd);
syncCommand.addCommand(syncSourcesCmd);
syncCommand.addCommand(syncLineageCmd);

export const datahubCommand = new Command('datahub')
  .description('DataHub integration commands')
  .option('--gms-url <url>', 'DataHub GMS URL (overrides platform.yaml)')
  .option('--token <token>', 'DataHub auth token (overrides platform.yaml)');

datahubCommand.addCommand(connectCommand);
datahubCommand.addCommand(syncCommand);
