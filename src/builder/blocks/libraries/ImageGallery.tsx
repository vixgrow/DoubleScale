/**
 * wordpress dependencies
 */
import { __ } from '@wordpress/i18n';
import { applyFilters } from '@wordpress/hooks';
/**
 * internal dependencies
 */
import { ImageBlockIcon } from '@doublescale/components';
import { DraggableTemplate } from '@/builder/components/shared/DraggableTemplate';

const ImageGalleryLibrary = () => {
	const isProActive = applyFilters('doublescale_is_pro_active', false) as boolean;
	// Grid 1 template - 1 large image + 2 small images
	const grid1Template = {
		type: 'grid-1',
		blocks: [
			{
				type: 'image',
				props: {
					src: '',
					alt: 'Gallery Image 1',
					width: '100%',
					height: '336px',
					align: 'center',
					backgroundColor: 'transparent',
					padding: { top: 0, right: 0, bottom: 0, left: 0 },
					link: '',
					borderRadius: '0',
					shape: 'rectangle',
					sideBySideLayout: true,
					sideBySidePosition: 'left',
				},
			},
			{
				type: 'image',
				props: {
					src: '',
					alt: 'Gallery Image 2',
					width: '100%',
					height: '150px',
					align: 'center',
					backgroundColor: 'transparent',
					padding: { top: 0, right: 0, bottom: 0, left: 0 },
					link: '',
					borderRadius: '0',
					shape: 'rectangle',
					sideBySideLayout: true,
					sideBySidePosition: 'right',
				},
			},
			{
				type: 'image',
				props: {
					src: '',
					alt: 'Gallery Image 3',
					width: '100%',
					height: '150px',
					align: 'center',
					backgroundColor: 'transparent',
					padding: { top: 0, right: 0, bottom: 0, left: 0 },
					link: '',
					borderRadius: '0',
					shape: 'rectangle',
					sideBySideLayout: true,
					sideBySidePosition: 'right',
				},
			},
		],
	};

	// Grid 2 template - 3 columns: 1 image + 2 images + 2 images
	const grid2Template = {
		type: 'grid-2',
		layout: {
			justifyContent: 'flex-start',
			gap: '4px',
			alignItems: 'flex-start',
			flexWrap: 'nowrap',
			width: '100%',
		},
		blocks: [
			// Column 1: Single image (50% width)
			{
				type: 'image',
				props: {
					src: '',
					alt: 'Gallery Image 1',
					width: '100%',
					height: '336px',
					align: 'center',
					backgroundColor: 'transparent',
					padding: { top: 0, right: 0, bottom: 0, left: 0 },
					link: '',
					borderRadius: '0',
					shape: 'rectangle',
					inlineLayout: true,
					containerId: 'grid2-container',
					flexBasis: '50%',
					flexGrow: 0,
					flexShrink: 0,
				},
			},
			// Column 2: First image (25% width)
			{
				type: 'image',
				props: {
					src: '',
					alt: 'Gallery Image 2',
					width: '100%',
					height: '150px',
					align: 'center',
					backgroundColor: 'transparent',
					padding: { top: 0, right: 0, bottom: 0, left: 0 },
					link: '',
					borderRadius: '0',
					shape: 'rectangle',
					inlineLayout: true,
					containerId: 'grid2-container',
					flexBasis: '25%',
					flexGrow: 0,
					flexShrink: 0,
				},
			},
			// Column 3: First image (25% width)
			{
				type: 'image',
				props: {
					src: '',
					alt: 'Gallery Image 3',
					width: '100%',
					height: '150px',
					align: 'center',
					backgroundColor: 'transparent',
					padding: { top: 0, right: 0, bottom: 0, left: 0 },
					link: '',
					borderRadius: '0',
					shape: 'rectangle',
					inlineLayout: true,
					containerId: 'grid2-container',
					flexBasis: '25%',
					flexGrow: 0,
					flexShrink: 0,
				},
			},
			// Column 2: Second image (25% width)
			{
				type: 'image',
				props: {
					src: '',
					alt: 'Gallery Image 4',
					width: '100%',
					height: '150px',
					align: 'center',
					backgroundColor: 'transparent',
					padding: { top: 0, right: 0, bottom: 0, left: 0 },
					link: '',
					borderRadius: '0',
					shape: 'rectangle',
					inlineLayout: true,
					containerId: 'grid2-container',
					flexBasis: '25%',
					flexGrow: 0,
					flexShrink: 0,
				},
			},
			// Column 3: Second image (25% width)
			{
				type: 'image',
				props: {
					src: '',
					alt: 'Gallery Image 5',
					width: '100%',
					height: '150px',
					align: 'center',
					backgroundColor: 'transparent',
					padding: { top: 0, right: 0, bottom: 0, left: 0 },
					link: '',
					borderRadius: '0',
					shape: 'rectangle',
					inlineLayout: true,
					containerId: 'grid2-container',
					flexBasis: '25%',
					flexGrow: 0,
					flexShrink: 0,
				},
			},
		],
	};

	// Grid 3 template - 3 columns: 25% + 50% + 25%
	const grid3Template = {
		type: 'grid-3',
		layout: {
			justifyContent: 'flex-start',
			gap: '4px',
			alignItems: 'flex-start',
			flexWrap: 'nowrap',
			width: '100%',
		},
		blocks: [
			// Column 1: First image (25% width)
			{
				type: 'image',
				props: {
					src: '',
					alt: 'Gallery Image 1',
					width: '100%',
					height: '150px',
					align: 'center',
					backgroundColor: 'transparent',
					padding: { top: 0, right: 0, bottom: 0, left: 0 },
					link: '',
					borderRadius: '0',
					shape: 'rectangle',
					inlineLayout: true,
					containerId: 'grid3-container',
					flexBasis: '25%',
					flexGrow: 0,
					flexShrink: 0,
				},
			},
			// Column 2: Single image (50% width)
			{
				type: 'image',
				props: {
					src: '',
					alt: 'Gallery Image 2',
					width: '100%',
					height: '336px',
					align: 'center',
					backgroundColor: 'transparent',
					padding: { top: 0, right: 0, bottom: 0, left: 0 },
					link: '',
					borderRadius: '0',
					shape: 'rectangle',
					inlineLayout: true,
					containerId: 'grid3-container',
					flexBasis: '50%',
					flexGrow: 0,
					flexShrink: 0,
				},
			},
			// Column 3: First image (25% width)
			{
				type: 'image',
				props: {
					src: '',
					alt: 'Gallery Image 3',
					width: '100%',
					height: '150px',
					align: 'center',
					backgroundColor: 'transparent',
					padding: { top: 0, right: 0, bottom: 0, left: 0 },
					link: '',
					borderRadius: '0',
					shape: 'rectangle',
					inlineLayout: true,
					containerId: 'grid3-container',
					flexBasis: '25%',
					flexGrow: 0,
					flexShrink: 0,
				},
			},
			// Column 1: Second image (25% width)
			{
				type: 'image',
				props: {
					src: '',
					alt: 'Gallery Image 4',
					width: '100%',
					height: '150px',
					align: 'center',
					backgroundColor: 'transparent',
					padding: { top: 0, right: 0, bottom: 0, left: 0 },
					link: '',
					borderRadius: '0',
					shape: 'rectangle',
					inlineLayout: true,
					containerId: 'grid3-container',
					flexBasis: '25%',
					flexGrow: 0,
					flexShrink: 0,
				},
			},
			// Column 3: Second image (25% width)
			{
				type: 'image',
				props: {
					src: '',
					alt: 'Gallery Image 5',
					width: '100%',
					height: '150px',
					align: 'center',
					backgroundColor: 'transparent',
					padding: { top: 0, right: 0, bottom: 0, left: 0 },
					link: '',
					borderRadius: '0',
					shape: 'rectangle',
					inlineLayout: true,
					containerId: 'grid3-container',
					flexBasis: '25%',
					flexGrow: 0,
					flexShrink: 0,
				},
			},
		],
	};

	// Grid 4 template - 3 columns: 25% + 25% + 50%
	const grid4Template = {
		type: 'grid-4',
		layout: {
			justifyContent: 'flex-start',
			gap: '4px',
			alignItems: 'flex-start',
			flexWrap: 'nowrap',
			width: '100%',
		},
		blocks: [
			// Column 1: First image (25% width)
			{
				type: 'image',
				props: {
					src: '',
					alt: 'Gallery Image 1',
					width: '100%',
					height: '150px',
					align: 'center',
					backgroundColor: 'transparent',
					padding: { top: 0, right: 0, bottom: 0, left: 0 },
					link: '',
					borderRadius: '0',
					shape: 'rectangle',
					inlineLayout: true,
					containerId: 'grid4-container',
					flexBasis: '25%',
					flexGrow: 0,
					flexShrink: 0,
				},
			},
			// Column 2: First image (25% width)
			{
				type: 'image',
				props: {
					src: '',
					alt: 'Gallery Image 2',
					width: '100%',
					height: '150px',
					align: 'center',
					backgroundColor: 'transparent',
					padding: { top: 0, right: 0, bottom: 0, left: 0 },
					link: '',
					borderRadius: '0',
					shape: 'rectangle',
					inlineLayout: true,
					containerId: 'grid4-container',
					flexBasis: '25%',
					flexGrow: 0,
					flexShrink: 0,
				},
			},
			// Column 3: Single image (50% width)
			{
				type: 'image',
				props: {
					src: '',
					alt: 'Gallery Image 3',
					width: '100%',
					height: '336px',
					align: 'center',
					backgroundColor: 'transparent',
					padding: { top: 0, right: 0, bottom: 0, left: 0 },
					link: '',
					borderRadius: '0',
					shape: 'rectangle',
					inlineLayout: true,
					containerId: 'grid4-container',
					flexBasis: '50%',
					flexGrow: 0,
					flexShrink: 0,
				},
			},
			// Column 1: Second image (25% width)
			{
				type: 'image',
				props: {
					src: '',
					alt: 'Gallery Image 4',
					width: '100%',
					height: '150px',
					align: 'center',
					backgroundColor: 'transparent',
					padding: { top: 0, right: 0, bottom: 0, left: 0 },
					link: '',
					borderRadius: '0',
					shape: 'rectangle',
					inlineLayout: true,
					containerId: 'grid4-container',
					flexBasis: '25%',
					flexGrow: 0,
					flexShrink: 0,
				},
			},
			// Column 2: Second image (25% width)
			{
				type: 'image',
				props: {
					src: '',
					alt: 'Gallery Image 5',
					width: '100%',
					height: '150px',
					align: 'center',
					backgroundColor: 'transparent',
					padding: { top: 0, right: 0, bottom: 0, left: 0 },
					link: '',
					borderRadius: '0',
					shape: 'rectangle',
					inlineLayout: true,
					containerId: 'grid4-container',
					flexBasis: '25%',
					flexGrow: 0,
					flexShrink: 0,
				},
			},
		],
	};

	// Grid 5 template - 3 columns: 33.33% + 33.33% + 33.33%
	const grid5Template = {
		type: 'grid-5',
		layout: {
			justifyContent: 'flex-start',
			gap: '4px',
			alignItems: 'flex-start',
			flexWrap: 'nowrap',
			width: '100%',
		},
		blocks: [
			// Column 1: First image (33.33% width)
			{
				type: 'image',
				props: {
					src: '',
					alt: 'Gallery Image 1',
					width: '100%',
					height: 'auto',
					align: 'center',
					backgroundColor: 'transparent',
					padding: { top: 0, right: 0, bottom: 0, left: 0 },
					link: '',
					borderRadius: '0',
					shape: 'rectangle',
					inlineLayout: true,
					containerId: 'grid5-container',
					flexBasis: '33.33%',
					flexGrow: 0,
					flexShrink: 0,
				},
			},
			// Column 2: First image (33.33% width)
			{
				type: 'image',
				props: {
					src: '',
					alt: 'Gallery Image 2',
					width: '100%',
					height: 'auto',
					align: 'center',
					backgroundColor: 'transparent',
					padding: { top: 0, right: 0, bottom: 0, left: 0 },
					link: '',
					borderRadius: '0',
					shape: 'rectangle',
					inlineLayout: true,
					containerId: 'grid5-container',
					flexBasis: '33.33%',
					flexGrow: 0,
					flexShrink: 0,
				},
			},
			// Column 3: First image (33.33% width)
			{
				type: 'image',
				props: {
					src: '',
					alt: 'Gallery Image 3',
					width: '100%',
					height: 'auto',
					align: 'center',
					backgroundColor: 'transparent',
					padding: { top: 0, right: 0, bottom: 0, left: 0 },
					link: '',
					borderRadius: '0',
					shape: 'rectangle',
					inlineLayout: true,
					containerId: 'grid5-container',
					flexBasis: '33.33%',
					flexGrow: 0,
					flexShrink: 0,
				},
			},
			// Column 1: Second image (33.33% width)
			{
				type: 'image',
				props: {
					src: '',
					alt: 'Gallery Image 4',
					width: '100%',
					height: 'auto',
					align: 'center',
					backgroundColor: 'transparent',
					padding: { top: 0, right: 0, bottom: 0, left: 0 },
					link: '',
					borderRadius: '0',
					shape: 'rectangle',
					inlineLayout: true,
					containerId: 'grid5-container',
					flexBasis: '33.33%',
					flexGrow: 0,
					flexShrink: 0,
				},
			},
			// Column 2: Second image (33.33% width)
			{
				type: 'image',
				props: {
					src: '',
					alt: 'Gallery Image 5',
					width: '100%',
					height: 'auto',
					align: 'center',
					backgroundColor: 'transparent',
					padding: { top: 0, right: 0, bottom: 0, left: 0 },
					link: '',
					borderRadius: '0',
					shape: 'rectangle',
					inlineLayout: true,
					containerId: 'grid5-container',
					flexBasis: '33.33%',
					flexGrow: 0,
					flexShrink: 0,
				},
			},
			// Column 3: Second image (33.33% width)
			{
				type: 'image',
				props: {
					src: '',
					alt: 'Gallery Image 6',
					width: '100%',
					height: 'auto',
					align: 'center',
					backgroundColor: 'transparent',
					padding: { top: 0, right: 0, bottom: 0, left: 0 },
					link: '',
					borderRadius: '0',
					shape: 'rectangle',
					inlineLayout: true,
					containerId: 'grid5-container',
					flexBasis: '33.33%',
					flexGrow: 0,
					flexShrink: 0,
				},
			},
		],
	};

	// Grid 6 template - 4 columns: 25% + 25% + 25% + 25%
	const grid6Template = {
		type: 'grid-6',
		layout: {
			justifyContent: 'flex-start',
			gap: '4px',
			alignItems: 'flex-start',
			flexWrap: 'nowrap',
			width: '100%',
		},
		blocks: [
			// Column 1: First image (25% width)
			{
				type: 'image',
				props: {
					src: '',
					alt: 'Gallery Image 1',
					width: '100%',
					height: 'auto',
					align: 'center',
					backgroundColor: 'transparent',
					padding: { top: 0, right: 0, bottom: 0, left: 0 },
					link: '',
					borderRadius: '0',
					shape: 'rectangle',
					inlineLayout: true,
					containerId: 'grid6-container',
					flexBasis: '25%',
					flexGrow: 0,
					flexShrink: 0,
				},
			},
			// Column 2: First image (25% width)
			{
				type: 'image',
				props: {
					src: '',
					alt: 'Gallery Image 2',
					width: '100%',
					height: 'auto',
					align: 'center',
					backgroundColor: 'transparent',
					padding: { top: 0, right: 0, bottom: 0, left: 0 },
					link: '',
					borderRadius: '0',
					shape: 'rectangle',
					inlineLayout: true,
					containerId: 'grid6-container',
					flexBasis: '25%',
					flexGrow: 0,
					flexShrink: 0,
				},
			},
			// Column 3: First image (25% width)
			{
				type: 'image',
				props: {
					src: '',
					alt: 'Gallery Image 3',
					width: '100%',
					height: 'auto',
					align: 'center',
					backgroundColor: 'transparent',
					padding: { top: 0, right: 0, bottom: 0, left: 0 },
					link: '',
					borderRadius: '0',
					shape: 'rectangle',
					inlineLayout: true,
					containerId: 'grid6-container',
					flexBasis: '25%',
					flexGrow: 0,
					flexShrink: 0,
				},
			},
			// Column 4: First image (25% width)
			{
				type: 'image',
				props: {
					src: '',
					alt: 'Gallery Image 4',
					width: '100%',
					height: 'auto',
					align: 'center',
					backgroundColor: 'transparent',
					padding: { top: 0, right: 0, bottom: 0, left: 0 },
					link: '',
					borderRadius: '0',
					shape: 'rectangle',
					inlineLayout: true,
					containerId: 'grid6-container',
					flexBasis: '25%',
					flexGrow: 0,
					flexShrink: 0,
				},
			},
			// Column 1: Second image (25% width)
			{
				type: 'image',
				props: {
					src: '',
					alt: 'Gallery Image 5',
					width: '100%',
					height: 'auto',
					align: 'center',
					backgroundColor: 'transparent',
					padding: { top: 0, right: 0, bottom: 0, left: 0 },
					link: '',
					borderRadius: '0',
					shape: 'rectangle',
					inlineLayout: true,
					containerId: 'grid6-container',
					flexBasis: '25%',
					flexGrow: 0,
					flexShrink: 0,
				},
			},
			// Column 2: Second image (25% width)
			{
				type: 'image',
				props: {
					src: '',
					alt: 'Gallery Image 6',
					width: '100%',
					height: 'auto',
					align: 'center',
					backgroundColor: 'transparent',
					padding: { top: 0, right: 0, bottom: 0, left: 0 },
					link: '',
					borderRadius: '0',
					shape: 'rectangle',
					inlineLayout: true,
					containerId: 'grid6-container',
					flexBasis: '25%',
					flexGrow: 0,
					flexShrink: 0,
				},
			},
			// Column 3: Second image (25% width)
			{
				type: 'image',
				props: {
					src: '',
					alt: 'Gallery Image 7',
					width: '100%',
					height: 'auto',
					align: 'center',
					backgroundColor: 'transparent',
					padding: { top: 0, right: 0, bottom: 0, left: 0 },
					link: '',
					borderRadius: '0',
					shape: 'rectangle',
					inlineLayout: true,
					containerId: 'grid6-container',
					flexBasis: '25%',
					flexGrow: 0,
					flexShrink: 0,
				},
			},
			// Column 4: Second image (25% width)
			{
				type: 'image',
				props: {
					src: '',
					alt: 'Gallery Image 8',
					width: '100%',
					height: 'auto',
					align: 'center',
					backgroundColor: 'transparent',
					padding: { top: 0, right: 0, bottom: 0, left: 0 },
					link: '',
					borderRadius: '0',
					shape: 'rectangle',
					inlineLayout: true,
					containerId: 'grid6-container',
					flexBasis: '25%',
					flexGrow: 0,
					flexShrink: 0,
				},
			},
		],
	};

	return (
		<div className="grid gap-4">
			<div className="flex flex-col gap-1 text-[#333333]">
				<label className="text-sm">{__('Grid 1', 'doublescale')}</label>
				<DraggableTemplate
					template={grid1Template}
					id="image-gallery-grid-1"
					templateType="image-gallery"
					disabled={!isProActive}
				>
					<div className="flex gap-1 h-full items-center border rounded-lg p-3">
						<div className="text-[#616161] bg-muted w-1/2 h-full py-6 flex items-center justify-center">
							<ImageBlockIcon />
						</div>
						<div className="flex flex-col gap-1 w-1/2">
							<div className="text-[#616161] bg-muted w-full py-6 flex items-center justify-center">
								<ImageBlockIcon />
							</div>
							<div className="text-[#616161] bg-muted w-full py-6 flex items-center justify-center">
								<ImageBlockIcon />
							</div>
						</div>
					</div>
				</DraggableTemplate>
			</div>

			<div className="flex flex-col gap-1 text-[#333333]">
				<label className="text-sm">{__('Grid 2', 'doublescale')}</label>
				<DraggableTemplate
					template={grid2Template}
					id="image-gallery-grid-2"
					templateType="image-gallery"
					disabled={!isProActive}
				>
					<div className="flex gap-1 h-full items-center border rounded-lg p-3">
						<div className="text-[#616161] bg-muted w-1/2 h-full py-6 flex items-center justify-center">
							<ImageBlockIcon />
						</div>
						<div className="flex flex-col gap-1 w-1/4">
							<div className="text-[#616161] bg-muted w-full py-6 flex items-center justify-center">
								<ImageBlockIcon />
							</div>
							<div className="text-[#616161] bg-muted w-full py-6 flex items-center justify-center">
								<ImageBlockIcon />
							</div>
						</div>
						<div className="flex flex-col gap-1 w-1/4">
							<div className="text-[#616161] bg-muted w-full py-6 flex items-center justify-center">
								<ImageBlockIcon />
							</div>
							<div className="text-[#616161] bg-muted w-full py-6 flex items-center justify-center">
								<ImageBlockIcon />
							</div>
						</div>
					</div>
				</DraggableTemplate>
			</div>

			<div className="flex flex-col gap-1 text-[#333333]">
				<label className="text-sm">{__('Grid 3', 'doublescale')}</label>
				<DraggableTemplate
					template={grid3Template}
					id="image-gallery-grid-3"
					templateType="image-gallery"
					disabled={!isProActive}
				>
					<div className="flex gap-1 h-full items-center border rounded-lg p-3">
						<div className="flex flex-col gap-1 w-1/4">
							<div className="text-[#616161] bg-muted w-full py-6 flex items-center justify-center">
								<ImageBlockIcon />
							</div>
							<div className="text-[#616161] bg-muted w-full py-6 flex items-center justify-center">
								<ImageBlockIcon />
							</div>
						</div>
						<div className="text-[#616161] bg-muted w-1/2 h-full py-6 flex items-center justify-center">
							<ImageBlockIcon />
						</div>
						<div className="flex flex-col gap-1 w-1/4">
							<div className="text-[#616161] bg-muted w-full py-6 flex items-center justify-center">
								<ImageBlockIcon />
							</div>
							<div className="text-[#616161] bg-muted w-full py-6 flex items-center justify-center">
								<ImageBlockIcon />
							</div>
						</div>
					</div>
				</DraggableTemplate>
			</div>

			<div className="flex flex-col gap-1 text-[#333333]">
				<label className="text-sm">{__('Grid 4', 'doublescale')}</label>
				<DraggableTemplate
					template={grid4Template}
					id="image-gallery-grid-4"
					templateType="image-gallery"
					disabled={!isProActive}
				>
					<div className="flex gap-1 h-full items-center border rounded-lg p-3">
						<div className="flex flex-col gap-1 w-1/4">
							<div className="text-[#616161] bg-muted w-full py-6 flex items-center justify-center">
								<ImageBlockIcon />
							</div>
							<div className="text-[#616161] bg-muted w-full py-6 flex items-center justify-center">
								<ImageBlockIcon />
							</div>
						</div>
						<div className="flex flex-col gap-1 w-1/4">
							<div className="text-[#616161] bg-muted w-full py-6 flex items-center justify-center">
								<ImageBlockIcon />
							</div>
							<div className="text-[#616161] bg-muted w-full py-6 flex items-center justify-center">
								<ImageBlockIcon />
							</div>
						</div>
						<div className="text-[#616161] bg-muted w-1/2 h-full py-6 flex items-center justify-center">
							<ImageBlockIcon />
						</div>
					</div>
				</DraggableTemplate>
			</div>

			<div className="flex flex-col gap-1 text-[#333333]">
				<label className="text-sm">{__('Grid 5', 'doublescale')}</label>
				<DraggableTemplate
					template={grid5Template}
					id="image-gallery-grid-5"
					templateType="image-gallery"
					disabled={!isProActive}
				>
					<div className="flex gap-1 items-center border rounded-lg p-3">
						<div className="flex flex-col gap-1 w-1/3">
							<div className="text-[#616161] bg-muted w-full py-6 flex items-center justify-center">
								<ImageBlockIcon />
							</div>
							<div className="text-[#616161] bg-muted w-full py-6 flex items-center justify-center">
								<ImageBlockIcon />
							</div>
						</div>
						<div className="flex flex-col gap-1 w-1/3">
							<div className="text-[#616161] bg-muted w-full py-6 flex items-center justify-center">
								<ImageBlockIcon />
							</div>
							<div className="text-[#616161] bg-muted w-full py-6 flex items-center justify-center">
								<ImageBlockIcon />
							</div>
						</div>
						<div className="flex flex-col gap-1 w-1/3">
							<div className="text-[#616161] bg-muted w-full py-6 flex items-center justify-center">
								<ImageBlockIcon />
							</div>
							<div className="text-[#616161] bg-muted w-full py-6 flex items-center justify-center">
								<ImageBlockIcon />
							</div>
						</div>
					</div>
				</DraggableTemplate>
			</div>

			<div className="flex flex-col gap-1 text-[#333333]">
				<label className="text-sm">{__('Grid 6', 'doublescale')}</label>
				<DraggableTemplate
					template={grid6Template}
					id="image-gallery-grid-6"
					templateType="image-gallery"
					disabled={!isProActive}
				>
					<div className="flex gap-1 items-center border rounded-lg p-3">
						<div className="flex flex-col gap-1 w-1/4">
							<div className="text-[#616161] bg-muted w-full py-6 flex items-center justify-center">
								<ImageBlockIcon />
							</div>
							<div className="text-[#616161] bg-muted w-full py-6 flex items-center justify-center">
								<ImageBlockIcon />
							</div>
						</div>
						<div className="flex flex-col gap-1 w-1/4">
							<div className="text-[#616161] bg-muted w-full py-6 flex items-center justify-center">
								<ImageBlockIcon />
							</div>
							<div className="text-[#616161] bg-muted w-full py-6 flex items-center justify-center">
								<ImageBlockIcon />
							</div>
						</div>
						<div className="flex flex-col gap-1 w-1/4">
							<div className="text-[#616161] bg-muted w-full py-6 flex items-center justify-center">
								<ImageBlockIcon />
							</div>
							<div className="text-[#616161] bg-muted w-full py-6 flex items-center justify-center">
								<ImageBlockIcon />
							</div>
						</div>
						<div className="flex flex-col gap-1 w-1/4">
							<div className="text-[#616161] bg-muted w-full py-6 flex items-center justify-center">
								<ImageBlockIcon />
							</div>
							<div className="text-[#616161] bg-muted w-full py-6 flex items-center justify-center">
								<ImageBlockIcon />
							</div>
						</div>
					</div>
				</DraggableTemplate>
			</div>
		</div>
	);
};

export default ImageGalleryLibrary;
