import { __ } from '@wordpress/i18n';

export const BannerBlock = {
	type: 'banner',
	name: __('Banner', 'quillcrm'),
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
					d="M3 3H19"
					stroke="#616161"
					stroke-width="1.5"
					stroke-linecap="round"
					stroke-linejoin="round"
				/>
				<path
					d="M3 21H12"
					stroke="#616161"
					stroke-width="1.5"
					stroke-linecap="round"
					stroke-linejoin="round"
				/>
				<path
					d="M3 12C3 9.64298 3 8.46447 3.73223 7.73223C4.46447 7 5.64298 7 8 7H16C18.357 7 19.5355 7 20.2678 7.73223C21 8.46447 21 9.64298 21 12C21 14.357 21 15.5355 20.2678 16.2678C19.5355 17 18.357 17 16 17H8C5.64298 17 4.46447 17 3.73223 16.2678C3 15.5355 3 14.357 3 12Z"
					stroke="#616161"
					stroke-width="1.5"
					stroke-linecap="round"
					stroke-linejoin="round"
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
