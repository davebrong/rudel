import { Outlet } from "react-router-dom";
import { Breadcrumb } from "../components/analytics/Breadcrumb";
import { Sidebar } from "../components/analytics/Sidebar";
import { DateRangeProvider } from "../contexts/DateRangeContext";
import { FilterProvider } from "../contexts/FilterContext";
import { OrganizationProvider } from "../contexts/OrganizationContext";

export function DashboardLayout() {
	return (
		<OrganizationProvider>
			<DateRangeProvider>
				<FilterProvider>
					<div className="fixed inset-0 flex overflow-hidden bg-surface">
						<Sidebar />
						<div className="flex min-h-0 flex-1 flex-col overflow-hidden">
							<Breadcrumb />
							<main className="min-h-0 flex-1 overflow-y-auto">
								<Outlet />
							</main>
						</div>
					</div>
				</FilterProvider>
			</DateRangeProvider>
		</OrganizationProvider>
	);
}
