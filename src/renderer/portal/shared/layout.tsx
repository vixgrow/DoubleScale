/**
 * Portal shell: identity header + grouped section nav + content area.
 * Below `lg`, nav is a horizontal settings-style tab strip (no Main/CRM/Other).
 */

import { useEffect, useRef, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { NavLink } from 'react-router-dom';

import type { PortalIdentity, PortalSection } from '../types';
import { ChevronLeftIcon, ChevronRightIcon, PortalNavIcon } from './icons';

/** Outer shell for every portal tab's main content. */
const PORTAL_CONTENT_SHELL =
	'rounded-[20px] bg-white p-5 shadow-[0px_4px_24px_0px_rgba(59,130,246,0.2)]';

const NAV_SHELL =
	'overflow-hidden rounded-[20px] bg-white shadow-[0px_4px_24px_0px_rgba(59,130,246,0.2)]';

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

const NavBadge = ({
	count,
	active,
}: {
	count?: number;
	active?: boolean;
}) => {
	if (!count || count <= 0) {
		return null;
	}
	return (
		<span
			className={[
				'inline-flex min-w-[1.25rem] items-center justify-center rounded-full px-1.5 text-xs font-semibold',
				active
					? 'bg-primary-foreground/20 text-primary-foreground'
					: 'bg-secondary text-secondary-foreground',
			].join(' ')}
		>
			{count}
		</span>
	);
};

interface HorizontalNavProps {
	items: NavItem[];
	linkClass: (props: {
		isActive: boolean;
		isPending?: boolean;
	}) => string;
}

/** Settings-style horizontal tabs with scroll chevrons when content overflows. */
const HorizontalNav = ({ items, linkClass }: HorizontalNavProps) => {
	const scrollRef = useRef<HTMLDivElement>(null);
	const [showLeft, setShowLeft] = useState(false);
	const [showRight, setShowRight] = useState(false);

	const updateScrollHints = () => {
		const el = scrollRef.current;
		if (!el) {
			return;
		}
		const { scrollLeft, scrollWidth, clientWidth } = el;
		const hasOverflow = scrollWidth > clientWidth + 1;
		setShowLeft(hasOverflow && scrollLeft > 2);
		setShowRight(
			hasOverflow && scrollLeft < scrollWidth - clientWidth - 2
		);
	};

	useEffect(() => {
		updateScrollHints();
		const el = scrollRef.current;
		if (!el) {
			return;
		}
		el.addEventListener('scroll', updateScrollHints, { passive: true });
		window.addEventListener('resize', updateScrollHints);
		const observer = new ResizeObserver(updateScrollHints);
		observer.observe(el);
		return () => {
			el.removeEventListener('scroll', updateScrollHints);
			window.removeEventListener('resize', updateScrollHints);
			observer.disconnect();
		};
	}, [items.length]);

	const scrollBy = (direction: 'left' | 'right') => {
		const el = scrollRef.current;
		if (!el) {
			return;
		}
		el.scrollBy({
			left: direction === 'left' ? -180 : 180,
			behavior: 'smooth',
		});
	};

	return (
		<div className={`${NAV_SHELL} relative px-2.5 py-3 lg:hidden`}>
			{showLeft && (
				<>
					<div
						className="pointer-events-none absolute inset-y-0 start-0 z-[1] w-10 rounded-s-[20px] bg-gradient-to-r from-white via-white/90 to-transparent"
						aria-hidden="true"
					/>
					<button
						type="button"
						onClick={() => scrollBy('left')}
						className="absolute start-0 top-0 z-10 flex h-full items-center justify-center rounded-s-[20px] bg-white px-1"
						aria-label={__('Scroll navigation left', 'doublescale')}
					>
						<ChevronLeftIcon className="h-4 w-4 text-muted-foreground" />
					</button>
				</>
			)}
			<div
				ref={scrollRef}
				className="portal-nav-tabs-scroll min-w-0 overflow-x-auto"
			>
				<ul className="flex w-max min-w-full flex-nowrap items-center justify-start gap-2 px-1">
					{items.map((item) => (
						<li key={item.slug} className="shrink-0">
							<NavLink
								to={item.to}
								end={item.to === '/'}
								className={linkClass}
							>
								{({ isActive }) => (
									<>
										<PortalNavIcon
											slug={item.slug}
											fallbackIcon={item.icon}
										/>
										<span>{item.label}</span>
										<NavBadge
											count={item.badge}
											active={isActive}
										/>
									</>
								)}
							</NavLink>
						</li>
					))}
				</ul>
			</div>
			{showRight && (
				<>
					<div
						className="pointer-events-none absolute inset-y-0 end-0 z-[1] w-10 rounded-e-[20px] bg-gradient-to-l from-white via-white/90 to-transparent"
						aria-hidden="true"
					/>
					<button
						type="button"
						onClick={() => scrollBy('right')}
						className="absolute end-0 top-0 z-10 flex h-full items-center justify-center rounded-e-[20px] bg-white px-1"
						aria-label={__('Scroll navigation right', 'doublescale')}
					>
						<ChevronRightIcon className="h-4 w-4 text-muted-foreground" />
					</button>
				</>
			)}
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

	const sidebarLinkClass = ({
		isActive,
		isPending,
	}: {
		isActive: boolean;
		isPending?: boolean;
	}): string => {
		const active = isActive || Boolean(isPending);
		return [
			'portal-nav-link relative flex items-center gap-3 rounded-lg p-3 text-sm font-medium',
			active ? 'portal-nav-link--active' : '',
			active
				? 'before:absolute before:inset-y-1.5 before:start-0 before:w-1 before:rounded-full before:bg-primary'
				: 'hover:bg-accent',
		]
			.filter(Boolean)
			.join(' ');
	};

	const tabsLinkClass = ({
		isActive,
		isPending,
	}: {
		isActive: boolean;
		isPending?: boolean;
	}): string => {
		const active = isActive || Boolean(isPending);
		return [
			'portal-nav-link portal-nav-link--tabs inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-lg p-1 text-sm font-medium transition-all sm:px-4',
			active
				? 'portal-nav-link--tabs-active bg-primary text-primary-foreground shadow-sm'
				: 'text-muted-foreground hover:bg-muted/70 hover:text-foreground',
		]
			.filter(Boolean)
			.join(' ');
	};

	const navGroups = [
		{ title: __('Main', 'doublescale'), items: [dashboardItem] },
		{ title: __('CRM', 'doublescale'), items: crmItems },
		{ title: __('Other', 'doublescale'), items: otherItems },
	].filter((group) => group.items.length > 0);

	const flatNavItems = navGroups.flatMap((group) => group.items);

	const displayName = identity.name || __('Welcome', 'doublescale');
	const welcomeLine = identity.email
		? `${displayName} (${identity.email})`
		: displayName;

	return (
		<div className="doublescale-client-portal overflow-x-hidden rounded-2xl bg-[#F7F8FA] text-base text-foreground">
			<div className="mx-auto w-full max-w-[93rem] px-4 py-6 sm:px-6 sm:py-8">
				<div className="mb-6 flex items-center gap-4 rounded-[20px] bg-white p-4 shadow-[0px_4px_24px_0px_rgba(59,130,246,0.2)] sm:p-5">
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
				</div>

				<div className="flex flex-col gap-6 lg:flex-row">
					<div className="min-w-0 lg:w-72 lg:shrink-0">
						{/* max-lg: settings-style horizontal tabs (no Main/CRM/Other) */}
						<HorizontalNav items={flatNavItems} linkClass={tabsLinkClass} />

						{/* lg+: vertical grouped sidebar */}
						<div className={`${NAV_SHELL} hidden px-5 py-2 lg:block`}>
							{navGroups.map((group, index) => (
								<NavGroup
									key={group.title}
									title={group.title}
									items={group.items}
									linkClass={sidebarLinkClass}
									showDivider={index < navGroups.length - 1}
								/>
							))}
						</div>
					</div>

					<div className="min-w-0 flex-1">
						<div className={PORTAL_CONTENT_SHELL}>{children}</div>
					</div>
				</div>
			</div>
		</div>
	);
};
