import { useQuery } from "@tanstack/react-query";
import { BookOpen, FolderKanban, Lightbulb, Users } from "lucide-react";
import { useMemo, useState } from "react";
import { AnalyticsCard } from "@/components/analytics/AnalyticsCard";
import { DatePicker } from "@/components/analytics/DatePicker";
import { MultiSelect } from "@/components/analytics/MultiSelect";
import { PageHeader } from "@/components/analytics/PageHeader";
import { StatCard } from "@/components/analytics/StatCard";
import { LearningsTrendChart } from "@/components/charts/LearningsTrendChart";
import { LearningsTimeline } from "@/components/learnings/LearningsTimeline";
import { useDateRange } from "@/contexts/DateRangeContext";
import { orpc } from "@/lib/orpc";

export function LearningsPage() {
	const { startDate, endDate, setStartDate, setEndDate, calculateDays } =
		useDateRange();
	const days = calculateDays();

	const [splitBy, setSplitBy] = useState<"user_id" | "repository">("user_id");
	const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
	const [selectedProjects, setSelectedProjects] = useState<string[]>([]);

	const { data: learnings, isLoading } = useQuery(
		orpc.analytics.learnings.list.queryOptions({
			input: { days, limit: 100, offset: 0 },
		}),
	);

	const { data: stats } = useQuery(
		orpc.analytics.learnings.stats.queryOptions({ input: { days } }),
	);

	const { data: trendData } = useQuery(
		orpc.analytics.learnings.trend.queryOptions({
			input: { days, splitBy },
		}),
	);

	const { data: availableUsers } = useQuery(
		orpc.analytics.learnings.users.queryOptions({}),
	);

	const { data: availableProjects } = useQuery(
		orpc.analytics.learnings.projects.queryOptions({}),
	);

	const { data: userMappings } = useQuery(
		orpc.analytics.users.mappings.queryOptions({ input: { days: 30 } }),
	);

	const userMap = useMemo(() => {
		const map = new Map<string, string>();
		if (userMappings) {
			for (const m of userMappings) {
				map.set(m.user_id, m.username);
			}
		}
		return map;
	}, [userMappings]);

	const userDisplayOptions = useMemo(() => {
		if (!availableUsers) return [];
		return availableUsers.map(
			(userId) => userMap.get(userId) || `${userId.substring(0, 8)}...`,
		);
	}, [availableUsers, userMap]);

	const projectDisplayOptions = useMemo(() => {
		if (!availableProjects) return [];
		return availableProjects.map((path) => {
			const name = path.split("/").pop() || path;
			return name;
		});
	}, [availableProjects]);

	const filteredLearnings = useMemo(() => {
		if (!learnings) return [];
		return learnings.filter((learning) => {
			if (
				selectedUsers.length > 0 &&
				!selectedUsers.includes(learning.user_id)
			) {
				return false;
			}
			if (
				selectedProjects.length > 0 &&
				!selectedProjects.includes(learning.project_path)
			) {
				return false;
			}
			return true;
		});
	}, [learnings, selectedUsers, selectedProjects]);

	const handleUserFilterChange = (selectedNames: string[]) => {
		if (!availableUsers) return;
		const userIds = selectedNames.map((name) => {
			const userId = availableUsers.find(
				(id) => (userMap.get(id) || `${id.substring(0, 8)}...`) === name,
			);
			return userId || name;
		});
		setSelectedUsers(userIds);
	};

	const handleProjectFilterChange = (selected: string[]) => {
		if (!availableProjects) return;
		const fullPaths = selected.map((name) => {
			const path = availableProjects.find((p) => p.split("/").pop() === name);
			return path || name;
		});
		setSelectedProjects(fullPaths);
	};

	const hasData = !isLoading && stats != null && stats.total_learnings > 0;

	return (
		<div className="px-8 py-6">
			<PageHeader
				title="Learning Feed"
				description="Team feedback and insights from /compound:feedback sessions"
				actions={
					hasData ? (
						<DatePicker
							startDate={startDate}
							endDate={endDate}
							onStartDateChange={setStartDate}
							onEndDateChange={setEndDate}
						/>
					) : undefined
				}
			/>

			{!isLoading && !hasData && (
				<AnalyticsCard className="mt-4">
					<div className="flex flex-col items-center justify-center py-20 px-4 text-center">
						<div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-6">
							<Lightbulb className="w-8 h-8 text-muted-foreground" />
						</div>
						<h3 className="text-lg font-semibold text-foreground mb-3">
							No learnings yet
						</h3>
						<p className="text-sm text-muted-foreground max-w-lg mb-6">
							This feature is powered by our internal continuous improvement
							system at{" "}
							<a
								href="https://obsessiondb.com"
								target="_blank"
								rel="noopener noreferrer"
								className="text-foreground underline underline-offset-2 hover:text-foreground/80"
							>
								ObsessionDB
							</a>
							. We are working on open-sourcing this workflow so you can set up
							your own continuous improvement agent system for your team.
						</p>
						<p className="text-xs text-muted-foreground/60 max-w-md">
							Stay tuned — once available, learnings will automatically appear
							here as your team captures feedback during coding sessions.
						</p>
					</div>
				</AnalyticsCard>
			)}

			{hasData && (
				<>
					{/* Stats Overview */}
					{stats && (
						<div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
							<StatCard
								title="Total Learnings"
								value={stats.total_learnings.toString()}
								icon={BookOpen}
								subtitle={`${stats.learnings_by_day.length} days with feedback`}
							/>
							<StatCard
								title="Team Members"
								value={stats.unique_users.toString()}
								icon={Users}
								subtitle="Contributing feedback"
							/>
							<StatCard
								title="Projects"
								value={stats.unique_projects.toString()}
								icon={FolderKanban}
								subtitle="With learnings captured"
							/>
						</div>
					)}

					{/* Filters */}
					<div className="mb-6 flex flex-wrap gap-4">
						<MultiSelect
							options={userDisplayOptions}
							selected={selectedUsers.map(
								(userId) =>
									userMap.get(userId) || `${userId.substring(0, 8)}...`,
							)}
							onChange={handleUserFilterChange}
							placeholder="All Users"
							className="w-64"
						/>
						<MultiSelect
							options={projectDisplayOptions}
							selected={selectedProjects.map((path) => {
								const name = path.split("/").pop() || path;
								return name;
							})}
							onChange={handleProjectFilterChange}
							placeholder="All Projects"
							className="w-64"
						/>
						{(selectedUsers.length > 0 || selectedProjects.length > 0) && (
							<button
								type="button"
								onClick={() => {
									setSelectedUsers([]);
									setSelectedProjects([]);
								}}
								className="px-4 py-2 text-sm text-muted hover:text-foreground hover:bg-hover rounded-md transition-colors"
							>
								Clear filters
							</button>
						)}
					</div>

					{/* Learnings Trend Chart */}
					{trendData && trendData.length > 0 && (
						<AnalyticsCard className="mb-6">
							<h2 className="text-xl font-bold text-heading mb-4">
								Learnings Over Time
							</h2>
							<p className="text-sm text-muted mb-6">
								Feedback activity over time split by developer
							</p>
							<LearningsTrendChart
								data={trendData}
								splitBy={splitBy}
								onSplitByChange={setSplitBy}
								userMap={userMap}
							/>
						</AnalyticsCard>
					)}

					{/* Timeline */}
					<AnalyticsCard>
						<div className="p-6">
							{filteredLearnings.length > 0 && (
								<div className="flex items-center justify-end mb-6">
									<span className="text-sm text-muted">
										{filteredLearnings.length}{" "}
										{filteredLearnings.length === 1 ? "learning" : "learnings"}
									</span>
								</div>
							)}

							<LearningsTimeline
								learnings={filteredLearnings}
								isLoading={isLoading}
								userMap={Object.fromEntries(userMap)}
							/>
						</div>
					</AnalyticsCard>
				</>
			)}
		</div>
	);
}
