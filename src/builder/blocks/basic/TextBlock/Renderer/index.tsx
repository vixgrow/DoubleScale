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

	// Clean content to remove conflicting font styles
	const getCleanContent = () => {
		if (!isHtmlContent) return props.content;

		// Remove inline font-size and font-family styles that might conflict
		let cleanContent = props.content;
		cleanContent = cleanContent.replace(
			/style\s*=\s*"[^"]*font-size[^"]*"/gi,
			''
		);
		cleanContent = cleanContent.replace(
			/style\s*=\s*"[^"]*font-family[^"]*"/gi,
			''
		);
		cleanContent = cleanContent.replace(
			/style\s*=\s*'[^']*font-size[^']*'/gi,
			''
		);
		cleanContent = cleanContent.replace(
			/style\s*=\s*'[^']*font-family[^']*'/gi,
			''
		);
		// Clean up empty style attributes
		cleanContent = cleanContent.replace(/style\s*=\s*""\s*/gi, '');
		cleanContent = cleanContent.replace(/style\s*=\s*''\s*/gi, '');

		return cleanContent;
	};

	// Generate unique class name for this renderer instance
	const rendererId = `text-block-renderer-${Math.random().toString(36).substr(2, 9)}`;

	const content = (
		<>
			<style>{`
				.${rendererId} {
					font-size: ${getFontSize()}px !important;
					font-family: ${props.fontFamily} !important;
				}
				.${rendererId} * {
					font-size: ${getFontSize()}px !important;
					font-family: ${props.fontFamily} !important;
				}
				.${rendererId} p,
				.${rendererId} div,
				.${rendererId} span,
				.${rendererId} strong,
				.${rendererId} em,
				.${rendererId} u,
				.${rendererId} strike {
					font-size: ${getFontSize()}px !important;
					font-family: ${props.fontFamily} !important;
				}
				.${rendererId} ul {
					list-style-type: disc !important;
					padding-left: 20px !important;
					margin: 10px 0 !important;
					font-size: ${getFontSize()}px !important;
					font-family: ${props.fontFamily} !important;
				}
				.${rendererId} ol {
					list-style-type: decimal !important;
					padding-left: 20px !important;
					margin: 10px 0 !important;
					font-size: ${getFontSize()}px !important;
					font-family: ${props.fontFamily} !important;
				}
				.${rendererId} li {
					display: list-item !important;
					margin: 5px 0 !important;
					font-size: ${getFontSize()}px !important;
					font-family: ${props.fontFamily} !important;
				}
				/* Override any inline styles that might be applied */
				.${rendererId} [style*="font-size"] {
					font-size: ${getFontSize()}px !important;
				}
				.${rendererId} [style*="font-family"] {
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
				className={rendererId}
			>
				{isHtmlContent ? (
					<div
						dangerouslySetInnerHTML={{ __html: getCleanContent() }}
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
						{getCleanContent()}
					</ElementType>
				)}
			</div>
		</>
	);

	return content;
};
