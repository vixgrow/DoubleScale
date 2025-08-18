/**
 * wordpress dependencies
 */
import { __ } from '@wordpress/i18n';
/**
 * external dependencies
 */

/**
 * internal dependencies
 */

export interface ImageBlockEditorProps {
	props: {
		src: string;
		alt: string;
		width: string;
		align: string;
	};
	onChange: (updates: Partial<ImageBlockEditorProps['props']>) => void;
}

export const ImageBlockEditor: React.FC<ImageBlockEditorProps> = ({
	props,
	onChange,
}) => (
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
					<option value="center">{__('Center', 'quillcrm')}</option>
					<option value="right">{__('Right', 'quillcrm')}</option>
				</select>
			</div>
		</div>
	</>
);
