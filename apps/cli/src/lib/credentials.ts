import {
	existsSync,
	mkdirSync,
	readFileSync,
	rmSync,
	writeFileSync,
} from "node:fs";
import { join } from "node:path";

interface Credentials {
	token: string;
	apiBaseUrl: string;
}

function getConfigDir(): string {
	return (
		process.env.RUDEL_CONFIG_DIR ?? join(process.env.HOME ?? "~", ".rudel")
	);
}

function getCredentialsPath(): string {
	return join(getConfigDir(), "credentials.json");
}

export function saveCredentials(token: string, apiBaseUrl: string): void {
	const dir = getConfigDir();
	if (!existsSync(dir)) {
		mkdirSync(dir, { recursive: true, mode: 0o700 });
	}
	const data: Credentials = { token, apiBaseUrl };
	writeFileSync(getCredentialsPath(), JSON.stringify(data, null, 2), {
		mode: 0o600,
	});
}

export function loadCredentials(): Credentials | null {
	const path = getCredentialsPath();
	if (!existsSync(path)) return null;
	const content = readFileSync(path, "utf-8");
	return JSON.parse(content) as Credentials;
}

export function clearCredentials(): void {
	const path = getCredentialsPath();
	if (existsSync(path)) {
		rmSync(path);
	}
}
