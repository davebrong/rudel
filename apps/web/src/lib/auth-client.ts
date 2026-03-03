import { organizationClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import { queryClient } from "./query-client";

export const authClient = createAuthClient({
	baseURL: "",
	plugins: [organizationClient()],
});

export async function signOut() {
	await authClient.signOut();
	queryClient.clear();
	localStorage.removeItem("dateRange");
	localStorage.removeItem("globalFilters");
	localStorage.removeItem("rudel:activeOrg");
	// Notify all better-auth signal atoms to trigger refetches,
	// clearing stale org data that /sign-out doesn't reset
	for (const key of Object.keys(authClient.$store.atoms)) {
		if (key.startsWith("$")) {
			authClient.$store.notify(key);
		}
	}
}
