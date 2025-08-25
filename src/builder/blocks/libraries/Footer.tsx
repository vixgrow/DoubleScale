/**
 * wordpress dependencies
 */
import { CursorIcon } from '@quillcrm/components';
import { __ } from '@wordpress/i18n';
/**
 * external dependencies
 */

/**
 * internal dependencies
 */

const FooterLibrary = () => {
	return (
		<div className="grid gap-4">
			<div className="flex flex-col gap-1 text-[#333333]">
				<label className="text-sm">
					{__('Centered Footer', 'quillcrm')}
				</label>
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
			</div>

			<div className="flex flex-col gap-1 text-[#333333]">
				<label className="text-sm">
					{__('Centered Footer & Items', 'quillcrm')}
				</label>
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
			</div>

			<div className="flex flex-col gap-1 text-[#333333]">
				<label className="text-sm">
					{__('Basic Footer', 'quillcrm')}
				</label>
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
			</div>
		</div>
	);
};

export default FooterLibrary;
