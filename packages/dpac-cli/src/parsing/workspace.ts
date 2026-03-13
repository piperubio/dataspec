import { readYamlFile, scanWorkspace } from './scanner.js';
import { parseYamlWithLineNumbers } from './yaml.js';
import type {
  Source, SourceEntity,
  Dataset,
  Contract,
  Flow, FlowStep,
  PlatformConfig
} from '@dataspec/dpac-core';

export interface ParsedSource {
  name: string;
  type: string;
  entities: SourceEntity[];
  file: string;
  line: number;
}

export interface ParsedDataset {
  name: string;
  layer: string;
  storage: {
    backend: string;
    format: string;
    location: string;
  };
  contract?: {
    name: string;
    version: string;
  };
  producedBy?: string;
  file: string;
  line: number;
}

export interface ParsedContract {
  name: string;
  version: string;
  fields: Array<{
    name: string;
    type: string;
    constraints?: Record<string, unknown>;
  }>;
  file: string;
  line: number;
}

export interface ParsedFlow {
  name: string;
  steps: FlowStep[];
  file: string;
  line: number;
}

export interface ParsedPlatform {
  name?: string;
  storage?: Array<{ name: string; type: string }>;
  engines?: Array<{ name: string; type: string }>;
  file: string;
  line: number;
}

export interface Workspace {
  platform: ParsedPlatform | null;
  sources: ParsedSource[];
  datasets: ParsedDataset[];
  contracts: ParsedContract[];
  flows: ParsedFlow[];
  rootPath: string;
}

export async function parseWorkspace(dirPath: string): Promise<Workspace> {
  const resources = await scanWorkspace(dirPath);
  
  const workspace: Workspace = {
    platform: null,
    sources: [],
    datasets: [],
    contracts: [],
    flows: [],
    rootPath: dirPath,
  };

  if (resources.platformYaml) {
    const content = await readYamlFile(resources.platformYaml);
    const result = parseYamlWithLineNumbers<ParsedPlatform>(content, { file: resources.platformYaml });
    if (result.errors.length === 0 && result.data) {
      workspace.platform = {
        ...result.data,
        file: resources.platformYaml,
        line: 1,
      };
    }
  }

  for (const file of resources.sources) {
    const content = await readYamlFile(file);
    const result = parseYamlWithLineNumbers<{ name: string; type: string; entities: SourceEntity[] }>(content, { file });
    if (result.errors.length === 0 && result.data) {
      workspace.sources.push({
        ...result.data,
        file,
        line: 1,
      });
    }
  }

  for (const file of resources.datasets) {
    const content = await readYamlFile(file);
    const result = parseYamlWithLineNumbers<ParsedDataset>(content, { file });
    if (result.errors.length === 0 && result.data) {
      workspace.datasets.push({
        ...result.data,
        file,
        line: 1,
      });
    }
  }

  for (const file of resources.contracts) {
    const content = await readYamlFile(file);
    const result = parseYamlWithLineNumbers<ParsedContract>(content, { file });
    if (result.errors.length === 0 && result.data) {
      workspace.contracts.push({
        ...result.data,
        file,
        line: 1,
      });
    }
  }

  for (const file of resources.flows) {
    const content = await readYamlFile(file);
    const result = parseYamlWithLineNumbers<ParsedFlow>(content, { file });
    if (result.errors.length === 0 && result.data) {
      workspace.flows.push({
        ...result.data,
        file,
        line: 1,
      });
    }
  }

  return workspace;
}
