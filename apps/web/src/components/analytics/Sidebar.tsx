import {
	AlertCircle,
	BookOpen,
	Building2,
	Check,
	ChevronsLeft,
	ChevronsRight,
	ChevronsUpDown,
	Clock,
	DollarSign,
	FolderKanban,
	LayoutDashboard,
	LogOut,
	Plus,
	Settings,
	User,
	UserCircle,
} from "lucide-react";
import { useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useOrganization } from "../../contexts/OrganizationContext";
import { authClient } from "../../lib/auth-client";
import { cn } from "../../lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { ThemeToggle } from "./ThemeToggle";

const navigation = [
	{ name: "Overview", href: "/dashboard", icon: LayoutDashboard },
	{ name: "Developers", href: "/dashboard/developers", icon: UserCircle },
	{ name: "Projects", href: "/dashboard/projects", icon: FolderKanban },
	{
		name: "ROI & Business Value",
		href: "/dashboard/roi",
		icon: DollarSign,
	},
	{ name: "Sessions", href: "/dashboard/sessions", icon: Clock },
	{ name: "Learnings", href: "/dashboard/learnings", icon: BookOpen },
	{ name: "Errors", href: "/dashboard/errors", icon: AlertCircle },
];

function getInitials(name: string) {
	return name
		.split(" ")
		.map((part) => part[0])
		.join("")
		.toUpperCase()
		.slice(0, 2);
}

function OrgSwitcher({ collapsed }: { collapsed: boolean }) {
	const { activeOrg, organizations, switchOrg } = useOrganization();
	const [open, setOpen] = useState(false);
	const ref = useRef<HTMLDivElement>(null);

	const handleSelect = async (orgId: string) => {
		setOpen(false);
		if (orgId !== activeOrg?.id) {
			await switchOrg(orgId);
		}
	};

	return (
		<div ref={ref} className="relative">
			<button
				type="button"
				onClick={() => setOpen(!open)}
				className={cn(
					"flex w-full items-center gap-1.5 px-4 h-10 overflow-hidden border-b border-border hover:bg-hover transition-colors",
					collapsed && "justify-center px-0",
				)}
			>
				<Building2 className="h-4 w-4 shrink-0 text-accent" />
				{!collapsed && (
					<>
						<span className="flex-1 truncate text-left text-sm font-bold text-heading">
							{activeOrg?.name ?? "Select org"}
						</span>
						<ChevronsUpDown className="h-3.5 w-3.5 shrink-0 text-muted" />
					</>
				)}
			</button>

			{open && (
				<>
					{/* biome-ignore lint/a11y/noStaticElementInteractions: backdrop overlay */}
					<div
						className="fixed inset-0 z-40"
						onClick={() => setOpen(false)}
						onKeyDown={() => {}}
					/>
					<div
						className={cn(
							"absolute z-50 mt-1 w-56 rounded-lg border border-border bg-surface shadow-lg",
							collapsed ? "left-full top-0 ml-2" : "left-2 right-2 w-auto",
						)}
					>
						<div className="p-1">
							{organizations.map((org) => (
								<button
									key={org.id}
									type="button"
									onClick={() => handleSelect(org.id)}
									className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-foreground hover:bg-hover transition-colors"
								>
									<Building2 className="h-3.5 w-3.5 shrink-0 text-muted" />
									<span className="flex-1 truncate text-left">{org.name}</span>
									{org.id === activeOrg?.id && (
										<Check className="h-3.5 w-3.5 shrink-0 text-accent" />
									)}
								</button>
							))}
						</div>
						<div className="border-t border-border p-1">
							<Link
								to="/dashboard/organization"
								onClick={() => setOpen(false)}
								className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-muted hover:bg-hover hover:text-foreground transition-colors"
							>
								<Settings className="h-3.5 w-3.5 shrink-0" />
								<span>Manage organization</span>
							</Link>
							<Link
								to="/dashboard/organization/new"
								onClick={() => setOpen(false)}
								className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-muted hover:bg-hover hover:text-foreground transition-colors"
							>
								<Plus className="h-3.5 w-3.5 shrink-0" />
								<span>Create organization</span>
							</Link>
						</div>
					</div>
				</>
			)}
		</div>
	);
}

