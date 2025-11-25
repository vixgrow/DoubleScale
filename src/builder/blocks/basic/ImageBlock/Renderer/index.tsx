/**
 * wordpress dependencies
 */

/**
 * external dependencies
 */
import React, { useState, forwardRef, useRef, useImperativeHandle } from 'react';

/**
 * internal dependencies
 */
import { ImageBlockProps } from '..';
import { ImageBlockIcon } from '@quillcrm/components';

export interface ImageBlockRendererProps {
	props: ImageBlockProps & {
		renderResizeHandles?: (containerRef: React.RefObject<HTMLDivElement>) => React.ReactNode;
	};
}

export const ImageBlockRenderer = forwardRef<
	HTMLDivElement,
	ImageBlockRendererProps
>(({ props }, ref) => {
	const containerRef = useRef<HTMLDivElement>(null);
	
	// Sync the forwarded ref with our internal ref
	useImperativeHandle(ref, () => containerRef.current as HTMLDivElement, []);
	
	// Extract renderResizeHandles from props if it exists
	const { renderResizeHandles, ...imageProps } = props;
	
	const [imageError, setImageError] = useState(false);
	const [imageLoaded, setImageLoaded] = useState(false);

	const containerStyle: React.CSSProperties = {
		backgroundColor: imageProps.backgroundColor,
		padding: `${imageProps.padding?.top || 0}px ${imageProps.padding?.right || 0}px ${imageProps.padding?.bottom || 0}px ${imageProps.padding?.left || 0}px`,
		borderRadius: `${imageProps.borderRadius}px`,
		display: 'block',
		maxWidth: '100%',
		width: imageProps.width,
		margin: '0',
	};

	const wrapperStyle: React.CSSProperties = {
		textAlign: imageProps.align as React.CSSProperties['textAlign'],
		width: '100%',
	};

	const imageStyle: React.CSSProperties = {
		width: '100%', // Image should fill the entire container width
		height: imageProps.height === 'auto' ? 'auto' : imageProps.height,
		maxWidth: '100%',
		borderRadius: `${imageProps.borderRadius}px`,
		display: 'block',
		objectFit: 'contain',
	};

	const placeholderStyle: React.CSSProperties = {
		width: '100%', // Placeholder should also fill container width
		height: imageProps.height === 'auto' ? '200px' : imageProps.height,
		maxWidth: '100%',
		borderRadius: `${imageProps.borderRadius}px`,
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
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
		if (!imageProps.src || imageError) {
			return (
				<div style={placeholderStyle}>
					<ImageBlockIcon width={48} height={48} />
				</div>
			);
		}

		return (
			<img
				src={imageProps.src}
				alt={imageProps.alt}
				style={imageStyle}
				onError={handleImageError}
				onLoad={handleImageLoad}
			/>
		);
	};

	const imageElement = renderImageElement();

	return (
		<div style={wrapperStyle}>
			<div ref={containerRef} style={containerStyle} className="relative">
				{imageProps.link ? (
					<a
						href={imageProps.link}
						target="_blank"
						rel="noopener noreferrer"
					>
						{imageElement}
					</a>
				) : (
					imageElement
				)}
				{renderResizeHandles && renderResizeHandles(containerRef)}
			</div>
		</div>
	);
});
