/**
 * External dependencies
 */
import React, { forwardRef } from 'react';
import { X, CircleX } from 'lucide-react';
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

	return (
		<div
			ref={ref}
			className={`flex justify-between items-start border py-3 px-5 mb-4 rounded-lg ${
				isSuccess
					? 'bg-[#D1E6DD] border-[#C0D7CD]'
					: 'bg-[#FF4D4F1A] border-[#FF4D4F]'
			}`}
		>
			<div className="flex items-center gap-2">
				{isSuccess ? (
					<div className="text-[#0F5032]">
						<CheckCircleIcon />
					</div>
				) : (
					<CircleX className="text-[#FF4D4F] text-[14px]" />
				)}
				<span
					className={`text-base ${isSuccess ? 'text-[#0F5032]' : 'text-[#FF4D4F]'}`}
				>
					{notice.message}
				</span>
			</div>

			<X
				onClick={closeNotice}
				className={`text-[18px] cursor-pointer pt-1 ${
					isSuccess ? 'text-[#0F5032]' : 'text-[#A8071A]'
				}`}
			/>
		</div>
	);
});

NoticeBanner.displayName = 'NoticeBanner';

export default NoticeBanner;
