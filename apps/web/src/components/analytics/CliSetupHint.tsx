import { Terminal } from "lucide-react";
import { AnalyticsCard } from "./AnalyticsCard";

export function CliSetupHint() {
	return (
		<AnalyticsCard className="mt-4">
			<div className="flex flex-col items-center justify-center py-20 px-4 text-center">
				<div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-6">
					<Terminal className="w-8 h-8 text-muted-foreground" />
				</div>
				<h3 className="text-lg font-semibold text-foreground mb-3">
					No sessions yet
				</h3>
				<p className="text-sm text-muted-foreground max-w-lg mb-6">
					Install the Rudel CLI and enable automatic uploads to start tracking
					your team's Claude Code sessions.
				</p>
				<div className="w-full max-w-md text-left space-y-4">
					<div>
						<p className="text-xs font-medium text-muted-foreground mb-2">
							1. Install the CLI globally
						</p>
						<pre className="bg-background rounded-md border border-border px-4 py-3 text-sm font-mono text-foreground">
							npm install -g rudel
						</pre>
					</div>
					<div>
						<p className="text-xs font-medium text-muted-foreground mb-2">
							2. Log in to your account
						</p>
						<pre className="bg-background rounded-md border border-border px-4 py-3 text-sm font-mono text-foreground">
							rudel login
						</pre>
					</div>
					<div>
						<p className="text-xs font-medium text-muted-foreground mb-2">
							3. Enable auto-upload in your repository
						</p>
						<pre className="bg-background rounded-md border border-border px-4 py-3 text-sm font-mono text-foreground">
							rudel enable
						</pre>
					</div>
				</div>
				<p className="text-xs text-muted-foreground/60 max-w-md mt-6">
					Sessions will appear here automatically after your next Claude Code
					session ends. <span className="font-mono">rudel enable</span> will
					also offer to upload your previous sessions, or you can run{" "}
					<span className="font-mono">rudel upload</span> at any time.
				</p>
			</div>
		</AnalyticsCard>
	);
}
