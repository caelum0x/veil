import { spawn } from "node:child_process";

export interface RunResult {
  code: number;
  stdout: string;
  stderr: string;
}

/**
 * Run a command, capturing stdout/stderr. Rejects on non-zero exit unless
 * `allowFailure` is set. Never interpolates untrusted input into a shell —
 * args are passed as an array.
 */
export function run(
  cmd: string,
  args: string[],
  opts: { cwd?: string; env?: NodeJS.ProcessEnv; allowFailure?: boolean } = {},
): Promise<RunResult> {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(cmd, args, {
      cwd: opts.cwd,
      env: { ...process.env, ...opts.env },
    });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (d) => (stdout += d.toString()));
    child.stderr.on("data", (d) => (stderr += d.toString()));
    child.on("error", reject);
    child.on("close", (code) => {
      const result: RunResult = { code: code ?? -1, stdout, stderr };
      if (code === 0 || opts.allowFailure) resolvePromise(result);
      else
        reject(
          new Error(
            `Command failed (${code}): ${cmd} ${args.join(" ")}\n${stderr || stdout}`,
          ),
        );
    });
  });
}
