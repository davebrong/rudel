import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { LoginForm } from "./components/auth/login-form";
import { SignupForm } from "./components/auth/signup-form";
import { Button } from "./components/ui/button";
import { authClient } from "./lib/auth-client";
import { orpc } from "./lib/orpc";

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
	const health = useQuery(orpc.health.queryOptions({}));
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
		<div className="flex min-h-screen flex-col items-center justify-center gap-4">
			<h1 className="text-4xl font-bold">Melbourne</h1>
			<p className="text-muted-foreground">
				Signed in as {session.user.name} ({session.user.email})
			</p>
			<p className="text-muted-foreground">
				API status:{" "}
				{health.isLoading
					? "checking..."
					: health.data
						? health.data.status
						: "offline"}
			</p>
			<div className="flex gap-2">
				<Button type="button" onClick={() => health.refetch()}>
					Check Health
				</Button>
				<Button
					type="button"
					variant="outline"
					onClick={() => authClient.signOut()}
				>
					Sign out
				</Button>
			</div>
		</div>
	);
}

export default App;
