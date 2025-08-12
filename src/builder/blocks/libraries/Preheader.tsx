import { __ } from '@wordpress/i18n';

const PreheaderLibrary = () => {
	return (
		<div className="grid gap-4">
			<div className="flex flex-col gap-1 text-[#333333]">
				<div>{__('Text & Link', 'quillcrm')}</div>
				<div className="flex gap-1 items-center border rounded-lg p-3 text-[10px]">
					<div className="text-[#9197A4]">
						{__('If you cannot see images, Please', 'quillcrm')}
					</div>
					<div className="text-secondary underline font-extrabold">
						{__('Click here', 'quillcrm')}
					</div>
				</div>
			</div>

			<div className="flex flex-col gap-1 text-[#333333]">
				<div>{__('Text & Button', 'quillcrm')}</div>
				<div className="flex gap-1 items-center border rounded-lg p-2 text-[10px]">
					<div className="text-[#9197A4]">
						{__('If you cannot see images, Please', 'quillcrm')}
					</div>
					<div className="text-white bg-primary py-2 px-3 rounded-lg">
						{__('Click here', 'quillcrm')}
					</div>
				</div>
			</div>
		</div>
	);
};

export default PreheaderLibrary;
