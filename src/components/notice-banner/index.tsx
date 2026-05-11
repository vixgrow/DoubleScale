import React, { forwardRef } from 'react';
import { X, CircleX, AlertTriangle } from 'lucide-react';
import { NoticeMessage } from '@doublescale/client';
import { CheckCircleIcon } from '@doublescale/components';

interface NoticeBannerProps {
	notice: NoticeMessage;
	closeNotice: () => void;
}

const NoticeBanner = forwardRef<HTMLDivElement, NoticeBannerProps>(
	({ closeNotice, notice }, ref) => {
		const isSuccess = notice.type === 'success';
		const isWarning = notice.type === 'warning';
		const isError = notice.type === 'error';

		const bgColor = isSuccess
			? 'bg-emerald-50 border-emerald-200'
			: isWarning
				? 'bg-amber-50 border-amber-200'
				: 'bg-red-50 border-red-200';

		const textColor = isSuccess
			? 'text-emerald-700'
			: isWarning
				? 'text-amber-700'
				: 'text-red-600';

		const closeColor = isSuccess
			? 'text-emerald-500 hover:text-emerald-700'
			: isWarning
				? 'text-amber-500 hover:text-amber-700'
				: 'text-red-400 hover:text-red-600';

		return (
			<div
				ref={ref}
				className={`flex justify-between items-start border py-3 px-4 rounded-xl ${bgColor}`}
			>
				<div className="flex items-center gap-2.5">
					{isSuccess ? (
						<div className={textColor}>
							<CheckCircleIcon />
						</div>
					) : isWarning ? (
						<AlertTriangle className={`${textColor} w-5 h-5`} />
					) : (
						<CircleX className={`${textColor} w-5 h-5`} />
					)}
					<span className={`text-sm font-medium ${textColor}`}>
						{notice.message}
					</span>
				</div>

				<button
					onClick={closeNotice}
					className={`p-1 rounded-lg transition-colors ${closeColor} hover:bg-black/5`}
				>
					<X className="w-4 h-4" />
				</button>
			</div>
		);
	}
);

NoticeBanner.displayName = 'NoticeBanner';

export default NoticeBanner;
