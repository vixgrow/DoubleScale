/**
 * Projects section — Kanban board with search, empty state, and a read-only
 * project details modal. Ownership is enforced by the portal endpoints.
 * Stage colors come from each project's dashboard status (`color` / `bg_color`).
 */

import { useEffect, useMemo, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { ArrowUpRight, Search } from 'lucide-react';
import { Navigate, Route, Routes, useNavigate, useParams } from 'react-router-dom';

import {
	Dialog,
	DialogContent,
	DialogHeader,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
	CustomDialogHeader,
	DealValueIcon,
	DropProjectsIcon,
	GradientProjectsIcon,
	InfoIcon,
	MoveStatusIcon,
	DollerIcon
} from '@doublescale/components';

import {
	fetchProject,
	fetchProjects,
	useAsync,
} from '../../api';
import type { PortalProject, PortalProjectStatus } from '../../types';
import { formatMoney } from '../../shared/format';
import { EmptyState, ErrorState, Spinner } from '../../shared/ui';

const DEFAULT_STATUS_COLOR = '#8775EC';
const DEFAULT_STATUS_BG = '#F4F2FE';

function statusColors(status?: PortalProjectStatus | null): {
	color: string;
	bg: string;
} {
	return {
		color: status?.color || DEFAULT_STATUS_COLOR,
		bg: status?.bg_color || DEFAULT_STATUS_BG,
	};
}

function formatCompactMoney(
	amount: number,
	currency: string | null
): string {
	const abs = Math.abs(amount);
	let symbol = '$';
	if (currency) {
		try {
			const parts = new Intl.NumberFormat(undefined, {
				style: 'currency',
				currency,
				minimumFractionDigits: 0,
				maximumFractionDigits: 0,
			}).formatToParts(0);
			symbol = parts.find((p) => p.type === 'currency')?.value || symbol;
		} catch {
			// Fall back to plain symbol.
		}
	}

	const compact = (value: number, suffix: string) =>
		`${symbol}${String(value).replace('.', ',')}${suffix}`;

	if (abs >= 1_000_000) {
		return compact(Math.round((amount / 1_000_000) * 10) / 10, 'M');
	}
	if (abs >= 1000) {
		return compact(Math.round((amount / 1000) * 10) / 10, 'K');
	}
	return formatMoney(amount, currency);
}

type StatusColumn = {
	key: string;
	label: string;
	status: PortalProjectStatus;
	projects: PortalProject[];
};

function buildColumns(projects: PortalProject[]): StatusColumn[] {
	const map = new Map<string, StatusColumn>();

	for (const project of projects) {
		const label = project.status?.name ?? __('Uncategorized', 'doublescale');
		const key =
			project.status?.id != null
				? `id-${project.status.id}`
				: label.toLowerCase();

		if (!map.has(key)) {
			map.set(key, {
				key,
				label,
				status: project.status ?? {
					name: label,
					is_completed: false,
					color: DEFAULT_STATUS_COLOR,
					bg_color: DEFAULT_STATUS_BG,
					position: 999,
				},
				projects: [],
			});
		}

		map.get(key)!.projects.push(project);
	}

	return Array.from(map.values()).sort((a, b) => {
		const ap = a.status.position ?? 999;
		const bp = b.status.position ?? 999;
		if (ap !== bp) {
			return ap - bp;
		}
		if (a.status.is_completed !== b.status.is_completed) {
			return a.status.is_completed ? 1 : -1;
		}
		return a.label.localeCompare(b.label);
	});
}

const StatusPill = ({ status }: { status: PortalProjectStatus }) => {
	const { color, bg } = statusColors(status);
	return (
		<span
			className="inline-flex rounded-lg px-2 py-1 text-sm font-medium capitalize"
			style={{ backgroundColor: bg, color }}
		>
			{status.name}
		</span>
	);
};

const DetailRow = ({
	icon,
	label,
	children,
	stacked = false,
}: {
	icon: React.ReactNode;
	label: string;
	children: React.ReactNode;
	stacked?: boolean;
}) => {
	if (stacked) {
		return (
			<div className="space-y-2 text-sm">
				<span className="inline-flex items-center gap-2 text-muted-foreground">
					{icon}
					{label}
				</span>
				<div className="font-medium text-foreground">{children}</div>
			</div>
		);
	}

	return (
		<div className="flex items-center justify-between gap-3 text-sm">
			<span className="inline-flex items-center gap-2 text-muted-foreground">
				{icon}
				{label}
			</span>
			<div className="text-right font-medium text-foreground">{children}</div>
		</div>
	);
};

const ProjectDetailModal = ({
	projectId,
	open,
	onOpenChange,
}: {
	projectId: number | null;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}) => {
	const { data: project, loading, error } = useAsync(async () => {
		if (!projectId) {
			return null;
		}
		return fetchProject(projectId);
	}, [projectId]);

	const showLoader = open && !!projectId && loading;
	const showError = open && !loading && (error || !project);

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent
				className="max-w-lg gap-0 overflow-hidden rounded-2xl border border-border sm:rounded-2xl"
				overlayClassName="bg-black/40 backdrop-blur-sm"
			>
				<DialogHeader>
					<CustomDialogHeader
						title={__('Project Details', 'doublescale')}
						subtitle={__(
							'View all details of project',
							'doublescale'
						)}
						icon={<GradientProjectsIcon width={24} height={24} />}
					/>
				</DialogHeader>

				<div className="pt-6">
					{showLoader && (
						<Spinner
							label={__('Loading project…', 'doublescale')}
						/>
					)}
					{showError && (
						<ErrorState
							message={
								error || __('Project not found.', 'doublescale')
							}
						/>
					)}
					{open && !loading && project && (
						<div className="rounded-xl border border-border bg-[#F7F8FA] p-6">
							<div className="space-y-4">
								<DetailRow
									icon={
										<DropProjectsIcon
											width={24}
											height={24}
											color="#6B6C76"
										/>
									}
									label={__('Project Name', 'doublescale')}
								>
									{project.title}
								</DetailRow>

								{project.budget != null && (
									<DetailRow
										icon={
											<DollerIcon
												width={24}
												height={24}
											/>
										}
										label={__('Budget', 'doublescale')}
									>
										<span className="inline-flex items-center gap-1.5 rounded-lg bg-[#E8F4FE] px-2 py-1 text-sm font-medium text-[#0D9DFC]">
											<DealValueIcon
												width={20}
												height={20}
												color="#0D9DFC"
											/>
											{formatCompactMoney(
												project.budget,
												project.currency
											)}
										</span>
									</DetailRow>
								)}

								{project.status && (
									<DetailRow
										icon={
											<MoveStatusIcon
												width={24}
												height={24}
												color="#6B6C76"
											/>
										}
										label={__('Status', 'doublescale')}
									>
										<StatusPill status={project.status} />
									</DetailRow>
								)}

								{project.description && (
									<DetailRow
										icon={
											<InfoIcon
												width={24}
												height={24}
												color="#6B6C76"
											/>
										}
										label={__('Description', 'doublescale')}
										stacked
									>
										<p className="text-sm leading-relaxed text-foreground">
											{project.description}
										</p>
									</DetailRow>
								)}
							</div>
						</div>
					)}
				</div>
			</DialogContent>
		</Dialog>
	);
};

