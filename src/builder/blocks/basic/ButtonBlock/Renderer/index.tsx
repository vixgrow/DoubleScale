/**
 * wordpress dependencies
 */

/**
 * external dependencies
 */

/**
 * internal dependencies
 */
import { ButtonBlockProps } from '..';

export interface ButtonRendererProps {
	props: ButtonBlockProps;
}

export const ButtonRenderer = ({ props }: ButtonRendererProps) => {
	// Safely access padding properties with defaults
	const buttonPadding = props.padding || { top: 8, right: 12, bottom: 8, left: 12 };
	const containerPadding = props.containerPadding || { top: 0, right: 0, bottom: 0, left: 0 };

	// Convert button padding object to CSS string
	const buttonPaddingString = `${buttonPadding.top}px ${buttonPadding.right}px ${buttonPadding.bottom}px ${buttonPadding.left}px`;

	// Convert container padding object to CSS string
	const containerPaddingString = `${containerPadding.top}px ${containerPadding.right}px ${containerPadding.bottom}px ${containerPadding.left}px`;

	// Build button style based on button style type
	const getButtonStyle = () => {
		const baseStyle: React.CSSProperties = {
			display: 'inline-block',
			padding: buttonPaddingString,
		};

		// Add full width when alignment is 'full'
		if (props.align === 'full') {
			baseStyle.width = '100%';
			baseStyle.display = 'block';
		}

		switch (props.buttonStyle) {
			case 'primary':
				return {
					...baseStyle,
					backgroundColor: props.backgroundColor,
				};
			case 'secondary':
				return {
					...baseStyle,
					backgroundColor: 'transparent',
					color: props.backgroundColor,
					border: `2px solid ${props.backgroundColor}`,
				};
			case 'tertiary':
				return {
					...baseStyle,
					backgroundColor: 'transparent',
				};
			default:
				return baseStyle;
		}
	};

	// Handle alignment
	const getAlignment = () => {
		switch (props.align) {
			case 'left':
				return 'left';
			case 'center':
				return 'center';
			case 'right':
				return 'right';
			case 'full':
				return 'center';
			default:
				return 'center';
		}
	};

	const containerStyle: React.CSSProperties = {
		textAlign: getAlignment() as 'left' | 'center' | 'right',
		width: props.align === 'full' ? '100%' : 'auto',
		padding: containerPaddingString,
		backgroundColor: props.containerBackgroundColor,
	};

	const buttonStyle = getButtonStyle();

	return (
		<div style={containerStyle}>
			<a href={props.url} style={buttonStyle}>
				{props.text}
			</a>
		</div>
	);
};
