import { useState } from "react";
import { authClient } from "../../lib/auth-client";
import { Button } from "../ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "../ui/card";

function getCallbackURL(): string {
	const params = new URLSearchParams(window.location.search);
	const userCode = params.get("user_code");
	if (userCode) {
		return `/?user_code=${encodeURIComponent(userCode)}`;
	}
	const redirect = params.get("redirect");
	if (redirect) {
		return `/?redirect=${encodeURIComponent(redirect)}`;
	}
	const path = window.location.pathname;
	const search = window.location.search;
	if (path !== "/" && path !== "") {
		return `/?redirect=${encodeURIComponent(`${path}${search}`)}`;
	}
	return "/";
}

export function LoginForm() {
	const [error, setError] = useState("");

	async function handleGoogleSignIn() {
		setError("");
		const { error } = await authClient.signIn.social({
			provider: "google",
			callbackURL: getCallbackURL(),
		});
		if (error) {
			setError(error.message ?? "Sign in with Google failed");
		}
	}

	return (
		<Card className="w-full max-w-sm">
			<CardHeader>
				<CardTitle className="text-2xl">Sign in</CardTitle>
				<CardDescription>
					Sign in with your Google account to continue
				</CardDescription>
			</CardHeader>
			<CardContent className="flex flex-col gap-4">
				{error && <p className="text-sm text-destructive">{error}</p>}
				<Button variant="outline" onClick={handleGoogleSignIn}>
					Continue with Google
				</Button>
			</CardContent>
		</Card>
	);
}