export function Sidebar() {
	const { pathname } = useLocation();
	const { data: session } = authClient.useSession();
	const [collapsed, setCollapsed] = useState(false);

	return (
		<div
			className={cn(
				"relative flex h-full shrink-0 flex-col bg-surface border-r border-border z-20 transition-[width] duration-200 ease-in-out",
				collapsed ? "w-14" : "w-64",
			)}
		>
			<OrgSwitcher collapsed={collapsed} />

			<nav className="flex-1 px-2 pt-2 pb-1 flex flex-col gap-[1px]">
				{navigation.map((item) => {
					const isActive = pathname === item.href;
					const Icon = item.icon;

					return (
						<div key={item.name} className="relative group">
							<Link
								to={item.href}
								className={cn(
									"flex items-center gap-2 rounded-lg px-2 py-2 text-[0.8125rem] font-medium transition-colors duration-150",
									collapsed && "justify-center",
									isActive
										? "bg-hover text-heading"
										: "text-muted hover:bg-hover hover:text-foreground",
								)}
							>
								<Icon className="h-4 w-4 shrink-0" />
								{!collapsed && (
									<span className="whitespace-nowrap overflow-hidden">
										{item.name}
									</span>
								)}
							</Link>

							{collapsed && (
								<div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2.5 py-1.5 rounded-md bg-heading text-surface text-xs font-medium whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-150 z-50">
									{item.name}
								</div>
							)}
						</div>
					);
				})}
			</nav>

			<div className="px-2 pb-1">
				<div className="relative group">
					<Link
						to="/dashboard/profile"
						className={cn(
							"flex items-center gap-2 rounded-lg px-2 py-2 text-[0.8125rem] font-medium transition-colors duration-150",
							collapsed && "justify-center",
							pathname === "/dashboard/profile"
								? "bg-hover text-heading"
								: "text-muted hover:bg-hover hover:text-foreground",
						)}
					>
						{session?.user.image ? (
							<img
								src={session.user.image}
								alt=""
								className="h-4 w-4 rounded-full shrink-0"
							/>
						) : (
							<User className="h-4 w-4 shrink-0" />
						)}
						{!collapsed && (
							<span className="whitespace-nowrap overflow-hidden text-ellipsis">
								{session?.user.name ?? "Profile"}
							</span>
						)}
					</Link>

					{collapsed && (
						<div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2.5 py-1.5 rounded-md bg-heading text-surface text-xs font-medium whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-150 z-50">
							{session?.user.name ?? "Profile"}
						</div>
					)}
				</div>
			</div>

			<div className="border-t border-border p-2 flex flex-col gap-2">
				{session?.user && (
					<div
						className={cn(
							"relative group flex items-center gap-2",
							collapsed ? "justify-center" : "px-2",
						)}
					>
						<Avatar size="sm">
							{session.user.image && (
								<AvatarImage src={session.user.image} alt={session.user.name} />
							)}
							<AvatarFallback>{getInitials(session.user.name)}</AvatarFallback>
						</Avatar>
						{!collapsed && (
							<>
								<span className="flex-1 truncate text-xs font-medium text-foreground">
									{session.user.name}
								</span>
								<button
									type="button"
									onClick={() => authClient.signOut()}
									className="p-1 rounded-md text-muted hover:text-foreground hover:bg-hover transition-colors"
									title="Sign out"
								>
									<LogOut className="h-3.5 w-3.5" />
								</button>
							</>
						)}
						{collapsed && (
							<div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2.5 py-1.5 rounded-md bg-heading text-surface text-xs font-medium whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-150 z-50">
								{session.user.name}
							</div>
						)}
					</div>
				)}
				<div
					className={cn(
						"flex items-center",
						collapsed ? "justify-center flex-col gap-2" : "justify-end gap-2",
					)}
				>
					<ThemeToggle />
					<button
						type="button"
						onClick={() => setCollapsed(!collapsed)}
						className="p-1 rounded-md text-muted hover:text-foreground hover:bg-hover transition-colors"
						title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
					>
						{collapsed ? (
							<ChevronsRight className="h-4 w-4" />
						) : (
							<ChevronsLeft className="h-4 w-4" />
						)}
					</button>
				</div>
			</div>
		</div>
	);
}
