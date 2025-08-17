/**
 * wordpress dependencies
 */

/**
 * external dependencies
 */

/**
 * internal dependencies
 */

export interface HtmlBlockRendererProps {
	props: {
		content: string;
		fontSize: number;
		color: string;
		align: string;
	};
}

export const HtmlBlockRenderer: React.FC<HtmlBlockRendererProps> = ({
	props,
}) => (
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
