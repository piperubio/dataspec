import type { SourceEntity, FlowStep } from '@dataspec/dataspec-core';

import { validateAgainstSchema } from '../validation/schema-validator.js';
import { readYamlFile, scanWorkspaceWithStructure } from './scanner.js';
import { parseYamlWithLineNumbers } from './yaml.js';

export interface ParsedSource {
  name: string;
  type: string;
  entities: SourceEntity[];
  file: string;
  line: number;
}

export interface ParsedDataset {
  name: string;
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

export interface WorkspaceStructureInfo {
  hasDataspecFolder: boolean;
}

export interface ParseResult {
  workspace: Workspace;
  structure: WorkspaceStructureInfo;
}

export async function parseWorkspace(dirPath: string): Promise<Workspace> {
  const result = await parseWorkspaceWithStructure(dirPath);
  return result.workspace;
}

export async function parseWorkspaceWithStructure(dirPath: string): Promise<ParseResult> {
  const scanResult = await scanWorkspaceWithStructure(dirPath);
  const resources = scanResult.resources;

  const workspace: Workspace = {
    platform: null,
    sources: [],
    datasets: [],
    contracts: [],
    flows: [],
    rootPath: dirPath,
  };

  const structure: WorkspaceStructureInfo = {
    hasDataspecFolder: scanResult.hasDataspecFolder,
  };

  if (resources.platformYaml) {
    const content = await readYamlFile(resources.platformYaml);
    const result = parseYamlWithLineNumbers<ParsedPlatform>(content, {
      file: resources.platformYaml,
    });
    if (result.errors.length === 0 && result.data) {
      const schemaResult = validateAgainstSchema(result.data, 'platform');
      if (!schemaResult.valid) {
        for (const error of schemaResult.errors) {
          console.warn(`Schema validation error in ${resources.platformYaml}: ${error}`);
        }
      }
      workspace.platform = {
        ...result.data,
        file: resources.platformYaml,
        line: 1,
      };
    }
  }

  for (const file of resources.sources) {
    const content = await readYamlFile(file);
    const result = parseYamlWithLineNumbers<{
      name: string;
      type: string;
      entities: SourceEntity[];
    }>(content, { file });
    if (result.errors.length === 0 && result.data) {
      const schemaResult = validateAgainstSchema(result.data, 'source');
      if (!schemaResult.valid) {
        for (const error of schemaResult.errors) {
          console.warn(`Schema validation error in ${file}: ${error}`);
        }
      }
      workspace.sources.push({
        ...result.data,
        file,
        line: typeof (result as any).line === 'number' ? (result as any).line : 1,
      });
    }
  }

  for (const file of resources.datasets) {
    const content = await readYamlFile(file);
    const result = parseYamlWithLineNumbers<ParsedDataset>(content, { file });
    if (result.errors.length === 0 && result.data) {
      const schemaResult = validateAgainstSchema(result.data, 'dataset');
      if (!schemaResult.valid) {
        for (const error of schemaResult.errors) {
          console.warn(`Schema validation error in ${file}: ${error}`);
        }
      }
      workspace.datasets.push({
        ...result.data,
        file,
        line: typeof (result as any).line === 'number' ? (result as any).line : 1,
      });
    }
  }

  for (const file of resources.contracts) {
    const content = await readYamlFile(file);
    const result = parseYamlWithLineNumbers<ParsedContract>(content, { file });
    if (result.errors.length === 0 && result.data) {
      const schemaResult = validateAgainstSchema(result.data, 'contract');
      if (!schemaResult.valid) {
        for (const error of schemaResult.errors) {
          console.warn(`Schema validation error in ${file}: ${error}`);
        }
      }
      workspace.contracts.push({
        ...result.data,
        file,
        line: typeof (result as any).line === 'number' ? (result as any).line : 1,
      });
    }
  }

  for (const file of resources.flows) {
    const content = await readYamlFile(file);
    const result = parseYamlWithLineNumbers<ParsedFlow>(content, { file });
    if (result.errors.length === 0 && result.data) {
      const schemaResult = validateAgainstSchema(result.data, 'flow');
      if (!schemaResult.valid) {
        for (const error of schemaResult.errors) {
          console.warn(`Schema validation error in ${file}: ${error}`);
        }
      }
      workspace.flows.push({
        ...result.data,
        file,
        line: typeof (result as any).line === 'number' ? (result as any).line : 1,
      });
    }
  }

  return { workspace, structure };
}
