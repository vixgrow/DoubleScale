import { ImageBlockIcon } from '@quillcrm/components';
import { __ } from '@wordpress/i18n';

export const ImageBlock = {
	type: 'image',
	name: __('Image', 'quillcrm'),
	icon: ImageBlockIcon,
	defaultProps: {
		src: 'https://via.placeholder.com/400x200?text=Image',
		alt: 'Image',
		width: '100%',
		align: 'center',
	},
	Renderer: ({ props }) => (
		<div style={{ textAlign: props.align }}>
			<img
				src={props.src}
				alt={props.alt}
				style={{
					width: props.width,
					maxWidth: '100%',
					height: 'auto',
				}}
			/>
		</div>
	),
	Editor: ({ props, onChange }) => (
		<>
			<div className="space-y-4">
				<div>
					<label className="block text-sm font-medium mb-2">
						{__('Image URL', 'quillcrm')}
					</label>
					<input
						type="url"
						className="w-full px-3 py-2 border border-input rounded-md"
						value={props.src}
						onChange={(e) => onChange({ src: e.target.value })}
						placeholder="https://example.com/image.jpg"
					/>
				</div>

				<div>
					<label className="block text-sm font-medium mb-2">
						{__('Alt Text', 'quillcrm')}
					</label>
					<input
						type="text"
						className="w-full px-3 py-2 border border-input rounded-md"
						value={props.alt}
						onChange={(e) => onChange({ alt: e.target.value })}
						placeholder="Describe the image"
					/>
				</div>

				<div>
					<label className="block text-sm font-medium mb-2">
						{__('Width', 'quillcrm')}
					</label>
					<input
						type="text"
						className="w-full px-3 py-2 border border-input rounded-md"
						value={props.width}
						onChange={(e) => onChange({ width: e.target.value })}
						placeholder="100% or 400px"
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
