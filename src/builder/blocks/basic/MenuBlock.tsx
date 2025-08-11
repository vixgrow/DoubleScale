import { MenuBlockIcon } from '@quillcrm/components';
import { __ } from '@wordpress/i18n';

export const MenuBlock = {
	type: 'menu',
	name: __('Menu', 'quillcrm'),
	icon: MenuBlockIcon,
	defaultProps: {
		content: 'Your text here',
		fontSize: 16,
		color: '#333',
		align: 'center',
	},
	Renderer: ({ props }) => (
		<p
			style={{
				fontSize: props.fontSize,
				color: props.color,
				textAlign: props.align,
			}}
		>
			{props.content}
		</p>
	),
	Editor: ({ props, onChange }) => (
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
	),
};
