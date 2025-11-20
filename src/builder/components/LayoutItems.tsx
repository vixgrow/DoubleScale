/**
 * wordpress dependencies
 */
import { __ } from '@wordpress/i18n';
import { applyFilters } from '@wordpress/hooks';
/**
 * external dependencies
 */
import { ChevronRight } from 'lucide-react';
/**
 * internal dependencies
 */
import LockedLibrary from './LockedLibrary';

interface LayoutItemsProps {
	activeSidebar?: any;
	setActiveSidebar?: (sidebar: any) => void;
}

const LayoutItems = ({ activeSidebar, setActiveSidebar }: LayoutItemsProps) => {
	const layoutItems = [
		{
			id: 'preheader',
			title: __('Preheader', 'quillcrm'),
			component: applyFilters(
				'QuillCRM.Builder.LibraryComponent',
				LockedLibrary,
				'preheader'
			),
		},
		{
			id: 'header',
			title: __('Header', 'quillcrm'),
			component: applyFilters(
				'QuillCRM.Builder.LibraryComponent',
				LockedLibrary,
				'header'
			),
		},
		{
			id: 'hero-image',
			title: __('Hero Image', 'quillcrm'),
			component: applyFilters(
				'QuillCRM.Builder.LibraryComponent',
				LockedLibrary,
				'hero-image'
			),
		},
		{
			id: 'email-body',
			title: __('Email Body', 'quillcrm'),
			component: applyFilters(
				'QuillCRM.Builder.LibraryComponent',
				LockedLibrary,
				'email-body'
			),
		},
		{
			id: 'image-gallery',
			title: __('Image Gallery', 'quillcrm'),
			component: applyFilters(
				'QuillCRM.Builder.LibraryComponent',
				LockedLibrary,
				'image-gallery'
			),
		},
		{
			id: 'footer',
			title: __('Footer', 'quillcrm'),
			component: applyFilters(
				'QuillCRM.Builder.LibraryComponent',
				LockedLibrary,
				'footer'
			),
		},
	];

	const handleItemClick = (itemId) => {
		const selectedItem = layoutItems.find((item) => item.id === itemId);
		if (activeSidebar?.id === itemId) {
			setActiveSidebar?.(null);
		} else {
			setActiveSidebar?.(selectedItem);
		}
	};

	return (
		<div className="space-y-2 p-4">
			{layoutItems.map((item) => (
				<div
					key={item.id}
					onClick={() => handleItemClick(item.id)}
					className={`flex items-center justify-between w-full px-4 py-3 rounded-md cursor-pointer transition-colors ${
						activeSidebar?.id === item.id
							? 'text-primary font-bold'
							: 'text-muted-foreground'
					}`}
				>
					<span className="text-base">{item.title}</span>
					<ChevronRight
						className={`transition-transform ${
							activeSidebar?.id === item.id ? 'rotate-180' : ''
						}`}
					/>
				</div>
			))}
		</div>
	);
};

export default LayoutItems;
