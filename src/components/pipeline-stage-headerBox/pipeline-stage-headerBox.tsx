import React from 'react';

interface PipelineStageBoxProps {
	stage: {
		color: string;
	};
	index: number;
	totalStages: number;
	children?: React.ReactNode;
	triangleWidth?: number;
	triangleHeight?: number;
	boxHeight?: number;
}

export const PipelineStageHeaderBox: React.FC<PipelineStageBoxProps> = ({
	stage,
	index,
	totalStages,
	children,
}) => {
	const backgroundColor = stage.color || '#E4EEFD';
	const isFirst = index === 0;
	const isLast = index === totalStages - 1;

	return (
		<div className="relative m-0 flex flex-col p-0">
			<div
				className="relative flex h-14 items-center justify-center px-4"
				style={{
					background: backgroundColor,
					zIndex: totalStages - index,
					borderStartStartRadius: isFirst ? 8 : undefined,
					borderStartEndRadius: isLast ? 8 : undefined,
				}}
			>
				{children}

				{!isFirst && (
					<div
						className="absolute top-0 h-0 w-0"
						style={{
							insetInlineStart: -3,
							borderTop: '28px solid transparent',
							borderBottom: '28px solid transparent',
							borderInlineStart: '14px solid white',
						}}
					/>
				)}
				{!isLast && (
					<div
						className="absolute top-[1px] z-20 h-0 w-0"
						style={{
							insetInlineEnd: -11,
							borderTop: '28px solid transparent',
							borderBottom: '28px solid transparent',
							borderInlineStart: `14px solid ${backgroundColor}`,
						}}
					/>
				)}
			</div>
		</div>
	);
};
