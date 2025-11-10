/**
 * QuillCRM dependencies
 */
import { getAdminPages, useNavigate, getToLink } from '@quillcrm/navigation';
import { useCapabilities } from '@quillcrm/hooks/use-capabilities';
/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useEffect, useMemo, useState } from '@wordpress/element';
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
					<SidebarMenu className="qcrm-navbar__menu">
						{navigationItems.map(renderMenuItem)}
					</SidebarMenu>
				</SidebarContent>
			</div>
		</Sidebar>
	);
};

export default NavBar;
