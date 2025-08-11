import { __ } from '@wordpress/i18n';
import { Button } from '@/components/ui/button';
import { ButtonBlockIcon } from '@quillcrm/components';

export const ButtonBlock = {
	type: 'button',
	name: __('Button', 'quillcrm'),
	icon: ButtonBlockIcon,
	defaultProps: {
		text: 'Click Here',
		url: '#',
		backgroundColor: '#007cba',
		textColor: '#ffffff',
		borderRadius: '4px',
		padding: '12px 24px',
		align: 'center',
	},
	Renderer: ({ props }) => (
		<div style={{ textAlign: props.align }}>
			<a
				href={props.url}
				style={{
					display: 'inline-block',
					backgroundColor: props.backgroundColor,
					color: props.textColor,
					padding: props.padding,
					borderRadius: props.borderRadius,
					textDecoration: 'none',
					fontFamily: 'Arial, sans-serif',
				}}
			>
				{props.text}
			</a>
		</div>
	),
	Editor: ({ props, onChange }) => (
		<>
			<div className="space-y-4">
				<div>
					<label className="block text-sm font-medium mb-2">
						{__('Button Text', 'quillcrm')}
					</label>
					<input
						type="text"
						className="w-full px-3 py-2 border border-input rounded-md"
						value={props.text}
						onChange={(e) => onChange({ text: e.target.value })}
						placeholder="Click Here"
					/>
				</div>

				<div>
					<label className="block text-sm font-medium mb-2">
						{__('Link URL', 'quillcrm')}
					</label>
					<input
						type="url"
						className="w-full px-3 py-2 border border-input rounded-md"
						value={props.url}
						onChange={(e) => onChange({ url: e.target.value })}
						placeholder="https://example.com"
					/>
				</div>

				<div>
					<label className="block text-sm font-medium mb-2">
						{__('Background Color', 'quillcrm')}
					</label>
					<input
						type="color"
						className="w-full h-10 border border-input rounded-md"
						value={props.backgroundColor}
						onChange={(e) =>
							onChange({ backgroundColor: e.target.value })
						}
					/>
				</div>

				<div>
					<label className="block text-sm font-medium mb-2">
						{__('Text Color', 'quillcrm')}
					</label>
					<input
						type="color"
						className="w-full h-10 border border-input rounded-md"
						value={props.textColor}
						onChange={(e) =>
							onChange({ textColor: e.target.value })
						}
					/>
				</div>

				<div>
					<label className="block text-sm font-medium mb-2">
						{__('Alignment', 'quillcrm')}
					</label>
					<select
						className="w-full px-3 py-2 border border-input rounded-md"
						value={props.align}
						onChange={(e) => onChange({ align: e.target.value })}
					>
						<option value="left">{__('Left', 'quillcrm')}</option>
						<option value="center">
							{__('Center', 'quillcrm')}
						</option>
						<option value="right">{__('Right', 'quillcrm')}</option>
					</select>
				</div>
			</div>
		</>
	),
};
