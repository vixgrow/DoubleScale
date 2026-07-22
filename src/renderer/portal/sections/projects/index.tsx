/**
 * Projects section — the client's own projects (list + read-only detail with
 * budget, dates, status, and linked invoice totals). Ownership is enforced by
 * the portal endpoints (contact_id → 404 on mismatch); this view is read-only,
 * matching Propovoice's client-facing project view.
 */

import { __ } from '@wordpress/i18n';
import { Navigate, Route, Routes, useNavigate, useParams, Link } from 'react-router-dom';

import {
	fetchProject,
	fetchProjects,
	useAsync,
} from '../../api';
import type { PortalProject } from '../../types';
import { formatDate, formatMoney } from '../../shared/format';
import { ChevronLeftIcon, ClockIcon } from '../../shared/icons';
import { EmptyState, ErrorState, Spinner, StatusBadge } from '../../shared/ui';

const ProjectCard = ({ project }: { project: PortalProject }) => (
	<Link
		to={String(project.id)}
		className="block rounded-xl border border-border bg-card p-4 shadow-sm transition-colors hover:border-primary"
	>
		<div className="flex items-start justify-between gap-3">
			<p className="font-semibold text-foreground">{project.title}</p>
			{project.status && <StatusBadge status={project.status.name} />}
		</div>
		{project.due_date && (
			<div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
				<ClockIcon className="w-4 h-4 shrink-0" />
				<span>
					{__('Due', 'doublescale')} {formatDate(project.due_date)}
				</span>
			</div>
		)}
		{project.budget != null && (
			<p className="mt-1 text-sm text-muted-foreground">
				{__('Budget', 'doublescale')}:{' '}
				{formatMoney(project.budget, project.currency)}
			</p>
		)}
	</Link>
);

const ProjectsList = () => {
	const { data, loading, error } = useAsync(() => fetchProjects(), []);
	const projects = data?.data || [];

	return (
		<section>
			<h2 className="mb-4 text-xl font-bold">
				{__('Projects', 'doublescale')}
			</h2>

			{loading && <Spinner />}
			{!loading && error && <ErrorState message={error} />}
			{!loading && !error && projects.length === 0 && (
				<EmptyState
					title={__('No projects yet', 'doublescale')}
					description={__(
						'When we start a project with you it will show up here.',
						'doublescale'
					)}
				/>
			)}
			{!loading && !error && projects.length > 0 && (
				<div className="space-y-3">
					{projects.map((p) => (
						<ProjectCard key={p.id} project={p} />
					))}
				</div>
			)}
		</section>
	);
};

const DetailRow = ({
	label,
	children,
}: {
	label: string;
	children: React.ReactNode;
}) => (
	<div className="flex items-start justify-between gap-3 text-sm">
		<span className="text-muted-foreground">{label}</span>
		<span className="text-right font-medium text-foreground">{children}</span>
	</div>
);

const BackLink = ({ onClick }: { onClick: () => void }) => (
	<button
		type="button"
		onClick={onClick}
		className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground"
	>
		<ChevronLeftIcon className="w-4 h-4" />
		{__('Back to projects', 'doublescale')}
	</button>
);

const ProjectDetail = () => {
	const params = useParams();
	const navigate = useNavigate();
	const id = Number.parseInt(params.id || '0', 10);
	const { data: project, loading, error } = useAsync(
		() => fetchProject(id),
		[id]
	);

	if (loading) {
		return <Spinner />;
	}
	if (error || !project) {
		return (
			<div className="space-y-4">
				<BackLink onClick={() => navigate('/projects')} />
				<ErrorState
					message={error || __('Project not found.', 'doublescale')}
				/>
			</div>
		);
	}

	const fin = project.financials;

	return (
		<section className="space-y-4">
			<BackLink onClick={() => navigate('/projects')} />

			<div className="rounded-xl border border-border bg-card p-5 shadow-sm">
				<div className="flex items-start justify-between gap-3">
					<h2 className="text-xl font-bold">{project.title}</h2>
					{project.status && (
						<StatusBadge status={project.status.name} />
					)}
				</div>

				{project.description && (
					<p className="mt-3 text-sm text-muted-foreground">
						{project.description}
					</p>
				)}

				<div className="mt-4 space-y-2">
					{project.budget != null && (
						<DetailRow label={__('Budget', 'doublescale')}>
							{formatMoney(project.budget, project.currency)}
						</DetailRow>
					)}
					{project.start_date && (
						<DetailRow label={__('Start date', 'doublescale')}>
							{formatDate(project.start_date)}
						</DetailRow>
					)}
					{project.due_date && (
						<DetailRow label={__('Due date', 'doublescale')}>
							{formatDate(project.due_date)}
						</DetailRow>
					)}
				</div>
			</div>

			{fin && (fin.total > 0 || fin.paid > 0 || fin.due > 0) && (
				<div className="rounded-xl border border-border bg-card p-5 shadow-sm">
					<h3 className="mb-3 text-sm font-semibold text-foreground">
						{__('Invoices', 'doublescale')}
					</h3>
					<div className="space-y-2">
						<DetailRow label={__('Total', 'doublescale')}>
							{formatMoney(fin.total, project.currency)}
						</DetailRow>
						<DetailRow label={__('Paid', 'doublescale')}>
							{formatMoney(fin.paid, project.currency)}
						</DetailRow>
						<DetailRow label={__('Due', 'doublescale')}>
							{formatMoney(fin.due, project.currency)}
						</DetailRow>
					</div>
				</div>
			)}
		</section>
	);
};

const Projects = () => (
	<Routes>
		<Route index element={<ProjectsList />} />
		<Route path=":id" element={<ProjectDetail />} />
		<Route path="*" element={<Navigate to="" replace />} />
	</Routes>
);

export default Projects;
