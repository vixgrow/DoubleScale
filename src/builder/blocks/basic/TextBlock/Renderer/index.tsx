/**
 * wordpress dependencies
 */

/**
 * external dependencies
 */
import React from 'react';
/**
 * internal dependencies
 */
import { TextBlockProps } from '..';

export interface TextRendererProps {
	props: TextBlockProps;
}

export const TextRenderer: React.FC<TextRendererProps> = ({ props }) => (
	<p
		style={{
			fontSize: props.fontSize,
			color: props.color,
			textAlign: props.align as React.CSSProperties['textAlign'],
			fontFamily: props.fontFamily,
			fontWeight: props.bold ? 'bold' : 'normal',
			fontStyle: props.italic ? 'italic' : 'normal',
			textDecoration: props.underline ? 'underline' : 'none',
			letterSpacing: props.letterSpacing,
			borderRadius: props.borderRadius,
			borderWidth: props.borderWidth,
			borderColor: props.borderColor,
			backgroundColor: props.backgroundColor,
		}}
	>
		{props.content}
	</p>
);
