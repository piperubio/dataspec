import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

export interface WorkspaceResources {
  sources: string[];
  datasets: string[];
  contracts: string[];
  flows: string[];
  platformYaml: string | null;
}

export interface WorkspaceStructureResult {
  resources: WorkspaceResources;
  hasDataspecFolder: boolean;
  legacyResources: {
    platformYaml: string | null;
    sources: string[];
    datasets: string[];
    contracts: string[];
    flows: string[];
  };
}

export interface WorkspaceStructureError {
  code: 'MISSING_DATASPEC_FOLDER' | 'LEGACY_STRUCTURE';
  message: string;
  legacyResources?: string[];
}

export async function scanWorkspace(dirPath: string): Promise<WorkspaceResources> {
  const result = await scanWorkspaceWithStructure(dirPath);
  return result.resources;
}

export async function scanWorkspaceWithStructure(dirPath: string): Promise<WorkspaceStructureResult> {
  const resources: WorkspaceResources = {
    sources: [],
    datasets: [],
    contracts: [],
    flows: [],
    platformYaml: null,
  };

  const legacyResources = {
    platformYaml: null as string | null,
    sources: [] as string[],
    datasets: [] as string[],
    contracts: [] as string[],
    flows: [] as string[],
  };

  let hasDataspecFolder = false;

  try {
    const entries = await readdir(dirPath, { withFileTypes: true });
    
    // Check for dataspec/ folder
    let dataspecPath: string | null = null;
    for (const entry of entries) {
      if (entry.isDirectory() && entry.name === 'dataspec') {
        hasDataspecFolder = true;
        dataspecPath = join(dirPath, entry.name);
        break;
      }
    }

    // Scan for legacy resources at root level (for error reporting)
    for (const entry of entries) {
      if (!entry.isDirectory() && entry.name === 'platform.yaml') {
        legacyResources.platformYaml = join(dirPath, entry.name);
      }
      
      if (entry.isDirectory()) {
        const subDirPath = join(dirPath, entry.name);
        
        if (entry.name === 'sources') {
          legacyResources.sources = await scanYamlFiles(subDirPath);
        } else if (entry.name === 'datasets') {
          legacyResources.datasets = await scanYamlFilesRecursive(subDirPath);
        } else if (entry.name === 'contracts') {
          legacyResources.contracts = await scanYamlFilesRecursive(subDirPath);
        } else if (entry.name === 'flows') {
          legacyResources.flows = await scanYamlFiles(subDirPath);
        }
      }
    }

    // If dataspec folder exists, scan within it
    if (dataspecPath) {
      const dataspecEntries = await readdir(dataspecPath, { withFileTypes: true });
      
      for (const entry of dataspecEntries) {
        if (!entry.isDirectory() && entry.name === 'platform.yaml') {
          resources.platformYaml = join(dataspecPath, entry.name);
          continue;
        }
        
        if (!entry.isDirectory()) continue;
        
        const subDirPath = join(dataspecPath, entry.name);
        
        if (entry.name === 'sources') {
          resources.sources = await scanYamlFiles(subDirPath);
        } else if (entry.name === 'datasets') {
          resources.datasets = await scanYamlFilesRecursive(subDirPath);
        } else if (entry.name === 'contracts') {
          resources.contracts = await scanYamlFilesRecursive(subDirPath);
        } else if (entry.name === 'flows') {
          resources.flows = await scanYamlFiles(subDirPath);
        }
      }
    }
  } catch (e) {
    // Directory doesn't exist or not accessible
  }

  return {
    resources,
    hasDataspecFolder,
    legacyResources,
  };
}

async function scanYamlFiles(dirPath: string): Promise<string[]> {
  const files: string[] = [];
  
  try {
    const entries = await readdir(dirPath, { withFileTypes: true });
    
    for (const entry of entries) {
      if (entry.isFile() && entry.name.endsWith('.yaml')) {
        files.push(join(dirPath, entry.name));
      }
    }
  } catch (e) {
    // Directory doesn't exist
  }
  
  return files;
}

async function scanYamlFilesRecursive(dirPath: string): Promise<string[]> {
  const files: string[] = [];
  
  try {
    const entries = await readdir(dirPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = join(dirPath, entry.name);
      
      if (entry.isDirectory()) {
        const subFiles = await scanYamlFilesRecursive(fullPath);
        files.push(...subFiles);
      } else if (entry.isFile() && entry.name.endsWith('.yaml')) {
        files.push(fullPath);
      }
    }
  } catch (e) {
    // Directory doesn't exist
  }
  
  return files;
}

export async function readYamlFile(filePath: string): Promise<string> {
  return readFile(filePath, 'utf-8');
}
