/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { MessageStatsCard } from '../message-stats-card';
import './style.scss';

interface ProStatCardProps {
	label: string;
	value: string | number;
	icon: React.ReactNode;
	iconBgClass?: string;
	borderColorClass?: string;
	iconColor?: string;
}

/**
 * ProStatCard Component
 *
 * Displays a stat card with blurred value and "Pro Feature" text beside it.
 */
export const ProStatCard: React.FC<ProStatCardProps> = ({
	label,
	value,
	icon,
	iconBgClass,
	borderColorClass,
	iconColor,
}) => {
	return (
		<div className="doublescale-pro-stat-card">
			<MessageStatsCard
				label={label}
				value={value}
				icon={icon}
				iconBgClass={iconBgClass}
				borderColorClass={borderColorClass}
				iconColor={iconColor}
			/>
			<div className="doublescale-pro-stat-card__pro-feature">
				<span className="text-lg text-[#CB5301] font-bold">
					{__('Pro feature', 'doublescale')}
				</span>
			</div>
		</div>
	);
};


