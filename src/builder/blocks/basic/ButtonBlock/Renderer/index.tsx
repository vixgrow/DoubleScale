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
import { useButtonSettings } from '../../../../hooks/useButtonSettings';

export interface ButtonRendererProps {
	props: ButtonBlockProps;
}

export const ButtonRenderer = ({ props }: ButtonRendererProps) => {
	const { getButtonSettings } = useButtonSettings();

	// Safely access container padding with defaults
	const containerPadding = props.containerPadding || {
		top: 0,
		right: 0,
		bottom: 0,
		left: 0,
	};

	// Convert container padding object to CSS string
	const containerPaddingString = `${containerPadding.top}px ${containerPadding.right}px ${containerPadding.bottom}px ${containerPadding.left}px`;

	// Get global button settings for the current button type
	const buttonSettings = getButtonSettings(props.buttonStyle);

	// Build button style based on button style type and global settings
	const getButtonStyle = () => {
		const baseStyle: React.CSSProperties = {
			display: 'inline-block',
			fontFamily: buttonSettings.font,
			fontSize: `${buttonSettings.size}px`,
			letterSpacing: buttonSettings.letterSpacing,
			borderRadius: `${buttonSettings.borderRadius}px`,
			fontWeight: buttonSettings.bold ? 'bold' : 'normal',
			fontStyle: buttonSettings.italic ? 'italic' : 'normal',
			textDecoration: buttonSettings.underline ? 'underline' : 'none',
			// Text wrapping and overflow handling
			whiteSpace: 'normal',
			wordWrap: 'break-word',
			overflowWrap: 'break-word',
			maxWidth: '100%',
			// No padding on button itself - removed as requested
			// No background color on button itself - removed as requested
		};

		// Add full width when alignment is 'full'
		if (props.align === 'full') {
			baseStyle.width = '100%';
			baseStyle.display = 'block';
		}

		// Add padding from global button settings
		const paddingString = `${buttonSettings.padding.top * 2}px ${buttonSettings.padding.right * 4}px ${buttonSettings.padding.bottom * 2}px ${buttonSettings.padding.left * 4}px`;
		baseStyle.padding = paddingString;

		// Apply global button settings (all button types use the same styling)
		return {
			...baseStyle,
			color: buttonSettings.textColor,
			backgroundColor: buttonSettings.backgroundColor,
			border: `${buttonSettings.borderWidth}px solid ${buttonSettings.borderColor}`,
		};
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
		// Ensure container doesn't overflow
		overflow: 'hidden',
		wordWrap: 'break-word',
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
