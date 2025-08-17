/**
 * wordpress dependencies
 */

/**
 * external dependencies
 */

/**
 * internal dependencies
 */

export interface MenuBlockRendererProps {
	props: {
		content: string;
		fontSize: number;
		color: string;
		align: string;
	};
}

export const MenuBlockRenderer: React.FC<MenuBlockRendererProps> = ({ props }) => (
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