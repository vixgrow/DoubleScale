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
import { CursorIcon } from '@quillcrm/components';
//@ts-ignore
import logo from '../../../../assets/images/header-logo.png';

const FooterLibrary = () => {
	// Centered Footer template
	const centeredFooterTemplate = {
		type: 'centered-footer',
		blocks: [
			{
				type: 'image',
				props: {
					src: logo,
					alt: 'Company Logo',
					width: 'auto',
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
					content:
						'Copyright © [[account.name]]<br/>[[account.address]], [[account.city]], [[account.country]], [[account.zipCode]]<br/>Lorem ipsum dolor sit amet, consectetur elit.<br/>Click here or Click here',
					textAlign: 'center',
					fontSize: '12px',
					fontWeight: 'normal',
					color: '#333333',
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

	// Centered Footer with Items template
	const centeredFooterWithItemsTemplate = {
		type: 'centered-footer-items',
		blocks: [
			{
				type: 'image',
				props: {
					src: logo,
					alt: 'Company Logo',
					width: 'auto',
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
				type: 'menu',
				props: {
					menuItems: [
						{
							id: '1',
							name: 'Item 1',
							link: '#',
							fontSize: 12,
							color: '#333333',
							fontFamily: 'Arial',
							bold: false,
							italic: false,
							underline: false,
							strikethrough: false,
							backgroundColor: 'transparent',
							borderRadius: '0',
							letterSpacing: '0px',
						},
						{
							id: '2',
							name: 'Item 2',
							link: '#',
							fontSize: 12,
							color: '#333333',
							fontFamily: 'Arial',
							bold: false,
							italic: false,
							underline: false,
							strikethrough: false,
							backgroundColor: 'transparent',
							borderRadius: '0',
							letterSpacing: '0px',
						},
						{
							id: '3',
							name: 'Item 3',
							link: '#',
							fontSize: 12,
							color: '#333333',
							fontFamily: 'Arial',
							bold: false,
							italic: false,
							underline: false,
							strikethrough: false,
							backgroundColor: 'transparent',
							borderRadius: '0',
							letterSpacing: '0px',
						},
						{
							id: '4',
							name: 'Item 4',
							link: '#',
							fontSize: 12,
							color: '#333333',
							fontFamily: 'Arial',
							bold: false,
							italic: false,
							underline: false,
							strikethrough: false,
							backgroundColor: 'transparent',
							borderRadius: '0',
							letterSpacing: '0px',
						},
					],
					padding: {
						top: 0,
						right: 0,
						bottom: 0,
						left: 0,
					},
					align: 'center',
				},
			},
			{
				type: 'text',
				props: {
					content:
						'Copyright © [[account.name]]<br/>[[account.address]], [[account.city]], [[account.country]], [[account.zipCode]]<br/>Lorem ipsum dolor sit amet, consectetur elit.<br/>Click here or Click here',
					textAlign: 'center',
					fontSize: '12px',
					fontWeight: 'normal',
					color: '#333333',
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

	// Basic Footer template
	const basicFooterTemplate = {
		type: 'basic-footer',
		blocks: [
			{
				type: 'image',
				props: {
					src: logo,
					alt: 'Company Logo',
					width: 'auto',
					height: 'auto',
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
				},
			},
			{
				type: 'text',
				props: {
					content:
						'Copyright © [[account.name]]<br/>[[account.address]], [[account.city]], [[account.country]], [[account.zipCode]]<br/>Lorem ipsum dolor sit amet, consectetur elit.<br/>Click here or Click here',
					align: 'left',
					fontSize: '12px',
					fontWeight: 'normal',
					color: '#333333',
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

	return (
		<div className="grid gap-4">
			<div className="flex flex-col gap-1 text-[#333333]">
				<label className="text-sm">
					{__('Centered Footer', 'quillcrm')}
				</label>
				<DraggableTemplate
					template={centeredFooterTemplate}
					id="centered-footer"
				>
					<div className="flex flex-col items-center justify-center text-center border rounded-lg p-3 text-[10px] text-[#333333]">
						<div className="flex gap-2 justify-center items-center mb-2">
							<CursorIcon />
							<div className="text-primary text-sm">
								{__('Company', 'quillcrm')}
							</div>
						</div>
						<div className="mb-2 font-medium">
							{__('Copyright © [[account.name]]', 'quillcrm')}
						</div>
						<div className="mb-2 font-medium">
							{__(
								'[[account.address]], [[account.city]], [[account.country]], [[account.zipCode]]',
								'quillcrm'
							)}
						</div>
						<div className="">
							{__(
								'Lorem ipsum dolor sit amet, consectetur elit.',
								'quillcrm'
							)}
						</div>
						<div className="text-secondary flex gap-1">
							{__('Click here', 'quillcrm')}
							<div className="text-[#333333]">
								{__('or', 'quillcrm')}
							</div>
							{__('Click here', 'quillcrm')}
						</div>
					</div>
				</DraggableTemplate>
			</div>

			<div className="flex flex-col gap-1 text-[#333333]">
				<label className="text-sm">
					{__('Centered Footer & Items', 'quillcrm')}
				</label>
				<DraggableTemplate
					template={centeredFooterWithItemsTemplate}
					id="centered-footer-items"
				>
					<div className="flex flex-col items-center justify-center text-center border rounded-lg p-3 text-[10px] text-[#333333]">
						<div className="flex gap-2 justify-center items-center mb-2">
							<CursorIcon />
							<div className="text-primary text-sm">
								{__('Company', 'quillcrm')}
							</div>
						</div>
						<div className="flex gap-4 justify-center items-center mb-2 font-medium">
							<div className="">{__('Item 1', 'quillcrm')}</div>
							<div className="">{__('Item 2', 'quillcrm')}</div>
							<div className="">{__('Item 3', 'quillcrm')}</div>
							<div className="">{__('Item 4', 'quillcrm')}</div>
						</div>
						<div className="mb-2 font-medium">
							{__('Copyright © [[account.name]]', 'quillcrm')}
						</div>

						<div className="mb-2 font-medium">
							{__(
								'[[account.address]], [[account.city]], [[account.country]], [[account.zipCode]]',
								'quillcrm'
							)}
						</div>
						<div className="">
							{__(
								'Lorem ipsum dolor sit amet, consectetur elit.',
								'quillcrm'
							)}
						</div>
						<div className="text-secondary flex gap-1">
							{__('Click here', 'quillcrm')}
							<div className="text-[#333333]">
								{__('or', 'quillcrm')}
							</div>
							{__('Click here', 'quillcrm')}
						</div>
					</div>
				</DraggableTemplate>
			</div>

			<div className="flex flex-col gap-1 text-[#333333]">
				<label className="text-sm">
					{__('Basic Footer', 'quillcrm')}
				</label>
				<DraggableTemplate
					template={basicFooterTemplate}
					id="basic-footer"
				>
					<div className="flex flex-col items-start justify-start border rounded-lg p-3 text-[10px] text-[#333333]">
						<div className="flex gap-2 justify-start items-center mb-2">
							<CursorIcon />
							<div className="text-primary text-sm">
								{__('Company', 'quillcrm')}
							</div>
						</div>
						<div className="mb-2 font-medium">
							{__('Copyright © [[account.name]]', 'quillcrm')}
						</div>
						<div className="mb-2 font-medium">
							{__(
								'[[account.address]], [[account.city]], [[account.country]], [[account.zipCode]]',
								'quillcrm'
							)}
						</div>
						<div className="">
							{__(
								'Lorem ipsum dolor sit amet, consectetur elit.',
								'quillcrm'
							)}
						</div>
						<div className="text-secondary flex gap-1">
							{__('Click here', 'quillcrm')}
							<div className="text-[#333333]">
								{__('or', 'quillcrm')}
							</div>
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
			type: 'footer-template',
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

export default FooterLibrary;
