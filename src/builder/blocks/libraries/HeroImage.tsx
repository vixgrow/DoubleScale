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
import { ImageBlockIcon } from '@quillcrm/components';

const HeroImageLibrary = () => {
	return (
		<div className="grid gap-4">
			<div className="flex flex-col gap-1 text-[#333333]">
				<label className="text-sm">
					{__('Standard Hero', 'quillcrm')}
				</label>
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
			</div>

			<div className="flex flex-col gap-1 text-[#333333]">
				<label className="text-sm">
					{__('Extended Hero', 'quillcrm')}
				</label>
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
			</div>

			<div className="flex flex-col gap-1 text-[#333333]">
				<label className="text-sm">
					{__('Title + Image', 'quillcrm')}
				</label>
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
			</div>

			<div className="flex flex-col gap-1 text-[#333333]">
				<label className="text-sm">
					{__('Side by Side Image + Text', 'quillcrm')}
				</label>
				<div className="flex gap-2 justify-center items-center border rounded-lg p-2 w-full">
					<div className="text-[#616161] bg-muted w-1/2 h-full flex items-center justify-center">
						<ImageBlockIcon />
					</div>
					<div className="flex flex-col w-1/2">
						<div className="text-[#141B34] text-sm font-bold">
							{__('Title 1', 'quillcrm')}
						</div>
						<div className="text-[#141B34] text-sm mb-2">
							{__('heading 1', 'quillcrm')}
						</div>
						<div className="text-[#9197A4] mb-2">
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
			</div>
		</div>
	);
};

export default HeroImageLibrary;
