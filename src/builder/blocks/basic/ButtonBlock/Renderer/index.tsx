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
	// Convert button padding object to CSS string
	const buttonPaddingString = `${props.padding.top}px ${props.padding.right}px ${props.padding.bottom}px ${props.padding.left}px`;

	// Convert container padding object to CSS string
	const containerPaddingString = `${props.containerPadding.top}px ${props.containerPadding.right}px ${props.containerPadding.bottom}px ${props.containerPadding.left}px`;

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
