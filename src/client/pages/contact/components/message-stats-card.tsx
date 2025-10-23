/**
 * Reusable Message Statistics Card Component
 *
 * Displays a statistics card with icon, value, and label.
 * Used across email, SMS, and WhatsApp message tabs for consistent UI.
 *
 * @since 1.0.0
 */

import React from 'react';
import { Card } from '@/components/ui/card';

/**
 * Props interface for MessageStatsCard
 */
interface MessageStatsCardProps {
	/** Icon element to display */
	icon: React.ReactNode;
	/** Main value to display (number or string) */
	value: string | number;
	/** Label text below the value */
	label: string;
	/** Optional percentage to display */
	percentage?: number;
	/** Background color class for icon container */
	iconBgClass?: string;
	/** Border color class for left border */
	borderColorClass?: string;
	/** Additional CSS classes for the card */
	className?: string;
}

/**
 * MessageStatsCard Component
 *
 * Renders a styled card displaying message statistics with:
 * - Large value/metric at top
 * - Descriptive label below
 * - Icon in colored background circle
 * - Optional percentage display
 * - Customizable border and icon colors
 *
 * @example
 * ```tsx
 * <MessageStatsCard
 *   icon={<ContactTotalEmailsIcon width={38} height={22} />}
 *   value={totalMessages}
 *   label={__('Total Emails', 'quillcrm')}
 *   iconBgClass="bg-[#E4EEFD]"
 *   borderColorClass="border-l-secondary"
 * />
 * ```
 *
 * @example With percentage
 * ```tsx
 * <MessageStatsCard
 *   icon={<OpenRateIcon />}
 *   value={`${openRate}%`}
 *   label={__('Open Rate', 'quillcrm')}
 *   percentage={75}
 *   iconBgClass="bg-[#D1F6DF]"
 *   borderColorClass="border-l-[#16A34A]"
 * />
 * ```
 */
export const MessageStatsCard: React.FC<MessageStatsCardProps> = ({
	icon,
	value,
	label,
	percentage,
	iconBgClass = 'bg-blue-50',
	borderColorClass = 'border-l-primary',
	className = '',
}) => {
	return (
		<Card
			className={`flex-1 p-3 shadow-none ${borderColorClass} border-l-[3px] border-y-0 border-r-0 ${className}`}
		>
			<div className="flex justify-between items-center">
				<div className="flex flex-col">
					<span className="text-2xl font-semibold">{value}</span>
					<span className="text-lg text-gray-500 font-medium">
						{label}
					</span>
					{percentage !== undefined && (
						<span className="text-xs text-gray-400">
							{percentage}%
						</span>
					)}
				</div>
				<div className={`${iconBgClass} px-2 py-4 rounded-full`}>
					{icon}
				</div>
			</div>
		</Card>
	);
};
