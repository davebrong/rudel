import { useQuery } from "@tanstack/react-query";
import { Button } from "./components/ui/button";
import { orpc } from "./lib/orpc";

function App() {
	const health = useQuery(orpc.health.queryOptions({}));

	return (
		<div className="flex min-h-screen flex-col items-center justify-center gap-4">
			<h1 className="text-4xl font-bold">Melbourne</h1>
			<p className="text-muted-foreground">
				API status:{" "}
				{health.isLoading
					? "checking..."
					: health.data
						? health.data.status
						: "offline"}
			</p>
			<Button onClick={() => health.refetch()}>Check Health</Button>
		</div>
	);
}

export default App;
