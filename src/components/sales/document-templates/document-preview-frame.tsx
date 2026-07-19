/**
 * Scales a fixed-width document preview to fill its container width.
 */

import React, { useLayoutEffect, useRef, useState } from '@wordpress/element';

/** Matches Propovoice invoice SVG viewBox width (595px). */
const DOCUMENT_BASE_WIDTH = 595;

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
	const [scale, setScale] = useState(1);
	const [frameHeight, setFrameHeight] = useState<number | undefined>();

	useLayoutEffect(() => {
		const viewport = viewportRef.current;
		const content = contentRef.current;
		if (!viewport || !content) {
			return undefined;
		}

		const update = () => {
			const available = viewport.clientWidth;
			if (available <= 0) {
				return;
			}
			const nextScale = Math.min(1, available / DOCUMENT_BASE_WIDTH);
			setScale(nextScale);
			setFrameHeight(content.offsetHeight * nextScale);
		};

		update();

		const viewportObserver = new ResizeObserver(update);
		viewportObserver.observe(viewport);

		const contentObserver = new ResizeObserver(update);
		contentObserver.observe(content);

		return () => {
			viewportObserver.disconnect();
			contentObserver.disconnect();
		};
	}, [children]);

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
