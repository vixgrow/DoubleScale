/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * External dependencies
 */
import { Crown } from 'lucide-react';

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
	upgradeUrl?: string;
}

/**
 * ProStatCard Component
 * 
 * Displays a blurred stat card with a "Pro Feature" overlay for free plugin users.
 * Shows the actual stat card when Pro plugin is active.
 */
export const ProStatCard: React.FC<ProStatCardProps> = ({
	label,
	value,
	icon,
	iconBgClass,
	borderColorClass,
	iconColor,
	upgradeUrl = 'https://www.quillcrm.com/pro',
}) => {
	return (
		<div className="qcrm-pro-stat-card">
			{/* Blurred background stat card */}
			<div className="qcrm-pro-stat-card__blurred">
				<MessageStatsCard
					label={label}
					value={value}
					icon={icon}
					iconBgClass={iconBgClass}
					borderColorClass={borderColorClass}
					iconColor={iconColor}
				/>
			</div>

			{/* Pro overlay */}
			<div className="qcrm-pro-stat-card__overlay">
				<div className="qcrm-pro-stat-card__content">
					<Crown size={24} className="qcrm-pro-stat-card__icon" />
					<span className="qcrm-pro-stat-card__text">
						{__('Pro Feature', 'quillcrm')}
					</span>
					<a
						href={upgradeUrl}
						className="qcrm-pro-stat-card__link"
						target="_blank"
						rel="noopener noreferrer"
						onClick={(e) => e.stopPropagation()}
					>
						{__('Upgrade', 'quillcrm')}
					</a>
				</div>
			</div>
		</div>
	);
};


