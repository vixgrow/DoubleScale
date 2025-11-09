/**
 * External dependencies
 */
import { StageTextColor } from '@quillcrm/components/stagebody-color/stagebodyColor';
import React from 'react';

interface StageBadgeProps {
	stage: string;
	stageColor?: string;
}

const StageBadge: React.FC<StageBadgeProps> = ({ stage, stageColor = '#7C3AED' }) => {
	return (
		<div className="relative inline-flex items-center">
			<div
				className="relative flex items-center justify-center h-8 px-3 rounded-l-[4px]"
				style={{
					backgroundColor: stageColor,
					width: 120,
				}}
			>
				{/* Text */}
				<span className="text-base font-Inter text-center px-1 leading-[26px] font-medium whitespace-nowrap relative z-10" style={{color:StageTextColor(stageColor)}}>
					{stage}
				</span>

				{/* Right Arrow  */}
				<span
					className="absolute top-0 right-[-8px] w-0 h-0"
					style={{
						borderTop: '16px solid transparent',
						borderBottom: '16px solid transparent',
						borderLeft: `9px solid ${stageColor}`,
					}}
				/>

				{/* Left Arrow  */}
				<span
					className="absolute top-0 left-0 w-0 h-0"
					style={{
						borderTop: '16px solid transparent',
						borderBottom: '16px solid transparent',
						borderLeft: '8px solid white',
					}}
				/>
			</div>
		</div>
	);
};

export default StageBadge;