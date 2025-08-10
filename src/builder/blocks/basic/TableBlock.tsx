import { __ } from '@wordpress/i18n';

export const TableBlock = {
	type: 'table',
	name: __('Table', 'quillcrm'),
	icon: () => (
		<div className="flex items-center justify-center">
			<svg
				width="24"
				height="24"
				viewBox="0 0 24 24"
				fill="none"
				xmlns="http://www.w3.org/2000/svg"
			>
				<path
					d="M20.1068 20.1088C18.7156 21.5 16.4764 21.5 11.998 21.5C7.5197 21.5 5.28053 21.5 3.88929 20.1088C2.49805 18.7175 2.49805 16.4783 2.49805 12C2.49805 7.52166 2.49805 5.28249 3.88929 3.89124C5.28053 2.5 7.5197 2.5 11.998 2.5C16.4764 2.5 18.7156 2.5 20.1068 3.89124C21.498 5.28249 21.498 7.52166 21.498 12C21.498 16.4783 21.498 18.7175 20.1068 20.1088Z"
					stroke="#616161"
					stroke-width="1.5"
					stroke-linecap="round"
					stroke-linejoin="round"
				/>
				<path
					d="M8.99805 21.5L8.99805 2.5"
					stroke="#616161"
					stroke-width="1.5"
				/>
				<path
					d="M21.498 8L2.49805 8"
					stroke="#616161"
					stroke-width="1.5"
				/>
				<path
					d="M21.498 16H2.49805"
					stroke="#616161"
					stroke-width="1.5"
				/>
			</svg>
		</div>
	),
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
