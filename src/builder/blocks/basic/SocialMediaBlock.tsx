import { __ } from '@wordpress/i18n';

export const SocialMediaBlock = {
	type: 'social_media',
	name: __('Social Media', 'quillcrm'),
	icon: () => (
		<div className="flex items-center justify-center">
			<svg
				width="24"
				height="24"
				viewBox="0 0 28 28"
				fill="none"
				xmlns="http://www.w3.org/2000/svg"
			>
				<path
					fill-rule="evenodd"
					clip-rule="evenodd"
					d="M16.625 7.58301C16.625 5.16676 18.5838 3.20801 21 3.20801C23.4162 3.20801 25.375 5.16676 25.375 7.58301C25.375 9.99925 23.4162 11.958 21 11.958C18.5838 11.958 16.625 9.99925 16.625 7.58301Z"
					fill="#616161"
				/>
				<path
					fill-rule="evenodd"
					clip-rule="evenodd"
					d="M2.625 14C2.625 11.5838 4.58375 9.625 7 9.625C9.41625 9.625 11.375 11.5838 11.375 14C11.375 16.4162 9.41625 18.375 7 18.375C4.58375 18.375 2.625 16.4162 2.625 14Z"
					fill="#616161"
				/>
				<path
					fill-rule="evenodd"
					clip-rule="evenodd"
					d="M16.625 20.416C16.625 17.9998 18.5838 16.041 21 16.041C23.4162 16.041 25.375 17.9998 25.375 20.416C25.375 22.8323 23.4162 24.791 21 24.791C18.5838 24.791 16.625 22.8323 16.625 20.416Z"
					fill="#616161"
				/>
				<path
					fill-rule="evenodd"
					clip-rule="evenodd"
					d="M18.2544 10.103L10.671 13.6024L9.69336 11.4838L17.2767 7.98438L18.2544 10.103ZM10.671 14.401L18.2544 17.9004L17.2767 20.0191L9.69336 16.5197L10.671 14.401Z"
					fill="#616161"
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
