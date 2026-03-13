import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

export interface WorkspaceResources {
  sources: string[];
  datasets: string[];
  contracts: string[];
  flows: string[];
  platformYaml: string | null;
}

export async function scanWorkspace(dirPath: string): Promise<WorkspaceResources> {
  const resources: WorkspaceResources = {
    sources: [],
    datasets: [],
    contracts: [],
    flows: [],
    platformYaml: null,
  };

  try {
    const entries = await readdir(dirPath, { withFileTypes: true });
    
    for (const entry of entries) {
      if (!entry.isDirectory() && entry.name === 'platform.yaml') {
        resources.platformYaml = join(dirPath, entry.name);
        continue;
      }
      
      if (!entry.isDirectory()) continue;
      
      const subDirPath = join(dirPath, entry.name);
      
      if (entry.name === 'sources') {
        resources.sources = await scanYamlFiles(subDirPath, dirPath);
      } else if (entry.name === 'datasets') {
        resources.datasets = await scanYamlFilesRecursive(subDirPath, dirPath);
      } else if (entry.name === 'contracts') {
        resources.contracts = await scanYamlFilesRecursive(subDirPath, dirPath);
      } else if (entry.name === 'flows') {
        resources.flows = await scanYamlFiles(subDirPath, dirPath);
      }
    }
  } catch (e) {
    // Directory doesn't exist or not accessible
  }

  return resources;
}

async function scanYamlFiles(dirPath: string, _basePath: string): Promise<string[]> {
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

async function scanYamlFilesRecursive(dirPath: string, basePath: string): Promise<string[]> {
  const files: string[] = [];
  
  try {
    const entries = await readdir(dirPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = join(dirPath, entry.name);
      
      if (entry.isDirectory()) {
        const subFiles = await scanYamlFilesRecursive(fullPath, basePath);
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
