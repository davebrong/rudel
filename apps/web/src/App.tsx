import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { LoginForm } from "./components/auth/login-form";
import { SignupForm } from "./components/auth/signup-form";
import { Button } from "./components/ui/button";
import { authClient } from "./lib/auth-client";
import { orpc } from "./lib/orpc";

type Page = "login" | "signup";

function App() {
	const { data: session, isPending } = authClient.useSession();
	const [page, setPage] = useState<Page>("login");
	const health = useQuery(orpc.health.queryOptions({}));

	if (isPending) {
		return (
			<div className="flex min-h-screen items-center justify-center">
				<p className="text-muted-foreground">Loading...</p>
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
				<Button onClick={() => health.refetch()}>Check Health</Button>
				<Button variant="outline" onClick={() => authClient.signOut()}>
					Sign out
				</Button>
			</div>
		</div>
	);
}

export default App;
