import { spawn } from 'child_process';
import crypto from 'crypto';
import fs from 'fs';
import os from 'os';
import path from 'path';

export type LibreOfficeTarget = 'docx' | 'xlsx' | 'pdf' | 'txt';

function libreOfficeCandidates(): string[] {
  const configured = process.env.LIBREOFFICE_PATH?.trim();
  const programFiles = process.env.ProgramFiles || 'C:\\Program Files';
  return [
    configured,
    path.join(programFiles, 'LibreOffice', 'program', 'soffice.exe'),
    'soffice',
    'libreoffice',
  ].filter((value): value is string => Boolean(value));
}

function toFileUrl(dir: string): string {
  const posix = dir.replace(/\\/g, '/');
  const withLeading = posix.startsWith('/') ? posix : `/${posix}`;
  return `file://${withLeading.replace(/ /g, '%20')}`;
}

function runSoffice(command: string, args: string[], timeoutMs: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const proc = spawn(command, args, { stdio: ['ignore', 'ignore', 'pipe'] });
    let stderr = '';
    let settled = false;
    const finish = (error?: Error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (error) reject(error);
      else resolve();
    };
    const timer = setTimeout(() => {
      proc.kill();
      finish(new Error('LibreOffice conversion timed out.'));
    }, timeoutMs);
    proc.stderr?.on('data', (chunk) => {
      stderr += String(chunk);
      if (stderr.length > 8000) stderr = stderr.slice(-8000);
    });
    proc.on('error', (error) => finish(error));
    proc.on('close', (code) => {
      if (code === 0) finish();
      else finish(new Error(stderr.trim() || `LibreOffice exited with code ${code}`));
    });
  });
}

export function isLibreOfficeMissingError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return message.toLowerCase().includes('libreoffice is not available');
}

export async function convertWithLibreOffice(
  input: Buffer,
  inputExt: string,
  target: LibreOfficeTarget,
  timeoutMs = 45_000,
): Promise<Buffer> {
  const id = crypto.randomBytes(8).toString('hex');
  const workDir = path.join(os.tmpdir(), `lo-${id}`);
  const profileDir = path.join(workDir, 'profile');
  await fs.promises.mkdir(profileDir, { recursive: true });
  const safeExt = inputExt.replace(/^\./, '').replace(/[^a-z0-9]/gi, '') || 'bin';
  const inputPath = path.join(workDir, `input.${safeExt}`);
  await fs.promises.writeFile(inputPath, input);
  const args = [
    '--headless',
    '--norestore',
    '--nologo',
    '--nolockcheck',
    `-env:UserInstallation=${toFileUrl(profileDir)}`,
    '--convert-to',
    target,
    '--outdir',
    workDir,
    inputPath,
  ];
  try {
    for (const candidate of libreOfficeCandidates()) {
      try {
        await runSoffice(candidate, args, timeoutMs);
        const outputPath = path.join(workDir, `input.${target}`);
        if (!fs.existsSync(outputPath)) {
          throw new Error('LibreOffice produced no output file.');
        }
        return await fs.promises.readFile(outputPath);
      } catch (error) {
        const code =
          typeof error === 'object' && error && 'code' in error
            ? String((error as { code?: string }).code)
            : '';
        if (code === 'ENOENT') continue;
        throw error;
      }
    }
    throw new Error('LibreOffice is not available in the current environment.');
  } finally {
    await fs.promises.rm(workDir, { recursive: true, force: true }).catch(() => undefined);
  }
}
