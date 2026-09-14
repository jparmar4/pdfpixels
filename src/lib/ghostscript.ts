import { spawn } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';

export type RunGhostscriptOptions = {
  /** Kill the process after this many ms. Default 45_000. */
  timeoutMs?: number;
  /** Error message when the process is killed by timeout. */
  timeoutMessage?: string;
  /** Capture stderr for better failure messages. Default true. */
  captureStderr?: boolean;
  /** Optional sink for stderr chunks (in addition to internal capture). */
  onStderr?: (chunk: string) => void;
  /** Optional sink for stdout chunks (gs writes some diagnostics there). */
  onStdout?: (chunk: string) => void;
};

/** Captured Ghostscript output returned by {@link runGhostscriptWithFallbackResult}. */
export type GhostscriptRunResult = {
  stderr: string;
  stdout: string;
};

const MAX_CAPTURE_BYTES = 16 * 1024;

/**
 * Resolve Ghostscript binaries to try, in preference order.
 * Honors GHOSTSCRIPT_PATH, then discovers installs under Program Files on Windows.
 */
export function getGhostscriptCandidates(): string[] {
  const configured = process.env.GHOSTSCRIPT_PATH?.trim();

  if (os.platform() !== 'win32') {
    return [configured, 'gs'].filter(Boolean) as string[];
  }

  const programFiles = process.env.ProgramFiles || 'C:\\Program Files';
  const gsRoot = path.join(programFiles, 'gs');
  const discovered: string[] = [];

  try {
    if (fs.existsSync(gsRoot)) {
      for (const dir of fs.readdirSync(gsRoot)) {
        const exePath = path.join(gsRoot, dir, 'bin', 'gswin64c.exe');
        if (fs.existsSync(exePath)) {
          discovered.push(exePath);
        }
      }
    }
  } catch {
    // Ignore discovery errors; fall through to known paths / PATH names.
  }

  return [
    configured,
    ...discovered.sort().reverse(),
    'C:\\Program Files\\gs\\gs10.06.0\\bin\\gswin64c.exe',
    'C:\\Program Files\\gs\\gs10.04.0\\bin\\gswin64c.exe',
    'C:\\Program Files\\gs\\gs10.03.1\\bin\\gswin64c.exe',
    'C:\\Program Files\\gs\\gs10.02.1\\bin\\gswin64c.exe',
    'C:\\Program Files\\gs\\gs10.01.2\\bin\\gswin64c.exe',
    'C:\\Program Files\\gs\\gs10.01.1\\bin\\gswin64c.exe',
    'C:\\Program Files\\gs\\gs10.00.0\\bin\\gswin64c.exe',
    'gswin64c',
    'gswin32c',
    'gs',
  ].filter(Boolean) as string[];
}

export function isGhostscriptMissingError(error: unknown): boolean {
  const err = error as NodeJS.ErrnoException | Error | null | undefined;
  const message = String(err?.message || '');
  const code = (err as NodeJS.ErrnoException | undefined)?.code;
  return (
    code === 'ENOENT' ||
    message.includes('not recognized') ||
    message.toLowerCase().includes('ghostscript is not available') ||
    /spawn .* ENOENT/i.test(message)
  );
}

/** Run a single Ghostscript binary with the given args. */
export function runGhostscript(
  command: string,
  args: string[],
  options: RunGhostscriptOptions = {},
): Promise<void> {
  const timeoutMs = options.timeoutMs ?? 45_000;
  const timeoutMessage = options.timeoutMessage ?? 'Ghostscript timed out. Please try a smaller PDF.';
  const captureStderr = options.captureStderr !== false;

  return new Promise<void>((resolve, reject) => {
    const proc = spawn(command, args, { stdio: ['ignore', 'pipe', 'pipe'] });
    let stderr = '';

    if (captureStderr || options.onStderr) {
      proc.stderr?.on('data', (chunk) => {
        const text = chunk.toString();
        options.onStderr?.(text);
        if (captureStderr && stderr.length < MAX_CAPTURE_BYTES) {
          stderr += text;
          if (stderr.length > MAX_CAPTURE_BYTES) stderr = stderr.slice(0, MAX_CAPTURE_BYTES);
        }
      });
    } else {
      proc.stderr?.resume();
    }

    if (options.onStdout) {
      proc.stdout?.on('data', (chunk) => options.onStdout!(chunk.toString()));
    } else {
      proc.stdout?.resume();
    }

    const timeout = setTimeout(() => {
      proc.kill('SIGKILL');
      reject(new Error(timeoutMessage));
    }, timeoutMs);

    proc.on('error', (err) => {
      clearTimeout(timeout);
      reject(err);
    });

    proc.on('close', (code) => {
      clearTimeout(timeout);
      if (code === 0) {
        resolve();
        return;
      }
      const detail = stderr.trim();
      reject(new Error(detail || `Ghostscript failed with exit code ${code}`));
    });
  });
}

/**
 * Try each Ghostscript candidate until one succeeds.
 * Skips missing binaries; rethrows non-ENOENT failures from a found binary.
 * Returns whatever Ghostscript wrote to stderr/stdout so callers can surface
 * real failure causes (e.g. when gs exits 0 but produces no output file).
 */
export async function runGhostscriptWithFallbackResult(
  args: string[],
  options: RunGhostscriptOptions = {},
): Promise<GhostscriptRunResult> {
  let stderr = '';
  let stdout = '';
  let lastError: Error | NodeJS.ErrnoException | null = null;

  for (const candidate of getGhostscriptCandidates()) {
    try {
      await runGhostscript(candidate, args, {
        ...options,
        onStderr: (chunk) => { if (stderr.length < MAX_CAPTURE_BYTES) stderr += chunk; },
        onStdout: (chunk) => { if (stdout.length < MAX_CAPTURE_BYTES) stdout += chunk; },
      });
      return { stderr, stdout };
    } catch (error) {
      lastError = error as Error | NodeJS.ErrnoException;
      if (isGhostscriptMissingError(lastError)) {
        continue;
      }
      throw lastError;
    }
  }

  throw lastError ?? new Error('Ghostscript is not available in the current environment.');
}

/**
 * Try each Ghostscript candidate until one succeeds.
 * Skips missing binaries; rethrows non-ENOENT failures from a found binary.
 */
export async function runGhostscriptWithFallback(
  args: string[],
  options: RunGhostscriptOptions = {},
): Promise<void> {
  await runGhostscriptWithFallbackResult(args, options);
}

/**
 * Short, sanitized Ghostscript diagnostics safe for API error bodies:
 * collapses whitespace, caps length, and replaces temp-dir paths so
 * absolute paths from the server filesystem are never leaked to clients.
 */
export function sanitizeGhostscriptDiagnostics(raw: string, maxLength = 200): string {
  const tempRoots = new Set<string>();
  for (const root of [os.tmpdir(), process.env.TEMP, process.env.TMP]) {
    if (!root) continue;
    tempRoots.add(root);
    tempRoots.add(root.replace(/\\/g, '/'));
  }
  let text = raw.replace(/\s+/g, ' ').trim();
  for (const root of tempRoots) {
    text = text.split(root).join('[temp]');
  }
  return text.slice(0, maxLength).trim();
}
