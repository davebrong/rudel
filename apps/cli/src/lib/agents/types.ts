export interface SessionFile {
	sessionId: string;
	transcriptPath: string;
	projectPath: string;
}

export interface CodingAgent {
	name: string;
	installHook(): void;
	removeHook(): void;
	isHookInstalled(): boolean;
	getHookSettingsPath(): string;
	findProjectSessions(projectPath: string): Promise<SessionFile[]>;
	getSessionsBaseDir(): string;
}
