import { __ } from '@wordpress/i18n';
//@ts-ignore
import device from '@doublescale/assets/images/email-device.png';
import { Star } from 'lucide-react';

const FeedBuilder: React.FC<{
	fromName?: string;
	subject?: string;
	previewText?: string;
}> = ({ fromName, subject, previewText }) => {
	const displayFromName =
		fromName?.trim() || __('From Name', 'doublescale');
	const displaySubject =
		subject?.trim() || __('Message Subject...', 'doublescale');
	const displayPreview =
		previewText?.trim() || __('Your preview text here...', 'doublescale');
	const avatarLetter = displayFromName.charAt(0).toUpperCase();

	return (
		<div className="flex flex-col items-center justify-center border border-border rounded-2xl bg-muted/50 w-full lg:w-1/3 py-8 sm:py-10">
			<div className="relative w-full flex items-center justify-center">
				<img
					src={device}
					alt={__('Mobile preview', 'doublescale')}
					className="w-full max-w-[260px] sm:max-w-[300px] select-none pointer-events-none"
				/>

				<div className="absolute top-[21%] left-1/2 -translate-x-1/2 w-[68%] max-w-[240px] flex gap-2 sm:gap-3 items-start">
					<div className="flex shrink-0 items-center justify-center rounded-full bg-[#2563EB] text-white font-semibold w-8 h-8 sm:w-9 sm:h-9">
						{avatarLetter}
					</div>

					<div className="flex-1 space-y-1">
						<div className="flex flex-col gap-1">
							<div className="flex items-center justify-between gap-2">
								<span className="font-medium text-foreground text-xs sm:text-sm max-w-[75px] truncate">
									{displayFromName}
								</span>
								<span className="text-[9px] sm:text-[10px] text-[#9c9595] shrink-0">
									{__('9:01 AM', 'doublescale')}
								</span>
							</div>
							<span className="text-[10px] sm:text-xs text-foreground max-w-[180px] font-medium truncate">
								{displaySubject}
							</span>
						</div>

						<p className="text-[9px] sm:text-[10px] text-[#9c9595] line-clamp-1 flex items-center justify-between gap-2">
							<span className="truncate max-w-[160px]">{displayPreview}</span>
							<Star className="w-3 h-3 sm:w-4 sm:h-4 shrink-0" />
						</p>
					</div>
				</div>
			</div>
		</div>
	);
};

export default FeedBuilder;