const PortalProjectCard = ({
	project,
	onOpen,
}: {
	project: PortalProject;
	onOpen: (id: number) => void;
}) => (
	<div className="flex items-start gap-3 rounded-xl border border-border bg-white p-4">
		<div className="min-w-0 flex-1">
			<div className="flex items-start gap-3">
				<span className="shrink-0 bg-[#EEEEFF] p-1 rounded-lg">
					<GradientProjectsIcon width={24} height={24} />
				</span>
				<div>
					<p className="truncate text-sm font-semibold text-foreground">
						{project.title}
					</p>
					{project.budget != null && (
				<span className="mt-3 inline-flex items-center gap-1 rounded-lg bg-[#E8F4FE] px-2 py-1 text-sm font-medium text-[#0D9DFC]">
					<DealValueIcon width={20} height={20} color="#0D9DFC" />
					{formatCompactMoney(project.budget, project.currency)}
				</span>
			)}
				</div>
			</div>
			
		</div>
		<button
			type="button"
			onClick={() => onOpen(project.id)}
			className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-white transition-opacity hover:opacity-90"
			aria-label={__('View project details', 'doublescale')}
			style={{ boxShadow: '0 5px 12px 0 rgba(69, 141, 199, 0.20)' }}
		>
			<ArrowUpRight width={16} height={16} />
		</button>
	</div>
);

