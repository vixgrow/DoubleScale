/**
 * wordpress dependencies
 */
import { __ } from '@wordpress/i18n';
/**
 * internal dependencies
 */
import { ImageBlockProps } from '..';
import {
	AlignmentControl,
	PaddingControl,
	ColorPickerControl,
	ShapeSelectorControl,
	WidthHeightControl,
	ImageUploadControl,
	LinkInput,
	AltTextInput,
} from '../../shared';

export interface ImageBlockEditorProps {
	props: ImageBlockProps;
	onChange: (updates: Partial<ImageBlockProps>) => void;
}

export const ImageBlockEditor: React.FC<ImageBlockEditorProps> = ({
	props,
	onChange,
}) => {
	return (
		<div className="grid gap-5">
			{/* Image Upload Section */}
			<ImageUploadControl
				label={__('Image', 'quillcrm')}
				description={__(
					'You can use JPG, PNG, and GIF formats, each under 2000px in dimension.',
					'quillcrm'
				)}
				value={props.src}
				alt={props.alt}
				onChange={({ src, alt }) => onChange({ src, alt })}
				uploadId="image"
				placeholder="Describe the image"
			/>

			{/* Alt Text */}
			<AltTextInput
				value={props.alt}
				onChange={(alt) => onChange({ alt })}
				placeholder="Describe the image"
			/>

			{/* Link Input */}
			<LinkInput
				label={__('Link', 'quillcrm')}
				value={props.link}
				onChange={(link) => onChange({ link })}
				placeholder="https://example.com"
			/>

			{/* Width and Height */}
			<WidthHeightControl
				width={props.width}
				height={props.height}
				onWidthChange={(width) => onChange({ width })}
				onHeightChange={(height) => onChange({ height })}
				widthOptions={[
					{ value: '100%', label: __('100%', 'quillcrm') },
					{ value: '75%', label: __('75%', 'quillcrm') },
					{ value: '50%', label: __('50%', 'quillcrm') },
					{ value: '25%', label: __('25%', 'quillcrm') },
				]}
				heightOptions={[
					{ value: 'auto', label: __('Auto', 'quillcrm') },
					{ value: '600px', label: __('600px', 'quillcrm') },
					{ value: '400px', label: __('400px', 'quillcrm') },
					{ value: '300px', label: __('300px', 'quillcrm') },
					{ value: '200px', label: __('200px', 'quillcrm') },
					{ value: '150px', label: __('150px', 'quillcrm') },
				]}
			/>

			{/* Alignment */}
			<AlignmentControl
				value={props.align as 'left' | 'center' | 'right' | 'full'}
				onChange={(align) => onChange({ align })}
			/>

			{/* Shape and Border Radius */}
			<ShapeSelectorControl
				value={props.borderRadius}
				onChange={(borderRadius) => onChange({ borderRadius })}
				onShapeChange={(shape) => onChange({ shape })}
			/>

			{/* Background Color */}
			<ColorPickerControl
				value={props.backgroundColor}
				onChange={(backgroundColor) => onChange({ backgroundColor })}
				label={__('Background Color', 'quillcrm')}
				id="bg-color"
			/>

			{/* Padding */}
			<PaddingControl
				value={
					props.padding || { top: 0, right: 0, bottom: 0, left: 0 }
				}
				onChange={(padding) => onChange({ padding })}
			/>
		</div>
	);
};
