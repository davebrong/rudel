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

interface Organization {
	id: string;
	name: string;
	slug: string;
	logo?: string | null | undefined;
	/** Internal: user ID for scoping localStorage cache */
	_userId?: string;
}

interface OrganizationContextType {
	activeOrg: Organization | null;
	organizations: readonly Organization[];
	switchOrg: (orgId: string) => Promise<void>;
	refetchOrgs: () => Promise<void>;
	isLoading: boolean;
	/** Whether the current user is an owner or admin of the active org */
	isOrgAdmin: boolean;
}

const ACTIVE_ORG_CACHE_KEY = "rudel:activeOrg";

function getCachedOrg(): Organization | null {
	try {
		const raw = localStorage.getItem(ACTIVE_ORG_CACHE_KEY);
		if (!raw) return null;
		const parsed = JSON.parse(raw);
		if (parsed && typeof parsed.id === "string") return parsed;
	} catch {
		// Corrupted cache, ignore
	}
	return null;
}

function setCachedOrg(org: Organization | null) {
	try {
		if (org) {
			localStorage.setItem(ACTIVE_ORG_CACHE_KEY, JSON.stringify(org));
		} else {
			localStorage.removeItem(ACTIVE_ORG_CACHE_KEY);
		}
	} catch {
		// Storage full or unavailable, ignore
	}
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(
	undefined,
);

export function OrganizationProvider({ children }: { children: ReactNode }) {
	const { data: session } = authClient.useSession();
	const { data: activeOrg, isPending: activeLoading } =
		authClient.useActiveOrganization();
	const { data: activeMember } = authClient.useActiveMember();
	const [switching, setSwitching] = useState(false);
	const [orgs, setOrgs] = useState<Organization[]>([]);
	const [listLoading, setListLoading] = useState(true);
	const [isSuperadmin, setIsSuperadmin] = useState(false);
	const autoSetAttempted = useRef(false);
	// Superadmin override: better-auth's useActiveOrganization returns null
	// for orgs where the superadmin isn't a member. Track it locally instead.
	const [superadminActiveOrg, setSuperadminActiveOrg] =
		useState<Organization | null>(null);

	const currentUserId = session?.user?.id ?? null;
	const [cachedOrg, setCachedOrgState] = useState(getCachedOrg);

	// Fetch org list and superadmin status from our custom RPCs
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
			// Failed to fetch orgs
		} finally {
			setListLoading(false);
		}
	}, []);

	useEffect(() => {
		fetchOrgs();
	}, [fetchOrgs]);

	// Reset auto-set flag when org list changes (e.g., after create/delete)
	useEffect(() => {
		autoSetAttempted.current = false;
	}, [orgs]);

	// Persist active org + user ID to localStorage whenever it changes
	useEffect(() => {
		if (activeOrg && currentUserId) {
			setCachedOrg({
				id: activeOrg.id,
				name: activeOrg.name,
				slug: activeOrg.slug,
				logo: activeOrg.logo,
				_userId: currentUserId,
			});
		}
	}, [activeOrg, currentUserId]);

	// Also persist superadmin override org to localStorage
	useEffect(() => {
		if (superadminActiveOrg && currentUserId) {
			setCachedOrg({
				...superadminActiveOrg,
				_userId: currentUserId,
			});
			setCachedOrgState(superadminActiveOrg);
		}
	}, [superadminActiveOrg, currentUserId]);

	// Clear cache when user changes (e.g., sign out + sign in as different user)
	useEffect(() => {
		if (currentUserId) {
			const cached = getCachedOrg();
			if (cached && cached._userId && cached._userId !== currentUserId) {
				setCachedOrg(null);
				setCachedOrgState(null);
				setSuperadminActiveOrg(null);
			}
		}
	}, [currentUserId]);

	// Try setActive; if it fails (e.g. superadmin not a member), update session directly
	const setActiveWithFallback = async (orgId: string) => {
		// Clear superadmin override — if normal setActive works, we don't need it
		setSuperadminActiveOrg(null);

		const result = await authClient.organization.setActive({
			organizationId: orgId,
		});
		if (!result.error) {
			return;
		}

		// Likely 403 — superadmin not a member, set active org directly via DB
		await client.superadminSetActive({ organizationId: orgId });

		// Resolve org data from our local list so we don't depend on
		// better-auth's hooks (which will 403 for non-member orgs)
		const org = orgs.find((o) => o.id === orgId);
		if (org) {
			setSuperadminActiveOrg(org);
		}

		// Force better-auth client to refetch session state
		for (const key of Object.keys(authClient.$store.atoms)) {
			if (key.startsWith("$")) {
				authClient.$store.notify(key);
			}
		}
	};

	// Auto-set active org if none is set but user has orgs (runs once per org list change)
	useEffect(() => {
		if (
			!activeLoading &&
			!listLoading &&
			!activeOrg &&
			!superadminActiveOrg &&
			orgs &&
			orgs.length > 0 &&
			!switching &&
			!autoSetAttempted.current
		) {
			autoSetAttempted.current = true;
			setSwitching(true);
			setActiveWithFallback(orgs[0].id).finally(() => setSwitching(false));
		}
	}, [activeOrg, superadminActiveOrg, orgs, activeLoading, listLoading, switching]);

	const switchOrg = async (orgId: string) => {
		setSwitching(true);
		try {
			await setActiveWithFallback(orgId);
		} finally {
			setSwitching(false);
		}
	};

	// Use cached org as optimistic value while better-auth is still loading.
	// Prefer better-auth's activeOrg, then superadmin override, then cache.
	const resolvedOrg =
		activeOrg ?? superadminActiveOrg ?? (activeLoading ? cachedOrg : null);

	// Superadmins always have admin access. Personal workspace (no active org)
	// means you're the owner. For real orgs, check the member role.
	const memberRole = activeMember?.role;
	const isOrgAdmin =
		isSuperadmin ||
		!resolvedOrg ||
		memberRole === "owner" ||
		memberRole === "admin";

	return (
		<OrganizationContext.Provider
			value={{
				activeOrg: resolvedOrg,
				organizations: orgs ?? [],
				switchOrg,
				refetchOrgs: fetchOrgs,
				isLoading: activeLoading || listLoading || switching,
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
