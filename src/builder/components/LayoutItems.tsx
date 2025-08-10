import { useState } from 'react';
import { __ } from '@wordpress/i18n';
import { ChevronRight } from 'lucide-react';

// Individual layout item components (you can create separate files for these)
const HeaderLayout = () => (
	<div className="p-4">
		<h3 className="font-semibold mb-2">
			{__('Header Layout', 'quillcrm')}
		</h3>
		<p className="text-sm text-muted-foreground">
			{__('Configure your header layout options', 'quillcrm')}
		</p>
		{/* Add your header layout content here */}
	</div>
);

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

const PreHeader = () => (
	<div className="p-4">
		<h3 className="font-semibold mb-2">
			{__('Preheader Layout', 'quillcrm')}
		</h3>
		<p className="text-sm text-muted-foreground">
			{__('Configure your sidebar layout options', 'quillcrm')}
		</p>
		{/* Add your sidebar layout content here */}
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

const EmailBody = () => (
	<div className="p-4">
		<h3 className="font-semibold mb-2">
			{__('Email Body Layout', 'quillcrm')}
		</h3>
		<p className="text-sm text-muted-foreground">
			{__('Configure your flex layout options', 'quillcrm')}
		</p>
		{/* Add your flex layout content here */}
	</div>
);

const HeroImage = () => (
	<div className="p-4">
		<h3 className="font-semibold mb-2">
			{__('Hero Image Layout', 'quillcrm')}
		</h3>
		<p className="text-sm text-muted-foreground">
			{__('Configure your container layout options', 'quillcrm')}
		</p>
		{/* Add your container layout content here */}
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
			component: HeaderLayout,
		},
		{
			id: 'header',
			title: __('Header', 'quillcrm'),
			component: HeaderLayout,
		},
		{
			id: 'hero-image',
			title: __('Hero Image', 'quillcrm'),
			component: HeroImage,
		},
		{
			id: 'email-body',
			title: __('Email Body', 'quillcrm'),
			component: EmailBody,
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
							className={`flex items-center justify-between w-full px-4 py-3 rounded-md cursor-pointer transition-colors ${
								activeSidebar === item.id
									? 'text-primary font-bold'
									: 'text-muted-foreground'
							}`}
						>
							<span className="text-base">{item.title}</span>
							<ChevronRight
								className={`transition-transform ${
									activeSidebar === item.id
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
				<div className="absolute -top-44 -right-[333px] w-72 z-20 h-full bg-white">
					<div className="">
						<div className="flex items-center justify-center px-8 pt-7">
							<h2 className="text-base font-bold text-primary border-b-2 text-center w-full pb-4">
								{
									layoutItems.find(
										(item) => item.id === activeSidebar
									)?.title
								}
							</h2>
						</div>
						<div className="max-h-[calc(100vh-200px)] overflow-y-auto">
							{ActiveComponent && <ActiveComponent />}
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

export default LayoutItems;
