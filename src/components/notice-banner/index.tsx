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

	const getBannerStyles = () => {
		if (isSuccess) {
			return 'bg-[#D1E6DD] border-[#C0D7CD]';
		}
		if (isWarning) {
			return 'bg-[#FFF7E6] border-[#FFD591]';
		}
		return 'bg-[#FF4D4F1A] border-[#FF4D4F]';
	};

	const getTextColor = () => {
		if (isSuccess) {
			return 'text-[#0F5032]';
		}
		if (isWarning) {
			return 'text-[#D46B08]';
		}
		return 'text-[#FF4D4F]';
	};

	const getCloseIconColor = () => {
		if (isSuccess) {
			return 'text-[#0F5032]';
		}
		if (isWarning) {
			return 'text-[#D46B08]';
		}
		return 'text-[#A8071A]';
	};

	const renderIcon = () => {
		if (isSuccess) {
			return (
				<div className="text-[#0F5032]">
					<CheckCircleIcon />
				</div>
			);
		}
		if (isWarning) {
			return <AlertTriangle className="text-[#D46B08] w-5 h-5" />;
		}
		return <CircleX className="text-[#FF4D4F] text-[14px]" />;
	};

	return (
		<div
			ref={ref}
			className={`flex justify-between items-start border py-3 px-5 mb-4 rounded-lg ${getBannerStyles()}`}
		>
			<div className="flex items-center gap-2">
				{renderIcon()}
				<span className={`text-base ${getTextColor()}`}>
					{notice.message}
				</span>
			</div>

			<X
				onClick={closeNotice}
				className={`text-[18px] cursor-pointer pt-1 ${getCloseIconColor()}`}
			/>
		</div>
	);
});

NoticeBanner.displayName = 'NoticeBanner';

export default NoticeBanner;
