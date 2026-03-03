import {
	createContext,
	type ReactNode,
	useContext,
	useEffect,
	useState,
} from "react";
import { authClient } from "../lib/auth-client";

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
	isLoading: boolean;
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(
	undefined,
);

export function OrganizationProvider({ children }: { children: ReactNode }) {
	const { data: activeOrg, isPending: activeLoading } =
		authClient.useActiveOrganization();
	const { data: orgs, isPending: listLoading } =
		authClient.useListOrganizations();
	const [switching, setSwitching] = useState(false);

	// Auto-set active org if none is set but user has orgs
	useEffect(() => {
		if (
			!activeLoading &&
			!listLoading &&
			!activeOrg &&
			orgs &&
			orgs.length > 0 &&
			!switching
		) {
			setSwitching(true);
			authClient.organization
				.setActive({ organizationId: orgs[0].id })
				.finally(() => setSwitching(false));
		}
	}, [activeOrg, orgs, activeLoading, listLoading, switching]);

	const switchOrg = async (orgId: string) => {
		setSwitching(true);
		try {
			await authClient.organization.setActive({ organizationId: orgId });
		} finally {
			setSwitching(false);
		}
	};

	return (
		<OrganizationContext.Provider
			value={{
				activeOrg: activeOrg ?? null,
				organizations: orgs ?? [],
				switchOrg,
				isLoading: activeLoading || listLoading || switching,
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
