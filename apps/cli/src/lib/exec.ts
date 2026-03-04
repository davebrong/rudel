import { execFile } from "node:child_process";

interface ExecResult {
	exitCode: number;
	stdout: string;
	stderr: string;
}

export function exec(cmd: string, args: string[]): Promise<ExecResult> {
	return new Promise((resolve) => {
		execFile(cmd, args, { encoding: "utf8" }, (error, stdout, stderr) => {
			resolve({
				exitCode: error ? ((error as { code?: number }).code ?? 1) : 0,
				stdout,
				stderr,
			});
		});
	});
}
