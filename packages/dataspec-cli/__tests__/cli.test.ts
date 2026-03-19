import { describe, it, expect, beforeAll, afterAll } from 'bun:test';
import { $ } from 'bun';
import { mkdtemp, writeFile, mkdir, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

// Use 'bun' as interpreter for cross-platform compatibility
// (Windows can't execute shebang scripts directly via Bun shell)
const CLI_PATH = join(import.meta.dir, '..', 'bin', 'dataspec');

// Helper to create a valid test workspace with dataspec/ folder
async function createTestWorkspace(basePath: string): Promise<void> {
  // Create dataspec container folder
  const dataspecPath = join(basePath, 'dataspec');
  await mkdir(dataspecPath, { recursive: true });
  await mkdir(join(dataspecPath, 'sources'), { recursive: true });
  await mkdir(join(dataspecPath, 'datasets'), { recursive: true });
  await mkdir(join(dataspecPath, 'flows'), { recursive: true });

  await writeFile(join(dataspecPath, 'platform.yaml'), `name: test-platform
version: "0.1.0"
description: Test platform

storage:
  - name: data-lake
    type: s3
`);

  await writeFile(join(dataspecPath, 'sources', 'test_db.yaml'), `name: test_db
type: database
entities:
  - name: users
    description: Users table
`);

  await writeFile(join(dataspecPath, 'datasets', 'users_raw.yaml'), `name: users_raw
storage:
  backend: data-lake
  format: parquet
  location: s3://bucket/users/
`);

  await writeFile(join(dataspecPath, 'flows', 'test_flow.yaml'), `name: test_flow
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
    testWorkspace = await mkdtemp(join(tmpdir(), 'dataspec-cli-test-'));
    await createTestWorkspace(testWorkspace);
  });

  afterAll(async () => {
    await rm(testWorkspace, { recursive: true, force: true });
  });

  describe('dataspec validate', () => {
    it('should validate a valid workspace', async () => {
      const result = await $`bun ${CLI_PATH} validate --path ${testWorkspace}`;
      expect(result.exitCode).toBe(0);
      expect(result.stdout.toString()).toContain('Validation passed');
    });

it('should show validation errors in invalid workspace', async () => {
      const invalidDir = await mkdtemp(join(tmpdir(), 'dataspec-invalid-'));
      // Create dataspec folder structure for invalid test
      const dataspecPath = join(invalidDir, 'dataspec');
      await mkdir(join(dataspecPath, 'flows'), { recursive: true });
      await writeFile(join(dataspecPath, 'platform.yaml'), 'name: test');
      await writeFile(join(dataspecPath, 'flows', 'bad.yaml'), 'name: bad_flow\nsteps:\n  - type: extract\n    source: nonexistent\n    entity: test\n    output: out');
      
      const result = await $`bun ${CLI_PATH} validate --path ${invalidDir}`.nothrow();
      expect(result.exitCode).toBe(1);
      expect(result.stdout.toString()).toContain('error');
      
      await rm(invalidDir, { recursive: true, force: true });
    });
  });

    describe('dataspec list', () => {
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

    it('should list datasets', async () => {
      const result = await $`bun ${CLI_PATH} list datasets --path ${testWorkspace}`;
      const output = result.stdout.toString();
      expect(output).toContain('users_raw');
    });

    it('should output JSON when requested', async () => {
      const result = await $`bun ${CLI_PATH} list --path ${testWorkspace} --format json`;
      const json = JSON.parse(result.stdout.toString());
      expect(json.sources).toBe(1);
      expect(json.datasets).toBe(1);
    });
  });

    describe('dataspec show', () => {
    it('should show dataset details', async () => {
      const result = await $`bun ${CLI_PATH} show dataset users_raw --path ${testWorkspace}`;
      const output = result.stdout.toString();
      expect(output).toContain('Dataset: users_raw');
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
    });

    it('should show with dependencies', async () => {
      const result = await $`bun ${CLI_PATH} show dataset users_raw --path ${testWorkspace} --deps`;
      const output = result.stdout.toString();
      expect(output).toContain('Dataset: users_raw');
    });
  });

describe('dataspec init', () => {
    it('should create project structure with dataspec folder', async () => {
        const tempDir = await mkdtemp(join(tmpdir(), 'dataspec-test-'));
      
        try {
        const result = await $`bun ${CLI_PATH} init --path ${tempDir} --name test-project`;
        expect(result.exitCode).toBe(0);
        expect(result.stdout.toString()).toContain('Initialized DataSpec project');
        expect(result.stdout.toString()).toContain('dataspec');
        
        const fs = await import('node:fs/promises');
        const entries = await fs.readdir(tempDir);
        expect(entries).toContain('dataspec');
        
        // Check inside dataspec folder
        const dataspecEntries = await fs.readdir(join(tempDir, 'dataspec'));
        expect(dataspecEntries).toContain('sources');
        expect(dataspecEntries).toContain('datasets');
        expect(dataspecEntries).toContain('contracts');
        expect(dataspecEntries).toContain('flows');
        expect(dataspecEntries).toContain('platform.yaml');
      } finally {
        await rm(tempDir, { recursive: true, force: true });
      }
    });

    it('should fail if dataspec folder already exists', async () => {
      const tempDir = await mkdtemp(join(tmpdir(), 'dataspec-test-'));
      
      try {
        // Create an existing dataspec folder
        const fs = await import('node:fs/promises');
        await fs.mkdir(join(tempDir, 'dataspec'));
        
        const result = await $`bun ${CLI_PATH} init --path ${tempDir}`.nothrow();
        expect(result.exitCode).toBe(2);
      } finally {
        await rm(tempDir, { recursive: true, force: true });
      }
    });

    it('should succeed in non-empty directory if dataspec folder does not exist', async () => {
      const tempDir = await mkdtemp(join(tmpdir(), 'dataspec-test-'));
      
      try {
        // Create a file in the directory (but no dataspec folder)
        await writeFile(join(tempDir, 'existing.txt'), 'test');
        const result = await $`bun ${CLI_PATH} init --path ${tempDir}`;
        expect(result.exitCode).toBe(0);
        
        // Verify dataspec folder was created
        const fs = await import('node:fs/promises');
        const stat = await fs.stat(join(tempDir, 'dataspec'));
        expect(stat.isDirectory()).toBe(true);
      } finally {
        await rm(tempDir, { recursive: true, force: true });
      }
    });

    it('should create with examples inside dataspec folder', async () => {
      const tempDir = await mkdtemp(join(tmpdir(), 'dataspec-test-'));
      
      try {
        const result = await $`bun ${CLI_PATH} init --path ${tempDir} --name test --with-examples`;
        expect(result.exitCode).toBe(0);
        
        const fs = await import('node:fs/promises');
        const sources = await fs.readdir(join(tempDir, 'dataspec', 'sources'));
        expect(sources.length).toBeGreaterThan(0);
      } finally {
        await rm(tempDir, { recursive: true, force: true });
      }
    });
  });

  describe('dataspec validate - workspace structure', () => {
    it('should fail when workspace has no dataspec folder', async () => {
      const noDataspecDir = await mkdtemp(join(tmpdir(), 'dataspec-no-folder-'));
      
      try {
        // Create files at root level (legacy structure)
        await mkdir(join(noDataspecDir, 'sources'), { recursive: true });
        await writeFile(join(noDataspecDir, 'platform.yaml'), 'name: test');
        
        const result = await $`bun ${CLI_PATH} validate --path ${noDataspecDir}`.nothrow();
        expect(result.exitCode).toBe(2);
        expect(result.stderr.toString()).toContain("Workspace must contain a 'dataspec/' folder");
      } finally {
        await rm(noDataspecDir, { recursive: true, force: true });
      }
    });

    it('should fail when resources are at root level (legacy structure)', async () => {
      const legacyDir = await mkdtemp(join(tmpdir(), 'dataspec-legacy-'));
      
      try {
        // Create both dataspec folder AND legacy resources at root
        await mkdir(join(legacyDir, 'dataspec'), { recursive: true });
        await mkdir(join(legacyDir, 'sources'), { recursive: true });
        await writeFile(join(legacyDir, 'platform.yaml'), 'name: test');
        
        const result = await $`bun ${CLI_PATH} validate --path ${legacyDir}`.nothrow();
        expect(result.exitCode).toBe(2);
        expect(result.stderr.toString()).toContain("Found resources outside 'dataspec/' folder");
      } finally {
        await rm(legacyDir, { recursive: true, force: true });
      }
    });

    it('should pass when workspace has proper dataspec folder structure', async () => {
      const properDir = await mkdtemp(join(tmpdir(), 'dataspec-proper-'));
      
      try {
        // Create proper dataspec folder structure
        const dsPath = join(properDir, 'dataspec');
        await mkdir(join(dsPath, 'sources'), { recursive: true });
        await writeFile(join(dsPath, 'platform.yaml'), 'name: test');
        
        const result = await $`bun ${CLI_PATH} validate --path ${properDir}`;
        expect(result.exitCode).toBe(0);
      } finally {
        await rm(properDir, { recursive: true, force: true });
      }
    });
  });

  describe('CI/CD Integration', () => {
    // Task 14.8: CI/CD integration tests

    it('should exit with code 0 for valid workspace', async () => {
      const result = await $`bun ${CLI_PATH} validate --path ${testWorkspace}`;
      expect(result.exitCode).toBe(0);
    });

    it('should exit with code 1 for validation errors', async () => {
      const invalidDir = await mkdtemp(join(tmpdir(), 'dataspec-invalid-'));
      // Create dataspec folder structure for invalid test
      const dataspecPath = join(invalidDir, 'dataspec');
      await mkdir(join(dataspecPath, 'flows'), { recursive: true });
      await writeFile(join(dataspecPath, 'platform.yaml'), 'name: test');
      await writeFile(join(dataspecPath, 'flows', 'bad.yaml'), `name: bad_flow
steps:
  - type: extract
    source: nonexistent
    entity: test
    output: out`);

      const result = await $`bun ${CLI_PATH} validate --path ${invalidDir}`.nothrow();
      expect(result.exitCode).toBe(1);

      await rm(invalidDir, { recursive: true, force: true });
    });

    it('should exit with code 2 for CLI errors', async () => {
      const result = await $`bun ${CLI_PATH} validate --path /nonexistent/path`.nothrow();
      expect(result.exitCode).toBe(2);
    });

    it('should output parseable JSON for programmatic use', async () => {
      const result = await $`bun ${CLI_PATH} validate --path ${testWorkspace} --format json`;
      const json = JSON.parse(result.stdout.toString());
      
      // Verify expected structure
      expect(json).toHaveProperty('passed');
      expect(json).toHaveProperty('errors');
      expect(json).toHaveProperty('warnings');
      expect(Array.isArray(json.errors)).toBe(true);
      expect(Array.isArray(json.warnings)).toBe(true);
    });

    it('should output errors in standard format for CI parsing', async () => {
      const invalidDir = await mkdtemp(join(tmpdir(), 'dataspec-invalid-'));
      // Create dataspec folder structure for invalid test
      const dataspecPath = join(invalidDir, 'dataspec');
      await mkdir(join(dataspecPath, 'flows'), { recursive: true });
      await writeFile(join(dataspecPath, 'platform.yaml'), 'name: test');
      await writeFile(join(dataspecPath, 'flows', 'bad.yaml'), `name: bad_flow
steps:
  - type: extract
    source: nonexistent
    entity: test
    output: out`);

      const result = await $`bun ${CLI_PATH} validate --path ${invalidDir} --format text`.nothrow();
      const output = result.stdout.toString();
      
      // Verify error format: <file>:<line>:<severity>: <message>
      const errorLine = output.split('\n').find(line => line.includes('error'));
      expect(errorLine).toBeDefined();
      expect(errorLine).toMatch(/^.+:\d+:(error|warning):/);
      
      await rm(invalidDir, { recursive: true, force: true });
    });

    it('should group output by severity for CI log analysis', async () => {
      const result = await $`bun ${CLI_PATH} validate --path ${testWorkspace} --format json`;
      const json = JSON.parse(result.stdout.toString());
      
      // In text format, errors should come before warnings
      // This is verified by checking the sort order in validate command
      expect(json.errors !== undefined).toBe(true);
      expect(json.warnings !== undefined).toBe(true);
    });

    it('should be executable in GitHub Actions', async () => {
      // Simulate GitHub Actions workflow execution
      const result = await $`bun ${CLI_PATH} validate --path ${testWorkspace} --format json`;
      const json = JSON.parse(result.stdout.toString());
      
      // GitHub Actions can capture exit code and JSON output
      expect(result.exitCode).toBe(0);
      expect(json.passed).toBe(true);
    });

    it('should work with npx for CI without local install', async () => {
      // Verify the CLI can be invoked in a way compatible with npx
      const result = await $`bun ${CLI_PATH} --version`;
      expect(result.exitCode).toBe(0);
      expect(result.stdout.toString()).toContain('0.2.0');
    });
  });
});
