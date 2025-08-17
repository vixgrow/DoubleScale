/**
 * wordpress dependencies
 */

/**
 * external dependencies
 */

/**
 * internal dependencies
 */

export interface TimerBlockRendererProps {
	props: {
		content: string;
		fontSize: number;
		color: string;
		align: string;
	};
}

export const TimerBlockRenderer: React.FC<TimerBlockRendererProps> = ({ props }) => (
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