const KanbanColumn = ({
	column,
	onOpenProject,
}: {
	column: StatusColumn;
	onOpenProject: (id: number) => void;
}) => {
	const { bg } = statusColors(column.status);

	return (
		<div className="flex h-full w-[360px] max-sm:w-[min(88vw,280px)] shrink-0 flex-col overflow-hidden rounded-xl border border-border bg-[#F7F8FA] p-4">
			<div
				className="flex shrink-0 items-center justify-between gap-2 rounded-xl p-3"
				style={{ backgroundColor: bg }}
			>
				<span className="truncate text-sm font-semibold text-foreground">
					{column.label}
				</span>
				<span className="flex h-6 min-w-6 shrink-0 items-center justify-center rounded-full border border-border bg-white px-1.5 text-xs font-medium text-foreground">
					{column.projects.length}
				</span>
			</div>
			<div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto pt-4">
				{column.projects.map((project) => (
					<PortalProjectCard
						key={project.id}
						project={project}
						onOpen={onOpenProject}
					/>
				))}
			</div>
		</div>
	);
};

const ProjectsBoard = ({
	initialProjectId = null,
	onCloseDeepLink,
}: {
	initialProjectId?: number | null;
	onCloseDeepLink?: () => void;
}) => {
	const [query, setQuery] = useState('');
	const [selectedId, setSelectedId] = useState<number | null>(
		initialProjectId
	);

	const { data, loading, error } = useAsync(() => fetchProjects(), []);
	const projects = data?.data || [];

	useEffect(() => {
		if (initialProjectId) {
			setSelectedId(initialProjectId);
		}
	}, [initialProjectId]);

	const normalizedQuery = query.trim().toLowerCase();
	const filteredProjects = useMemo(() => {
		if (!normalizedQuery) {
			return projects;
		}
		return projects.filter((p) =>
			p.title.toLowerCase().includes(normalizedQuery)
		);
	}, [projects, normalizedQuery]);

	const columns = useMemo(
		() => buildColumns(filteredProjects),
		[filteredProjects]
	);

	const handleOpenProject = (id: number) => setSelectedId(id);

	const handleModalChange = (open: boolean) => {
		if (!open) {
			setSelectedId(null);
			onCloseDeepLink?.();
		}
	};

	const hasProjects = projects.length > 0;
	const hasVisibleProjects = filteredProjects.length > 0;

	return (
		<section className="portal-projects-board flex h-[min(calc(100dvh-11rem),1100px)] min-h-[32rem] flex-col">
			<div className="shrink-0">
				<h2 className="mb-4 text-2xl font-semibold text-foreground">
					{__('Projects', 'doublescale')}
				</h2>

				<div className="relative mb-6">
					<Search
						width={16}
						height={16}
						className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 text-muted-foreground"
					/>
					<Input
						type="search"
						value={query}
						onChange={(e) => setQuery(e.target.value)}
						placeholder={__(
							'Search by project name…',
							'doublescale'
						)}
						className="pl-9"
					/>
				</div>
			</div>

			<div className="flex min-h-0 flex-1 flex-col overflow-hidden">
				{loading && <Spinner />}
				{!loading && error && <ErrorState message={error} />}

				{!loading && !error && !hasProjects && (
					<div className="flex flex-1 items-center justify-center">
						<EmptyState
							icon={<GradientProjectsIcon width={40} height={40} />}
							title={__('No projects yet', 'doublescale')}
							description={__(
								'There are no projects to display at the moment.',
								'doublescale'
							)}
						/>
					</div>
				)}

				{!loading && !error && hasProjects && !hasVisibleProjects && (
					<div className="flex flex-1 items-center justify-center">
						<EmptyState
							icon={<GradientProjectsIcon width={40} height={40} />}
							title={__('No matching projects', 'doublescale')}
							description={__(
								'Try a different search term.',
								'doublescale'
							)}
						/>
					</div>
				)}

				{!loading && !error && hasVisibleProjects && (
					<div className="portal-projects-kanban flex h-full min-h-0 flex-1 items-stretch gap-4 overflow-x-auto overflow-y-hidden pb-1">
						{columns.map((column) => (
							<KanbanColumn
								key={column.key}
								column={column}
								onOpenProject={handleOpenProject}
							/>
						))}
					</div>
				)}
			</div>

			<ProjectDetailModal
				projectId={selectedId}
				open={selectedId != null}
				onOpenChange={handleModalChange}
			/>
		</section>
	);
};

const ProjectsDeepLink = () => {
	const { id } = useParams();
	const navigate = useNavigate();
	const projectId = Number.parseInt(id || '0', 10);

	return (
		<ProjectsBoard
			initialProjectId={
				Number.isNaN(projectId) || projectId <= 0 ? null : projectId
			}
			onCloseDeepLink={() => navigate('/projects', { replace: true })}
		/>
	);
};

const Projects = () => (
	<Routes>
		<Route index element={<ProjectsBoard />} />
		<Route path=":id" element={<ProjectsDeepLink />} />
		<Route path="*" element={<Navigate to="" replace />} />
	</Routes>
);

export default Projects;
