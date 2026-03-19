import { scanWorkspaceWithStructure } from '../src/parsing/scanner.js';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

async function main() {
  const tempDir = await mkdtemp(join(tmpdir(), 'test-scanner-'));
  console.log('Temp dir:', tempDir);
  
  // Create dataspec folder
  const dsPath = join(tempDir, 'dataspec');
  await mkdir(join(dsPath, 'sources'), { recursive: true });
  await writeFile(join(dsPath, 'platform.yaml'), 'name: test');
  
  // Scan
  const result = await scanWorkspaceWithStructure(tempDir);
  console.log('hasDataspecFolder:', result.hasDataspecFolder);
  console.log('platformYaml:', result.resources.platformYaml);
  console.log('legacyResources:', result.legacyResources);
  
  // Cleanup
  await rm(tempDir, { recursive: true, force: true });
}

main().catch(console.error);
