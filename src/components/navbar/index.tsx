/**
 * QuillCRM dependencies
 */
import { getAdminPages, useNavigate, getToLink } from '@quillcrm/navigation';
import Config from '@quillcrm/config';
/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState, useMemo } from '@wordpress/element';
/**
 * Internal dependencies
 */
import './style.scss';
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
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

/**
 * Check if user has the required capability for a page
 */
const hasRequiredCapability = (requiredCapability?: string): boolean => {
	if (!requiredCapability) {
		return true; // No capability required
	}

	const userCapabilities = Config.getUserCapabilities();
	return (
		userCapabilities[requiredCapability as keyof typeof userCapabilities] ||
		false
	);
};

const NavBar: React.FC<NavBarProps> = ({ defaultSelectedPath = '/' }) => {
	const navigate = useNavigate();
	const [selectedKey, setSelectedKey] = useState<string>(defaultSelectedPath);

	// Memoize the filtered items to avoid recalculation on every render
	const { dashboardItem, crmItems } = useMemo(() => {
		const pages = getAdminPages();
		const allItems: NavigationItem[] = [];

		// Convert pages object to array and filter out hidden items, items without access, and root path
		Object.entries(pages).forEach(([_, item]) => {
			if (
				!item.hidden &&
				hasRequiredCapability(item.requiredCapability)
			) {
				allItems.push({
					path: item.path,
					label: item.label,
					icon: item.icon,
				});
			}
		});

		// Separate dashboard item (first item) from CRM items
		const [first, ...rest] = allItems;

		return {
			dashboardItem: first || null,
			crmItems: rest,
		};
	}, []);

	const handleNavigation = (path: string) => {
		setSelectedKey(path);
		navigate(getToLink(path));
	};

	const renderMenuItem = (item: NavigationItem) => (
		<SidebarMenuItem
			key={item.path}
			onClick={() => handleNavigation(item.path)}
			className="group-data-[collapsible=icon]:pl-0 pl-3 menu-item"
		>
			<SidebarMenuButton
				size="lg"
				isActive={selectedKey === item.path}
				className="group-data-[collapsible=icon]:justify-center"
			>
				<div className="cursor-pointer flex gap-2 items-center">
					<span
						className={
							selectedKey === item.path
								? 'text-primary-foreground'
								: 'text-primary icon'
						}
					>
						{item.icon}
					</span>
					<span className="group-data-[collapsible=icon]:hidden">
						{item.label}
					</span>
				</div>
			</SidebarMenuButton>
		</SidebarMenuItem>
	);

	return (
		<Sidebar collapsible="icon">
			<SidebarHeader>
				<SidebarMenu>
					<SidebarMenuItem
						key="logo"
						className="border-b hover:bg-transparent cursor-default"
						style={{
							borderWidth: '1px',
							borderStyle: 'solid',
							borderImageSource:
								'linear-gradient(90deg, hsl(var(--border) / 0) 0%, hsl(var(--border)) 49.52%, hsl(var(--border) / 0.15625) 99.04%)',
							borderImageSlice: 1,
						}}
					>
						<SidebarMenuButton
							size="lg"
							className="hover:bg-transparent cursor-default"
						>
							<div className="flex gap-2 items-center">
								<LogoIcon width={30} height={40} />
								<span className="group-data-[collapsible=icon]:hidden text-sidebar-header font-extrabold text-2xl">
									{__('Quill CRM', 'quillcrm')}
								</span>
							</div>
						</SidebarMenuButton>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarHeader>

			<SidebarContent>
				{/* User Dashboard Section */}
				{dashboardItem && (
					<SidebarGroup>
						<SidebarGroupLabel>
							{__('User Dashboard', 'quillcrm')}
						</SidebarGroupLabel>
						<SidebarGroupContent>
							<SidebarMenu>
								{renderMenuItem(dashboardItem)}
							</SidebarMenu>
						</SidebarGroupContent>
					</SidebarGroup>
				)}

				{/* CRM Controls Section */}
				{crmItems.length > 0 && (
					<SidebarGroup>
						<SidebarGroupLabel>
							{__('CRM Controls', 'quillcrm')}
						</SidebarGroupLabel>
						<SidebarGroupContent>
							<SidebarMenu>
								{crmItems.map(renderMenuItem)}
							</SidebarMenu>
						</SidebarGroupContent>
					</SidebarGroup>
				)}
			</SidebarContent>

			<SidebarFooter />
		</Sidebar>
	);
};

export default NavBar;
