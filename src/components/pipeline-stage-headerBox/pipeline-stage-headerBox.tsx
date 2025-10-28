import React from 'react';
import { StageColorBody } from '@quillcrm/components/stagebody-color/stagebodyColor';

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
	const { backgroundColor } = StageColorBody(stage.color, index, totalStages);
	const isFirst = index === 0;
	const isLast = index === totalStages - 1;

	return (
		<div className="flex flex-col p-0 m-0 relative">
			{/*upp */}
			<div
				className="h-14 flex items-center justify-center relative rounded-t-[8px] px-4"
				style={{ background: backgroundColor }}
			>
				
				{children}

				{/* Triangles */}
				{isFirst && (
					<div
						className="absolute top-[1px] right-[-11px] w-0 h-0"
						style={{
							borderTop: '28px solid transparent',
							borderBottom: '28px solid transparent',
							borderLeft: `14px solid ${backgroundColor}`,
						}}
					/>
				)}
				{isLast && (
					<div
						className="absolute top-0 left-[-3px] w-0 h-0"
						style={{
							borderTop: '28px solid transparent',
							borderBottom: '28px solid transparent',
							borderLeft: `14px solid white`,
						}}
					/>
				)}
				{!isFirst && !isLast && (
					<>
						<div
							className="absolute top-0 left-[-3px] w-0 h-0"
							style={{
								borderTop: '28px solid transparent',
								borderBottom: '28px solid transparent',
								borderLeft: `14px solid white`,
							}}
						/>
						<div
							className="absolute top-[1px] right-[-11px] w-0 h-0"
							style={{
								borderTop: '28px solid transparent',
								borderBottom: '28px solid transparent',
								borderLeft: `14px solid ${backgroundColor}`,
							}}
						/>
					</>
				)}
			</div>
		</div>
	);
};
