/**
 * Lineage sync module
 * Syncs dataspec flow steps to DataHub lineage edges
 */

import type { Flow, FlowStep, Dataset } from '@dataspec/dataspec-core';

import { DataHubClient } from '../client.js';
import type { LineageEdge } from '../types.js';

export interface SyncLineageOptions {
  client: DataHubClient;
  flows: Flow[];
  datasets: Dataset[];
  flowName?: string;
}

export interface SyncLineageResult {
  synced: number;
  skipped: number;
  failed: number;
  warnings: string[];
  errors: Array<{ flow: string; error: string }>;
}

/**
 * Creates a DataHub URN for a dataset
 */
export function createDatasetUrn(platform: string, datasetName: string): string {
  return `urn:li:dataset:(urn:li:dataPlatform:${platform},${datasetName},PROD)`;
}

/**
 * Finds a dataset by name and returns its platform
 */
function findDatasetPlatform(datasets: Dataset[], datasetName: string): string | null {
  const dataset = datasets.find((d) => d.name === datasetName);
  return dataset?.storage.backend ?? null;
}

/**
 * Maps a transform step to lineage edges
 * Transform step connects inputs → output
 */
export function mapTransformStepToEdges(
  step: FlowStep & { type: 'transform' },
  datasets: Dataset[],
  flowName: string,
): { edges: LineageEdge[]; warnings: string[] } {
  const edges: LineageEdge[] = [];
  const warnings: string[] = [];

  const outputPlatform = findDatasetPlatform(datasets, step.output);
  if (!outputPlatform) {
    warnings.push(
      `Output dataset "${step.output}" not found in transform step of flow "${flowName}"`,
    );
    return { edges, warnings };
  }

  const downstreamUrn = createDatasetUrn(outputPlatform, step.output);

  for (const input of step.inputs) {
    const inputPlatform = findDatasetPlatform(datasets, input);
    if (!inputPlatform) {
      warnings.push(`Input dataset "${input}" not found in transform step of flow "${flowName}"`);
      continue;
    }

    const upstreamUrn = createDatasetUrn(inputPlatform, input);
    edges.push({
      upstreamUrn,
      downstreamUrn,
      createdOn: Date.now(),
      createdActor: `dataspec:${flowName}`,
    });
  }

  return { edges, warnings };
}

/**
 * Maps a load step to lineage edges
 * Load step connects input → target
 */
export function mapLoadStepToEdges(
  step: FlowStep & { type: 'load' },
  datasets: Dataset[],
  flowName: string,
): { edges: LineageEdge[]; warnings: string[] } {
  const edges: LineageEdge[] = [];
  const warnings: string[] = [];

  const inputPlatform = findDatasetPlatform(datasets, step.input);
  if (!inputPlatform) {
    warnings.push(`Input dataset "${step.input}" not found in load step of flow "${flowName}"`);
    return { edges, warnings };
  }

  const targetPlatform = findDatasetPlatform(datasets, step.target);
  if (!targetPlatform) {
    warnings.push(`Target dataset "${step.target}" not found in load step of flow "${flowName}"`);
    return { edges, warnings };
  }

  const upstreamUrn = createDatasetUrn(inputPlatform, step.input);
  const downstreamUrn = createDatasetUrn(targetPlatform, step.target);

  edges.push({
    upstreamUrn,
    downstreamUrn,
    createdOn: Date.now(),
    createdActor: `dataspec:${flowName}`,
  });

  return { edges, warnings };
}

/**
 * Maps a flow's steps to lineage edges
 */
export function mapFlowToLineageEdges(
  flow: Flow,
  datasets: Dataset[],
): { edges: LineageEdge[]; warnings: string[] } {
  const edges: LineageEdge[] = [];
  const warnings: string[] = [];

  for (const step of flow.steps) {
    if (step.type === 'transform') {
      const result = mapTransformStepToEdges(step, datasets, flow.name);
      edges.push(...result.edges);
      warnings.push(...result.warnings);
    } else if (step.type === 'load') {
      const result = mapLoadStepToEdges(step, datasets, flow.name);
      edges.push(...result.edges);
      warnings.push(...result.warnings);
    }
  }

  return { edges, warnings };
}

/**
 * Filters flows based on sync options
 */
function filterFlows(flows: Flow[], options: Pick<SyncLineageOptions, 'flowName'>): Flow[] {
  if (options.flowName) {
    return flows.filter((f) => f.name === options.flowName);
  }
  return flows;
}

/**
 * Syncs dataspec flow lineage to DataHub
 * Processes lineage edges in batches of 50
 */
export async function syncLineage(options: SyncLineageOptions): Promise<SyncLineageResult> {
  const { client, flows, datasets } = options;

  const filtered = filterFlows(flows, options);

  const result: SyncLineageResult = {
    synced: 0,
    skipped: 0,
    failed: 0,
    warnings: [],
    errors: [],
  };

  if (filtered.length === 0) {
    result.skipped = flows.length;
    return result;
  }

  const allEdges: LineageEdge[] = [];

  for (const flow of filtered) {
    const { edges, warnings } = mapFlowToLineageEdges(flow, datasets);
    allEdges.push(...edges);
    result.warnings.push(...warnings);
  }

  if (allEdges.length === 0) {
    return result;
  }

  try {
    const responses = await client.ingestLineageBatch(allEdges, 50);
    result.synced = responses.length;
  } catch (error) {
    for (const flow of filtered) {
      result.errors.push({
        flow: flow.name,
        error: error instanceof Error ? error.message : String(error),
      });
      result.failed++;
    }
  }

  return result;
}
