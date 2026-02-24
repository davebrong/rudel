import { useEffect, useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { LoginForm } from "./components/auth/login-form";
import { SignupForm } from "./components/auth/signup-form";
import { DashboardLayout } from "./layouts/DashboardLayout";
import { authClient } from "./lib/auth-client";
import { AcceptInvitationPage } from "./pages/AcceptInvitationPage";
import { CreateOrgPage } from "./pages/dashboard/CreateOrgPage";
import { DeveloperDetailPage } from "./pages/dashboard/DeveloperDetailPage";
import { DevelopersListPage } from "./pages/dashboard/DevelopersListPage";
import { ErrorsPage } from "./pages/dashboard/ErrorsPage";
import { LearningsPage } from "./pages/dashboard/LearningsPage";
import { OrganizationPage } from "./pages/dashboard/OrganizationPage";
import { OverviewPage } from "./pages/dashboard/OverviewPage";
import { ProfilePage } from "./pages/dashboard/ProfilePage";
import { ProjectDetailPage } from "./pages/dashboard/ProjectDetailPage";
import { ProjectsListPage } from "./pages/dashboard/ProjectsListPage";
import { ROIPage } from "./pages/dashboard/ROIPage";
import { SessionDetailPage } from "./pages/dashboard/SessionDetailPage";
import { SessionsListPage } from "./pages/dashboard/SessionsListPage";

type Page = "login" | "signup";

function getCliParams(): { cliCallback: string; state: string } | null {
	const params = new URLSearchParams(window.location.search);
	const cliCallback = params.get("cli_callback");
	const state = params.get("state");
	if (!cliCallback || !state) return null;
	try {
		const url = new URL(cliCallback);
		if (url.hostname !== "127.0.0.1") return null;
	} catch {
		return null;
	}
	return { cliCallback, state };
}

function App() {
	const { data: session, isPending } = authClient.useSession();
	const [page, setPage] = useState<Page>("login");
	const [cliRedirecting, setCliRedirecting] = useState(false);
	const cliParams = getCliParams();

	useEffect(() => {
		if (!session || !cliParams || cliRedirecting) return;
		setCliRedirecting(true);

		fetch("/api/cli-token", { credentials: "include" })
			.then((res) => res.json())
			.then((data: { token: string }) => {
				const redirectUrl = `${cliParams.cliCallback}?token=${encodeURIComponent(data.token)}&state=${encodeURIComponent(cliParams.state)}`;
				window.location.href = redirectUrl;
			});
	}, [session, cliParams, cliRedirecting]);

	if (isPending) {
		return (
			<div className="flex min-h-screen items-center justify-center">
				<p className="text-muted-foreground">Loading...</p>
			</div>
		);
	}

	if (cliRedirecting) {
		return (
			<div className="flex min-h-screen items-center justify-center">
				<p className="text-muted-foreground">Completing CLI login...</p>
			</div>
		);
	}

	if (!session) {
		return (
			<div className="flex min-h-screen items-center justify-center">
				{page === "login" ? (
					<LoginForm onSwitchToSignup={() => setPage("signup")} />
				) : (
					<SignupForm onSwitchToLogin={() => setPage("login")} />
				)}
			</div>
		);
	}

	return (
		<Routes>
			<Route path="/" element={<Navigate to="/dashboard" replace />} />
			<Route
				path="/invitation/:invitationId"
				element={<AcceptInvitationPage />}
			/>
			<Route path="/dashboard" element={<DashboardLayout />}>
				<Route index element={<OverviewPage />} />
				<Route path="developers" element={<DevelopersListPage />} />
				<Route path="developers/:userId" element={<DeveloperDetailPage />} />
				<Route path="projects" element={<ProjectsListPage />} />
				<Route path="projects/:projectPath" element={<ProjectDetailPage />} />
				<Route path="sessions" element={<SessionsListPage />} />
				<Route path="sessions/:sessionId" element={<SessionDetailPage />} />
				<Route path="roi" element={<ROIPage />} />
				<Route path="errors" element={<ErrorsPage />} />
				<Route path="learnings" element={<LearningsPage />} />
				<Route path="profile" element={<ProfilePage />} />
				<Route path="organization" element={<OrganizationPage />} />
				<Route path="organization/new" element={<CreateOrgPage />} />
			</Route>
			<Route path="*" element={<Navigate to="/dashboard" replace />} />
		</Routes>
	);
}

export default App;
