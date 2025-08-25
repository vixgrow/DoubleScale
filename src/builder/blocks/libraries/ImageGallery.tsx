/**
 * wordpress dependencies
 */
import { ImageBlockIcon } from '@quillcrm/components';
import { __ } from '@wordpress/i18n';
/**
 * external dependencies
 */

/**
 * internal dependencies
 */

const ImageGalleryLibrary = () => {
	return (
		<div className="grid gap-4">
			<div className="flex flex-col gap-1 text-[#333333]">
			<label className='text-sm'>{__('Grid 1', 'quillcrm')}</label>
				<div className="flex gap-1 items-center border rounded-lg p-3">
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
			</div>

			<div className="flex flex-col gap-1 text-[#333333]">
				<label className='text-sm'>{__('Grid 2', 'quillcrm')}</label>
				<div className="flex gap-1 items-center border rounded-lg p-3">
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
			</div>

			<div className="flex flex-col gap-1 text-[#333333]">
				<label className='text-sm'>{__('Grid 3', 'quillcrm')}</label>
				<div className="flex gap-1 items-center border rounded-lg p-3">
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
			</div>

			<div className="flex flex-col gap-1 text-[#333333]">
				<label className='text-sm'>{__('Grid 4', 'quillcrm')}</label>
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
					<div className="text-[#616161] bg-muted w-1/2 h-full py-6 flex items-center justify-center">
						<ImageBlockIcon />
					</div>
				</div>
			</div>

			<div className="flex flex-col gap-1 text-[#333333]">
				<label className='text-sm'>{__('Grid 5', 'quillcrm')}</label>
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
			</div>

			<div className="flex flex-col gap-1 text-[#333333]">
				<label className='text-sm'>{__('Grid 6', 'quillcrm')}</label>
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
			</div>
		</div>
	);
};

export default ImageGalleryLibrary;
