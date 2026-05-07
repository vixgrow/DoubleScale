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
import PreheaderLibrary from '../blocks/libraries/Preheader';
import HeaderLibrary from '../blocks/libraries/Header';
import HeroImageLibrary from '../blocks/libraries/HeroImage';
import EmailBodyLibrary from '../blocks/libraries/EmailBody';
import ImageGalleryLibrary from '../blocks/libraries/ImageGallery';
import FooterLibrary from '../blocks/libraries/Footer';

interface LayoutItemsProps {
	activeSidebar?: any;
	setActiveSidebar?: (sidebar: any) => void;
}

const LayoutItems = ({ activeSidebar, setActiveSidebar }: LayoutItemsProps) => {
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
