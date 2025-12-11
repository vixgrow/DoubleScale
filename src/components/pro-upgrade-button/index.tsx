/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { RocketIcon } from '../icons';
import { useProUpgrade } from '../../hooks/use-pro-upgrade';

interface ProUpgradeButtonProps {
	className?: string;
	variant?: 'link' | 'button';
}

export const ProUpgradeButton: React.FC<ProUpgradeButtonProps> = ({
	className = '',
	variant = 'link',
}) => {
	const { isInstalling, isActivating, handleUpgradeClick, getUpgradeButtonText } = useProUpgrade();

	if (variant === 'link') {
		return (
			<a
				href="#"
				onClick={(e) => {
					e.preventDefault();
					handleUpgradeClick();
				}}
				className={`border border-[#458DC7] text-[#458DC7] text-base px-3 py-2 rounded-lg flex items-center gap-2 mr-3 ${className}`}
			>
				<RocketIcon />
				{getUpgradeButtonText()}
			</a>
		);
	}

	return (
		<button
			onClick={() => handleUpgradeClick()}
			disabled={isInstalling || isActivating}
			className={className}
		>
			<RocketIcon />
			{getUpgradeButtonText()}
		</button>
	);
};

