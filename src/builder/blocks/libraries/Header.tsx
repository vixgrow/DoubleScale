/**
 * wordpress dependencies
 */
import { __ } from '@wordpress/i18n';
import { applyFilters } from '@wordpress/hooks';
/**
 * internal dependencies
 */
import { CursorIcon } from '@doublescale/components';
import { DraggableTemplate } from '@/builder/components/shared/DraggableTemplate';
//@ts-ignore
import logo from '../../../../assets/images/header-logo.png';

const HeaderLibrary = () => {
	const isProActive = applyFilters('doublescale_is_pro_active', false) as boolean;

	// Logo template - single image block with centered logo
	const logoTemplate = {
		type: 'single-logo',
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
					templateLayout: {
						justifyContent: 'center',
						alignItems: 'center',
						width: '100%',
					},
				},
			},
		],
	};

	// Logo + Navigation template - creates 2 blocks: centered logo and menu
	const logoNavigationTemplate = {
		type: 'logo-navigation',
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
					templateLayout: {
						justifyContent: 'flex-start',
						alignItems: 'center',
						width: '50%',
					},
				},
			},
			{
				type: 'menu',
				props: {
					menuItems: [
						{
							id: '1',
							name: 'Home',
							link: '#',
							fontSize: 16,
							color: '#333',
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
							name: 'About',
							link: '#',
							fontSize: 16,
							color: '#333',
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
							name: 'Contact',
							link: '#',
							fontSize: 16,
							color: '#333',
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
						top: 4,
						right: 8,
						bottom: 4,
						left: 8,
					},
					align: 'center',
					templateLayout: {
						justifyContent: 'flex-end',
						alignItems: 'center',
						width: '50%',
					},
				},
			},
		],
	};

	// Logo + Button template - creates 2 blocks: logo and button with flex justify-between and w-1/2 each
	const logoButtonTemplate = {
		type: 'logo-button',
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
				type: 'button',
				props: {
					text: 'Click Here',
					url: '#',
					backgroundColor: '#1E3A8A',
					padding: {
						top: 12,
						right: 24,
						bottom: 12,
						left: 24,
					},
					align: 'right',
					buttonStyle: 'primary',
					width: '50%',
				},
			},
		],
		layout: {
			display: 'flex',
			justifyContent: 'space-between',
			alignItems: 'center',
			width: '100%',
			logoWidth: 'auto',
			buttonWidth: '50%',
		},
	};

	return (
		<div className="grid gap-4">
			<div className="flex flex-col gap-1 text-[#333333]">
				<label className="text-sm">{__('Logo', 'doublescale')}</label>
				<DraggableTemplate
					template={logoTemplate}
					id="header-logo"
					templateType="header"
					disabled={!isProActive}
				>
					<div className="flex gap-2 justify-center items-center border rounded-lg py-3 px-4">
						<CursorIcon />
						<div className="text-primary text-sm text-center">
							{__('Company', 'doublescale')}
						</div>
					</div>
				</DraggableTemplate>
			</div>

			<div className="flex flex-col gap-1 text-[#333333]">
				<label className="text-sm">
					{__('Logo + Navigation', 'doublescale')}
				</label>
				<DraggableTemplate
					template={logoNavigationTemplate}
					id="header-navigation"
					templateType="header"
					disabled={!isProActive}
				>
					<div className="flex flex-col gap-2 justify-center items-center border rounded-lg py-3 px-4">
						<div className="flex gap-2 justify-center items-center">
							<CursorIcon />
							<div className="text-primary text-sm text-center">
								{__('Company', 'doublescale')}
							</div>
						</div>
						<div className="flex gap-2 items-center justify-center text-[10px] text-[#9197A4]">
							<div className="">{__('Item 1', 'doublescale')}</div>
							<div className="">{__('Item 2', 'doublescale')}</div>
							<div className="">{__('Item 3', 'doublescale')}</div>
							<div className="">{__('Item 4', 'doublescale')}</div>
						</div>
					</div>
				</DraggableTemplate>
			</div>

			<div className="flex flex-col gap-1 text-[#333333]">
				<label className="text-sm">
					{__('Logo + Button', 'doublescale')}
				</label>
				<DraggableTemplate
					template={logoButtonTemplate}
					id="header-button"
					templateType="header"
					disabled={!isProActive}
				>
					<div className="flex gap-2 items-center justify-between border rounded-lg py-3 px-4 w-full">
						<div className="flex gap-2 justify-center items-center w-1/2">
							<CursorIcon />
							<div className="text-primary text-sm">
								{__('Company', 'doublescale')}
							</div>
						</div>
						<div className="flex gap-2 justify-center items-center w-1/2">
							<div className="text-white bg-primary py-1 text-xs px-3 rounded-lg text-[10px]">
								{__('Click here', 'doublescale')}
							</div>
						</div>
					</div>
				</DraggableTemplate>
			</div>
		</div>
	);
};

export default HeaderLibrary;
