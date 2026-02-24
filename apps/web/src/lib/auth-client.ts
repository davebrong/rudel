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
}
