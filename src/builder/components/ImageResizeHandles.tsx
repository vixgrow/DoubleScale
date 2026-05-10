/**
 * Image Resize Handles Component
 * Renders 8 resize handles (4 corners + 4 edges) around an image block
 */

import React from 'react';
import { ResizeHandleType, useImageResize } from '@doublescale/hooks/useImageResize';

interface ImageResizeHandlesProps {
	width: string;
	height: string;
	onResize: (width: string, height: string) => void;
	containerRef?: React.RefObject<HTMLDivElement>;
}

const handlePositions: Array<{
	type: ResizeHandleType;
	position: string;
	cursor: string;
}> = [
	{ type: 'nw', position: 'top-0 left-0', cursor: 'nwse-resize' }, // top-left
	{
		type: 'n',
		position: 'top-0 left-1/2 -translate-x-1/2',
		cursor: 'ns-resize',
	}, // top
	{ type: 'ne', position: 'top-0 right-0', cursor: 'nesw-resize' }, // top-right
	{
		type: 'e',
		position: 'top-1/2 right-0 -translate-y-1/2',
		cursor: 'ew-resize',
	}, // right
	{ type: 'se', position: 'bottom-0 right-0', cursor: 'nwse-resize' }, // bottom-right
	{
		type: 's',
		position: 'bottom-0 left-1/2 -translate-x-1/2',
		cursor: 'ns-resize',
	}, // bottom
	{ type: 'sw', position: 'bottom-0 left-0', cursor: 'nesw-resize' }, // bottom-left
	{
		type: 'w',
		position: 'top-1/2 left-0 -translate-y-1/2',
		cursor: 'ew-resize',
	}, // left
];

export const ImageResizeHandles: React.FC<ImageResizeHandlesProps> = ({
	width,
	height,
	onResize,
	containerRef: externalContainerRef,
}) => {
	const { handleMouseDown, isResizing } = useImageResize({
		onResize,
		initialWidth: width,
		initialHeight: height,
		minWidth: 50,
		minHeight: 50,
		containerRef: externalContainerRef,
	});

	return (
		<div className="absolute inset-0 pointer-events-none">
			{handlePositions.map(({ type, position, cursor }) => (
				<button
					key={type}
					type="button"
					className={`absolute ${position} w-4 h-4 bg-blue-500 border-2 border-white rounded-full shadow-lg pointer-events-auto hover:bg-blue-600 hover:scale-110 transition-all ${
						isResizing ? 'bg-blue-600 scale-110' : ''
					}`}
					style={{
						cursor: cursor,
						margin: '-8px', // Center the 16px handle on the edge
						boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
						padding: 0,
						border: '2px solid white',
					}}
					onMouseDown={(e) => {
						e.preventDefault();
						e.stopPropagation();
						handleMouseDown(e, type);
					}}
					onClick={(e) => e.stopPropagation()}
					title={`Resize ${type.toUpperCase()} (Hold Shift for aspect ratio)`}
					aria-label={`Resize ${type.toUpperCase()}`}
				/>
			))}
		</div>
	);
};
