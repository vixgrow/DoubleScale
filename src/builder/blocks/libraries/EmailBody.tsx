/**
 * wordpress dependencies
 */
import { __ } from '@wordpress/i18n';
/**
 * external dependencies
 */
import { useDraggable } from '@dnd-kit/core';
/**
 * internal dependencies
 */

const EmailBodyLibrary = () => {
	// Title 1 template - creates 2 blocks: heading text and lorem text
	const title1Template = {
		type: 'title-1',
		blocks: [
			{
				type: 'text',
				props: {
					content: '<p>heading 1</p>',
					hyperlink: '',
					fontSize: 14,
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
					headingStyle: 'p',
					padding: {
						top: 0,
						right: 0,
						bottom: 0,
						left: 0,
					},
				},
			},
			{
				type: 'text',
				props: {
					content:
						'<p>Lorem ipsum contains the typefaces more in use, an aspect that allows you to have an overview.</p>',
					hyperlink: '',
					fontSize: 12,
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
				},
			},
		],
	};

	// Title 2 template - creates 2 blocks: lorem text and heading text
	const title2Template = {
		type: 'title-2',
		blocks: [
			{
				type: 'text',
				props: {
					content:
						'<p>Lorem ipsum contains the typefaces more in use,</p>',
					hyperlink: '',
					fontSize: 12,
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
				},
			},
			{
				type: 'text',
				props: {
					content: '<p>title 1</p>',
					hyperlink: '',
					fontSize: 14,
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
					headingStyle: 'p',
					padding: {
						top: 0,
						right: 0,
						bottom: 0,
						left: 0,
					},
				},
			},
		],
	};

	// Title 3 template - creates 1 block: centered heading text
	const title3Template = {
		type: 'title-3',
		blocks: [
			{
				type: 'text',
				props: {
					content: '<p>Title 1</p>',
					hyperlink: '',
					fontSize: 14,
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
					headingStyle: 'p',
					padding: {
						top: 0,
						right: 0,
						bottom: 0,
						left: 0,
					},
				},
			},
		],
	};

	// Title 4 template - creates 2 blocks: centered heading and centered lorem text
	const title4Template = {
		type: 'title-4',
		blocks: [
			{
				type: 'text',
				props: {
					content: '<h2>title 1</h2>',
					hyperlink: '',
					fontSize: 16,
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
						top: 0,
						right: 0,
						bottom: 0,
						left: 0,
					},
				},
			},
			{
				type: 'text',
				props: {
					content:
						'<p>Lorem ipsum contains the typefaces more in use,</p>',
					hyperlink: '',
					fontSize: 12,
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
						top: 0,
						right: 0,
						bottom: 0,
						left: 0,
					},
				},
			},
		],
	};

	// Title & Button 1 template - creates 3 blocks: heading, lorem text, button
	const titleButton1Template = {
		type: 'title-button-1',
		blocks: [
			{
				type: 'text',
				props: {
					content: '<p>heading 1</p>',
					hyperlink: '',
					fontSize: 14,
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
					headingStyle: 'p',
					padding: {
						top: 0,
						right: 0,
						bottom: 0,
						left: 0,
					},
				},
			},
			{
				type: 'text',
				props: {
					content:
						'<p>Lorem ipsum contains the typefaces more in use, an aspect that allows you to have an overview.</p>',
					hyperlink: '',
					fontSize: 12,
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
				},
			},
			{
				type: 'button',
				props: {
					text: 'Click here',
					url: '#',
					backgroundColor: '#1E3A8A',
					padding: {
						top: 8,
						right: 12,
						bottom: 8,
						left: 12,
					},
					align: 'left',
					buttonStyle: 'primary',
				},
			},
		],
	};

	// Title & Button 2 template - creates 3 blocks: lorem text, heading, button
	const titleButton2Template = {
		type: 'title-button-2',
		blocks: [
			{
				type: 'text',
				props: {
					content:
						'<p>Lorem ipsum contains the typefaces more in use.</p>',
					hyperlink: '',
					fontSize: 12,
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
				},
			},
			{
				type: 'text',
				props: {
					content: '<p>title 1</p>',
					hyperlink: '',
					fontSize: 14,
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
					headingStyle: 'p',
					padding: {
						top: 0,
						right: 0,
						bottom: 0,
						left: 0,
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
						top: 8,
						right: 12,
						bottom: 8,
						left: 12,
					},
					align: 'left',
					buttonStyle: 'primary',
				},
			},
		],
	};

	// Title & 2 Buttons template - creates 5 blocks: lorem text, heading, lorem text, primary button, secondary button
	const titleButton5Template = {
		type: 'title-2-buttons',
		blocks: [
			{
				type: 'text',
				props: {
					content: '<p>title 1</p>',
					hyperlink: '',
					fontSize: 12,
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
						top: 0,
						right: 0,
						bottom: 0,
						left: 0,
					},
				},
			},
			{
				type: 'text',
				props: {
					content: '<h2>heading 1</h2>',
					hyperlink: '',
					fontSize: 16,
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
						top: 0,
						right: 0,
						bottom: 0,
						left: 0,
					},
				},
			},
			{
				type: 'text',
				props: {
					content:
						'<p>Lorem ipsum contains the typefaces more in use.</p>',
					hyperlink: '',
					fontSize: 12,
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
						top: 0,
						right: 0,
						bottom: 0,
						left: 0,
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
						top: 8,
						right: 12,
						bottom: 8,
						left: 12,
					},
					align: 'center',
					buttonStyle: 'primary',
				},
			},
			{
				type: 'button',
				props: {
					text: 'Click here',
					url: '#',
					backgroundColor: '#6B7280',
					padding: {
						top: 8,
						right: 12,
						bottom: 8,
						left: 12,
					},
					align: 'center',
					buttonStyle: 'secondary',
				},
			},
		],
	};

	// Title, Paragraph & Button template - creates 4 blocks: lorem text, heading, long lorem text, button
	const titleParagraphButtonTemplate = {
		type: 'title-paragraph-button',
		blocks: [
			{
				type: 'text',
				props: {
					content: '<p>title 1</p>',
					hyperlink: '',
					fontSize: 12,
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
				},
			},
			{
				type: 'text',
				props: {
					content: '<p>heading 1</p>',
					hyperlink: '',
					fontSize: 14,
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
					headingStyle: 'p',
					padding: {
						top: 0,
						right: 0,
						bottom: 0,
						left: 0,
					},
				},
			},
			{
				type: 'text',
				props: {
					content:
						'<p>Lorem ipsum contains the typefaces more in use, an aspect that allows you to have an overview..Lorem ipsum contains the typefaces more in use, an aspect that allows you to have an overview.</p>',
					hyperlink: '',
					fontSize: 12,
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
				},
			},
			{
				type: 'button',
				props: {
					text: 'Click here',
					url: '#',
					backgroundColor: '#1E3A8A',
					padding: {
						top: 8,
						right: 12,
						bottom: 8,
						left: 12,
					},
					align: 'left',
					buttonStyle: 'primary',
				},
			},
		],
	};

	return (
		<div className="grid gap-4">
			<div className="flex flex-col gap-1 text-[#333333]">
				<label className="text-sm">{__('Title 1', 'quillcrm')}</label>
				<DraggableTemplate
					template={title1Template}
					id="email-body-title-1"
				>
					<div className="flex flex-col gap-2 items-start border rounded-lg p-3 text-[10px]">
						<div className="text-[#141B34] text-sm">
							{__('heading 1', 'quillcrm')}
						</div>
						<div className="text-[#9197A4]">
							{__(
								'Lorem ipsum contains the typefaces more in use, an aspect that allows you to have an overview .',
								'quillcrm'
							)}
						</div>
					</div>
				</DraggableTemplate>
			</div>

			<div className="flex flex-col gap-1 text-[#333333]">
				<label className="text-sm">{__('Title 2', 'quillcrm')}</label>
				<DraggableTemplate
					template={title2Template}
					id="email-body-title-2"
				>
					<div className="flex flex-col gap-2 items-start border rounded-lg p-3 text-[10px]">
						<div className="text-[#9197A4]">
							{__(
								'Lorem ipsum contains the typefaces more in use,',
								'quillcrm'
							)}
						</div>
						<div className="text-[#141B34] text-sm font-bold">
							{__('title 1', 'quillcrm')}
						</div>
					</div>
				</DraggableTemplate>
			</div>

			<div className="flex flex-col gap-1 text-[#333333]">
				<label className="text-sm">{__('Title 3', 'quillcrm')}</label>
				<DraggableTemplate
					template={title3Template}
					id="email-body-title-3"
				>
					<div className="flex items-center justify-center border rounded-lg p-2 text-[10px]">
						<div className="text-[#141B34] text-sm font-bold">
							{__('Title 1', 'quillcrm')}
						</div>
					</div>
				</DraggableTemplate>
			</div>

			<div className="flex flex-col gap-1 text-[#333333]">
				<label className="text-sm">{__('Title 4', 'quillcrm')}</label>
				<DraggableTemplate
					template={title4Template}
					id="email-body-title-4"
				>
					<div className="flex flex-col gap-2 items-center justify-center border rounded-lg p-3 text-sm text-[#141B34]">
						<div className="font-bold">
							{__('title 1', 'quillcrm')}
						</div>
						<div className="text-center">
							{__(
								'Lorem ipsum contains the typefaces more in use,',
								'quillcrm'
							)}
						</div>
					</div>
				</DraggableTemplate>
			</div>

			<div className="flex flex-col gap-1 text-[#333333]">
				<label className="text-sm">
					{__('Title & Button 1', 'quillcrm')}
				</label>
				<DraggableTemplate
					template={titleButton1Template}
					id="email-body-title-button-1"
				>
					<div className="flex flex-col gap-2 items-start border rounded-lg p-2 text-[10px]">
						<div className="text-[#141B34] font-bold text-sm">
							{__('heading 1', 'quillcrm')}
						</div>
						<div className="text-[#9197A4]">
							{__(
								'Lorem ipsum contains the typefaces more in use, an aspect that allows you to have an overview.',
								'quillcrm'
							)}
						</div>
						<div className="text-white w-fit bg-primary py-2 px-3 rounded-lg">
							{__('Click here', 'quillcrm')}
						</div>
					</div>
				</DraggableTemplate>
			</div>

			<div className="flex flex-col gap-1 text-[#333333]">
				<label className="text-sm">
					{__('Title & Button 2', 'quillcrm')}
				</label>
				<DraggableTemplate
					template={titleButton2Template}
					id="email-body-title-button-2"
				>
					<div className="flex flex-col gap-2 items-start border rounded-lg p-2 text-[10px]">
						<div className="text-[#9197A4]">
							{__(
								'Lorem ipsum contains the typefaces more in use.',
								'quillcrm'
							)}
						</div>
						<div className="text-[#141B34] font-bold text-sm">
							{__('title 1', 'quillcrm')}
						</div>
						<div className="text-white w-fit bg-primary py-2 px-3 rounded-lg">
							{__('Click here', 'quillcrm')}
						</div>
					</div>
				</DraggableTemplate>
			</div>

			<div className="flex flex-col gap-1 text-[#333333]">
				<label className="text-sm">
					{__('Title & 2 Buttons', 'quillcrm')}
				</label>
				<DraggableTemplate
					template={titleButton5Template}
					id="email-body-title-2-buttons"
				>
					<div className="flex flex-col gap-2 items-center justify-center border rounded-lg p-2 text-[10px]">
						<div className="text-[#9197A4]">
							{__('title 1', 'quillcrm')}
						</div>
						<div className="text-[#141B34] font-bold text-sm">
							{__('heading 1', 'quillcrm')}
						</div>
						<div className="text-[#9197A4]">
							{__(
								'Lorem ipsum contains the typefaces more in use.',
								'quillcrm'
							)}
						</div>
						<div className="text-white w-fit bg-primary py-2 px-8 rounded-lg">
							{__('Click here', 'quillcrm')}
						</div>
						<div className="text-white w-fit bg-secondary py-2 px-8 rounded-lg">
							{__('Click here', 'quillcrm')}
						</div>
					</div>
				</DraggableTemplate>
			</div>

			<div className="flex flex-col gap-1 text-[#333333]">
				<label className="text-sm">
					{__('Title, Paragraph & Button', 'quillcrm')}
				</label>
				<DraggableTemplate
					template={titleParagraphButtonTemplate}
					id="email-body-title-paragraph-button"
				>
					<div className="flex flex-col gap-2 items-start border rounded-lg p-2 text-[10px]">
						<div className="text-[#9197A4]">
							{__('title 1', 'quillcrm')}
						</div>
						<div className="text-[#141B34] font-bold text-sm">
							{__('heading 1', 'quillcrm')}
						</div>
						<div className="text-[#9197A4]">
							{__(
								'Lorem ipsum contains the typefaces more in use, an aspect that allows you to have an overview..Lorem ipsum contains the typefaces more in use, an aspect that allows you to have an overview.',
								'quillcrm'
							)}
						</div>
						<div className="text-white w-fit bg-primary py-2 px-3 rounded-lg">
							{__('Click here', 'quillcrm')}
						</div>
					</div>
				</DraggableTemplate>
			</div>
		</div>
	);
};

// Draggable component using dnd-kit
const DraggableTemplate = ({ template, id, children }) => {
	const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
		id: id,
		data: {
			type: 'email-body-template',
			template: template,
		},
	});

	const style = {
		opacity: isDragging ? 0.5 : 1,
		cursor: 'grab',
	};

	console.log(`DraggableTemplate ${id}:`, { isDragging, template });

	return (
		<div
			ref={setNodeRef}
			style={style}
			{...listeners}
			{...attributes}
			className="hover:border-primary transition-colors"
		>
			{children}
		</div>
	);
};

export default EmailBodyLibrary;
