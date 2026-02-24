import {
	Building2,
	Check,
	Copy,
	Loader2,
	Mail,
	Trash2,
	UserPlus,
	X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { AnalyticsCard } from "../../components/analytics/AnalyticsCard";
import { PageHeader } from "../../components/analytics/PageHeader";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { useOrganization } from "../../contexts/OrganizationContext";
import { authClient } from "../../lib/auth-client";

interface FullOrg {
	id: string;
	name: string;
	slug: string;
	members: readonly {
		id: string;
		userId: string;
		role: string;
		user: { id: string; name: string; email: string; image: string | null };
	}[];
	invitations: readonly {
		id: string;
		email: string;
		role: string | null;
		status: string;
	}[];
}

export function OrganizationPage() {
	const { activeOrg } = useOrganization();
	const [fullOrg, setFullOrg] = useState<FullOrg | null>(null);
	const [loading, setLoading] = useState(true);
	const [inviteEmail, setInviteEmail] = useState("");
	const [inviteRole, setInviteRole] = useState("member");
	const [inviting, setInviting] = useState(false);
	const [inviteLink, setInviteLink] = useState<string | null>(null);
	const [copied, setCopied] = useState(false);

	const fetchOrg = async () => {
		if (!activeOrg) return;
		setLoading(true);
		const res = await authClient.organization.getFullOrganization({
			query: { organizationId: activeOrg.id },
		});
		if (res.data) {
			setFullOrg(res.data as unknown as FullOrg);
		}
		setLoading(false);
	};

	// biome-ignore lint/correctness/useExhaustiveDependencies: refetch when org changes
	useEffect(() => {
		fetchOrg();
	}, [activeOrg?.id]);

	const handleInvite = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!inviteEmail.trim()) return;
		setInviting(true);
		const res = await authClient.organization.inviteMember({
			email: inviteEmail.trim(),
			role: inviteRole as "member" | "admin",
		});
		if (res.data) {
			const link = `${window.location.origin}/invitation/${res.data.id}`;
			setInviteLink(link);
			setInviteEmail("");
			await fetchOrg();
		}
		setInviting(false);
	};

	const handleCopyLink = () => {
		if (!inviteLink) return;
		navigator.clipboard.writeText(inviteLink);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	};

	const handleRemoveMember = async (memberIdOrEmail: string) => {
		await authClient.organization.removeMember({ memberIdOrEmail });
		await fetchOrg();
	};

	const handleCancelInvitation = async (invitationId: string) => {
		await authClient.organization.cancelInvitation({ invitationId });
		await fetchOrg();
	};

	if (!activeOrg) {
		return (
			<div className="px-8 py-6">
				<p className="text-muted">No organization selected.</p>
			</div>
		);
	}

	return (
		<div className="px-8 py-6">
			<PageHeader
				title="Organization"
				description={`Manage ${activeOrg.name}`}
			/>

			<div className="flex flex-col gap-6">
				{/* Organization Info */}
				<AnalyticsCard>
					<div className="flex items-center gap-4">
						<div className="flex h-12 w-12 items-center justify-center rounded-lg bg-hover">
							<Building2 className="h-6 w-6 text-muted" />
						</div>
						<div>
							<h2 className="text-lg font-semibold text-heading">
								{activeOrg.name}
							</h2>
							<p className="text-sm text-muted">/{activeOrg.slug}</p>
						</div>
					</div>
				</AnalyticsCard>

				{/* Invite Members */}
				<AnalyticsCard>
					<h2 className="text-lg font-semibold text-heading mb-4">
						<UserPlus className="h-5 w-5 inline-block mr-2 -mt-0.5" />
						Invite Members
					</h2>

					<form onSubmit={handleInvite} className="flex gap-2 mb-3">
						<Input
							type="email"
							placeholder="Email address"
							value={inviteEmail}
							onChange={(e) => setInviteEmail(e.target.value)}
							className="flex-1"
						/>
						<select
							value={inviteRole}
							onChange={(e) => setInviteRole(e.target.value)}
							className="rounded-md border border-border bg-surface px-3 py-1.5 text-sm text-foreground"
						>
							<option value="member">Member</option>
							<option value="admin">Admin</option>
						</select>
						<Button
							type="submit"
							size="sm"
							disabled={inviting || !inviteEmail.trim()}
						>
							{inviting ? (
								<Loader2 className="h-4 w-4 animate-spin" />
							) : (
								<Mail className="h-4 w-4 mr-1" />
							)}
							Invite
						</Button>
					</form>

					{inviteLink && (
						<div className="flex items-center gap-2 rounded-lg border border-border bg-hover/50 px-3 py-2 text-sm">
							<span className="flex-1 truncate text-muted">{inviteLink}</span>
							<Button variant="outline" size="xs" onClick={handleCopyLink}>
								{copied ? (
									<Check className="h-3.5 w-3.5 text-status-success-icon" />
								) : (
									<Copy className="h-3.5 w-3.5" />
								)}
							</Button>
							<Button
								variant="outline"
								size="xs"
								onClick={() => setInviteLink(null)}
							>
								<X className="h-3.5 w-3.5" />
							</Button>
						</div>
					)}
				</AnalyticsCard>

				{/* Members */}
				<AnalyticsCard>
					<h2 className="text-lg font-semibold text-heading mb-4">Members</h2>

					{loading ? (
						<p className="text-sm text-muted">Loading...</p>
					) : (
						<div className="flex flex-col gap-2">
							{fullOrg?.members.map((m) => (
								<div
									key={m.id}
									className="flex items-center justify-between rounded-lg border border-border px-4 py-3"
								>
									<div className="flex items-center gap-3">
										{m.user.image ? (
											<img
												src={m.user.image}
												alt=""
												className="h-8 w-8 rounded-full"
											/>
										) : (
											<div className="flex h-8 w-8 items-center justify-center rounded-full bg-hover text-xs font-medium text-muted">
												{m.user.name.charAt(0).toUpperCase()}
											</div>
										)}
										<div>
											<p className="text-sm font-medium text-foreground">
												{m.user.name}
											</p>
											<p className="text-xs text-muted">{m.user.email}</p>
										</div>
									</div>
									<div className="flex items-center gap-2">
										<Badge
											variant={m.role === "owner" ? "default" : "secondary"}
										>
											{m.role}
										</Badge>
										{m.role !== "owner" && (
											<Button
												variant="outline"
												size="xs"
												onClick={() => handleRemoveMember(m.id)}
											>
												<Trash2 className="h-3.5 w-3.5" />
											</Button>
										)}
									</div>
								</div>
							))}
						</div>
					)}
				</AnalyticsCard>

				{/* Pending Invitations */}
				{fullOrg && fullOrg.invitations.length > 0 && (
					<AnalyticsCard>
						<h2 className="text-lg font-semibold text-heading mb-4">
							Pending Invitations
						</h2>

						<div className="flex flex-col gap-2">
							{fullOrg.invitations
								.filter((inv) => inv.status === "pending")
								.map((inv) => (
									<div
										key={inv.id}
										className="flex items-center justify-between rounded-lg border border-border px-4 py-3"
									>
										<div className="flex items-center gap-3">
											<Mail className="h-4 w-4 text-muted" />
											<span className="text-sm text-foreground">
												{inv.email}
											</span>
											{inv.role && (
												<Badge variant="secondary">{inv.role}</Badge>
											)}
										</div>
										<Button
											variant="outline"
											size="xs"
											onClick={() => handleCancelInvitation(inv.id)}
										>
											<X className="h-3.5 w-3.5 mr-1" />
											Cancel
										</Button>
									</div>
								))}
						</div>
					</AnalyticsCard>
				)}
			</div>
		</div>
	);
}
