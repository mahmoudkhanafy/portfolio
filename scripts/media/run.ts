import { spawn } from 'node:child_process';

/** Runs a command and resolves with its stdout; rejects with CommandError on a non-zero exit. */
export type Runner = (command: string, args: string[], options?: { cwd?: string }) => Promise<string>;

export class CommandError extends Error {
  readonly stderr: string;
  constructor(message: string, stderr: string) {
    super(message);
    this.name = 'CommandError';
    this.stderr = stderr;
  }
}

export const runCommand: Runner = (command, args, options = {}) =>
  new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd: options.cwd, stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '';
    let stderr = '';
    child.stdout.setEncoding('utf8').on('data', (chunk: string) => (stdout += chunk));
    child.stderr.setEncoding('utf8').on('data', (chunk: string) => (stderr += chunk));
    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) resolve(stdout);
      else reject(new CommandError(`${command} exited with code ${code}`, stderr.trim()));
    });
  });

export const FFMPEG = process.env.FFMPEG_PATH || 'ffmpeg';
export const FFPROBE = process.env.FFPROBE_PATH || 'ffprobe';
