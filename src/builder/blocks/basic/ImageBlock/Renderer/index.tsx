/**
 * wordpress dependencies
 */

/**
 * external dependencies
 */

/**
 * internal dependencies
 */
import { ImageBlockProps } from '..';

export interface ImageBlockRendererProps {
	props: ImageBlockProps;
}

export const ImageBlockRenderer: React.FC<ImageBlockRendererProps> = ({ props }) => {
	const containerStyle: React.CSSProperties = {
		backgroundColor: props.backgroundColor,
		padding: `${props.padding.top}px ${props.padding.right}px ${props.padding.bottom}px ${props.padding.left}px`,
		borderRadius: `${props.borderRadius}px`,
		display: 'block',
		maxWidth: '100%',
	};

	const wrapperStyle: React.CSSProperties = {
		textAlign: props.align as React.CSSProperties['textAlign'],
		width: '100%',
	};

	const imageStyle: React.CSSProperties = {
		width: props.width,
		height: props.height === 'auto' ? 'auto' : props.height,
		maxWidth: '100%',
		borderRadius: `${props.borderRadius}px`,
		display: 'inline-block',
	};

	const imageElement = (
		<img
			src={props.src}
			alt={props.alt}
			style={imageStyle}
		/>
	);

	return (
		<div style={wrapperStyle}>
			<div style={containerStyle}>
				{props.link ? (
					<a href={props.link} target="_blank" rel="noopener noreferrer">
						{imageElement}
					</a>
				) : (
					imageElement
				)}
			</div>
		</div>
	);
};