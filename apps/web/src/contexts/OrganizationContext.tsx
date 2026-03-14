import {
	createContext,
	type ReactNode,
	useCallback,
	useContext,
	useEffect,
	useRef,
	useState,
} from "react";
import { authClient } from "../lib/auth-client";
import { client } from "../lib/orpc";
import { queryClient } from "../lib/query-client";

interface Organization {
	id: string;
	name: string;
	slug: string;
	logo?: string | null | undefined;
}

interface OrganizationContextType {
	activeOrg: Organization | null;
	organizations: readonly Organization[];
	switchOrg: (orgId: string) => Promise<void>;
	refetchOrgs: () => Promise<void>;
	isLoading: boolean;
	isOrgAdmin: boolean;
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(
	undefined,
);

export function OrganizationProvider({ children }: { children: ReactNode }) {
	const { data: session } = authClient.useSession();
	const { data: betterAuthOrg, isPending: betterAuthLoading } =
		authClient.useActiveOrganization();
	const { data: activeMember } = authClient.useActiveMember();

	const [orgs, setOrgs] = useState<Organization[]>([]);
	const [listLoading, setListLoading] = useState(true);
	const [isSuperadmin, setIsSuperadmin] = useState(false);
	const [switching, setSwitching] = useState(false);
	// For superadmins, better-auth's hooks 403 on non-member orgs.
	// Track active org locally instead.
	const [superadminOrg, setSuperadminOrg] = useState<Organization | null>(null);
	const autoSwitched = useRef(false);

	// Fetch org list and superadmin flag
	const fetchOrgs = useCallback(async () => {
		try {
			setListLoading(true);
			const [orgList, meData] = await Promise.all([
				client.listMyOrganizations(),
				client.me(),
			]);
			setOrgs(orgList);
			setIsSuperadmin(meData.isSuperadmin);
		} catch {
			// ignore
		} finally {
			setListLoading(false);
		}
	}, []);

	useEffect(() => {
		fetchOrgs();
	}, [fetchOrgs]);

	// Switch org
	const switchOrg = useCallback(
		async (orgId: string) => {
			const targetOrg = orgs.find((o) => o.id === orgId);
			if (!targetOrg) return;

			setSwitching(true);
			try {
				if (isSuperadmin) {
					// Bypass better-auth entirely — its set-active endpoint clears
					// activeOrganizationId on 403, corrupting the session.
					await client.superadminSetActive({ organizationId: orgId });
					setSuperadminOrg(targetOrg);
					authClient.$store.notify("$sessionSignal");
					queryClient.removeQueries({ queryKey: ["org"] });
				} else {
					setSuperadminOrg(null);
					await authClient.organization.setActive({
						organizationId: orgId,
					});
				}
			} finally {
				setSwitching(false);
			}
		},
		[isSuperadmin, orgs],
	);

	// Auto-select first org when none is active (once per session)
	useEffect(() => {
		if (betterAuthLoading || listLoading || autoSwitched.current) return;
		if (orgs.length === 0) return;

		// Already have an active org from either source
		if (betterAuthOrg || superadminOrg) return;

		// For superadmins, check if the session already has an activeOrganizationId
		// (e.g. after page reload). Restore from the org list.
		if (isSuperadmin) {
			const meData = session?.session as
				| Record<string, unknown>
				| undefined;
			const sessionOrgId = meData?.activeOrganizationId;
			if (typeof sessionOrgId === "string") {
				const match = orgs.find((o) => o.id === sessionOrgId);
				if (match) {
					setSuperadminOrg(match);
					return;
				}
			}
		}

		// No active org at all — auto-select first
		autoSwitched.current = true;
		switchOrg(orgs[0].id);
	}, [
		betterAuthOrg,
		betterAuthLoading,
		superadminOrg,
		listLoading,
		orgs,
		isSuperadmin,
		session,
		switchOrg,
	]);

	// For superadmins, always use our local state (better-auth's hooks 403 on
	// non-member orgs, and hold stale data when switching away from a member org).
	// For regular users, use better-auth's hook.
	const activeOrg = isSuperadmin
		? superadminOrg ?? betterAuthOrg ?? null
		: betterAuthOrg ?? null;

	const memberRole = activeMember?.role;
	const isOrgAdmin =
		isSuperadmin ||
		!activeOrg ||
		memberRole === "owner" ||
		memberRole === "admin";

	return (
		<OrganizationContext.Provider
			value={{
				activeOrg,
				organizations: orgs,
				switchOrg,
				refetchOrgs: fetchOrgs,
				isLoading: betterAuthLoading || listLoading || switching,
				isOrgAdmin,
			}}
		>
			{children}
		</OrganizationContext.Provider>
	);
}

export function useOrganization() {
	const context = useContext(OrganizationContext);
	if (context === undefined) {
		throw new Error(
			"useOrganization must be used within an OrganizationProvider",
		);
	}
	return context;
}
