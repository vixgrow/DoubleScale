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

export const TextRenderer: React.FC<TextRendererProps> = ({ props }) => {
	// Determine the HTML element based on heading style
	const getElementType = () => {
		switch (props.headingStyle) {
			case 'h1':
			case 'h2':
			case 'h3':
				return props.headingStyle;
			case 'small':
				return 'small';
			default:
				return 'p';
		}
	};

	// Get font size based on heading style
	const getFontSize = () => {
		switch (props.headingStyle) {
			case 'h1':
				return Math.max(props.fontSize * 2.5, 24);
			case 'h2':
				return Math.max(props.fontSize * 2, 20);
			case 'h3':
				return Math.max(props.fontSize * 1.5, 18);
			case 'small':
				return Math.max(props.fontSize * 0.8, 12);
			default:
				return props.fontSize;
		}
	};

	const ElementType = getElementType() as keyof JSX.IntrinsicElements;

	// Check if content is HTML
	const isHtmlContent =
		props.content &&
		props.content.includes('<') &&
		props.content.includes('>');

	const content = (
		<>
			<style>{`
				.text-block-renderer ul {
					list-style-type: disc !important;
					padding-left: 20px !important;
					margin: 10px 0 !important;
					font-size: ${getFontSize()}px !important;
					font-family: ${props.fontFamily} !important;
				}
				.text-block-renderer ol {
					list-style-type: decimal !important;
					padding-left: 20px !important;
					margin: 10px 0 !important;
					font-size: ${getFontSize()}px !important;
					font-family: ${props.fontFamily} !important;
				}
				.text-block-renderer li {
					display: list-item !important;
					margin: 5px 0 !important;
					font-size: ${getFontSize()}px !important;
					font-family: ${props.fontFamily} !important;
				}
				.text-block-renderer * {
					font-size: ${getFontSize()}px !important;
					font-family: ${props.fontFamily} !important;
				}
				.text-block-renderer p {
					font-size: ${getFontSize()}px !important;
					font-family: ${props.fontFamily} !important;
					margin: 0 !important;
				}
				.text-block-renderer div {
					font-size: ${getFontSize()}px !important;
					font-family: ${props.fontFamily} !important;
				}
			`}</style>
			<div
				style={
					{
						fontSize: getFontSize(),
						color: props.color,
						textAlign:
							props.textAlign as React.CSSProperties['textAlign'],
						fontFamily: props.fontFamily,
						fontWeight: props.bold ? 'bold' : 'normal',
						fontStyle: props.italic ? 'italic' : 'normal',
						textDecoration: (() => {
							if (props.underline && props['line-through'])
								return 'underline line-through';
							if (props.underline) return 'underline';
							if (props['line-through']) return 'line-through';
							return 'none';
						})(),
						lineHeight: props.lineHeight,
						letterSpacing: props.letterSpacing,
						borderRadius: props.borderRadius,
						borderWidth: props.borderWidth,
						backgroundColor: props.backgroundColor,
						padding: `${(props.padding?.top || 0) * 2}px ${(props.padding?.right || 0) * 4}px ${(props.padding?.bottom || 0) * 2}px ${(props.padding?.left || 0) * 4}px`,
						margin: 0,
						// CSS custom properties for inheritance
						'--text-font-size': `${getFontSize()}px`,
						'--text-font-family': props.fontFamily,
					} as React.CSSProperties
				}
				className="text-block-renderer"
			>
				{isHtmlContent ? (
					<div
						dangerouslySetInnerHTML={{ __html: props.content }}
						style={{
							fontSize: 'inherit',
							fontFamily: 'inherit',
							color: 'inherit',
							lineHeight: 'inherit',
							letterSpacing: 'inherit',
						}}
					/>
				) : (
					<ElementType
						style={{
							margin: 0,
							fontSize: 'inherit',
							fontFamily: 'inherit',
							color: 'inherit',
						}}
					>
						{props.content}
					</ElementType>
				)}
			</div>
		</>
	);

	return content;
};
