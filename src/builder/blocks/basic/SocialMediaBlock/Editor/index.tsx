/**
 * wordpress dependencies
 */

/**
 * external dependencies
 */

/**
 * internal dependencies
 */

export interface SocialMediaBlockEditorProps {
	props: {
		content: string;
		fontSize: number;
		color: string;
		align: string;
	};
	onChange: (updates: Partial<SocialMediaBlockEditorProps['props']>) => void;
}

export const SocialMediaBlockEditor: React.FC<SocialMediaBlockEditorProps> = ({ props, onChange }) => (
	<>
		<input
			type="text"
			value={props.content}
			onChange={(e) => onChange({ content: e.target.value })}
		/>
		<input
			type="color"
			value={props.color}
			onChange={(e) => onChange({ color: e.target.value })}
		/>
		<input
			type="number"
			value={props.fontSize}
			onChange={(e) =>
				onChange({ fontSize: parseInt(e.target.value) })
			}
		/>
	</>
);