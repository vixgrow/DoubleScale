/**
 * External dependencies
 */
import React, { forwardRef } from 'react';
import { X, CircleX, AlertTriangle } from 'lucide-react';
/**
 * Internal dependencies
 */
import { NoticeMessage } from '@quillcrm/client';
import { CheckCircleIcon } from '@quillcrm/components';

interface NoticeBannerProps {
	notice: NoticeMessage;
	closeNotice: () => void;
}

const NoticeBanner = forwardRef<HTMLDivElement, NoticeBannerProps>(({ closeNotice, notice }, ref) => {
	const isSuccess = notice.type === 'success';
	const isWarning = notice.type === 'warning';
	const isError = notice.type === 'error';

	// Determine colors and styles based on notice type
	const bgColor = isSuccess
		? 'bg-[#D1E6DD] border-[#C0D7CD]'
		: isWarning
		? 'bg-[#FFF7E6] border-[#FFD591]'
		: 'bg-[#FF4D4F1A] border-[#FF4D4F]';

	const textColor = isSuccess
		? 'text-[#0F5032]'
		: isWarning
		? 'text-[#AD6800]'
		: 'text-[#FF4D4F]';

	const closeColor = isSuccess
		? 'text-[#0F5032]'
		: isWarning
		? 'text-[#AD6800]'
		: 'text-[#A8071A]';

	return (
		<div
			ref={ref}
			className={`flex justify-between items-start border py-3 px-5 mb-4 rounded-lg ${bgColor}`}
		>
			<div className="flex items-center gap-2">
				{isSuccess ? (
					<div className={textColor}>
						<CheckCircleIcon />
					</div>
				) : isWarning ? (
					<AlertTriangle className={`${textColor} text-[20px]`} />
				) : (
					<CircleX className={`${textColor} text-[14px]`} />
				)}
				<span className={`text-base ${textColor}`}>
					{notice.message}
				</span>
			</div>

			<X
				onClick={closeNotice}
				className={`text-[18px] cursor-pointer pt-1 ${closeColor}`}
			/>
		</div>
	);
});

NoticeBanner.displayName = 'NoticeBanner';

export default NoticeBanner;
