/**
 * wordpress dependencies
 */

/**
 * external dependencies
 */

/**
 * internal dependencies
 */

export interface ImageBlockRendererProps {
	props: {
		src: string;
		alt: string;
		width: string;
		align: string;
	};
}

export const ImageBlockRenderer: React.FC<ImageBlockRendererProps> = ({ props }) => (
	<div style={{ textAlign: props.align as React.CSSProperties['textAlign'] }}>
		<img
			src={props.src}
			alt={props.alt}
			style={{
				width: props.width,
				maxWidth: '100%',
				height: 'auto',
			}}
		/>
	</div>
);