import {
	Activity,
	AlertCircle,
	BookOpen,
	ChevronsLeft,
	ChevronsRight,
	Clock,
	DollarSign,
	FolderKanban,
	LayoutDashboard,
	User,
	UserCircle,
} from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { authClient } from "../../lib/auth-client";
import { cn } from "../../lib/utils";
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
			<div className="flex h-10 items-center gap-1.5 px-4 overflow-hidden border-b border-border">
				<Activity className="h-5 w-5 shrink-0 text-accent" />
				{!collapsed && (
					<span className="text-sm font-bold text-heading whitespace-nowrap">
						Rudel Analytics
					</span>
				)}
			</div>

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

			<div
				className={cn(
					"border-t border-border p-2 flex items-center",
					collapsed ? "justify-center" : "justify-between px-4",
				)}
			>
				{!collapsed && <p className="text-xs text-muted">Rudel v1.0</p>}
				<div
					className={cn(
						"flex items-center",
						collapsed ? "flex-col gap-2" : "gap-2",
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
