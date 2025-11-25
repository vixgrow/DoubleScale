/**
 * wordpress dependencies
 */
import { __ } from '@wordpress/i18n';
import { applyFilters } from '@wordpress/hooks';
/**
 * internal dependencies
 */
import { ImageBlockIcon } from '@quillcrm/components';
import { DraggableTemplate } from '@/builder/components/shared/DraggableTemplate';

const HeroImageLibrary = () => {
	const isProActive = applyFilters('quillcrm_is_pro_active', false) as boolean;
	// Standard Hero template - creates 4 blocks: image, heading text, lorem text, button
	const standardHeroTemplate = {
		type: 'standard-hero',
		blocks: [
			{
				type: 'image',
				props: {
					src: '',
					alt: 'Hero Image',
					width: '100%',
					height: 'auto',
					align: 'center',
					backgroundColor: 'transparent',
					padding: {
						top: 0,
						right: 0,
						bottom: 0,
						left: 0,
					},
					link: '',
					borderRadius: '0',
					shape: 'rectangle',
				},
			},
			{
				type: 'text',
				props: {
					content: '<h1>Heading 1</h1>',
					hyperlink: '',
					fontSize: 24,
					color: '#141B34',
					align: 'center',
					fontFamily: 'Arial',
					bold: true,
					italic: false,
					underline: false,
					'line-through': false,
					lineHeight: '1.2',
					letterSpacing: '0px',
					borderRadius: '0px',
					borderWidth: '0px',
					linkColor: '#141B34',
					backgroundColor: 'transparent',
					textAlign: 'center',
					listType: 'none',
					headingStyle: 'h1',
					padding: {
						top: 8,
						right: 16,
						bottom: 8,
						left: 16,
					},
				},
			},
			{
				type: 'text',
				props: {
					content:
						'<p>Lorem ipsum contains the typefaces more in use, an aspect that allows you to have an overview of the rendering of the text in terms of font choice and font size.</p>',
					hyperlink: '',
					fontSize: 16,
					color: '#9197A4',
					align: 'center',
					fontFamily: 'Arial',
					bold: false,
					italic: false,
					underline: false,
					'line-through': false,
					lineHeight: '1.5',
					letterSpacing: '0px',
					borderRadius: '0px',
					borderWidth: '0px',
					linkColor: '#9197A4',
					backgroundColor: 'transparent',
					textAlign: 'center',
					listType: 'none',
					headingStyle: 'p',
					padding: {
						top: 8,
						right: 16,
						bottom: 8,
						left: 16,
					},
				},
			},
			{
				type: 'button',
				props: {
					text: 'Click here',
					url: '#',
					backgroundColor: '#1E3A8A',
					padding: {
						top: 12,
						right: 24,
						bottom: 12,
						left: 24,
					},
					align: 'center',
					buttonStyle: 'primary',
				},
			},
		],
	};

	// Extended Hero template - creates 6 blocks: image, heading, lorem, 2 price text blocks in flex, button
	const extendedHeroTemplate = {
		type: 'extended-hero',
		blocks: [
			{
				type: 'image',
				props: {
					src: '',
					alt: 'Hero Image',
					width: '100%',
					height: 'auto',
					align: 'center',
					backgroundColor: 'transparent',
					padding: {
						top: 0,
						right: 0,
						bottom: 0,
						left: 0,
					},
					link: '',
					borderRadius: '0',
					shape: 'rectangle',
				},
			},
			{
				type: 'text',
				props: {
					content: '<h1>Heading 1</h1>',
					hyperlink: '',
					fontSize: 24,
					color: '#141B34',
					align: 'center',
					fontFamily: 'Arial',
					bold: true,
					italic: false,
					underline: false,
					'line-through': false,
					lineHeight: '1.2',
					letterSpacing: '0px',
					borderRadius: '0px',
					borderWidth: '0px',
					linkColor: '#141B34',
					backgroundColor: 'transparent',
					textAlign: 'center',
					listType: 'none',
					headingStyle: 'h1',
					padding: {
						top: 8,
						right: 16,
						bottom: 8,
						left: 16,
					},
				},
			},
			{
				type: 'text',
				props: {
					content:
						'<p>Lorem ipsum contains the typefaces more in use, an aspect that allows you to have an overview.</p>',
					hyperlink: '',
					fontSize: 16,
					color: '#9197A4',
					align: 'center',
					fontFamily: 'Arial',
					bold: false,
					italic: false,
					underline: false,
					'line-through': false,
					lineHeight: '1.5',
					letterSpacing: '0px',
					borderRadius: '0px',
					borderWidth: '0px',
					linkColor: '#9197A4',
					backgroundColor: 'transparent',
					textAlign: 'center',
					listType: 'none',
					headingStyle: 'p',
					padding: {
						top: 8,
						right: 16,
						bottom: 8,
						left: 16,
					},
				},
			},
			{
				type: 'text',
				props: {
					content: '<span>$30</span>',
					hyperlink: '',
					fontSize: 14,
					color: '#007cba',
					align: 'center',
					fontFamily: 'Arial',
					bold: true,
					italic: false,
					underline: false,
					'line-through': false,
					lineHeight: '1.2',
					letterSpacing: '0px',
					borderRadius: '0px',
					borderWidth: '0px',
					linkColor: '#007cba',
					backgroundColor: 'transparent',
					textAlign: 'center',
					listType: 'none',
					headingStyle: 'span',
					padding: {
						top: 8,
						right: 8,
						bottom: 8,
						left: 8,
					},
					inlineLayout: true,
					containerId: 'pricingContainer',
				},
			},
			{
				type: 'text',
				props: {
					content: '<span>$48</span>',
					hyperlink: '',
					fontSize: 14,
					color: '#9197A4',
					align: 'center',
					fontFamily: 'Arial',
					bold: false,
					italic: false,
					underline: false,
					'line-through': false,
					lineHeight: '1.2',
					letterSpacing: '0px',
					borderRadius: '0px',
					borderWidth: '0px',
					linkColor: '#9197A4',
					backgroundColor: 'transparent',
					textAlign: 'center',
					listType: 'none',
					headingStyle: 'span',
					padding: {
						top: 8,
						right: 8,
						bottom: 8,
						left: 8,
					},
					inlineLayout: true,
					containerId: 'pricingContainer',
				},
			},
			{
				type: 'button',
				props: {
					text: 'Click here',
					url: '#',
					backgroundColor: '#1E3A8A',
					padding: {
						top: 12,
						right: 24,
						bottom: 12,
						left: 24,
					},
					align: 'center',
					buttonStyle: 'primary',
				},
			},
		],
		layout: {
			pricingContainer: {
				display: 'flex',
				justifyContent: 'center',
				alignItems: 'center',
				gap: '20px',
				width: '100%',
			},
		},
	};

	// Title + Image template - creates 5 blocks: title text, image, heading text, lorem text, button
	const titleImageTemplate = {
		type: 'title-image',
		blocks: [
			{
				type: 'text',
				props: {
					content: '<h1>Title 1</h1>',
					hyperlink: '',
					fontSize: 28,
					color: '#141B34',
					align: 'center',
					fontFamily: 'Arial',
					bold: true,
					italic: false,
					underline: false,
					'line-through': false,
					lineHeight: '1.2',
					letterSpacing: '0px',
					borderRadius: '0px',
					borderWidth: '0px',
					linkColor: '#141B34',
					backgroundColor: 'transparent',
					textAlign: 'center',
					listType: 'none',
					headingStyle: 'h1',
					padding: {
						top: 8,
						right: 16,
						bottom: 8,
						left: 16,
					},
				},
			},
			{
				type: 'image',
				props: {
					src: '',
					alt: 'Hero Image',
					width: '100%',
					height: 'auto',
					align: 'center',
					backgroundColor: 'transparent',
					padding: {
						top: 0,
						right: 0,
						bottom: 0,
						left: 0,
					},
					link: '',
					borderRadius: '0',
					shape: 'rectangle',
				},
			},
			{
				type: 'text',
				props: {
					content: '<h2>Heading 1</h2>',
					hyperlink: '',
					fontSize: 20,
					color: '#141B34',
					align: 'center',
					fontFamily: 'Arial',
					bold: true,
					italic: false,
					underline: false,
					'line-through': false,
					lineHeight: '1.2',
					letterSpacing: '0px',
					borderRadius: '0px',
					borderWidth: '0px',
					linkColor: '#141B34',
					backgroundColor: 'transparent',
					textAlign: 'center',
					listType: 'none',
					headingStyle: 'h2',
					padding: {
						top: 8,
						right: 16,
						bottom: 8,
						left: 16,
					},
				},
			},
			{
				type: 'text',
				props: {
					content:
						'<p>Lorem ipsum contains the typefaces more in use, an aspect that allows you to have an overview of the rendering of the text in terms of font choice and font size.</p>',
					hyperlink: '',
					fontSize: 16,
					color: '#9197A4',
					align: 'center',
					fontFamily: 'Arial',
					bold: false,
					italic: false,
					underline: false,
					'line-through': false,
					lineHeight: '1.5',
					letterSpacing: '0px',
					borderRadius: '0px',
					borderWidth: '0px',
					linkColor: '#9197A4',
					backgroundColor: 'transparent',
					textAlign: 'center',
					listType: 'none',
					headingStyle: 'p',
					padding: {
						top: 8,
						right: 16,
						bottom: 8,
						left: 16,
					},
				},
			},
			{
				type: 'button',
				props: {
					text: 'Click here',
					url: '#',
					backgroundColor: '#1E3A8A',
					padding: {
						top: 12,
						right: 24,
						bottom: 12,
						left: 24,
					},
					align: 'center',
					buttonStyle: 'primary',
				},
			},
		],
	};

	// Side by Side template - creates 5 separate individual blocks: image, title, heading, lorem text, button
	const sideBySideTemplate = {
		type: 'side-by-side',
		blocks: [
			{
				type: 'image',
				props: {
					src: '',
					alt: 'Hero Image',
					width: '100%',
					height: '300px',
					align: 'left',
					backgroundColor: 'transparent',
					padding: {
						top: 0,
						right: 0,
						bottom: 0,
						left: 0,
					},
					link: '',
					borderRadius: '0',
					shape: 'rectangle',
					sideBySideLayout: true,
					sideBySidePosition: 'left',
				},
			},
			{
				type: 'text',
				props: {
					content: '<h1>Title 1</h1>',
					hyperlink: '',
					fontSize: 24,
					color: '#141B34',
					align: 'left',
					fontFamily: 'Arial',
					bold: true,
					italic: false,
					underline: false,
					'line-through': false,
					lineHeight: '1.2',
					letterSpacing: '0px',
					borderRadius: '0px',
					borderWidth: '0px',
					linkColor: '#141B34',
					backgroundColor: 'transparent',
					textAlign: 'left',
					listType: 'none',
					headingStyle: 'h1',
					padding: {
						top: 0,
						right: 0,
						bottom: 0,
						left: 0,
					},
					sideBySideLayout: true,
					sideBySidePosition: 'right',
				},
			},
			{
				type: 'text',
				props: {
					content: '<h2>Heading 1</h2>',
					hyperlink: '',
					fontSize: 18,
					color: '#141B34',
					align: 'left',
					fontFamily: 'Arial',
					bold: true,
					italic: false,
					underline: false,
					'line-through': false,
					lineHeight: '1.2',
					letterSpacing: '0px',
					borderRadius: '0px',
					borderWidth: '0px',
					linkColor: '#141B34',
					backgroundColor: 'transparent',
					textAlign: 'left',
					listType: 'none',
					headingStyle: 'h2',
					padding: {
						top: 0,
						right: 0,
						bottom: 0,
						left: 0,
					},
					sideBySideLayout: true,
					sideBySidePosition: 'right',
				},
			},
			{
				type: 'text',
				props: {
					content:
						'<p>Lorem ipsum contains the typefaces more in use, an aspect that allows you to have an overview of the rendering of the text in terms of font choice and font size.</p>',
					hyperlink: '',
					fontSize: 16,
					color: '#9197A4',
					align: 'left',
					fontFamily: 'Arial',
					bold: false,
					italic: false,
					underline: false,
					'line-through': false,
					lineHeight: '1.5',
					letterSpacing: '0px',
					borderRadius: '0px',
					borderWidth: '0px',
					linkColor: '#9197A4',
					backgroundColor: 'transparent',
					textAlign: 'left',
					listType: 'none',
					headingStyle: 'p',
					padding: {
						top: 0,
						right: 0,
						bottom: 0,
						left: 0,
					},
					sideBySideLayout: true,
					sideBySidePosition: 'right',
				},
			},
			{
				type: 'button',
				props: {
					text: 'Click here',
					url: '#',
					backgroundColor: '#1E3A8A',
					padding: {
						top: 12,
						right: 24,
						bottom: 12,
						left: 24,
					},
					align: 'left',
					buttonStyle: 'primary',
					sideBySideLayout: true,
					sideBySidePosition: 'right',
				},
			},
		],
	};

	return (
		<div className="grid gap-4">
			<div className="flex flex-col gap-1 text-[#333333]">
				<label className="text-sm">
					{__('Standard Hero', 'quillcrm')}
				</label>
				<DraggableTemplate
					template={standardHeroTemplate}
					id="hero-standard"
					templateType="hero-image"
					disabled={!isProActive}
				>
					<div className="flex flex-col gap-2 justify-center items-center border rounded-lg p-2">
						<div className="text-[#616161] bg-muted w-full py-6 flex items-center justify-center">
							<ImageBlockIcon />
						</div>
						<div className="text-[#141B34] text-sm">
							{__('heading 1', 'quillcrm')}
						</div>
						<div className="text-[#9197A4] text-center">
							{__(
								'Lorem ipsum contains the typefaces more in use, an aspect that allows you to have an overview of the rendering of the text in terms of font choice and font size.',
								'quillcrm'
							)}
						</div>
						<div className="text-white bg-primary py-2 px-3 rounded-lg text-[10px]">
							{__('Click here', 'quillcrm')}
						</div>
					</div>
				</DraggableTemplate>
			</div>

			<div className="flex flex-col gap-1 text-[#333333]">
				<label className="text-sm">
					{__('Extended Hero', 'quillcrm')}
				</label>
				<DraggableTemplate
					template={extendedHeroTemplate}
					id="hero-extended"
					templateType="hero-image"
					disabled={!isProActive}
				>
					<div className="flex flex-col gap-2 justify-center items-center border rounded-lg p-2">
						<div className="text-[#616161] bg-muted w-full py-6 flex items-center justify-center">
							<ImageBlockIcon />
						</div>
						<div className="text-[#141B34] text-sm">
							{__('heading 1', 'quillcrm')}
						</div>
						<div className="text-[#9197A4] text-center">
							{__(
								'Lorem ipsum contains the typefaces more in use, an aspect that allows you to have an overview.',
								'quillcrm'
							)}
						</div>
						<div className="flex gap-3 items-center justify-center text-[10px]">
							<div className="font-bold text-primary">
								{__('$30', 'quillcrm')}
							</div>
							<div className="text-[#9197A4]">
								{__('$48', 'quillcrm')}
							</div>
						</div>
						<div className="text-white bg-primary py-2 px-3 rounded-lg text-[10px]">
							{__('Click here', 'quillcrm')}
						</div>
					</div>
				</DraggableTemplate>
			</div>

			<div className="flex flex-col gap-1 text-[#333333]">
				<label className="text-sm">
					{__('Title + Image', 'quillcrm')}
				</label>
				<DraggableTemplate
					template={titleImageTemplate}
					id="hero-title-image"
					templateType="hero-image"
					disabled={!isProActive}
				>
					<div className="flex flex-col gap-2 justify-center items-center border rounded-lg p-2">
						<div className="text-[#141B34] text-sm font-bold">
							{__('Title 1', 'quillcrm')}
						</div>
						<div className="text-[#616161] bg-muted w-full py-6 flex items-center justify-center">
							<ImageBlockIcon />
						</div>
						<div className="text-[#141B34] text-sm">
							{__('heading 1', 'quillcrm')}
						</div>
						<div className="text-[#9197A4] text-center">
							{__(
								'Lorem ipsum contains the typefaces more in use, an aspect that allows you to have an overview of the rendering of the text in terms of font choice and font size.',
								'quillcrm'
							)}
						</div>
						<div className="text-white bg-primary py-2 px-3 rounded-lg text-[10px]">
							{__('Click here', 'quillcrm')}
						</div>
					</div>
				</DraggableTemplate>
			</div>

			<div className="flex flex-col gap-1 text-[#333333]">
				<label className="text-sm">
					{__('Side by Side Image + Text', 'quillcrm')}
				</label>
				<DraggableTemplate
					template={sideBySideTemplate}
					id="hero-side-by-side"
					templateType="hero-image"
					disabled={!isProActive}
				>
					<div className="flex gap-5 items-center border rounded-lg p-2 w-full">
						<div className="text-[#616161] bg-muted w-1/2 h-full py-20 flex items-center justify-center">
							<ImageBlockIcon />
						</div>
						<div className="grid gap-2 w-1/2">
							<div className="text-[#141B34] text-sm font-bold">
								{__('Title 1', 'quillcrm')}
							</div>
							<div className="text-[#141B34] text-sm">
								{__('heading 1', 'quillcrm')}
							</div>
							<div className="text-[#9197A4]">
								{__(
									'Lorem ipsum contains the typefaces more in use, an aspect that.',
									'quillcrm'
								)}
							</div>
							<div className="text-white w-fit bg-primary py-2 px-3 rounded-lg text-[10px]">
								{__('Click here', 'quillcrm')}
							</div>
						</div>
					</div>
				</DraggableTemplate>
			</div>
		</div>
	);
};

export default HeroImageLibrary;
