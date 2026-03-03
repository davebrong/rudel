import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { client } from "../lib/orpc";
import { Button } from "./ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "./ui/dialog";
import { Input } from "./ui/input";

interface DeleteOrganizationDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	organization: { id: string; name: string };
	otherOrganizations: { id: string; name: string }[];
	onDeleted: () => void;
}

export function DeleteOrganizationDialog({
	open,
	onOpenChange,
	organization,
	otherOrganizations,
	onDeleted,
}: DeleteOrganizationDialogProps) {
	const { data: sessionCountData, isLoading: loading } = useQuery({
		queryKey: ["org-session-count", organization.id],
		queryFn: async () => {
			const res = await client.getOrganizationSessionCount({
				organizationId: organization.id,
			});
			return res.count;
		},
		enabled: open,
	});
	const sessionCount = sessionCountData ?? null;
	const [sessionAction, setSessionAction] = useState<
		"migrate" | "delete" | null
	>(null);
	const [migrateTarget, setMigrateTarget] = useState("");
	const [confirmName, setConfirmName] = useState("");
	const [deleting, setDeleting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (!open) {
			setSessionAction(null);
			setMigrateTarget("");
			setConfirmName("");
			setDeleting(false);
			setError(null);
		}
	}, [open]);

	const nameMatches =
		confirmName.toLowerCase() === organization.name.toLowerCase();
	const canDelete =
		nameMatches &&
		!deleting &&
		(sessionCount === 0 ||
			sessionAction === "delete" ||
			(sessionAction === "migrate" && migrateTarget));

	const handleDelete = async () => {
		setDeleting(true);
		setError(null);
		try {
			await client.deleteOrganization({
				organizationId: organization.id,
				migrateSessionsTo:
					sessionAction === "migrate" ? migrateTarget : undefined,
			});
			onDeleted();
		} catch (err) {
			setError(
				err instanceof Error ? err.message : "Failed to delete organization",
			);
			setDeleting(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<AlertTriangle className="h-5 w-5 text-red-500" />
						Delete Organization
					</DialogTitle>
					<DialogDescription>
						This action cannot be undone. This will permanently delete{" "}
						<strong>{organization.name}</strong> and remove all member access.
					</DialogDescription>
				</DialogHeader>

				{loading ? (
					<div className="flex items-center justify-center py-8">
						<Loader2 className="h-6 w-6 animate-spin text-muted" />
					</div>
				) : (
					<div className="flex flex-col gap-4">
						{sessionCount !== null && sessionCount > 0 ? (
							<>
								<p className="text-sm text-foreground">
									This organization has{" "}
									<strong>
										{sessionCount} session{sessionCount !== 1 ? "s" : ""}
									</strong>
									.
								</p>

								<div className="flex flex-col gap-2">
									<label className="flex items-start gap-2 rounded-lg border border-border p-3 cursor-pointer has-[:checked]:border-foreground">
										<input
											type="radio"
											name="sessionAction"
											value="migrate"
											checked={sessionAction === "migrate"}
											onChange={() => setSessionAction("migrate")}
											className="mt-0.5"
										/>
										<div className="flex flex-col gap-1">
											<span className="text-sm font-medium text-foreground">
												Migrate sessions
											</span>
											<span className="text-xs text-muted">
												Move all sessions to another organization
											</span>
											{sessionAction === "migrate" && (
												<select
													value={migrateTarget}
													onChange={(e) => setMigrateTarget(e.target.value)}
													className="mt-1 rounded-md border border-border bg-surface px-3 py-1.5 text-sm text-foreground"
												>
													<option value="">Select organization...</option>
													{otherOrganizations.map((org) => (
														<option key={org.id} value={org.id}>
															{org.name}
														</option>
													))}
												</select>
											)}
										</div>
									</label>

									<label className="flex items-start gap-2 rounded-lg border border-border p-3 cursor-pointer has-[:checked]:border-foreground">
										<input
											type="radio"
											name="sessionAction"
											value="delete"
											checked={sessionAction === "delete"}
											onChange={() => setSessionAction("delete")}
											className="mt-0.5"
										/>
										<div className="flex flex-col gap-1">
											<span className="text-sm font-medium text-foreground">
												Delete sessions
											</span>
											<span className="text-xs text-muted">
												Permanently delete all session data
											</span>
										</div>
									</label>
								</div>
							</>
						) : (
							<p className="text-sm text-muted">
								This organization has no session data.
							</p>
						)}

						<div className="flex flex-col gap-2">
							<label htmlFor="confirm-name" className="text-sm text-foreground">
								Type <strong>{organization.name}</strong> to confirm:
							</label>
							<Input
								id="confirm-name"
								value={confirmName}
								onChange={(e) => setConfirmName(e.target.value)}
								placeholder={organization.name}
							/>
						</div>

						{error && <p className="text-sm text-red-500">{error}</p>}
					</div>
				)}

				<DialogFooter>
					<Button
						variant="outline"
						onClick={() => onOpenChange(false)}
						disabled={deleting}
					>
						Cancel
					</Button>
					<Button
						variant="destructive"
						onClick={handleDelete}
						disabled={!canDelete}
					>
						{deleting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
						Delete Organization
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
