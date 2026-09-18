import { spawn } from 'child_process';

/**
 * Shared qpdf runner (used by the protect and linearize API routes).
 * Tries configured + well-known qpdf binaries, caps stderr, and kills the
 * child on timeout so a stuck binary can never hang a request.
 */

export function getQpdfCandidates(): string[] {
  const configured = process.env.QPDF_PATH?.trim();

  if (process.platform !== 'win32') {
    return [configured, 'qpdf'].filter(Boolean) as string[];
  }

  return [
    configured,
    'C:\\Program Files\\qpdf 12.2.0\\bin\\qpdf.exe',
    'C:\\Program Files\\qpdf 12.1.0\\bin\\qpdf.exe',
    'C:\\Program Files\\qpdf 11.9.1\\bin\\qpdf.exe',
    'qpdf',
  ].filter(Boolean) as string[];
}

/** Matches "binary missing" failures (engine-unavailable) as opposed to real
 *  qpdf errors, so callers can fall back to Ghostscript. */
export function isQpdfUnavailableError(error: unknown): boolean {
  const code = (error as NodeJS.ErrnoException | null)?.code;
  const message = String((error as Error | null)?.message || '');
  return (
    code === 'ENOENT' ||
    message.includes('not recognized') ||
    message.includes('spawn') ||
    message.includes('qpdf is not available')
  );
}

export function runQpdfCommand(
  command: string,
  args: string[],
  options: { timeoutMs?: number; timeoutMessage?: string } = {},
): Promise<void> {
  const { timeoutMs = 45_000, timeoutMessage = 'PDF operation timed out.' } = options;
  return new Promise<void>((resolve, reject) => {
    const proc = spawn(command, args, { stdio: ['ignore', 'ignore', 'pipe'] });
    let stderr = '';
    const timeout = setTimeout(() => {
      proc.kill('SIGKILL');
      reject(new Error(timeoutMessage));
    }, timeoutMs);

    proc.stderr.on('data', (chunk) => {
      if (stderr.length < 16 * 1024) {
        stderr += chunk.toString();
      }
    });

    proc.on('error', (error) => {
      clearTimeout(timeout);
      reject(error);
    });

    proc.on('close', (code) => {
      clearTimeout(timeout);
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(stderr.trim() || `qpdf failed with exit code ${code}`));
    });
  });
}

export async function runQpdf(
  args: string[],
  options: { timeoutMs?: number; timeoutMessage?: string } = {},
): Promise<void> {
  let lastError: Error | NodeJS.ErrnoException | null = null;

  for (const candidate of getQpdfCandidates()) {
    try {
      await runQpdfCommand(candidate, args, options);
      return;
    } catch (error) {
      lastError = error as Error | NodeJS.ErrnoException;
      if (isQpdfUnavailableError(lastError)) {
        continue;
      }
      throw lastError;
    }
  }

  throw lastError ?? new Error('qpdf is not available in the current environment.');
}
