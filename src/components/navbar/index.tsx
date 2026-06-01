/**
 * DoubleScale dependencies
 */
import {
	getAdminPages,
	useNavigate,
	getToLink,
	useLocation,
} from '@doublescale/navigation';
import { useCapabilities } from '@doublescale/hooks/use-capabilities';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from '@wordpress/element';
import { applyFilters } from '@wordpress/hooks';
import { Button } from '@wordpress/components';

/**
 * Internal dependencies
 */
import './style.scss';
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	useSidebar,
} from '@doublescale/components/ui/sidebar';
import { LogoIcon } from '@/components/icons';
import { ChevronDown, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from '@/components/ui/tooltip';
import WordPressLogoIcon from '@/components/icons/woedpress-logo';
import { createPortal } from 'react-dom';
import config from '@doublescale/config';
import { useModulesConfigTick } from '@doublescale/hooks/use-module-enabled';

interface SubMenuItem {
	path: string;
	label: string;
}

interface NavigationItem {
	path: string;
	label: string;
	icon: React.ReactNode;
	subMenu?: SubMenuItem[];
	section?: string;
}

interface SectionGroup {
	key: string;
	label: string;
	items: NavigationItem[];
}

interface NavBarProps {
	defaultSelectedPath?: string;
}

const SECTION_ORDER: Record<string, { label: string; order: number }> = {
	main: { label: __('Main', 'doublescale'), order: 0 },
	crm: { label: __('CRM', 'doublescale'), order: 1 },
	marketing: { label: __('Marketing', 'doublescale'), order: 2 },
	insights: { label: __('Insights', 'doublescale'), order: 3 },
	system: { label: __('System', 'doublescale'), order: 4 },
};

const PATH_TO_SECTION: Record<string, string> = {
	'/': 'main',
	contacts: 'crm',
	'sales-pipeline': 'crm',
	booking: 'crm',
	support: 'crm',
	tasks: 'crm',
	campaigns: 'marketing',
	'sms-campaigns': 'marketing',
	forms: 'marketing',
	automations: 'marketing',
	'email-sequences': 'marketing',
	'analytics-and-reports': 'insights',
	integrations: 'system',
	'smtp/:tab?': 'system',
	'team-managers': 'system',
	'settings/:tab?': 'system',
	extensions: 'system',
};

/** Top-level admin page ids shown in the free (non-Pro) sidebar without a module gate. */
const FREE_CORE_PAGE_IDS = new Set([
	'dashboard',
	'contacts',
	'campaigns',
	'automations',
	'settings',
	'booking-dashboard',
	'smtp',
	'team-managers',
	'integrations',
]);

/**
 * Free-sidebar pages that map to a module slug; shown only when that module is enabled
 * (or when DoubleScale Pro is active — full Pro shell handles visibility there).
 */
const FREE_OPTIONAL_SIDEBAR_PAGE_MODULE: Record<string, string> = {
	'sales-pipeline': 'deals',
	tasks: 'tasks',
	forms: 'forms',
	support: 'support',
};

/**
 * Maps `registerAdminPage` path to a module slug for sidebar visibility when the
 * page does not set {@link PageSettings.requiresModule}. Paths with no entry
 * are not module-gated via this map (the page's `requiresModule` wins first).
 */
const PATH_TO_MODULE: Record<string, string> = {
	'sales-pipeline': 'deals',
	'pipeline/deal/:id': 'deals',
	tasks: 'tasks',
	campaigns: 'campaigns',
	'sms-campaigns': 'campaigns',
	forms: 'forms',
	'email-sequences': 'campaigns',
	'analytics-and-reports': 'analytics',
	booking: 'booking',
	support: 'support',
	'support/ticket/:id': 'support',
	'abandoned-carts': 'campaigns',
	extensions: 'integrations',
};

/** Submenu routes gated by a Pro module (when Pro is active). */
const SUB_PATH_TO_MODULE: Record<string, string> = {
	campaigns: 'campaigns',
	'email-sequences': 'campaigns',
	'deals-analytics': 'analytics',
	'sales-rep-analytics': 'analytics',
	'pipeline-analytics': 'analytics',
	'my-reports': 'analytics',
	'emails-analytics': 'analytics',
	'contacts-analytics': 'analytics',
	'cart-analytics': 'analytics',
};

const NavBar: React.FC<NavBarProps> = ({ defaultSelectedPath = '/' }) => {
	const navigate = useNavigate();
	const location = useLocation();
	const { state: sidebarState, toggleSidebar } = useSidebar();
	const isCollapsed = sidebarState === 'collapsed';

	const getCurrentPathFromLocation = useCallback(() => {
		const pathname = location.pathname;
		const normalizedPath = pathname.replace(/^\//, '') || '';
		return normalizedPath;
	}, [location.pathname]);

	const [selectedKey, setSelectedKey] = useState<string>(defaultSelectedPath);
	const [expandedSubMenus, setExpandedSubMenus] = useState<Set<string>>(
		new Set()
	);
	const { hasRequiredCapability, isSalesRep, canManageAllDeals, isCrmManager } =
		useCapabilities();
	const modulesTick = useModulesConfigTick();

	const filterSubMenuByModules = useCallback(
		(items: SubMenuItem[] | undefined, isPro: boolean): SubMenuItem[] | undefined => {
			if (!items?.length) {
				return items;
			}
			if (!isPro) {
				return items;
			}
			return items.filter((sub) => {
				const mod = SUB_PATH_TO_MODULE[sub.path];
				return !mod || config.isModuleToggleEnabled(mod);
			});
		},
		[]
	);

	const navigationItems = useMemo(() => {
		const pages = getAdminPages();
		const isProActive = applyFilters(
			'doublescale_is_pro_active',
			false
		) as boolean;

		const builtItems = Object.entries(pages)
			.filter(([, item]) => {
				return (
					!item.hidden &&
					item.path &&
					hasRequiredCapability(item.requiredCapability)
				);
			})
			.filter(([pageId, item]) => {
				const optionalGate = FREE_OPTIONAL_SIDEBAR_PAGE_MODULE[pageId];
				const defaultSidebar =
					isProActive ||
					FREE_CORE_PAGE_IDS.has(pageId) ||
					(optionalGate !== undefined && config.isModuleToggleEnabled(optionalGate));
				const show = applyFilters(
					'doublescale_show_admin_page_in_sidebar',
					defaultSidebar,
					pageId,
					item
				) as boolean;
				if (!show) {
					return false;
				}
				const moduleSlug =
					item.requiresModule ?? PATH_TO_MODULE[item.path];
				return !moduleSlug || config.isModuleToggleEnabled(moduleSlug);
			})
			.map<NavigationItem>(([, item]) => {
				const navItem: NavigationItem = {
					path: item.path,
					label: item.label,
					icon: item.icon,
					section: PATH_TO_SECTION[item.path] || 'system',
				};

				if (item.path === 'analytics-and-reports') {
					if (isSalesRep() && !canManageAllDeals()) {
						navItem.subMenu = [
							{ path: 'my-reports', label: __('My Reports', 'doublescale') },
						];
					} else if (canManageAllDeals() && !isCrmManager()) {
						navItem.subMenu = [
							{
								path: 'deals-analytics',
								label: __('Deals Analytics', 'doublescale'),
							},
							{
								path: 'sales-rep-analytics',
								label: __('Sales Rep Analytics', 'doublescale'),
							},
							{
								path: 'pipeline-analytics',
								label: __('Pipeline Analytics', 'doublescale'),
							},
							{ path: 'my-reports', label: __('My Reports', 'doublescale') },
						];
					} else {
						navItem.subMenu = [
							{
								path: 'deals-analytics',
								label: __('Deals Analytics', 'doublescale'),
							},
							{
								path: 'sales-rep-analytics',
								label: __('Sales Rep Analytics', 'doublescale'),
							},
							{
								path: 'pipeline-analytics',
								label: __('Pipeline Analytics', 'doublescale'),
							},
							{ path: 'my-reports', label: __('My Reports', 'doublescale') },
							{
								path: 'emails-analytics',
								label: __('Emails Analytics', 'doublescale'),
							},
							{
								path: 'contacts-analytics',
								label: __('Contacts Analytics', 'doublescale'),
							},
							{
								path: 'cart-analytics',
								label: __('Cart Analytics', 'doublescale'),
							},
						];
					}
				}

				if (item.path === 'campaigns') {
					navItem.subMenu = [
						{
							path: 'campaigns',
							label: __('Email Campaigns', 'doublescale'),
						},
						{
							path: 'sms-campaigns',
							label: __('SMS Campaigns', 'doublescale'),
						},
					];
				}

				if (item.path === 'automations') {
					navItem.subMenu = [
						{ path: 'automations', label: __('Workflow', 'doublescale') },
						{
							path: 'email-sequences',
							label: __('Email Sequences', 'doublescale'),
						},
					];
				}

				if (item.path === 'contacts') {
					const subMenu: SubMenuItem[] = [
						{ path: 'contacts', label: __('Contacts', 'doublescale') },
					];
					if (isCrmManager()) {
						subMenu.push(
							{ path: 'lists', label: __('Lists', 'doublescale') },
							{ path: 'tags', label: __('Tags', 'doublescale') },
							{
								path: 'lead-scoring',
								label: __('Lead Score', 'doublescale'),
							}
						);
					}
					navItem.subMenu = subMenu;
				}

				if (item.path === 'smtp/:tab?') {
					navItem.subMenu = [
						{
							path: 'smtp/settings',
							label: __('Connections', 'doublescale'),
						},
						{
							path: 'smtp/email-test',
							label: __('Email Test', 'doublescale'),
						},
						{ path: 'smtp/logs', label: __('Logs', 'doublescale') },
						{ path: 'smtp/alerts', label: __('Alerts', 'doublescale') },
					];
				}

				if (item.path === 'booking') {
					navItem.subMenu = [
						{
							path: 'booking/calendars',
							label: __('Calendars', 'doublescale'),
						},
						{
							path: 'booking/bookings',
							label: __('Bookings', 'doublescale'),
						},
						{
							path: 'booking/availability',
							label: __('Availability', 'doublescale'),
						},
						{
							path: 'booking/settings',
							label: __('Settings', 'doublescale'),
						},
					];
				}

				if (item.path === 'support') {
					// Unlike `booking` (whose parent path only redirects), the
					// `support` parent path IS the inbox, so the first child
					// links back to it explicitly — the group reads Inbox /
					// Settings. `support/settings` is capability-gated at the
					// route, so agents without `doublescale_crm_manager` simply
					// land on the inbox if they deep-link it.
					navItem.subMenu = [
						{ path: 'support', label: __('Inbox', 'doublescale') },
						{
							path: 'support/settings',
							label: __('Settings', 'doublescale'),
						},
					];
				}

				if (navItem.subMenu) {
					const filtered = filterSubMenuByModules(
						navItem.subMenu,
						isProActive
					);
					navItem.subMenu =
						filtered && filtered.length > 0 ? filtered : undefined;
				}

				return navItem;
			});

		return applyFilters(
			'doublescale_navbar_sidebar_items',
			builtItems,
			{ isProActive }
		) as NavigationItem[];
	}, [
		hasRequiredCapability,
		isSalesRep,
		canManageAllDeals,
		isCrmManager,
		filterSubMenuByModules,
		modulesTick,
	]);

	const sectionGroups = useMemo<SectionGroup[]>(() => {
		const grouped: Record<string, NavigationItem[]> = {};
		navigationItems.forEach((item) => {
			const section = item.section || 'system';
			if (!grouped[section]) grouped[section] = [];
			grouped[section].push(item);
		});
		return Object.entries(SECTION_ORDER)
			.sort(([, a], [, b]) => a.order - b.order)
			.filter(([key]) => grouped[key]?.length)
			.map(([key, { label }]) => ({
				key,
				label,
				items: grouped[key],
			}));
	}, [navigationItems]);

	const handleNavigation = (path: string) => {
		setSelectedKey(path);
		const cleanPath = path.replace(/\/:[^/]+\?/g, '');
		navigate(getToLink(cleanPath));
	};

	const toggleSubMenu = (path: string) => {
		setExpandedSubMenus((prev) => {
			const next = new Set(prev);
			if (next.has(path)) {
				next.delete(path);
			} else {
				next.add(path);
			}
			return next;
		});
	};

	const isItemActive = useCallback(
		(itemPath: string) => {
			if (selectedKey === itemPath) return true;
			const normalizedSelected = selectedKey.replace(/^\//, '');
			const normalizedItem = itemPath.replace(/^\//, '');
			if (normalizedSelected === normalizedItem) return true;
			if (
				normalizedItem &&
				normalizedSelected.startsWith(normalizedItem + '/')
			)
				return true;
			return false;
		},
		[selectedKey]
	);

	useEffect(() => {
		const currentPath = getCurrentPathFromLocation();
		const matched = navigationItems.find((item) => {
			const normalizedItemPath = item.path.replace(/^\//, '');
			if (item.path === '/' || item.path === '') {
				return currentPath === '' || currentPath === '/';
			}
			if (currentPath === normalizedItemPath) return true;
			if (item.subMenu) {
				if (item.subMenu.some((sub) => currentPath === sub.path)) return true;
			}
			return (
				currentPath.startsWith(normalizedItemPath + '/') ||
				currentPath.startsWith(normalizedItemPath + ':')
			);
		});

		if (matched) {
			setSelectedKey(matched.path);
			// Auto-expand the parent submenu whenever a child route is
			// active. This keeps the sibling items visible after a hard
			// refresh on e.g. /booking/calendars and prevents the submenu
			// from "disappearing" when the user navigates directly to a
			// child URL from outside the SPA.
			if (matched.subMenu?.length) {
				const matchesChild =
					matched.subMenu.some((sub) => currentPath === sub.path) ||
					currentPath.startsWith(
						matched.path.replace(/^\//, '') + '/'
					);
				if (matchesChild) {
					setExpandedSubMenus((prev) => {
						if (prev.has(matched.path)) return prev;
						const next = new Set(prev);
						next.add(matched.path);
						return next;
					});
				}
			}
		} else if (currentPath === '') {
			setSelectedKey(defaultSelectedPath);
		}
	}, [
		navigationItems,
		location.pathname,
		getCurrentPathFromLocation,
		defaultSelectedPath,
	]);

	const handleBackToWordPress = () => {
		const ajaxUrl = (window as Window & { ajaxurl?: string }).ajaxurl ?? '';
		if (ajaxUrl.includes('admin-ajax.php')) {
			window.location.href = ajaxUrl.replace('admin-ajax.php', 'index.php');
			return;
		}
		window.location.href = `${window.location.origin}/wp-admin/`;
	};

	const [collapsedPopover, setCollapsedPopover] = useState<string | null>(null);
	const [collapsedFlyoutPos, setCollapsedFlyoutPos] = useState<{
		top: number;
		left: number;
	} | null>(null);
	const flyoutCloseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	const cancelFlyoutClose = useCallback(() => {
		if (flyoutCloseTimerRef.current !== null) {
			clearTimeout(flyoutCloseTimerRef.current);
			flyoutCloseTimerRef.current = null;
		}
	}, []);

	const scheduleFlyoutClose = useCallback(() => {
		cancelFlyoutClose();
		flyoutCloseTimerRef.current = window.setTimeout(() => {
			setCollapsedPopover(null);
			setCollapsedFlyoutPos(null);
			flyoutCloseTimerRef.current = null;
		}, 180);
	}, [cancelFlyoutClose]);

	const syncCollapsedFlyoutPosition = useCallback((anchorPath: string) => {
		window.requestAnimationFrame(() => {
			const escaped =
				typeof CSS !== 'undefined' && typeof CSS.escape === 'function'
					? CSS.escape(anchorPath)
					: anchorPath.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
			const anchorEl = document.querySelector(
				`[data-collapsed-flyout-anchor="${escaped}"]`
			);
			if (!anchorEl) return;
			const r = anchorEl.getBoundingClientRect();
			setCollapsedFlyoutPos({
				top: r.top - 4,
				left: r.left + r.width + 8,
			});
		});
	}, []);

	const collapsedFlyoutItem = useMemo(() => {
		if (!collapsedPopover) return null;
		for (const g of sectionGroups) {
			const found = g.items.find(
				(i) => i.path === collapsedPopover && Boolean(i.subMenu?.length)
			);
			if (found) return found;
		}
		return null;
	}, [collapsedPopover, sectionGroups]);

	useEffect(() => {
		if (!isCollapsed) {
			cancelFlyoutClose();
			setCollapsedPopover(null);
			setCollapsedFlyoutPos(null);
		}
	}, [isCollapsed, cancelFlyoutClose]);

	useEffect(() => {
		if (!isCollapsed || !collapsedPopover) return;
		const sync = () => syncCollapsedFlyoutPosition(collapsedPopover);
		sync();
		const scrollEl = document.querySelector('[data-sidebar="content"]');
		scrollEl?.addEventListener('scroll', sync, { passive: true });
		window.addEventListener('resize', sync);
		return () => {
			scrollEl?.removeEventListener('scroll', sync);
			window.removeEventListener('resize', sync);
		};
	}, [isCollapsed, collapsedPopover, syncCollapsedFlyoutPosition]);

	const renderNavItem = (item: NavigationItem) => {
		const active = isItemActive(item.path);
		const hasSubMenu = item.subMenu && item.subMenu.length > 0;
		const isExpanded = expandedSubMenus.has(item.path);

		if (isCollapsed) {
			if (hasSubMenu) {
				return (
					<div key={item.path} className="doublescale-navbar__item-group">
						<SidebarMenuItem className="doublescale-navbar__item">
							<div
								className="doublescale-navbar__collapsed-trigger"
								data-collapsed-flyout-anchor={item.path}
								onMouseEnter={(e) => {
									cancelFlyoutClose();
									const r = e.currentTarget.getBoundingClientRect();
									setCollapsedFlyoutPos({
										top: r.top - 4,
										left: r.left + r.width + 8,
									});
									setCollapsedPopover(item.path);
								}}
								onMouseLeave={scheduleFlyoutClose}
							>
								<SidebarMenuButton
									isActive={active}
									className="doublescale-navbar__link"
									onClick={() => {
										handleNavigation(item.path);
										cancelFlyoutClose();
										setCollapsedPopover(null);
										setCollapsedFlyoutPos(null);
									}}
								>
									<span className="doublescale-navbar__icon">{item.icon}</span>
								</SidebarMenuButton>
							</div>
						</SidebarMenuItem>
					</div>
				);
			}

			return (
				<div key={item.path} className="doublescale-navbar__item-group">
					<SidebarMenuItem className="doublescale-navbar__item">
						<TooltipProvider delayDuration={0}>
							<Tooltip>
								<TooltipTrigger asChild>
									<SidebarMenuButton
										isActive={active}
										className="doublescale-navbar__link"
										onClick={() => handleNavigation(item.path)}
									>
										<span className="doublescale-navbar__icon">{item.icon}</span>
									</SidebarMenuButton>
								</TooltipTrigger>
								<TooltipContent side="right" sideOffset={8}>
									{item.label}
								</TooltipContent>
							</Tooltip>
						</TooltipProvider>
					</SidebarMenuItem>
				</div>
			);
		}

		return (
			<div key={item.path} className="doublescale-navbar__item-group">
				<SidebarMenuItem className="doublescale-navbar__item">
					<SidebarMenuButton
						isActive={active}
						className="doublescale-navbar__link"
						onClick={() => {
							if (hasSubMenu) {
								toggleSubMenu(item.path);
								handleNavigation(item.path);
							} else {
								handleNavigation(item.path);
							}
						}}
					>
						<span className="doublescale-navbar__icon">{item.icon}</span>
						<span className="doublescale-navbar__label">{item.label}</span>
						{hasSubMenu && (
							<span
								className={`doublescale-navbar__expand-icon ${isExpanded ? 'doublescale-navbar__expand-icon--open' : ''}`}
							>
								<ChevronDown size={14} />
							</span>
						)}
					</SidebarMenuButton>
				</SidebarMenuItem>

				{hasSubMenu && isExpanded && (
					<div className="doublescale-navbar__submenu">
						{item.subMenu!.map((subItem) => {
							const subActive =
								getCurrentPathFromLocation() === subItem.path;
							return (
								<button
									key={subItem.path}
									type="button"
									className={`doublescale-navbar__submenu-item ${subActive ? 'doublescale-navbar__submenu-item--active' : ''}`}
									onClick={() => {
										// Navigate only — keep the parent
										// submenu expanded so the sibling
										// items (Calendar, Bookings,
										// Availability, Settings under
										// Booking) remain visible. Users
										// close the submenu via the parent
										// chevron, not as a side effect of
										// navigation.
										handleNavigation(subItem.path);
									}}
								>
									<span className="doublescale-navbar__submenu-dot" />
									{subItem.label}
								</button>
							);
						})}
					</div>
				)}
			</div>
		);
	};

	const backToWordPressLabel = __('Back to WordPress', 'doublescale');

	const wpFooterButton = (
		<Button
			className="doublescale-navbar__wp-link"
			onClick={handleBackToWordPress}
		>
			<WordPressLogoIcon />
			{!isCollapsed && (
				<span className="doublescale-navbar__wp-label">
					{backToWordPressLabel}
				</span>
			)}
		</Button>
	);

	return (
		<>
			<Sidebar collapsible="icon" className="doublescale-navbar">
				<SidebarHeader className="doublescale-navbar__header">
					{applyFilters(
						'doublescale_navbar_brand',
						<div className="doublescale-navbar__brand">
							<span className="doublescale-navbar__logo-icon">
								<LogoIcon />
							</span>
							<span className="doublescale-navbar__brand-text">
								{__('DoubleScale', 'doublescale')}
							</span>
						</div>
					) as React.ReactNode}
					<button
						type="button"
						className="doublescale-navbar__collapse-btn"
						onClick={toggleSidebar}
						aria-label={
							isCollapsed
								? __('Expand sidebar', 'doublescale')
								: __('Collapse sidebar', 'doublescale')
						}
					>
						{isCollapsed ? (
							<PanelLeftOpen size={16} />
						) : (
							<PanelLeftClose size={16} />
						)}
					</button>
				</SidebarHeader>

				<SidebarContent className="doublescale-navbar__content">
					{sectionGroups.map((section) => (
						<div key={section.key} className="doublescale-navbar__section">
							{!isCollapsed && (
								<div className="doublescale-navbar__section-label">
									{section.label}
								</div>
							)}
							<SidebarMenu className="doublescale-navbar__menu">
								{section.items.map((item) => renderNavItem(item))}
							</SidebarMenu>
						</div>
					))}
				</SidebarContent>

				<SidebarFooter className="doublescale-navbar__footer">
					{applyFilters(
						'doublescale_navbar_user_block',
						null,
						{ isCollapsed }
					) as React.ReactNode}
					{isCollapsed ? (
						<TooltipProvider delayDuration={0}>
							<Tooltip>
								<TooltipTrigger asChild>
									<span className="doublescale-navbar__wp-tooltip-trigger">
										{wpFooterButton}
									</span>
								</TooltipTrigger>
								<TooltipContent side="right" sideOffset={8}>
									{backToWordPressLabel}
								</TooltipContent>
							</Tooltip>
						</TooltipProvider>
					) : (
						wpFooterButton
					)}
				</SidebarFooter>
			</Sidebar>
			{isCollapsed &&
				collapsedFlyoutItem?.subMenu &&
				collapsedFlyoutPos &&
				createPortal(
					<div
						className="doublescale-navbar__collapsed-popover doublescale-navbar__collapsed-popover--portal"
						style={{
							position: 'fixed',
							top: collapsedFlyoutPos.top,
							left: collapsedFlyoutPos.left,
							zIndex: 160100,
						}}
						onMouseEnter={cancelFlyoutClose}
						onMouseLeave={scheduleFlyoutClose}
						role="presentation"
					>
						<div className="doublescale-navbar__collapsed-popover-inner">
							<div className="doublescale-navbar__collapsed-popover-header">
								{collapsedFlyoutItem.label}
							</div>
							{collapsedFlyoutItem.subMenu!.map((subItem) => {
								const subActive =
									getCurrentPathFromLocation() === subItem.path;
								return (
									<button
										key={subItem.path}
										type="button"
										className={`doublescale-navbar__collapsed-popover-item ${subActive ? 'doublescale-navbar__collapsed-popover-item--active' : ''}`}
										onClick={(e) => {
											e.stopPropagation();
											// In icon-rail mode the popover
											// itself closes (below) — there's
											// no expanded submenu to delete.
											handleNavigation(subItem.path);
											cancelFlyoutClose();
											setCollapsedPopover(null);
											setCollapsedFlyoutPos(null);
										}}
									>
										{subItem.label}
									</button>
								);
							})}
						</div>
					</div>,
					document.body
				)}
		</>
	);
};

export default NavBar;
