import { __ } from '@wordpress/i18n';
import { Separator } from '@/components/ui/separator';

export const DividerBlock = {
	type: 'divider',
	name: __('Divider', 'quillcrm'),
	icon: () => (
		<div className="w-6 h-6 flex items-center justify-center">
			<div className="w-full h-0.5 bg-gray-400"></div>
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
