import { useState } from 'react';
import { __ } from '@wordpress/i18n';
import { ChevronRight } from 'lucide-react';
import PreheaderLibrary from '../blocks/libraries/Preheader';
import HeaderLibrary from '../blocks/libraries/Header';
import HeroImageLibrary from '../blocks/libraries/HeroImage';
import EmailBodyLibrary from '../blocks/libraries/EmailBody';


const FooterLayout = () => (
	<div className="p-4">
		<h3 className="font-semibold mb-2">
			{__('Footer Layout', 'quillcrm')}
		</h3>
		<p className="text-sm text-muted-foreground">
			{__('Configure your footer layout options', 'quillcrm')}
		</p>
		{/* Add your footer layout content here */}
	</div>
);

const ImageGallery = () => (
	<div className="p-4">
		<h3 className="font-semibold mb-2">
			{__('Image Gallery Layout', 'quillcrm')}
		</h3>
		<p className="text-sm text-muted-foreground">
			{__('Configure your grid layout options', 'quillcrm')}
		</p>
		{/* Add your grid layout content here */}
	</div>
);

const ProductListing = () => (
	<div className="p-4">
		<h3 className="font-semibold mb-2">
			{__('Product Listing Layout', 'quillcrm')}
		</h3>
		<p className="text-sm text-muted-foreground">
			{__('Create your custom layout', 'quillcrm')}
		</p>
		{/* Add your custom layout content here */}
	</div>
);

const LayoutItems = () => {
	const [activeSidebar, setActiveSidebar] = useState(null);

	const layoutItems = [
		{
			id: 'preheader',
			title: __('Preheader', 'quillcrm'),
			component: PreheaderLibrary,
		},
		{
			id: 'header',
			title: __('Header', 'quillcrm'),
			component: HeaderLibrary,
		},
		{
			id: 'hero-image',
			title: __('Hero Image', 'quillcrm'),
			component: HeroImageLibrary,
		},
		{
			id: 'email-body',
			title: __('Email Body', 'quillcrm'),
			component: EmailBodyLibrary,
		},
		{
			id: 'product-listing',
			title: __('Product Listing', 'quillcrm'),
			component: ProductListing,
		},
		{
			id: 'image-gallery',
			title: __('Image Gallery', 'quillcrm'),
			component: ImageGallery,
		},
		{
			id: 'footer',
			title: __('Footer', 'quillcrm'),
			component: FooterLayout,
		},
	];

	const handleItemClick = (itemId) => {
		setActiveSidebar(activeSidebar === itemId ? null : itemId);
	};

	const ActiveComponent = activeSidebar
		? layoutItems.find((item) => item.id === activeSidebar)?.component
		: null;

	return (
		<div className="relative">
			{/* Main content area */}
			<div className="flex-1">
				<div className="space-y-2 p-4">
					{layoutItems.map((item) => (
						<div
							key={item.id}
							onClick={() => handleItemClick(item.id)}
							className={`flex items-center justify-between w-full px-4 py-3 rounded-md cursor-pointer transition-colors ${activeSidebar === item.id
								? 'text-primary font-bold'
								: 'text-muted-foreground'
								}`}
						>
							<span className="text-base">{item.title}</span>
							<ChevronRight
								className={`transition-transform ${activeSidebar === item.id
									? 'rotate-180'
									: ''
									}`}
							/>
						</div>
					))}
				</div>
			</div>

			{/* Sidebar */}
			{activeSidebar && (
				<div className="absolute -top-44 -right-[333px] w-72 h-auto z-20 bg-white">
					<div className="flex items-center justify-center px-8 pt-7">
						<h2 className="text-base font-bold text-primary border-b-2 text-center w-full pb-4">
							{
								layoutItems.find(
									(item) => item.id === activeSidebar
								)?.title
							}
						</h2>
					</div>
					<div className="overflow-y-auto p-4">
						{ActiveComponent && <ActiveComponent />}
					</div>
				</div>
			)}
		</div>
	);
};

export default LayoutItems;
