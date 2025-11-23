/**
 * wordpress dependencies
 */

/**
 * external dependencies
 */
import React, { useState } from 'react';

/**
 * internal dependencies
 */
import { ImageBlockProps } from '..';
import { ImageBlockIcon } from '@quillcrm/components';

export interface ImageBlockRendererProps {
	props: ImageBlockProps;
}

export const ImageBlockRenderer: React.FC<ImageBlockRendererProps> = ({
	props,
}) => {
	const [imageError, setImageError] = useState(false);
	const [imageLoaded, setImageLoaded] = useState(false);

	const containerStyle: React.CSSProperties = {
		backgroundColor: props.backgroundColor,
		padding: `${props.padding?.top || 0}px ${props.padding?.right || 0}px ${props.padding?.bottom || 0}px ${props.padding?.left || 0}px`,
		borderRadius: `${props.borderRadius}px`,
		display: 'block',
		maxWidth: '100%',
		width: props.width,
		margin: '0',
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

	const placeholderStyle: React.CSSProperties = {
		width: props.width,
		height: props.height === 'auto' ? '200px' : props.height,
		maxWidth: '100%',
		borderRadius: `${props.borderRadius}px`,
		display: 'flex',
		alignItems: 'flex-start',
		justifyContent: 'flex-start',
		backgroundColor: '#F5F5F580',
		color: '#6B7280',
		fontSize: '14px',
		fontWeight: '500',
	};

	const handleImageError = () => {
		setImageError(true);
	};

	const handleImageLoad = () => {
		setImageLoaded(true);
	};

	const renderImageElement = () => {
		if (!props.src || imageError) {
			return (
				<div style={placeholderStyle}>
					<ImageBlockIcon width={24} height={24} />
				</div>
			);
		}

		return (
			<img
				src={props.src}
				alt={props.alt}
				style={imageStyle}
				onError={handleImageError}
				onLoad={handleImageLoad}
			/>
		);
	};

	const imageElement = renderImageElement();

	return (
		<div style={wrapperStyle}>
			<div style={containerStyle}>
				{props.link ? (
					<a
						href={props.link}
						target="_blank"
						rel="noopener noreferrer"
					>
						{imageElement}
					</a>
				) : (
					imageElement
				)}
			</div>
		</div>
	);
};
