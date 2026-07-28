/**
 * Scales a fixed-width document preview to fill its container width.
 *
 * Avoids scale ↔ scrollbar feedback loops that make the preview vibrate
 * when template height changes (e.g. after switching a published proposal's template).
 */

import React, { useLayoutEffect, useRef, useState } from '@wordpress/element';

/** Matches Propovoice invoice SVG viewBox width (595px). */
const DOCUMENT_BASE_WIDTH = 595;
const SCALE_EPSILON = 0.002;
const HEIGHT_EPSILON = 1;
const WIDTH_EPSILON = 1;

interface DocumentPreviewFrameProps {
	children: React.ReactNode;
	className?: string;
}

export const DocumentPreviewFrame: React.FC<DocumentPreviewFrameProps> = ({
	children,
	className = '',
}) => {
	const viewportRef = useRef<HTMLDivElement>(null);
	const contentRef = useRef<HTMLDivElement>(null);
	const scaleRef = useRef(1);
	const widthRef = useRef(0);
	const [scale, setScale] = useState(1);
	const [frameHeight, setFrameHeight] = useState<number | undefined>();

	useLayoutEffect(() => {
		const viewport = viewportRef.current;
		const content = contentRef.current;
		if (!viewport || !content) {
			return undefined;
		}

		const setScaleIfChanged = (nextScale: number) => {
			if (Math.abs(scaleRef.current - nextScale) < SCALE_EPSILON) {
				return scaleRef.current;
			}
			scaleRef.current = nextScale;
			setScale(nextScale);
			return nextScale;
		};

		const setHeightIfChanged = (nextHeight: number) => {
			setFrameHeight((prev) =>
				prev !== undefined && Math.abs(prev - nextHeight) < HEIGHT_EPSILON
					? prev
					: nextHeight
			);
		};

		const updateFromWidth = (available: number) => {
			if (available <= 0) {
				return;
			}
			if (Math.abs(widthRef.current - available) < WIDTH_EPSILON) {
				setHeightIfChanged(content.scrollHeight * scaleRef.current);
				return;
			}
			widthRef.current = available;
			const nextScale = setScaleIfChanged(
				Math.min(1, available / DOCUMENT_BASE_WIDTH)
			);
			setHeightIfChanged(content.scrollHeight * nextScale);
		};

		const updateHeightOnly = () => {
			setHeightIfChanged(content.scrollHeight * scaleRef.current);
		};

		updateFromWidth(viewport.clientWidth);

		const viewportObserver = new ResizeObserver((entries) => {
			const entry = entries[0];
			if (!entry) {
				return;
			}
			const width =
				entry.contentBoxSize?.[0]?.inlineSize ?? entry.contentRect.width;
			updateFromWidth(width);
		});
		viewportObserver.observe(viewport);

		// Content size changes (template swap) should only refresh height.
		// Recomputing scale from content resize re-enters the scrollbar loop.
		const contentObserver = new ResizeObserver(updateHeightOnly);
		contentObserver.observe(content);

		return () => {
			viewportObserver.disconnect();
			contentObserver.disconnect();
		};
	}, []);

	return (
		<div
			ref={viewportRef}
			className={`w-full overflow-hidden ${className}`}
		>
			<div
				className="relative w-full"
				style={frameHeight ? { height: frameHeight } : undefined}
			>
				<div
					ref={contentRef}
					className="document-preview-frame__content"
					style={{
						width: DOCUMENT_BASE_WIDTH,
						transform: `scale(${scale})`,
						transformOrigin: 'top left',
					}}
				>
					{children}
				</div>
			</div>
		</div>
	);
};
