import {
	AlertTriangle,
	Building2,
	Check,
	Copy,
	Loader2,
	Mail,
	Pencil,
	Plus,
	Trash2,
	UserPlus,
	X,
} from "lucide-react";
import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AnalyticsCard } from "../../components/analytics/AnalyticsCard";
import { PageHeader } from "../../components/analytics/PageHeader";
import { DeleteOrganizationDialog } from "../../components/DeleteOrganizationDialog";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "../../components/ui/select";
import { useOrganization } from "../../contexts/OrganizationContext";
import { useFullOrganization } from "../../hooks/useFullOrganization";
import { authClient } from "../../lib/auth-client";

export function OrganizationPage() {
	const { activeOrg, organizations, switchOrg } = useOrganization();
	const { data: session } = authClient.useSession();
	const navigate = useNavigate();
	const {
		data: fullOrg,
		isLoading: loading,
		invalidate,
	} = useFullOrganization(activeOrg?.id);
	const [inviteEmail, setInviteEmail] = useState("");
	const [inviteRole, setInviteRole] = useState("member");
	const [inviting, setInviting] = useState(false);
	const [inviteLink, setInviteLink] = useState<string | null>(null);
	const [copied, setCopied] = useState(false);
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [editing, setEditing] = useState(false);
	const [editName, setEditName] = useState("");
	const [saving, setSaving] = useState(false);
	const [renameError, setRenameError] = useState<string | null>(null);
	const nameInputRef = useRef<HTMLInputElement>(null);

	const currentUserRole = fullOrg?.members.find(
		(m) => m.userId === session?.user.id,
	)?.role;
	const canEdit = currentUserRole === "owner" || currentUserRole === "admin";

	const handleStartEditing = () => {
		if (!activeOrg) return;
		setEditName(activeOrg.name);
		setRenameError(null);
		setEditing(true);
		setTimeout(() => nameInputRef.current?.focus(), 0);
	};

	const handleCancelEditing = () => {
		setEditing(false);
		setRenameError(null);
	};

	const handleSaveName = async () => {
		const trimmed = editName.trim();
		if (!trimmed || !activeOrg) return;
		if (trimmed === activeOrg.name) {
			setEditing(false);
			return;
		}

		setSaving(true);
		setRenameError(null);
		const res = await authClient.organization.update({
			data: { name: trimmed },
			organizationId: activeOrg.id,
		});

		if (res.error) {
			setRenameError(res.error.message ?? "Failed to rename organization");
			setSaving(false);
			return;
		}

		setEditing(false);
		setSaving(false);
		invalidate();
	};

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
			invalidate();
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
		invalidate();
	};

	const handleCancelInvitation = async (invitationId: string) => {
		await authClient.organization.cancelInvitation({ invitationId });
		invalidate();
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
				actions={
					<Link to="/dashboard/organization/new">
						<Button size="sm">
							<Plus className="h-4 w-4 mr-1" />
							Create Organization
						</Button>
					</Link>
				}
			/>

			<div className="flex flex-col gap-6">
				{/* Organization Info */}
				<AnalyticsCard>
					<div className="flex items-center gap-4">
						<div className="flex h-12 w-12 items-center justify-center rounded-lg bg-hover">
							<Building2 className="h-6 w-6 text-muted" />
						</div>
						{editing ? (
							<div className="flex-1">
								<Label htmlFor="org-name">Organization name</Label>
								<div className="flex items-center gap-2 mt-1">
									<Input
										ref={nameInputRef}
										id="org-name"
										value={editName}
										onChange={(e) => setEditName(e.target.value)}
										onKeyDown={(e) => {
											if (e.key === "Enter") handleSaveName();
											if (e.key === "Escape") handleCancelEditing();
										}}
										disabled={saving}
										className="max-w-xs"
									/>
									<Button
										size="sm"
										onClick={handleSaveName}
										disabled={saving || !editName.trim()}
									>
										{saving ? (
											<Loader2 className="h-4 w-4 animate-spin" />
										) : (
											<Check className="h-4 w-4" />
										)}
									</Button>
									<Button
										variant="outline"
										size="sm"
										onClick={handleCancelEditing}
										disabled={saving}
									>
										<X className="h-4 w-4" />
									</Button>
								</div>
								{renameError && (
									<p className="mt-1 text-sm text-red-500">{renameError}</p>
								)}
							</div>
						) : (
							<div className="flex items-center gap-2">
								<div>
									<h2 className="text-lg font-semibold text-heading">
										{activeOrg.name}
									</h2>
									<p className="text-sm text-muted">/{activeOrg.slug}</p>
								</div>
								{canEdit && (
									<Button
										variant="outline"
										size="xs"
										onClick={handleStartEditing}
									>
										<Pencil className="h-3.5 w-3.5" />
									</Button>
								)}
							</div>
						)}
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
							onChange={(e) => {
								setInviteEmail(e.target.value);
								if (inviteLink) setInviteLink(null);
							}}
							className="flex-1"
						/>
						<Select value={inviteRole} onValueChange={setInviteRole}>
							<SelectTrigger className="w-auto">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="member">Member</SelectItem>
								<SelectItem value="admin">Admin</SelectItem>
							</SelectContent>
						</Select>
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

				{/* Danger Zone */}
				<AnalyticsCard className="border-red-500/30">
					<h2 className="text-lg font-semibold text-red-500 mb-2">
						<AlertTriangle className="h-5 w-5 inline-block mr-2 -mt-0.5" />
						Danger Zone
					</h2>
					<p className="text-sm text-muted mb-4">
						Permanently delete this organization and all associated data.
					</p>
					{organizations.length <= 1 ? (
						<Button variant="destructive" size="sm" disabled>
							Cannot delete your only organization
						</Button>
					) : (
						<Button
							variant="destructive"
							size="sm"
							onClick={() => setDeleteDialogOpen(true)}
						>
							<Trash2 className="h-4 w-4 mr-1" />
							Delete Organization
						</Button>
					)}
				</AnalyticsCard>

				<DeleteOrganizationDialog
					open={deleteDialogOpen}
					onOpenChange={setDeleteDialogOpen}
					organization={activeOrg}
					onDeleted={async () => {
						setDeleteDialogOpen(false);
						const other = organizations.find((o) => o.id !== activeOrg.id);
						if (other) {
							await switchOrg(other.id);
						}
						navigate("/dashboard");
					}}
				/>
			</div>
		</div>
	);
}
