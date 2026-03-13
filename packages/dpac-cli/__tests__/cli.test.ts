import { describe, it, expect, beforeAll, afterAll } from 'bun:test';
import { $ } from 'bun';
import { mkdtemp, writeFile, mkdir, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

// Use 'bun' as interpreter for cross-platform compatibility
// (Windows can't execute shebang scripts directly via Bun shell)
const CLI_PATH = join(import.meta.dir, '..', 'bin', 'dpac');

// Helper to create a valid test workspace
async function createTestWorkspace(basePath: string): Promise<void> {
  await mkdir(join(basePath, 'sources'), { recursive: true });
  await mkdir(join(basePath, 'datasets', 'raw'), { recursive: true });
  await mkdir(join(basePath, 'flows'), { recursive: true });

  await writeFile(join(basePath, 'platform.yaml'), `name: test-platform
version: "0.1.0"
description: Test platform

storage:
  - name: data-lake
    type: s3
`);

  await writeFile(join(basePath, 'sources', 'test_db.yaml'), `name: test_db
type: database
entities:
  - name: users
    description: Users table
`);

  await writeFile(join(basePath, 'datasets', 'raw', 'users_raw.yaml'), `name: users_raw
layer: raw
storage:
  backend: data-lake
  format: parquet
  location: s3://bucket/users/
`);

  await writeFile(join(basePath, 'flows', 'test_flow.yaml'), `name: test_flow
steps:
  - type: extract
    source: test_db
    entity: users
    output: users_raw
`);
}

describe('CLI Integration', () => {
  let testWorkspace: string;

  beforeAll(async () => {
    testWorkspace = await mkdtemp(join(tmpdir(), 'dpac-cli-test-'));
    await createTestWorkspace(testWorkspace);
  });

  afterAll(async () => {
    await rm(testWorkspace, { recursive: true, force: true });
  });

  describe('dpac validate', () => {
    it('should validate a valid workspace', async () => {
      const result = await $`bun ${CLI_PATH} validate --path ${testWorkspace}`;
      expect(result.exitCode).toBe(0);
      expect(result.stdout.toString()).toContain('Validation passed');
    });

    it('should show validation errors in invalid workspace', async () => {
      const invalidDir = await mkdtemp(join(tmpdir(), 'dpac-invalid-'));
      await mkdir(join(invalidDir, 'flows'), { recursive: true });
      await writeFile(join(invalidDir, 'platform.yaml'), 'name: test');
      await writeFile(join(invalidDir, 'flows', 'bad.yaml'), 'name: bad_flow\nsteps:\n  - type: extract\n    source: nonexistent\n    entity: test\n    output: out');
      
      const result = await $`bun ${CLI_PATH} validate --path ${invalidDir}`.nothrow();
      expect(result.exitCode).toBe(1);
      expect(result.stdout.toString()).toContain('error');
      
      await rm(invalidDir, { recursive: true, force: true });
    });
  });

  describe('dpac list', () => {
    it('should list all resources', async () => {
      const result = await $`bun ${CLI_PATH} list --path ${testWorkspace}`;
      const output = result.stdout.toString();
      expect(output).toContain('Sources: 1');
      expect(output).toContain('Datasets: 1');
      expect(output).toContain('Flows: 1');
    });

    it('should list sources', async () => {
      const result = await $`bun ${CLI_PATH} list sources --path ${testWorkspace}`;
      const output = result.stdout.toString();
      expect(output).toContain('test_db');
      expect(output).toContain('database');
    });

    it('should list datasets filtered by tier', async () => {
      const result = await $`bun ${CLI_PATH} list datasets --path ${testWorkspace} --tier raw`;
      const output = result.stdout.toString();
      expect(output).toContain('users_raw');
      expect(output).toContain('raw');
    });

    it('should output JSON when requested', async () => {
      const result = await $`bun ${CLI_PATH} list --path ${testWorkspace} --format json`;
      const json = JSON.parse(result.stdout.toString());
      expect(json.sources).toBe(1);
      expect(json.datasets).toBe(1);
    });
  });

  describe('dpac show', () => {
    it('should show dataset details', async () => {
      const result = await $`bun ${CLI_PATH} show dataset users_raw --path ${testWorkspace}`;
      const output = result.stdout.toString();
      expect(output).toContain('Dataset: users_raw');
      expect(output).toContain('Layer: raw');
    });

    it('should show source details', async () => {
      const result = await $`bun ${CLI_PATH} show source test_db --path ${testWorkspace}`;
      const output = result.stdout.toString();
      expect(output).toContain('Source: test_db');
      expect(output).toContain('database');
    });

    it('should return error for non-existent resource', async () => {
      const result = await $`bun ${CLI_PATH} show dataset nonexistent --path ${testWorkspace}`.nothrow();
      expect(result.exitCode).toBe(2);
    });

    it('should show JSON format', async () => {
      const result = await $`bun ${CLI_PATH} show dataset users_raw --path ${testWorkspace} --format json`;
      const json = JSON.parse(result.stdout.toString());
      expect(json.name).toBe('users_raw');
      expect(json.layer).toBe('raw');
    });

    it('should show with dependencies', async () => {
      const result = await $`bun ${CLI_PATH} show dataset users_raw --path ${testWorkspace} --deps`;
      const output = result.stdout.toString();
      expect(output).toContain('Dataset: users_raw');
    });
  });

  describe('dpac init', () => {
    it('should create project structure', async () => {
      const tempDir = await mkdtemp(join(tmpdir(), 'dpac-test-'));
      
      try {
        const result = await $`bun ${CLI_PATH} init --path ${tempDir} --name test-project`;
        expect(result.exitCode).toBe(0);
        expect(result.stdout.toString()).toContain('Initialized DPAC project');
        
        const fs = await import('node:fs/promises');
        const entries = await fs.readdir(tempDir);
        expect(entries).toContain('sources');
        expect(entries).toContain('datasets');
        expect(entries).toContain('contracts');
        expect(entries).toContain('flows');
        expect(entries).toContain('platform.yaml');
      } finally {
        await rm(tempDir, { recursive: true, force: true });
      }
    });

    it('should fail in non-empty directory without --force', async () => {
      const tempDir = await mkdtemp(join(tmpdir(), 'dpac-test-'));
      
      try {
        await writeFile(join(tempDir, 'existing.txt'), 'test');
        const result = await $`bun ${CLI_PATH} init --path ${tempDir}`.nothrow();
        expect(result.exitCode).toBe(2);
      } finally {
        await rm(tempDir, { recursive: true, force: true });
      }
    });

    it('should create with examples', async () => {
      const tempDir = await mkdtemp(join(tmpdir(), 'dpac-test-'));
      
      try {
        const result = await $`bun ${CLI_PATH} init --path ${tempDir} --name test --with-examples`;
        expect(result.exitCode).toBe(0);
        
        const fs = await import('node:fs/promises');
        const sources = await fs.readdir(join(tempDir, 'sources'));
        expect(sources.length).toBeGreaterThan(0);
      } finally {
        await rm(tempDir, { recursive: true, force: true });
      }
    });
  });
});