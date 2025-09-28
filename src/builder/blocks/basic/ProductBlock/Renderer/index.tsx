/**
 * wordpress dependencies
 */

/**
 * external dependencies
 */

/**
 * internal dependencies
 */
import { ProductBlockProps } from '..';
import { useButtonSettings } from '../../../../context/ButtonSettingsContext';
import { ImageBlockIcon } from '@quillcrm/components';

export interface ProductBlockRendererProps {
	props: ProductBlockProps;
}

export const ProductBlockRenderer: React.FC<ProductBlockRendererProps> = ({
	props,
}) => {
	const { getButtonSettings } = useButtonSettings();

	// Safely access padding with defaults
	const padding = props.padding || {
		top: 16,
		right: 16,
		bottom: 16,
		left: 16,
	};

	// Convert padding object to CSS string
	const paddingString = `${padding.top}px ${padding.right}px ${padding.bottom}px ${padding.left}px`;

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
			textDecoration: 'none',
			// Text truncation
			whiteSpace: 'nowrap',
			overflow: 'hidden',
			textOverflow: 'ellipsis',
			maxWidth: '100%',
		};

		// Add padding from global button settings
		const buttonPaddingString = `${buttonSettings.padding.top * 2}px ${buttonSettings.padding.right * 4}px ${buttonSettings.padding.bottom * 2}px ${buttonSettings.padding.left * 4}px`;
		baseStyle.padding = buttonPaddingString;

		// Apply button type specific styling based on global settings
		switch (props.buttonStyle) {
			case 'primary':
				return {
					...baseStyle,
					color: buttonSettings.textColor,
					backgroundColor: buttonSettings.backgroundColor,
					border: `${buttonSettings.borderWidth}px solid ${buttonSettings.borderColor}`,
				};
			case 'secondary':
				return {
					...baseStyle,
					color: buttonSettings.backgroundColor,
					backgroundColor: 'transparent',
					border: `${buttonSettings.borderWidth}px solid ${buttonSettings.backgroundColor}`,
				};
			case 'tertiary':
				return {
					...baseStyle,
					color: buttonSettings.backgroundColor,
					backgroundColor: 'transparent',
					border: 'none',
				};
			default:
				return baseStyle;
		}
	};

	// Container with padding and styling - single container like other blocks
	const containerStyle: React.CSSProperties = {
		width: props.width,
		maxWidth: '100%', // Ensure container doesn't exceed canvas width
		padding: paddingString,
		border: `1px solid ${props.borderColor}`,
		borderRadius: '8px',
		display: 'grid',
		gap: '16px', // gap-4 equivalent
		gridTemplateColumns: '1fr',
		margin: '0 auto', // Center the card
		textAlign: 'center', // Center content
		// Text wrapping for overflow - same as PreheaderBlock
		wordWrap: 'break-word',
		overflowWrap: 'break-word',
		whiteSpace: 'normal',
		boxSizing: 'border-box',
	};

	// Safely access image padding with defaults
	const imagePadding = props.imagePadding || {
		top: 8,
		right: 8,
		bottom: 8,
		left: 8,
	};
	const imagePaddingString = `${imagePadding.top}px ${imagePadding.right}px ${imagePadding.bottom}px ${imagePadding.left}px`;

	const imageStyle: React.CSSProperties = {
		width: '100%',
		height: '200px',
		objectFit: 'cover',
		borderRadius: '4px',
		backgroundColor: props.imageBackgroundColor,
		padding: imagePaddingString,
	};

	const imagePlaceholderStyle: React.CSSProperties = {
		width: '100%',
		height: '200px',
		backgroundColor: '#F5F5F580',
		borderRadius: '4px',
		padding: imagePaddingString,
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		color: '#6B7280',
		fontSize: '14px',
		fontWeight: '500',
	};

	const titleStyle: React.CSSProperties = {
		fontWeight: 'bold',
		color: props.titleColor,
		margin: 0,
		fontSize: '18px',
		lineHeight: '1.4',
		// Text truncation
		whiteSpace: 'nowrap',
		overflow: 'hidden',
		textOverflow: 'ellipsis',
		maxWidth: '100%',
	};

	const descriptionStyle: React.CSSProperties = {
		color: props.descriptionColor,
		fontWeight: 'normal',
		margin: 0,
		fontSize: '14px',
		lineHeight: '1.5',
		// Text wrapping with 2-line truncation
		display: '-webkit-box',
		WebkitLineClamp: 2,
		WebkitBoxOrient: 'vertical',
		overflow: 'hidden',
		textOverflow: 'ellipsis',
		maxWidth: '100%',
	};

	const priceStyle: React.CSSProperties = {
		color: props.priceColor,
		fontWeight: 'bold',
		margin: 0,
		fontSize: '18px',
		lineHeight: '1.4',
		// Text truncation
		whiteSpace: 'nowrap',
		overflow: 'hidden',
		textOverflow: 'ellipsis',
		maxWidth: '100%',
	};

	const buttonStyle = getButtonStyle();

	return (
		<div style={containerStyle}>
			{props.imageSrc ? (
				<img
					src={props.imageSrc}
					alt={props.imageAlt}
					style={imageStyle}
				/>
			) : (
				<div style={imagePlaceholderStyle}>
					<ImageBlockIcon width={57} height={57} />
				</div>
			)}
			<h3 style={titleStyle}>{props.title}</h3>
			<p style={descriptionStyle}>{props.description}</p>
			<div style={priceStyle}>{props.price || '0.00 EGP'}</div>
			<a href={props.buttonLink} style={buttonStyle}>
				{props.buttonText}
			</a>
		</div>
	);
};
