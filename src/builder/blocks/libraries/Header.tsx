/**
 * wordpress dependencies
 */
import { __ } from '@wordpress/i18n';
/**
 * external dependencies
 */

/**
 * internal dependencies
 */
import { CursorIcon } from '@quillcrm/components';

const HeaderLibrary = () => {
	return (
		<div className="grid gap-4">
			<div className="flex flex-col gap-1 text-[#333333]">
				<div>{__('Logo', 'quillcrm')}</div>
				<div className="flex gap-2 justify-center items-center border rounded-lg py-3 px-4">
					<CursorIcon />
					<div className="text-primary text-sm">
						{__('Company', 'quillcrm')}
					</div>
				</div>
			</div>

			<div className="flex flex-col gap-1 text-[#333333]">
				<div>{__('Navigation', 'quillcrm')}</div>
				<div className="flex gap-2 items-center justify-center border rounded-lg py-3 px-4 text-[10px] text-[#9197A4]">
					<div className="">{__('Item 1', 'quillcrm')}</div>
					<div className="">{__('Item 2', 'quillcrm')}</div>
					<div className="">{__('Item 3', 'quillcrm')}</div>
					<div className="">{__('Item 4', 'quillcrm')}</div>
				</div>
			</div>

			<div className="flex flex-col gap-1 text-[#333333]">
				<div>{__('Logo + Navigation', 'quillcrm')}</div>
				<div className="flex flex-col gap-2 justify-center items-center border rounded-lg py-3 px-4">
					<div className="flex gap-2 justify-center items-center">
						<CursorIcon />
						<div className="text-primary text-sm">
							{__('Company', 'quillcrm')}
						</div>
					</div>
					<div className="flex gap-2 items-center justify-center text-[10px] text-[#9197A4]">
						<div className="">{__('Item 1', 'quillcrm')}</div>
						<div className="">{__('Item 2', 'quillcrm')}</div>
						<div className="">{__('Item 3', 'quillcrm')}</div>
						<div className="">{__('Item 4', 'quillcrm')}</div>
					</div>
				</div>
			</div>

			<div className="flex flex-col gap-1 text-[#333333]">
				<div>{__('Logo + Navigation', 'quillcrm')}</div>
				<div className="flex gap-2 items-center justify-center border rounded-lg py-3 px-4 text-[10px] text-[#9197A4]">
					<div className="">{__('Item 1', 'quillcrm')}</div>
					<div className="flex gap-2 justify-center items-center">
						<CursorIcon />
						<div className="text-primary text-sm">
							{__('Company', 'quillcrm')}
						</div>
					</div>
					<div className="">{__('Item 4', 'quillcrm')}</div>
				</div>
			</div>

			<div className="flex flex-col gap-1 text-[#333333]">
				<div>{__('Logo + Navigation', 'quillcrm')}</div>
				<div className="flex gap-2 items-center justify-between border rounded-lg py-3 px-4">
					<div className="flex gap-2 justify-center items-center">
						<CursorIcon />
						<div className="text-primary text-sm">
							{__('Company', 'quillcrm')}
						</div>
					</div>
					<div className="flex gap-2 items-center text-[10px] text-[#9197A4]">
						<div className="">{__('Item 1', 'quillcrm')}</div>
						<div className="">{__('Item 4', 'quillcrm')}</div>
					</div>
				</div>
			</div>

			<div className="flex flex-col gap-1 text-[#333333]">
				<div>{__('Logo + Button', 'quillcrm')}</div>
				<div className="flex gap-2 items-center justify-between border rounded-lg py-3 px-4">
					<div className="flex gap-2 justify-center items-center">
						<CursorIcon />
						<div className="text-primary text-sm">
							{__('Company', 'quillcrm')}
						</div>
					</div>
					<div className="text-white bg-primary py-1 text-xs px-3 rounded-lg text-[10px]">
						{__('Click here', 'quillcrm')}
					</div>
				</div>
			</div>

			<div className="flex flex-col gap-1 text-[#333333]">
				<div>{__('Logo + Text', 'quillcrm')}</div>
				<div className="flex gap-2 items-center justify-between border rounded-lg py-3 px-4">
					<div className="flex gap-2 justify-center items-center">
						<CursorIcon />
						<div className="text-primary text-sm">
							{__('Company', 'quillcrm')}
						</div>
					</div>
					<div className="text-[10px] text-[#9197A4]">
						{__('Text here', 'quillcrm')}
					</div>
				</div>
			</div>
		</div>
	);
};

export default HeaderLibrary;
