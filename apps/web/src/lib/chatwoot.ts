type ChatwootSDK = {
	run: (config: { websiteToken: string; baseUrl: string }) => void;
};

type ChatwootUser = {
	email?: string;
	name?: string;
	avatar_url?: string;
	phone_number?: string;
	description?: string;
	company_name?: string;
};

type ChatwootAPI = {
	hasLoaded?: boolean;
	toggle: (state?: "open" | "close") => void;
	setUser: (identifier: string | number, user: ChatwootUser) => void;
	setLabel: (label: string) => void;
	reset: () => void;
};

type ChatwootConfig = {
	baseUrl: string;
	websiteToken: string;
	enabled: boolean;
};

declare global {
	interface Window {
		chatwootSDK?: ChatwootSDK;
		$chatwoot?: ChatwootAPI;
	}
}

const SCRIPT_ID = "rudel-chatwoot-sdk";
const LOAD_TIMEOUT_MS = 5_000;
const RUNTIME_CONFIG_ENDPOINT = "/api/runtime-config";

let loadPromise: Promise<void> | null = null;
let runtimeConfig: ChatwootConfig | null | undefined;
let runtimeConfigPromise: Promise<ChatwootConfig | null> | null = null;

function trimValue(value: string | null | undefined) {
	const trimmed = value?.trim();
	return trimmed ? trimmed : undefined;
}

function getBuildChatwootConfig(): ChatwootConfig | null {
	const baseUrl = trimValue(import.meta.env.VITE_CHATWOOT_BASE_URL) ?? "";
	const websiteToken =
		trimValue(import.meta.env.VITE_CHATWOOT_WEBSITE_TOKEN) ?? "";
	const enabled =
		(trimValue(import.meta.env.VITE_CHATWOOT_ENABLED) ?? "true") !== "false";

	if (!enabled || baseUrl.length === 0 || websiteToken.length === 0) {
		return null;
	}

	return {
		baseUrl,
		websiteToken,
		enabled,
	};
}

function parseRuntimeChatwootConfig(input: {
	CHATWOOT_BASE_URL?: string;
	CHATWOOT_WEBSITE_TOKEN?: string;
	CHATWOOT_ENABLED?: string;
}): ChatwootConfig | null {
	const baseUrl = trimValue(input.CHATWOOT_BASE_URL) ?? "";
	const websiteToken = trimValue(input.CHATWOOT_WEBSITE_TOKEN) ?? "";
	const enabled = (trimValue(input.CHATWOOT_ENABLED) ?? "true") !== "false";

	if (!enabled || baseUrl.length === 0 || websiteToken.length === 0) {
		return null;
	}

	return {
		baseUrl,
		websiteToken,
		enabled,
	};
}

async function loadRuntimeChatwootConfig(): Promise<ChatwootConfig | null> {
	if (typeof window === "undefined") {
		return null;
	}

	if (runtimeConfig !== undefined) {
		return runtimeConfig;
	}

	if (runtimeConfigPromise) {
		return runtimeConfigPromise;
	}

	runtimeConfigPromise = fetch(RUNTIME_CONFIG_ENDPOINT, {
		credentials: "same-origin",
	})
		.then(async (response) => {
			if (!response.ok) {
				return null;
			}

			const payload = (await response.json()) as {
				CHATWOOT_BASE_URL?: string;
				CHATWOOT_WEBSITE_TOKEN?: string;
				CHATWOOT_ENABLED?: string;
			};

			runtimeConfig = parseRuntimeChatwootConfig(payload);
			return runtimeConfig;
		})
		.catch(() => {
			runtimeConfig = null;
			return runtimeConfig;
		})
		.finally(() => {
			runtimeConfigPromise = null;
		});

	return runtimeConfigPromise;
}

async function resolveChatwootConfig(): Promise<ChatwootConfig | null> {
	const fromRuntime = await loadRuntimeChatwootConfig();
	return fromRuntime ?? getBuildChatwootConfig();
}

