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
};

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
    const proc = spawn(command, args, { stdio: ['ignore', 'ignore', 'pipe'] });
    let stderr = '';
    const maxStderr = 16 * 1024;

    if (captureStderr) {
      proc.stderr?.on('data', (chunk) => {
        if (stderr.length < maxStderr) {
          stderr += chunk.toString();
          if (stderr.length > maxStderr) stderr = stderr.slice(0, maxStderr);
        }
      });
    } else {
      proc.stderr?.resume();
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
 */
export async function runGhostscriptWithFallback(
  args: string[],
  options: RunGhostscriptOptions = {},
): Promise<void> {
  let lastError: Error | NodeJS.ErrnoException | null = null;

  for (const candidate of getGhostscriptCandidates()) {
    try {
      await runGhostscript(candidate, args, options);
      return;
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
