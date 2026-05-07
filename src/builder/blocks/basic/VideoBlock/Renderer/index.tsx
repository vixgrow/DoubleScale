/**
 * wordpress dependencies
 */
import { __ } from '@wordpress/i18n';
/**
 * external dependencies
 */
import React from 'react';
import { PlayIcon } from 'lucide-react';
/**
 * internal dependencies
 */
import { VideoBlockIcon } from '@doublescale/components';
import { VideoBlockProps } from '..';

export interface VideoBlockRendererProps {
	props: VideoBlockProps;
}

export const VideoBlockRenderer: React.FC<VideoBlockRendererProps> = ({ props }) => {
	console.log('VideoBlockRenderer props:', props);
	const {
		videoUrl,
		imageUrl,
		alt,
		width,
		height,
		align,
		backgroundColor,
		padding,
		borderRadius,
		shape,
	} = props;

	// Helper function to get background color
	const getBackgroundColor = () => {
		if (backgroundColor && backgroundColor !== 'transparent') {
			return backgroundColor;
		}
		return '#000000'; // Default black for placeholder
	};

	// Helper function to get container style
	const getContainerStyle = (isPlaceholder = false) => ({
		width: width === 'auto' ? '100%' : width,
		height: height === 'auto' ? (isPlaceholder ? '300px' : 'auto') : height,
		position: 'relative' as const,
		borderRadius: `${borderRadius}px`,
		backgroundColor: getBackgroundColor(),
		padding: `${padding?.top || 0}px ${padding?.right || 0}px ${padding?.bottom || 0}px ${padding?.left || 0}px`,
		margin: align === 'center' ? '0 auto' : align === 'right' ? '0 0 0 auto' : '0',
		overflow: 'hidden' as const,
	});

	// If no video URL is provided, show placeholder with background color and video icon
	if (!videoUrl || videoUrl.trim() === '') {
		return (
			<div style={getContainerStyle(true)}>
				<div className="flex flex-col items-center justify-center text-white h-full">
					<VideoBlockIcon width={48} height={48} />
				</div>
			</div>
		);
	}

	// If there's a thumbnail image, show it with play button overlay
	if (imageUrl && imageUrl.trim() !== '') {
		const containerStyle = getContainerStyle();

		return (
			<div style={containerStyle}>
				<img
					src={imageUrl}
					alt={alt}
					style={{
						width: '100%',
						height: '100%',
						objectFit: 'cover',
						borderRadius: `${borderRadius}px`,
					}}
				/>
				<div
					style={{
						position: 'absolute',
						top: '50%',
						left: '50%',
						transform: 'translate(-50%, -50%)',
						backgroundColor: 'rgba(0, 0, 0, 0.7)',
						borderRadius: '50%',
						width: '60px',
						height: '60px',
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						cursor: 'pointer',
						transition: 'all 0.3s ease',
					}}
					onClick={() => {
						// Handle video play - you might want to implement a modal or inline player
						if (videoUrl) {
							window.open(videoUrl, '_blank');
						}
					}}
					onMouseEnter={(e) => {
						e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.9)';
						e.currentTarget.style.transform = 'translate(-50%, -50%) scale(1.1)';
					}}
					onMouseLeave={(e) => {
						e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
						e.currentTarget.style.transform = 'translate(-50%, -50%) scale(1)';
					}}
				>
					<PlayIcon size={24} color="white" />
				</div>
			</div>
		);
	}

	// Create video element with all styling properties
	const videoElement = (
		<video
			src={videoUrl}
			style={{
				width: '100%',
				height: '100%',
				borderRadius: `${borderRadius}px`,
				objectFit: 'cover',
			}}
			controls
			preload="metadata"
		>
			{__('Your browser does not support the video tag.', 'doublescale')}
		</video>
	);

	// If no thumbnail but video URL exists, show video with styling
	const containerStyle = getContainerStyle();

	// Return video without link wrapper
	return (
		<div style={containerStyle}>
			{videoElement}
		</div>
	);
};