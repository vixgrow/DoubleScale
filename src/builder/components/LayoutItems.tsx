/**
 * wordpress dependencies
 */
import { __ } from '@wordpress/i18n';
/**
 * external dependencies
 */
import { ChevronRight } from 'lucide-react';
/**
 * internal dependencies
 */
import { cn } from '@/lib/utils';
import PreheaderLibrary from '../blocks/libraries/Preheader';
import HeaderLibrary from '../blocks/libraries/Header';
import HeroImageLibrary from '../blocks/libraries/HeroImage';
import EmailBodyLibrary from '../blocks/libraries/EmailBody';
import ImageGalleryLibrary from '../blocks/libraries/ImageGallery';
import FooterLibrary from '../blocks/libraries/Footer';

interface LayoutItemsProps {
	activeSidebar?: any;
	setActiveSidebar?: (sidebar: any) => void;
	/**
	 * When true, render with dark sidebar styling.
	 */
	inline?: boolean;
}

const LayoutItems = ({
	activeSidebar,
	setActiveSidebar,
	inline = true,
}: LayoutItemsProps) => {
	const layoutItems = [
		{
			id: 'preheader',
			title: __('Preheader', 'doublescale'),
			component: PreheaderLibrary,
		},
		{
			id: 'header',
			title: __('Header', 'doublescale'),
			component: HeaderLibrary,
		},
		{
			id: 'hero-image',
			title: __('Hero Image', 'doublescale'),
			component: HeroImageLibrary,
		},
		{
			id: 'email-body',
			title: __('Email Body', 'doublescale'),
			component: EmailBodyLibrary,
		},
		{
			id: 'image-gallery',
			title: __('Image Gallery', 'doublescale'),
			component: ImageGalleryLibrary,
		},
		{
			id: 'footer',
			title: __('Footer', 'doublescale'),
			component: FooterLibrary,
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
		<div className="space-y-2 py-2">
			{layoutItems.map((item) => {
				const isActive = activeSidebar?.id === item.id;
				return (
					<button
						type="button"
						key={item.id}
						onClick={() => handleItemClick(item.id)}
						className={cn(
							'flex items-center justify-between w-full px-4 py-3 rounded-lg cursor-pointer transition-colors text-left',
							inline
								? isActive
									? 'bg-white/15 text-white'
									: 'bg-white/5 text-white/80 hover:bg-white/10 hover:text-white'
								: isActive
									? 'text-primary font-bold'
									: 'text-muted-foreground'
						)}
					>
						<span className="text-sm">{item.title}</span>
						<ChevronRight
							className={cn(
								'h-4 w-4 transition-transform',
								isActive && 'rotate-90'
							)}
						/>
					</button>
				);
			})}
		</div>
	);
};

export default LayoutItems;
