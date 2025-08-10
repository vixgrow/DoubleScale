import { __ } from '@wordpress/i18n';
import { Separator } from '@/components/ui/separator';

export const DividerBlock = {
	type: 'divider',
	name: __('Divider', 'quillcrm'),
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
					d="M2 22L22 22"
					stroke="#616161"
					stroke-width="1.5"
					stroke-linecap="round"
					stroke-linejoin="round"
				/>
				<path
					d="M2 10L22 10"
					stroke="#616161"
					stroke-width="1.5"
					stroke-linecap="round"
					stroke-linejoin="round"
				/>
				<path
					d="M8.00232 4.5C8.00232 5.34389 7.91895 6.31789 8.75232 6.79904C9.10039 7 9.5677 7 10.5023 7H13.5023C14.4369 7 14.9042 7 15.2523 6.79904C16.0857 6.31789 16.0023 5.34389 16.0023 4.5C16.0023 3.65611 16.0857 2.68211 15.2523 2.20096C14.9042 2 14.4369 2 13.5023 2L10.5023 2C9.5677 2 9.10039 2 8.75232 2.20096C7.91895 2.68211 8.00232 3.65611 8.00232 4.5Z"
					stroke="#616161"
					stroke-width="1.5"
					stroke-linecap="round"
					stroke-linejoin="round"
				/>
				<path
					d="M5.00232 16.5C5.00232 17.3439 4.91895 18.3179 5.75232 18.799C6.10039 19 6.5677 19 7.50232 19L16.5023 19C17.4369 19 17.9042 19 18.2523 18.799C19.0857 18.3179 19.0023 17.3439 19.0023 16.5C19.0023 15.6561 19.0857 14.6821 18.2523 14.201C17.9042 14 17.4369 14 16.5023 14L7.50232 14C6.5677 14 6.10039 14 5.75232 14.201C4.91895 14.6821 5.00232 15.6561 5.00232 16.5Z"
					stroke="#616161"
					stroke-width="1.5"
					stroke-linecap="round"
					stroke-linejoin="round"
				/>
			</svg>
		</div>
	),
	defaultProps: {
		height: '1px',
		color: '#cccccc',
		style: 'solid',
		margin: '20px 0',
	},
	Renderer: ({ props }) => (
		<div style={{ margin: props.margin }}>
			<hr
				style={{
					height: props.height,
					backgroundColor: props.color,
					border: 'none',
					borderTop: `${props.height} ${props.style} ${props.color}`,
				}}
			/>
		</div>
	),
	Editor: ({ props, onChange }) => (
		<>
			<div className="space-y-4">
				<div>
					<label className="block text-sm font-medium mb-2">
						{__('Height', 'quillcrm')}
					</label>
					<input
						type="text"
						className="w-full px-3 py-2 border border-input rounded-md"
						value={props.height}
						onChange={(e) => onChange({ height: e.target.value })}
						placeholder="1px"
					/>
				</div>

				<div>
					<label className="block text-sm font-medium mb-2">
						{__('Color', 'quillcrm')}
					</label>
					<input
						type="color"
						className="w-full h-10 border border-input rounded-md"
						value={props.color}
						onChange={(e) => onChange({ color: e.target.value })}
					/>
				</div>

				<div>
					<label className="block text-sm font-medium mb-2">
						{__('Style', 'quillcrm')}
					</label>
					<select
						className="w-full px-3 py-2 border border-input rounded-md"
						value={props.style}
						onChange={(e) => onChange({ style: e.target.value })}
					>
						<option value="solid">{__('Solid', 'quillcrm')}</option>
						<option value="dashed">
							{__('Dashed', 'quillcrm')}
						</option>
						<option value="dotted">
							{__('Dotted', 'quillcrm')}
						</option>
					</select>
				</div>

				<div>
					<label className="block text-sm font-medium mb-2">
						{__('Margin', 'quillcrm')}
					</label>
					<input
						type="text"
						className="w-full px-3 py-2 border border-input rounded-md"
						value={props.margin}
						onChange={(e) => onChange({ margin: e.target.value })}
						placeholder="20px 0"
					/>
				</div>
			</div>
		</>
	),
};
