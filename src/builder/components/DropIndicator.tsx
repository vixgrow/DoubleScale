/**
 * Drop Indicator Component
 * Shows where a dragged item will be dropped
 */
import React from 'react';

interface DropIndicatorProps {
	position: 'top' | 'bottom' | 'between';
	isVisible: boolean;
}

export const DropIndicator: React.FC<DropIndicatorProps> = ({
	position,
	isVisible,
}) => {
	if (!isVisible) return null;

	const positionStyles = {
		top: 'top-0 -translate-y-1/2',
		bottom: 'bottom-0 translate-y-1/2',
		between: 'top-1/2 -translate-y-1/2',
	};

	return (
		<div
			className={`absolute left-0 right-0 ${positionStyles[position]} z-50 pointer-events-none`}
		>
			<div className="relative w-full h-1">
				{/* Glowing line */}
				<div className="absolute inset-0 bg-blue-500 rounded-full shadow-lg animate-pulse" />
				<div className="absolute inset-0 bg-blue-400 blur-sm" />
				
				{/* Start indicator dot */}
				<div className="absolute left-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-blue-500 rounded-full shadow-lg" />
				
				{/* End indicator dot */}
				<div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-blue-500 rounded-full shadow-lg" />
			</div>
		</div>
	);
};

export default DropIndicator;

