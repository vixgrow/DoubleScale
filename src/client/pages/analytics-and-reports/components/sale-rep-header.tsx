/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * External dependencies
 */
import React from 'react';

/**
 * Internal dependencies
 */
import { CardHeader } from '../../../../components/ui/card';
import { Button } from '../../../../components/ui/button';
import UserActivityIcon from '@quillcrm/components/icons/user-activity';
import MeetingActivityIcon from '@quillcrm/components/icons/meeting-activity';
import ViewIcon from '@quillcrm/components/icons/view-header';

interface SaleRepHeaderProps {
	name: string;
	lastActivity?: string;
	showViewButton?: boolean;
	onViewClick?: () => void;
	additionalContent?: React.ReactNode;
	className?: string;
}

const SaleRepHeader: React.FC<SaleRepHeaderProps> = ({
	name,
	lastActivity,
	showViewButton = false,
	onViewClick,
	additionalContent,
	className = '',
}) => {
	return (
		<div className={`pb-4  ${className}`}>
			<div className="flex items-start justify-between gap-3">
				<div className="flex items-center gap-2 min-w-0 flex-1">
					{/* Avatar */}
					<div className="w-12 h-12 rounded-full flex items-center justify-center border-2 border-[#DEE1E6] font-semibold flex-shrink-0">
						<UserActivityIcon width={22} height={32} />
					</div>

					{/* Name and Last Activity */}
					<div className="min-w-0 flex-1">
						<h3 className="font-semibold text-[#09090B] text-base leading-[26px] truncate">
							{name}
						</h3>
						
						{lastActivity && (
							<div className="flex gap-1 items-center">
								<MeetingActivityIcon />
								<p className="text-base font-medium text-[#777]">
									{__('Last Activity:', 'quillcrm')}{' '}
									<span className="text-[#660FF1] font-semibold">
										{lastActivity}
									</span>
								</p>
							</div>
						)}
					</div>

					{/* View Button - Optional */}
					{showViewButton && (
						<Button
							variant="ghost"
							onClick={onViewClick}
							className="h-10 flex items-center gap-1 text-base border border-[#458DC7] hover:text-[#458DC7] text-[#458DC7] hover:bg-[#FFF] bg-[#FFF] py-2 px-4 rounded-[8px]"
						>
							<ViewIcon color="#458DC7" width={24} height={24} />
							{__('View', 'quillcrm')}
						</Button>
					)}

					{/* Additional Content - Optional */}
					{additionalContent}
				</div>
			</div>
		</div>
	);
};

export default SaleRepHeader;