import { useState } from "react";
import { authClient } from "../../lib/auth-client";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "../ui/card";

const EMAIL_PASSWORD_ENABLED =
	import.meta.env.VITE_ENABLE_EMAIL_PASSWORD === "true";

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
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [loading, setLoading] = useState(false);

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

	async function handleEmailSignIn(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();
		setError("");
		setLoading(true);
		try {
			const { error } = await authClient.signIn.email({
				email,
				password,
				callbackURL: getCallbackURL(),
			});
			if (error) {
				setError(error.message ?? "Sign in failed");
			}
		} finally {
			setLoading(false);
		}
	}

	return (
		<Card className="w-full max-w-sm">
			<CardHeader>
				<CardTitle className="text-2xl">Sign in</CardTitle>
				<CardDescription>
					{EMAIL_PASSWORD_ENABLED
						? "Sign in to continue"
						: "Sign in with your Google account to continue"}
				</CardDescription>
			</CardHeader>
			<CardContent className="flex flex-col gap-4">
				{error && <p className="text-sm text-destructive">{error}</p>}
				{EMAIL_PASSWORD_ENABLED && (
					<form onSubmit={handleEmailSignIn} className="flex flex-col gap-4">
						<div className="flex flex-col gap-2">
							<Label htmlFor="email">Email</Label>
							<Input
								id="email"
								type="email"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								required
							/>
						</div>
						<div className="flex flex-col gap-2">
							<Label htmlFor="password">Password</Label>
							<Input
								id="password"
								type="password"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								required
							/>
						</div>
						<Button type="submit" disabled={loading}>
							{loading ? "Signing in..." : "Sign in"}
						</Button>
					</form>
				)}
				<Button variant="outline" onClick={handleGoogleSignIn}>
					Continue with Google
				</Button>
			</CardContent>
		</Card>
	);
}
