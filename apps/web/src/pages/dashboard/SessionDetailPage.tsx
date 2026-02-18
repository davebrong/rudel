import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "react-router-dom";
import {
	ArrowLeft,
	User,
	Clock,
	FolderOpen,
	GitBranch,
	Copy,
	CheckCircle2,
} from "lucide-react";
import { AnalyticsCard } from "@/components/analytics/AnalyticsCard";
import { orpc } from "@/lib/orpc";
import { formatRelativeTime } from "@/lib/time-utils";
import { formatUsername, calculateCost } from "@/lib/format";

export function SessionDetailPage() {
	const { sessionId } = useParams<{ sessionId: string }>();
	const [copied, setCopied] = useState(false);

	const { data: session, isLoading } = useQuery(
		orpc.analytics.sessions.detail.queryOptions({
			input: { sessionId: sessionId! },
		}),
	);

	const { data: userMappings } = useQuery(
		orpc.analytics.users.mappings.queryOptions({ input: { days: 30 } }),
	);

	const userMapRecord = useMemo(() => {
		const record: Record<string, string> = {};
		if (userMappings) {
			for (const m of userMappings) {
				record[m.user_id] = m.username;
			}
		}
		return record;
	}, [userMappings]);

	const copySessionId = () => {
		if (session) {
			navigator.clipboard.writeText(session.session_id);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		}
	};

	if (isLoading) {
		return (
			<div className="max-w-6xl mx-auto">
				<div className="mb-6">
					<Link
						to="/dashboard/sessions"
						className="inline-flex items-center text-sm text-muted hover:text-foreground mb-4"
					>
						<ArrowLeft className="w-4 h-4 mr-1" />
						Back to Sessions
					</Link>
				</div>
				<AnalyticsCard>
					<div className="animate-pulse space-y-4">
						<div className="h-8 bg-hover rounded w-1/3" />
						<div className="h-4 bg-hover rounded w-1/2" />
						<div className="h-4 bg-hover rounded w-2/3" />
					</div>
				</AnalyticsCard>
			</div>
		);
	}

	if (!session) {
		return (
			<div className="max-w-6xl mx-auto">
				<div className="mb-6">
					<Link
						to="/dashboard/sessions"
						className="inline-flex items-center text-sm text-muted hover:text-foreground mb-4"
					>
						<ArrowLeft className="w-4 h-4 mr-1" />
						Back to Sessions
					</Link>
				</div>
				<AnalyticsCard>
					<div className="text-center py-8">
						<p className="text-status-error-icon text-lg font-semibold mb-2">
							Session Not Found
						</p>
					</div>
				</AnalyticsCard>
			</div>
		);
	}

	return (
		<div className="max-w-6xl mx-auto">
			{/* Session Header */}
			<div className="sticky top-0 z-10 bg-input border-b border-border shadow-sm mb-6 -mx-6 px-6 py-4">
				<div className="flex items-start justify-between">
					<div>
						<h1 className="text-2xl font-bold text-heading mb-2">
							Session Details
						</h1>
						<div className="flex items-center gap-4 text-sm text-muted">
							<div className="flex items-center gap-2">
								<span className="font-mono text-xs bg-surface px-2 py-1 rounded">
									{session.session_id.slice(0, 8)}...
								</span>
								<button
									onClick={copySessionId}
									className="p-1 hover:bg-hover rounded"
									title="Copy session ID"
								>
									{copied ? (
										<CheckCircle2 className="w-4 h-4 text-status-success-icon" />
									) : (
										<Copy className="w-4 h-4 text-muted" />
									)}
								</button>
							</div>
							<div className="flex items-center gap-1">
								<Clock className="w-4 h-4" />
								{formatRelativeTime(session.session_date)}
							</div>
							<div className="flex items-center gap-1">
								<User className="w-4 h-4" />
								{formatUsername(session.user_id, userMapRecord)}
							</div>
						</div>
					</div>
				</div>

				<div className="mt-4 flex flex-wrap items-center gap-4 text-sm">
					{session.repository && (
						<div className="flex items-center gap-2 px-3 py-1 bg-status-info-bg rounded-lg">
							<GitBranch className="w-4 h-4 text-accent" />
							<span className="text-status-info-text font-medium">
								{session.repository}
							</span>
						</div>
					)}
					<div className="flex items-center gap-2 px-3 py-1 bg-surface rounded-lg">
						<FolderOpen className="w-4 h-4 text-muted" />
						<span className="text-subheading text-xs font-mono">
							{session.project_path.split("/").pop() || session.project_path}
						</span>
					</div>

					<div className="flex gap-2 ml-auto">
						{session.skills.map((skill, idx) => (
							<span
								key={idx}
								className="px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded"
							>
								skill:{skill}
							</span>
						))}
						{session.slash_commands.map((cmd, idx) => (
							<span
								key={idx}
								className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded"
							>
								/{cmd}
							</span>
						))}
					</div>
				</div>
			</div>

			{/* Session Metadata */}
			<AnalyticsCard className="mb-6">
				<h3 className="text-lg font-semibold mb-4">Session Information</h3>
				<div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
					<div>
						<p className="text-muted font-medium mb-1">Project Path</p>
						<p className="text-foreground font-mono text-xs break-all">
							{session.project_path}
						</p>
					</div>
					<div>
						<p className="text-muted font-medium mb-1">Session Date</p>
						<p className="text-foreground">
							{new Date(session.session_date).toLocaleString()}
						</p>
					</div>
					<div>
						<p className="text-muted font-medium mb-1">Developer</p>
						<p className="text-foreground">
							{formatUsername(session.user_id, userMapRecord)}
						</p>
					</div>
					{session.git_branch && (
						<div>
							<p className="text-muted font-medium mb-1">Git Branch</p>
							<p className="text-foreground font-mono text-xs">
								{session.git_branch}
							</p>
						</div>
					)}
					{session.git_sha && (
						<div>
							<p className="text-muted font-medium mb-1">Git SHA</p>
							<p className="text-foreground font-mono text-xs">
								{session.git_sha.slice(0, 8)}
							</p>
						</div>
					)}
					<div>
						<p className="text-muted font-medium mb-1">Total Tokens</p>
						<p className="text-foreground">
							{session.total_tokens.toLocaleString()}
						</p>
					</div>
					<div>
						<p className="text-muted font-medium mb-1">Input Tokens</p>
						<p className="text-foreground">
							{session.input_tokens.toLocaleString()}
						</p>
					</div>
					<div>
						<p className="text-muted font-medium mb-1">Output Tokens</p>
						<p className="text-foreground">
							{session.output_tokens.toLocaleString()}
						</p>
					</div>
					{session.success_score !== undefined && (
						<div>
							<p className="text-muted font-medium mb-1">Success Score</p>
							<p className="text-foreground font-semibold">
								<span
									className={
										session.success_score >= 70
											? "text-status-success-icon"
											: session.success_score >= 40
												? "text-status-warning-icon"
												: "text-status-error-icon"
									}
								>
									{session.success_score.toFixed(1)}
								</span>
								<span className="text-xs text-muted ml-1">/ 100</span>
							</p>
						</div>
					)}
					<div>
						<p className="text-muted font-medium mb-1">Cost</p>
						<p className="text-foreground font-mono">
							$
							{calculateCost(
								session.input_tokens,
								session.output_tokens,
							).toFixed(4)}
						</p>
					</div>
				</div>
			</AnalyticsCard>

			{/* Conversation Placeholder */}
			<AnalyticsCard>
				<div className="flex items-center justify-between mb-6">
					<h3 className="text-lg font-semibold">Conversation</h3>
				</div>
				<p>Conversation viewer coming soon</p>
			</AnalyticsCard>
		</div>
	);
}
