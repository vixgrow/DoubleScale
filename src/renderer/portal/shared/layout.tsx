/**
 * Portal shell: identity header + section nav + content area.
 */

import { __ } from '@wordpress/i18n';
import { NavLink } from 'react-router-dom';

import type { PortalIdentity, PortalSection } from '../types';
import { SectionIcon } from './icons';

interface NavItem {
	slug: string;
	label: string;
	icon: string;
	badge?: number;
	to: string;
}

const Avatar = ({ identity }: { identity: PortalIdentity }) => {
	if (identity.avatar) {
		return (
			<img
				src={identity.avatar}
				alt={identity.name || identity.email}
				className="w-10 h-10 rounded-full object-cover"
			/>
		);
	}
	const initial = (identity.name || identity.email || '?')
		.charAt(0)
		.toUpperCase();
	return (
		<span className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold">
			{initial}
		</span>
	);
};

interface Props {
	identity: PortalIdentity;
	sections: PortalSection[];
	children: React.ReactNode;
}

export const PortalLayout = ({ identity, sections, children }: Props) => {
	const navItems: NavItem[] = [
		{
			slug: 'dashboard',
			label: __('Dashboard', 'doublescale'),
			icon: 'home',
			to: '/',
		},
		...sections.map((s) => ({
			slug: s.slug,
			label: s.label,
			icon: s.icon,
			badge: s.badge,
			to: `/${s.slug}`,
		})),
	];

	const linkClass = ({ isActive }: { isActive: boolean }): string =>
		[
			'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
			isActive
				? 'bg-primary text-primary-foreground'
				: 'text-foreground hover:bg-accent',
		].join(' ');

	return (
		<div className="doublescale-client-portal text-base text-foreground">
			<div className="mx-auto max-w-5xl px-4 py-6">
				<header className="mb-6 flex items-center gap-4 rounded-xl border border-border bg-card p-4 shadow-sm">
					<Avatar identity={identity} />
					<div className="min-w-0">
						<p className="truncate text-lg font-semibold leading-tight">
							{identity.name || __('Welcome', 'doublescale')}
						</p>
						{identity.email && (
							<p className="truncate text-sm text-muted-foreground">
								{identity.email}
							</p>
						)}
					</div>
				</header>

				<div className="flex flex-col gap-6 md:flex-row">
					<nav className="md:w-56 md:shrink-0">
						<ul className="flex gap-2 overflow-x-auto md:flex-col md:overflow-visible">
							{navItems.map((item) => (
								<li key={item.slug} className="shrink-0">
									<NavLink
										to={item.to}
										end={item.to === '/'}
										className={linkClass}
									>
										<SectionIcon
											icon={item.icon}
											className="w-5 h-5 shrink-0"
										/>
										<span className="whitespace-nowrap">
											{item.label}
										</span>
										{!!item.badge && item.badge > 0 && (
											<span className="ml-auto inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-secondary px-1.5 text-xs font-semibold text-secondary-foreground">
												{item.badge}
											</span>
										)}
									</NavLink>
								</li>
							))}
						</ul>
					</nav>

					<main className="min-w-0 flex-1">{children}</main>
				</div>
			</div>
		</div>
	);
};
