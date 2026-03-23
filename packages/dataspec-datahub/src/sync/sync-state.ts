/**
 * Sync state persistence
 * Stores last sync timestamps for incremental sync support
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

interface SyncState {
  lastSyncTimestamp: number;
}

const STATE_FILE = 'datahub-sync-state.json';

/**
 * Gets the path to the sync state file
 * Stored directly in the workspace directory
 */
function getStatePath(workspacePath: string): string {
  return join(workspacePath, STATE_FILE);
}

/**
 * Loads the last sync timestamp from state file
 * Returns undefined if no state exists (first sync)
 */
export function loadLastSyncTimestamp(workspacePath: string): number | undefined {
  const statePath = getStatePath(workspacePath);
  try {
    const content = readFileSync(statePath, 'utf-8');
    const state = JSON.parse(content) as SyncState;
    return state.lastSyncTimestamp;
  } catch {
    return undefined;
  }
}

/**
 * Saves the current sync timestamp to state file
 */
export function saveLastSyncTimestamp(workspacePath: string, timestamp: number): void {
  const statePath = getStatePath(workspacePath);
  const state: SyncState = { lastSyncTimestamp: timestamp };
  writeFileSync(statePath, JSON.stringify(state, null, 2), 'utf-8');
}
