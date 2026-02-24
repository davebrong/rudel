import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { ConversationList } from "@/components/sessions/conversation/ConversationList";
import { SessionHeader } from "@/components/sessions/SessionHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSession } from "@/hooks/useSession";
import { orpc } from "@/lib/orpc";

export function SessionDetailPage() {
	const { sessionId } = useParams<{ sessionId: string }>();

	const { data, isLoading, error } = useQuery(
		orpc.analytics.sessions.detail.queryOptions({
			input: { sessionId: sessionId as string },
		}),
	);

	if (isLoading) {
		return (
			<div className="flex flex-col h-full">
				<div className="border-b p-4 space-y-3">
					<div className="h-8 w-48 bg-muted animate-pulse rounded" />
					<div className="h-4 w-64 bg-muted animate-pulse rounded" />
					<div className="h-6 w-96 bg-muted animate-pulse rounded" />
				</div>
				<div className="flex-1 p-4">
					<div className="space-y-4">
						{["sk-1", "sk-2", "sk-3", "sk-4", "sk-5"].map((id) => (
							<div key={id} className="h-24 bg-muted animate-pulse rounded" />
						))}
					</div>
				</div>
			</div>
		);
	}

	if (error || !data) {
		return (
			<div className="flex items-center justify-center h-96">
				<Card className="max-w-md w-full">
					<CardHeader>
						<CardTitle className="text-destructive">
							Error Loading Session
						</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-sm text-muted-foreground">
							Failed to load session data. The session may not exist.
						</p>
					</CardContent>
				</Card>
			</div>
		);
	}

	return <SessionDetailContent session={data} />;
}

interface SessionDetailContentProps {
	session: {
		session_id: string;
		user_id: string;
		session_date: string;
		project_path: string;
		repository: string | null;
		content: string;
		subagents: Record<string, string>;
		skills: Array<string>;
		slash_commands: Array<string>;
		git_branch: string | null;
		git_sha: string | null;
		total_tokens: number;
		input_tokens: number;
		output_tokens: number;
		success_score?: number;
		duration_min?: number;
		total_interactions?: number;
		session_archetype?: string;
		model_used?: string;
	};
}

function SessionDetailContent({ session }: SessionDetailContentProps) {
	const { conversations, getToolResult, subagents } = useSession(session);

	return (
		<div className="flex flex-col h-full">
			<SessionHeader session={session} />
			<div className="flex-1 overflow-auto p-4">
				<ConversationList
					conversations={conversations}
					getToolResult={getToolResult}
					subagents={subagents}
				/>
			</div>
		</div>
	);
}
