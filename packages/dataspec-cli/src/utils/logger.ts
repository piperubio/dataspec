/**
 * Logger utility with verbose mode support
 */

let verboseEnabled = false;

export function setVerbose(enabled: boolean): void {
  verboseEnabled = enabled;
}

export function isVerbose(): boolean {
  return verboseEnabled;
}

export function logVerbose(message: string): void {
  if (verboseEnabled) {
    console.error(`[verbose] ${message}`);
  }
}

export function logDebug(message: string): void {
  if (verboseEnabled) {
    console.error(`[debug] ${message}`);
  }
}
