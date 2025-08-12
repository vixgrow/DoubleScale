import { __ } from '@wordpress/i18n';

const EmailBodyLibrary = () => {
	return (
		<div className="grid gap-4">
			<div className="flex flex-col gap-1 text-[#333333]">
				<div>{__('Title 1', 'quillcrm')}</div>
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
			</div>

			<div className="flex flex-col gap-1 text-[#333333]">
				<div>{__('Title 2', 'quillcrm')}</div>
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
			</div>

			<div className="flex flex-col gap-1 text-[#333333]">
				<div>{__('Title 3', 'quillcrm')}</div>
				<div className="flex items-center justify-center border rounded-lg p-2 text-[10px]">
					<div className="text-[#141B34] text-sm font-bold">
						{__('Title 1', 'quillcrm')}
					</div>
				</div>
			</div>

			<div className="flex flex-col gap-1 text-[#333333]">
				<div>{__('Title 4', 'quillcrm')}</div>
				<div className="flex flex-col gap-2 items-center justify-center border rounded-lg p-3 text-sm text-[#141B34]">
					<div className="font-bold">{__('title 1', 'quillcrm')}</div>
					<div className="text-center">
						{__(
							'Lorem ipsum contains the typefaces more in use,',
							'quillcrm'
						)}
					</div>
				</div>
			</div>

			<div className="flex flex-col gap-1 text-[#333333]">
				<div>{__('Title & Button 1', 'quillcrm')}</div>
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
			</div>

			<div className="flex flex-col gap-1 text-[#333333]">
				<div>{__('Title & Button 2', 'quillcrm')}</div>
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
			</div>

			<div className="flex flex-col gap-1 text-[#333333]">
				<div>{__('Title & Button 3', 'quillcrm')}</div>
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
			</div>

			<div className="flex flex-col gap-1 text-[#333333]">
				<div>{__('Title & Button 4', 'quillcrm')}</div>
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
			</div>

			<div className="flex flex-col gap-1 text-[#333333]">
				<div>{__('Title & Button 5', 'quillcrm')}</div>
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
			</div>

			<div className="flex flex-col gap-1 text-[#333333]">
				<div>{__('Title, Paragraph & Button', 'quillcrm')}</div>
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
			</div>
		</div>
	);
};

export default EmailBodyLibrary;
