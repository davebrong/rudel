import { useMemo } from "react";
import { useOrganization } from "@/contexts/OrganizationContext";
import { useFullOrganization } from "@/hooks/useFullOrganization";

export function useUserMap() {
	const { activeOrg } = useOrganization();
	const { data: fullOrg, isLoading } = useFullOrganization(activeOrg?.id);

	const userMap = useMemo(() => {
		const record: Record<string, string> = {};
		if (fullOrg?.members) {
			for (const m of fullOrg.members) {
				record[m.userId] = m.user.name;
			}
		}
		return record;
	}, [fullOrg]);

	return { userMap, isLoading };
}
