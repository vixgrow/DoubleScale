/**
 * QuillCRM dependencies
 */
import { getAdminPages, useNavigate, getToLink } from '@quillcrm/navigation';
import { useCapabilities } from '@quillcrm/hooks/use-capabilities';
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

interface NavigationItem {
	path: string;
	label: string;
	icon: React.ReactNode;
}

interface NavBarProps {
	defaultSelectedPath?: string;
}

const NavBar: React.FC<NavBarProps> = ({ defaultSelectedPath = '/' }) => {
	const navigate = useNavigate();
	const [selectedKey, setSelectedKey] = useState<string>(defaultSelectedPath);
	const [isAtTop, setIsAtTop] = useState(true);
	const [isAtBottom, setIsAtBottom] = useState(false);
	const scrollContainerRef = useRef<HTMLDivElement | null>(null);
	const { hasRequiredCapability } = useCapabilities();

	const navigationItems = useMemo(() => {
		const pages = getAdminPages();
		return Object.values(pages)
			.filter(
				(item) =>
					!item.hidden &&
					item.path &&
					hasRequiredCapability(item.requiredCapability)
			)
			.map<NavigationItem>((item) => ({
				path: item.path,
				label: item.label,
				icon: item.icon,
			}));
	}, [hasRequiredCapability]);

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

	const renderMenuItem = (item: NavigationItem) => (
		<SidebarMenuItem
			key={item.path}
			onClick={() => handleNavigation(item.path)}
			className="qcrm-navbar__item"
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

	useEffect(() => {
		if (typeof window === 'undefined') {
			return;
		}

		const currentHash = window.location.hash.replace(/^#\//, '');
		if (!currentHash) {
			return;
		}

		const matched = navigationItems.find((item) =>
			currentHash.startsWith(item.path)
		);

		if (matched) {
			setSelectedKey(matched.path);
		}
	}, [navigationItems]);

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
		<Sidebar collapsible="icon" className="qcrm-navbar">
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
							{navigationItems.map(renderMenuItem)}
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
	);
};

export default NavBar;
