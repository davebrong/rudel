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

declare global {
	interface Window {
		chatwootSDK?: ChatwootSDK;
		$chatwoot?: ChatwootAPI;
	}
}

const BASE_URL = import.meta.env.VITE_CHATWOOT_BASE_URL?.trim() ?? "";
const WEBSITE_TOKEN = import.meta.env.VITE_CHATWOOT_WEBSITE_TOKEN?.trim() ?? "";
const ENABLED = import.meta.env.VITE_CHATWOOT_ENABLED !== "false";
const SCRIPT_ID = "rudel-chatwoot-sdk";
const LOAD_TIMEOUT_MS = 5_000;

let loadPromise: Promise<void> | null = null;

function getScriptUrl() {
	return `${BASE_URL.replace(/\/$/, "")}/packs/js/sdk.js`;
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

function runChatwoot() {
	if (!window.chatwootSDK) {
		throw new Error("Chatwoot SDK failed to load");
	}

	window.chatwootSDK.run({
		websiteToken: WEBSITE_TOKEN,
		baseUrl: BASE_URL,
	});
}

export function isChatwootEnabled() {
	return ENABLED && BASE_URL.length > 0 && WEBSITE_TOKEN.length > 0;
}

export function ensureChatwootLoaded(): Promise<void> {
	if (
		typeof window === "undefined" ||
		typeof document === "undefined" ||
		!isChatwootEnabled()
	) {
		return Promise.resolve();
	}

	if (window.$chatwoot?.hasLoaded) {
		return Promise.resolve();
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
				runChatwoot();
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
		script.src = getScriptUrl();
		script.addEventListener("load", startWidget, { once: true });
		script.addEventListener(
			"error",
			() => reject(new Error("Chatwoot SDK failed to load")),
			{ once: true },
		);

		document.head.appendChild(script);
	});

	return loadPromise.catch((error) => {
		loadPromise = null;
		throw error;
	});
}

export async function openChatwoot() {
	if (!isChatwootEnabled()) {
		return;
	}

	try {
		await ensureChatwootLoaded();
		window.$chatwoot?.toggle("open");
	} catch {
		// Ignore widget load failures so the dashboard remains functional.
	}
}

function trimValue(value: string | null | undefined) {
	const trimmed = value?.trim();
	return trimmed ? trimmed : undefined;
}

export async function syncChatwootUser(user: {
	identifier: string | number;
	email?: string | null;
	name?: string | null;
	avatarUrl?: string | null;
	organizationName?: string | null;
}) {
	if (!isChatwootEnabled()) {
		return;
	}

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
