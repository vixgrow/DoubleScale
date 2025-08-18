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

export interface ButtonEditorProps {
	props: {
		text: string;
		url: string;
		backgroundColor: string;
		textColor: string;
		borderRadius: string;
		padding: string;
		align: string;
	};
	onChange: (updates: Partial<ButtonEditorProps['props']>) => void;
}

export const ButtonEditor = ({ props, onChange }: ButtonEditorProps) => (
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
				onChange={(e) => onChange({ backgroundColor: e.target.value })}
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
				onChange={(e) => onChange({ textColor: e.target.value })}
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
);