function getKnownChatwootConfig(): ChatwootConfig | null {
	return runtimeConfig ?? getBuildChatwootConfig();
}

function getScriptUrl(baseUrl: string) {
	return `${baseUrl.replace(/\/$/, "")}/packs/js/sdk.js`;
}

function delay(ms: number) {
	return new Promise<void>((resolve) => {
		window.setTimeout(resolve, ms);
	});
}

async function waitForChatwoot() {
	const startedAt = Date.now();

	while (Date.now() - startedAt < LOAD_TIMEOUT_MS) {
		if (window.$chatwoot?.hasLoaded) {
			return;
		}
		await delay(50);
	}

	throw new Error("Timed out waiting for Chatwoot to initialize");
}

function runChatwoot(config: ChatwootConfig) {
	if (!window.chatwootSDK) {
		throw new Error("Chatwoot SDK failed to load");
	}

	window.chatwootSDK.run({
		websiteToken: config.websiteToken,
		baseUrl: config.baseUrl,
	});
}

export function isChatwootEnabled() {
	return getKnownChatwootConfig() !== null;
}

export async function ensureChatwootLoaded(): Promise<void> {
	if (typeof window === "undefined" || typeof document === "undefined") {
		return;
	}

	const config = await resolveChatwootConfig();
	if (!config) {
		return;
	}

	if (window.$chatwoot?.hasLoaded) {
		return;
	}

	if (loadPromise) {
		return loadPromise;
	}

	if (window.$chatwoot) {
		loadPromise = waitForChatwoot();
		return loadPromise.catch((error) => {
			loadPromise = null;
			throw error;
		});
	}

	loadPromise = new Promise<void>((resolve, reject) => {
		const existingScript = document.getElementById(
			SCRIPT_ID,
		) as HTMLScriptElement | null;

		const startWidget = () => {
			try {
				runChatwoot(config);
				void waitForChatwoot().then(resolve, reject);
			} catch (error) {
				reject(error);
			}
		};

		if (existingScript) {
			if (window.chatwootSDK) {
				startWidget();
				return;
			}

			existingScript.addEventListener("load", startWidget, { once: true });
			existingScript.addEventListener(
				"error",
				() => reject(new Error("Chatwoot SDK failed to load")),
				{ once: true },
			);
			return;
		}

		const script = document.createElement("script");
		script.id = SCRIPT_ID;
		script.async = true;
		script.src = getScriptUrl(config.baseUrl);
		script.addEventListener("load", startWidget, { once: true });
		script.addEventListener(
			"error",
			() => reject(new Error("Chatwoot SDK failed to load")),
			{ once: true },
		);

		document.head.appendChild(script);
	});

	await loadPromise.catch((error) => {
		loadPromise = null;
		throw error;
	});
}

export async function openChatwoot() {
	try {
		await ensureChatwootLoaded();
		window.$chatwoot?.toggle("open");
	} catch {
		// Ignore widget load failures so the dashboard remains functional.
	}
}

export async function syncChatwootUser(user: {
	identifier: string | number;
	email?: string | null;
	name?: string | null;
	avatarUrl?: string | null;
	organizationName?: string | null;
}) {
	try {
		await ensureChatwootLoaded();

		const api = window.$chatwoot;
		if (!api) {
			return;
		}

		const contact: ChatwootUser = {
			email: trimValue(user.email),
			name: trimValue(user.name),
			avatar_url: trimValue(user.avatarUrl),
			company_name: trimValue(user.organizationName),
			description: trimValue(user.organizationName)
				? `Rudel dashboard user from ${user.organizationName}`
				: "Rudel dashboard user",
		};

		if (!contact.email && !contact.name && !contact.avatar_url) {
			return;
		}

		api.setUser(user.identifier, contact);
		api.setLabel("rudel-dashboard");
	} catch {
		// Keep the dashboard usable even if Chatwoot is unavailable.
	}
}

export function resetChatwoot() {
	window.$chatwoot?.reset();
}
