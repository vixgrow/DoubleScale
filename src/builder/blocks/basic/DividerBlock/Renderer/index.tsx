/**
 * external dependencies
 */
import React from 'react';

/**
 * internal dependencies
 */
import { DividerBlockProps } from '..';
import {
	getAlignmentStyle,
	getBorderStyle,
} from '@/builder/utils/styleHelpers';

export interface DividerRendererProps {
	props: DividerBlockProps;
}

export const DividerRenderer: React.FC<DividerRendererProps> = ({ props }) => {
	const alignmentStyle = getAlignmentStyle(props.align);

	const paddingStyle = {
		paddingTop: `${props.padding?.top || 0}px`,
		paddingRight: `${props.padding?.right || 0}px`,
		paddingBottom: `${props.padding?.bottom || 0}px`,
		paddingLeft: `${props.padding?.left || 0}px`,
	};

	const borderStyle = getBorderStyle(props.height, props.style, props.color);

	return (
		<div
			style={{
				...paddingStyle,
				backgroundColor: props.backgroundColor,
				borderRadius: `${props.borderRadius}px`,
				opacity: props.opacity,
			}}
		>
			<hr
				style={{
					height: '0',
					width: `${props.width}%`,
					backgroundColor: 'transparent',
					border: 'none',
					borderTop: borderStyle,
					borderRadius: `${props.borderRadius}px`,
					opacity: props.opacity,
					...alignmentStyle,
				}}
			/>
		</div>
	);
};
