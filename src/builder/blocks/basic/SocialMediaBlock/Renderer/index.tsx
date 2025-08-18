/**
 * wordpress dependencies
 */

/**
 * external dependencies
 */

/**
 * internal dependencies
 */

export interface SocialMediaBlockRendererProps {
	props: {
		content: string;
		fontSize: number;
		color: string;
		align: string;
	};
}

export const SocialMediaBlockRenderer: React.FC<SocialMediaBlockRendererProps> = ({ props }) => (
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