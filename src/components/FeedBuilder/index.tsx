import { __ } from '@wordpress/i18n';
//@ts-ignore
import device from '../../../assets/images/email-device.png';
import { Star } from 'lucide-react';

const FeedBuilder: React.FC<{
	fromName?: string;
	subject?: string;
	previewText?: string;
}> = ({ fromName, subject, previewText }) => {
	const displayFromName =
		fromName?.trim() || __('From Name', 'quillcrm');
	const displaySubject =
		subject?.trim() || __('Message Subject...', 'quillcrm');
	const displayPreview =
		previewText?.trim() || __('Your preview text here...', 'quillcrm');
	const avatarLetter = displayFromName.charAt(0).toUpperCase();

	return (
		<div
			className="flex flex-col items-center justify-center border border-gray-200 rounded-2xl bg-[#F8F8F8] w-1/3 py-10"
		>
			<div className="relative">
				<img src={device} alt={__('Mobile preview', 'quillcrm')} className="w-[272px] select-none pointer-events-none" />

				<div className="absolute top-[114px] left-1/2 -translate-x-1/2 w-[218px] bg-transparent flex gap-3 items-start">
					<div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#2563EB] text-white font-semibold">
						{avatarLetter}
					</div>

					<div className="flex-1 space-y-1">
						<div className="flex flex-col">
							<div className="flex items-center justify-between">
								<span className="font-medium text-[#09090B] text-xs w-[65px] truncate">{displayFromName}</span>
								<span className="text-[10px] text-[#9c9595]">{__('9:01 AM', 'quillcrm')}</span>
							</div>
							<span className="text-[10px] w-[170px] text-[#09090B] font-medium truncate">
								{displaySubject}
							</span>
						</div>

						<p className="text-[10px] text-[#9c9595] line-clamp-1 flex items-center justify-between">
							<span className="w-[150px] truncate">{displayPreview}</span>
							<Star className="w-4 h-4" />
						</p>
					</div>
				</div>
			</div>
		</div>
	);
};

export default FeedBuilder;
