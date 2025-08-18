/**
 * wordpress dependencies
 */

/**
 * external dependencies
 */

/**
 * internal dependencies
 */

export interface VideoBlockRendererProps {
	props: {
		content: string;
		fontSize: number;
		color: string;
		align: string;
	};
}

export const VideoBlockRenderer: React.FC<VideoBlockRendererProps> = ({ props }) => (
	<p
		style={{
			fontSize: props.fontSize,
			color: props.color,
			textAlign: props.align as React.CSSProperties['textAlign'],
		}}
	>
		{props.content}
	</p>
);