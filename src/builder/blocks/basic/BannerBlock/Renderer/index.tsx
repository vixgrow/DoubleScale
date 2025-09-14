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
import { BannerBlockProps } from '..';
import { BannerBlockIcon } from '@quillcrm/components';

export interface BannerBlockRendererProps {
	props: BannerBlockProps;
}

export const BannerRenderer: React.FC<BannerBlockRendererProps> = ({
	props,
}) => {
	const [imageError, setImageError] = useState(false);
	const [imageLoaded, setImageLoaded] = useState(false);

	const containerStyle: React.CSSProperties = {
		backgroundColor: props.backgroundColor,
		padding: `${(props.padding?.top || 0)}px ${(props.padding?.right || 0)}px ${(props.padding?.bottom || 0)}px ${(props.padding?.left || 0)}px`,
		borderRadius: `${props.borderRadius}px`,
		display: 'inline-block',
		maxWidth: '100%',
	};

	const wrapperStyle: React.CSSProperties = {
		textAlign: props.align as React.CSSProperties['textAlign'],
		width: '100%',
	};

	const imageStyle: React.CSSProperties = {
		width: '100px',
		height: '100px',
		maxWidth: '100%',
		borderRadius: `${props.borderRadius}px`,
		display: 'block',
		transform: `rotate(${props.rotation}deg)`,
		objectFit: 'cover',
	};

	const placeholderStyle: React.CSSProperties = {
		width: '100px',
		height: '100px',
		maxWidth: '100%',
		borderRadius: `${props.borderRadius}px`,
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		color: '#6B7280',
		fontSize: '14px',
		fontWeight: '500',
		margin: '0 auto',
	};

	const handleImageError = () => {
		setImageError(true);
	};

	const handleImageLoad = () => {
		setImageLoaded(true);
	};

	const renderBannerElement = () => {
		if (!props.src || imageError) {
			return (
				<div style={placeholderStyle}>
					<div className="bg-accent rounded-full p-3 flex items-center justify-center">
						<BannerBlockIcon width={40} height={40} />
					</div>
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

	const bannerElement = renderBannerElement();

	return (
		<div style={wrapperStyle}>
			<div style={containerStyle}>
				{props.link ? (
					<a
						href={props.link}
						target="_blank"
						rel="noopener noreferrer"
					>
						{bannerElement}
					</a>
				) : (
					bannerElement
				)}
			</div>
		</div>
	);
};
