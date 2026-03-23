/**
 * DataHub configuration loader
 * Loads DataHub configuration from platform.yaml and resolves environment variables
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { parse as parseYaml } from 'yaml';

import type { DataHubConfig } from './types.js';

const ENV_VAR_REGEX = /^\$\{([^}]+)\}$/;

/**
 * Resolves environment variable references in string values
 * Supports ${VAR_NAME} syntax
 */
function resolveEnvVar(value: string | undefined): string | undefined {
  if (!value) {
    return value;
  }

  const match = value.match(ENV_VAR_REGEX);
  if (match) {
    const varName = match[1];
    const envValue = process.env[varName];
    if (envValue === undefined) {
      throw new Error(
        `Environment variable ${varName} is not defined but referenced in DataHub configuration`,
      );
    }
    return envValue;
  }

  return value;
}

/**
 * Validates the DataHub configuration
 * Ensures required fields are present and properly formatted
 */
function validateConfig(config: Partial<DataHubConfig>): DataHubConfig {
  if (!config.gms_url) {
    throw new Error(
      'DataHub configuration error: gms_url is required. ' +
        'Please add a gms_url field to the datahub section in platform.yaml',
    );
  }

  try {
    new URL(config.gms_url);
  } catch {
    throw new Error(
      `DataHub configuration error: gms_url "${config.gms_url}" is not a valid URL. ` +
        'Please provide a valid URL (e.g., https://datahub.company.com/api/gms)',
    );
  }

  return {
    gms_url: config.gms_url,
    token: config.token,
  };
}

/**
 * Loads DataHub configuration from platform.yaml
 * Returns null if no datahub section is found
 */
export function loadConfig(workspacePath: string): DataHubConfig | null {
  const platformYamlPath = join(workspacePath, 'dataspec', 'platform.yaml');

  try {
    const content = readFileSync(platformYamlPath, 'utf-8');
    const platformConfig = parseYaml(content) as Record<string, unknown>;

    if (!platformConfig.datahub) {
      return null;
    }

    const rawConfig = platformConfig.datahub as Partial<DataHubConfig>;

    const resolvedConfig: Partial<DataHubConfig> = {
      gms_url: rawConfig.gms_url,
      token: resolveEnvVar(rawConfig.token),
    };

    return validateConfig(resolvedConfig);
  } catch (error) {
    if (error instanceof Error && error.message.includes('ENOENT')) {
      throw new Error(
        `Platform configuration file not found at ${platformYamlPath}. ` +
          'Please ensure platform.yaml exists in the dataspec directory.',
        { cause: error },
      );
    }
    throw error;
  }
}

/**
 * Loads DataHub configuration with CLI overrides
 * CLI flags take precedence over platform.yaml configuration
 * Throws a clear error if no configuration source provides gms_url
 */
export function loadConfigWithOverrides(
  workspacePath: string,
  overrides?: {
    gms_url?: string;
    token?: string;
  },
): DataHubConfig {
  const fileConfig = loadConfig(workspacePath);
  const gmsUrl = overrides?.gms_url ?? fileConfig?.gms_url;

  if (!gmsUrl) {
    throw new Error(
      'DataHub is not configured. Either:\n' +
        '  1. Add a datahub section to platform.yaml:\n' +
        '     datahub:\n' +
        '       gms_url: https://your-datahub.com/api/gms\n' +
        '       token: ${DATAHUB_TOKEN}\n' +
        '  2. Or pass --gms-url flag to the command',
    );
  }

  const mergedConfig: Partial<DataHubConfig> = {
    gms_url: gmsUrl,
    token: overrides?.token ?? fileConfig?.token,
  };

  return validateConfig(mergedConfig);
}
