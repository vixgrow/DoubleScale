/**
 * QuillCRM dependencies
 */
import {
	getAdminPages,
	useNavigate,
	getToLink,
	useLocation,
} from '@quillcrm/navigation';
import { useCapabilities } from '@quillcrm/hooks/use-capabilities';
/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { applyFilters } from '@wordpress/hooks';
import {
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from '@wordpress/element';
/**
 * Internal dependencies
 */
import './style.scss';
import {
	Sidebar,
	SidebarContent,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from '@quillcrm/components/ui/sidebar';
import { LogoIcon } from '../icons';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { createPortal } from 'react-dom';

interface SubMenuItem {
	path: string;
	label: string;
}

interface NavigationItem {
	path: string;
	label: string;
	icon: React.ReactNode;
	subMenu?: SubMenuItem[];
}

interface NavBarProps {
	defaultSelectedPath?: string;
}

const NavBar: React.FC<NavBarProps> = ({ defaultSelectedPath = '/' }) => {
	const navigate = useNavigate();
	const location = useLocation();

	// Get current path from location (handled by WordPress custom history)
	// location.pathname will be like '/contacts' or '/contacts/123'
	// navigation items have paths like 'contacts' (no leading slash)
	const getCurrentPathFromLocation = useCallback(() => {
		const pathname = location.pathname;
		// Remove leading slash to normalize
		const normalizedPath = pathname.replace(/^\//, '') || '';
		return normalizedPath;
	}, [location.pathname]);

	const [selectedKey, setSelectedKey] = useState<string>(defaultSelectedPath);
	const [isAtTop, setIsAtTop] = useState(true);
	const [isAtBottom, setIsAtBottom] = useState(false);
	const [isMounted, setIsMounted] = useState(false);
	const [hoveredItem, setHoveredItem] = useState<{
		path: string;
		subMenu: SubMenuItem[];
		rect: DOMRect;
	} | null>(null);
	const hoverTimeoutRef = useRef<number | null>(null);
	const scrollContainerRef = useRef<HTMLDivElement | null>(null);
	const { hasRequiredCapability, isSalesRep } = useCapabilities();

	useEffect(() => {
		const frameId = requestAnimationFrame(() => setIsMounted(true));
		return () => cancelAnimationFrame(frameId);
	}, []);

	useEffect(() => {
		// Cleanup timeout on unmount
		return () => {
			if (hoverTimeoutRef.current) {
				clearTimeout(hoverTimeoutRef.current);
			}
		};
	}, []);

	const navigationItems = useMemo(() => {
		const pages = getAdminPages();
		return Object.values(pages)
			.filter(
				(item) =>
					!item.hidden &&
					item.path &&
					hasRequiredCapability(item.requiredCapability)
			)
			.map<NavigationItem>((item) => {
				const navItem: NavigationItem = {
					path: item.path,
					label: item.label,
					icon: item.icon,
				};

				// Add submenu for Analytics based on capabilities
				if (item.path === 'analytics-and-reports') {
					if (isSalesRep()) {
						// Sales reps see only their reports
						navItem.subMenu = [
							{
								path: 'my-reports',
								label: __('My Reports', 'quillcrm'),
							},
						];
					} else {
						// Non-sales reps see all analytics including My Reports
						const submenu = [
							{
								path: 'deals-analytics',
								label: __('Deals Analytics', 'quillcrm'),
							},
							{
								path: 'sales-rep-analytics',
								label: __('Sales Rep Analytics', 'quillcrm'),
							},
							{
								path: 'pipeline-analytics',
								label: __('Pipeline Analytics', 'quillcrm'),
							},
							{
								path: 'my-reports',
								label: __('My Reports', 'quillcrm'),
							},
							{
								path: 'emails-analytics',
								label: __('Emails Analytics', 'quillcrm'),
							},
							{
								path: 'contacts-analytics',
								label: __('Contacts Analytics', 'quillcrm'),
							},
							{
								path: 'cart-analytics',
								label: __('Cart Analytics', 'quillcrm'),
							},
						];

						navItem.subMenu = submenu;
					}
				}

				return navItem;
			});
	}, [hasRequiredCapability, isSalesRep]);

	const handleNavigation = (path: string) => {
		setSelectedKey(path);
		navigate(getToLink(path));
	};

	const updateScrollIndicators = useCallback(() => {
		const container = scrollContainerRef.current;
		if (!container) {
			return;
		}

		const { scrollTop, scrollHeight, clientHeight } = container;

		const atTop = scrollTop <= 2;
		const atBottom = scrollTop + clientHeight >= scrollHeight - 2;

		setIsAtTop(atTop || scrollHeight <= clientHeight);
		setIsAtBottom(atBottom || scrollHeight <= clientHeight);
	}, []);

	const handleScrollBy = (direction: 'up' | 'down') => {
		const container = scrollContainerRef.current;
		if (!container) {
			return;
		}

		const scrollAmount = direction === 'up' ? -220 : 220;

		container.scrollBy({
			top: scrollAmount,
			behavior: 'smooth',
		});
	};

	const renderMenuItem = (item: NavigationItem, index: number) => {
		const itemRef = useRef<HTMLLIElement>(null);

		const handleMouseEnter = () => {
			if (item.subMenu && itemRef.current) {
				// Clear any pending timeout
				if (hoverTimeoutRef.current) {
					clearTimeout(hoverTimeoutRef.current);
					hoverTimeoutRef.current = null;
				}
				const rect = itemRef.current.getBoundingClientRect();
				setHoveredItem({
					path: item.path,
					subMenu: item.subMenu,
					rect,
				});
			}
		};

		const handleMouseLeave = () => {
			if (item.subMenu) {
				// Delay closing to allow mouse to reach submenu
				hoverTimeoutRef.current = window.setTimeout(() => {
					setHoveredItem(null);
				}, 300);
			}
		};

		return (
			<SidebarMenuItem
				key={item.path}
				ref={itemRef}
				onClick={() => handleNavigation(item.path)}
				onMouseEnter={handleMouseEnter}
				onMouseLeave={handleMouseLeave}
				className="qcrm-navbar__item"
				style={{
					transitionDelay: `${Math.min(index * 100, 300)}ms`,
				}}
			>
				<SidebarMenuButton
					size="xl"
					isActive={selectedKey === item.path}
					className="qcrm-navbar__link"
				>
					<div className="qcrm-navbar__link-inner">
						<span className="qcrm-navbar__icon">{item.icon}</span>
						<span className="qcrm-navbar__label">{item.label}</span>
					</div>
				</SidebarMenuButton>
			</SidebarMenuItem>
		);
	};

	useEffect(() => {
		const currentPath = getCurrentPathFromLocation();

		// Try to match the current path with navigation items
		// navigation items can have paths like '/' (dashboard) or 'contacts' (no leading slash)
		// currentPath will be like '' (for '/') or 'contacts', 'contacts/123', etc. (no leading slash)
		const matched = navigationItems.find((item) => {
			// Normalize item path for comparison (remove leading slash if present)
			const normalizedItemPath = item.path.replace(/^\//, '');

			// Handle dashboard/home case (path is '/' or empty)
			if (item.path === '/' || item.path === '') {
				return currentPath === '' || currentPath === '/';
			}

			// Exact match
			if (currentPath === normalizedItemPath) {
				return true;
			}

			// Check if current path starts with item path (for sub-routes like 'contacts/123')
			// Make sure we match on path boundaries (e.g., 'contacts' matches 'contacts/123' but not 'contact')
			return (
				currentPath.startsWith(normalizedItemPath + '/') ||
				currentPath.startsWith(normalizedItemPath + ':')
			);
		});

		if (matched) {
			setSelectedKey(matched.path);
		} else if (currentPath === '') {
			// If no path, use default
			setSelectedKey(defaultSelectedPath);
		}
	}, [
		navigationItems,
		location.pathname,
		getCurrentPathFromLocation,
		defaultSelectedPath,
	]);

	useEffect(() => {
		const container = scrollContainerRef.current;
		if (!container) {
			return;
		}

		updateScrollIndicators();

		container.addEventListener('scroll', updateScrollIndicators, {
			passive: true,
		});
		window.addEventListener('resize', updateScrollIndicators);

		return () => {
			container.removeEventListener('scroll', updateScrollIndicators);
			window.removeEventListener('resize', updateScrollIndicators);
		};
	}, [updateScrollIndicators]);

	useEffect(() => {
		updateScrollIndicators();
	}, [navigationItems, updateScrollIndicators]);

	return (
		<>
			<Sidebar
				collapsible="icon"
				className={`qcrm-navbar${
					isMounted ? ' qcrm-navbar--mounted' : ''
				}`}
			>
				<div className="qcrm-navbar__surface">
					<SidebarHeader className="qcrm-navbar__header">
						<div className="qcrm-navbar__brand">
							<LogoIcon width={30} height={40} />
							<span className="qcrm-navbar__brand-text">
								{__('Quill CRM', 'quillcrm')}
							</span>
						</div>
					</SidebarHeader>
					<SidebarContent className="qcrm-navbar__content">
						{!isAtTop && (
							<button
								type="button"
								className="qcrm-navbar__chevron qcrm-navbar__chevron--top"
								onClick={() => handleScrollBy('up')}
								aria-label={__('Scroll up', 'quillcrm')}
							>
								<ChevronUp />
							</button>
						)}
						<div
							ref={scrollContainerRef}
							className="qcrm-navbar__scroll-container"
						>
							<SidebarMenu className="qcrm-navbar__menu">
								{navigationItems.map((item, index) =>
									renderMenuItem(item, index)
								)}
							</SidebarMenu>
						</div>
						{!isAtBottom && (
							<button
								type="button"
								className="qcrm-navbar__chevron qcrm-navbar__chevron--bottom"
								onClick={() => handleScrollBy('down')}
								aria-label={__('Scroll down', 'quillcrm')}
							>
								<ChevronDown />
							</button>
						)}
					</SidebarContent>
				</div>
			</Sidebar>
			{hoveredItem &&
				createPortal(
					<div
						className="qcrm-navbar__submenu-portal"
						style={{
							position: 'fixed',
							top: `${hoveredItem.rect.top - 80}px`,
							left: `${hoveredItem.rect.right + 20}px`,
							zIndex: 99999,
						}}
						onMouseEnter={() => {
							// Clear timeout when hovering over submenu
							if (hoverTimeoutRef.current) {
								clearTimeout(hoverTimeoutRef.current);
								hoverTimeoutRef.current = null;
							}
						}}
						onMouseLeave={() => {
							// Close submenu when leaving
							setHoveredItem(null);
						}}
					>
						<div className="qcrm-navbar__submenu">
							{hoveredItem.subMenu.map((subItem) => (
								<button
									key={subItem.path}
									onClick={() => {
										handleNavigation(subItem.path);
										setHoveredItem(null);
									}}
									className="qcrm-navbar__submenu-item"
								>
									{subItem.label}
								</button>
							))}
						</div>
					</div>,
					document.body
				)}
		</>
	);
};

export default NavBar;
