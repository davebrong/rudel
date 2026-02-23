import type { ReactNode } from "react";

interface PageHeaderProps {
	title: string;
	description?: string;
	actions?: ReactNode;
}

export function PageHeader({ title, description, actions }: PageHeaderProps) {
	return (
		<div className="mb-10">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-bold text-heading mb-2">{title}</h1>
					{description && <p className="text-muted">{description}</p>}
				</div>
				{actions && <div className="flex items-center gap-4">{actions}</div>}
			</div>
		</div>
	);
}
