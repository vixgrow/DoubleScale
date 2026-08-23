/**
 * Portal shell: identity header + grouped section nav + content area.
 */

import { __ } from '@wordpress/i18n';
import { NavLink } from 'react-router-dom';

import type { PortalIdentity, PortalSection } from '../types';
import { PortalNavIcon } from './icons';

/** Outer shell for every portal tab's main content. */
const PORTAL_CONTENT_SHELL =
	'rounded-[20px] border border-[#E8E8ED] bg-white p-5 shadow-[0px_4px_24px_0px_rgba(59,130,246,0.2)]';

interface NavItem {
	slug: string;
	label: string;
	icon: string;
	badge?: number;
	to: string;
}

const CRM_SLUGS = new Set(['tickets', 'bookings', 'projects']);
const OTHER_SLUGS = new Set(['documents', 'subscriptions']);

const navLabel = (slug: string, label: string): string => {
	if (slug === 'tickets') {
		return __('Support Tickets', 'doublescale');
	}
	return label;
};

const Avatar = ({ identity }: { identity: PortalIdentity }) => {
	if (identity.avatar) {
		return (
			<img
				src={identity.avatar}
				alt={identity.name || identity.email}
				className="h-11 w-11 rounded-full object-cover"
			/>
		);
	}
	const initial = (identity.name || identity.email || '?')
		.charAt(0)
		.toUpperCase();
	return (
		<span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary font-semibold text-primary-foreground">
			{initial}
		</span>
	);
};

interface NavGroupProps {
	title: string;
	items: NavItem[];
	linkClass: (props: { isActive: boolean }) => string;
	showDivider?: boolean;
}

const NavGroup = ({
	title,
	items,
	linkClass,
	showDivider = true,
}: NavGroupProps) => {
	if (items.length === 0) {
		return null;
	}

	return (
		<div
			className={
				showDivider
					? 'border-b border-border py-3'
					: 'py-3'
			}
		>
			<p className="pb-2 text-sm font-normal uppercase tracking-wide text-muted-foreground">
				{title}
			</p>
			<ul className="flex flex-col gap-2">
				{items.map((item) => (
					<li key={item.slug}>
						<NavLink
							to={item.to}
							end={item.to === '/'}
							className={linkClass}
						>
							<PortalNavIcon slug={item.slug} fallbackIcon={item.icon} />
							<span className="truncate">{item.label}</span>
							{!!item.badge && item.badge > 0 && (
								<span className="ms-auto inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-secondary px-1.5 text-xs font-semibold text-secondary-foreground">
									{item.badge}
								</span>
							)}
						</NavLink>
					</li>
				))}
			</ul>
		</div>
	);
};

interface Props {
	identity: PortalIdentity;
	sections: PortalSection[];
	children: React.ReactNode;
}

export const PortalLayout = ({ identity, sections, children }: Props) => {
	const sectionItems: NavItem[] = sections
		.filter((s) => s.slug !== 'calendar')
		.map((s) => ({
			slug: s.slug,
			label: navLabel(s.slug, s.label),
			icon: s.icon,
			badge: s.badge,
			to: `/${s.slug}`,
		}));

	const dashboardItem: NavItem = {
		slug: 'dashboard',
		label: __('Dashboard', 'doublescale'),
		icon: 'home',
		to: '/',
	};

	const crmItems = sectionItems.filter((s) => CRM_SLUGS.has(s.slug));
	const otherItems = sectionItems.filter(
		(s) =>
			OTHER_SLUGS.has(s.slug) ||
			(!CRM_SLUGS.has(s.slug) && s.slug !== 'dashboard')
	);

	const linkClass = ({ isActive }: { isActive: boolean }): string =>
		[
			'relative flex items-center gap-3 rounded-lg p-3 text-sm font-medium transition-colors',
			isActive
				? 'bg-[#EEEEFF] text-primary before:absolute before:inset-y-1.5 before:start-0 before:w-1 before:rounded-full before:bg-primary'
				: 'text-foreground hover:bg-accent',
		].join(' ');

	const navGroups = [
		{ title: __('Main', 'doublescale'), items: [dashboardItem] },
		{ title: __('CRM', 'doublescale'), items: crmItems },
		{ title: __('Other', 'doublescale'), items: otherItems },
	].filter((group) => group.items.length > 0);

	const displayName = identity.name || __('Welcome', 'doublescale');
	const welcomeLine = identity.email
		? `${displayName} (${identity.email})`
		: displayName;

	return (
		<div className="doublescale-client-portal rounded-2xl bg-[#F7F8FA] text-base text-foreground">
			<div className="mx-auto max-w-[93rem] px-4 py-6 sm:px-6 sm:py-8">
				<header className="mb-6 flex items-center gap-4 rounded-[20px] border border-[#E8E8ED] bg-white p-4 shadow-[0px_4px_24px_0px_rgba(59,130,246,0.2)] sm:p-5">
					<div className="flex min-w-0 items-center gap-4">
						<Avatar identity={identity} />
						<div className="min-w-0">
							<p className="truncate text-base font-semibold leading-tight text-foreground">
								{__('👋 Welcome back', 'doublescale')},{' '}
								{welcomeLine}
							</p>
							<p className="mt-2 text-sm text-muted-foreground">
								{__(
									'Everything is updated and aligned so you can focus on what matters most.',
									'doublescale'
								)}
							</p>
						</div>
					</div>
				</header>

				<div className="flex flex-col gap-6 lg:flex-row">
					<nav className="lg:w-72 lg:shrink-0">
						<div className="overflow-hidden rounded-[20px] bg-white px-5 py-2 shadow-[0px_4px_24px_0px_rgba(59,130,246,0.2)]">
							{navGroups.map((group, index) => (
								<NavGroup
									key={group.title}
									title={group.title}
									items={group.items}
									linkClass={linkClass}
									showDivider={index < navGroups.length - 1}
								/>
							))}
						</div>
					</nav>

					<main className="min-w-0 flex-1">
						<div className={PORTAL_CONTENT_SHELL}>{children}</div>
					</main>
				</div>
			</div>
		</div>
	);
};
