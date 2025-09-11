/**
 * wordpress dependencies
 */
import { __ } from '@wordpress/i18n';
/**
 * internal dependencies
 */
import { BannerBlockProps } from '..';
import {
	AlignmentControl,
	PaddingControl,
	ColorPickerControl,
	ShapeSelectorControl,
	ImageUploadControl,
	LinkInput,
	AltTextInput,
	RotationControl,
} from '../../shared';

export interface BannerBlockEditorProps {
	props: BannerBlockProps;
	onChange: (updates: Partial<BannerBlockProps>) => void;
}

export const BannerEditor: React.FC<BannerBlockEditorProps> = ({
	props,
	onChange,
}) => {
	return (
		<div className="grid gap-5">
			{/* Image Upload Section */}
			<ImageUploadControl
				label={__('Banner Image', 'quillcrm')}
				description={__(
					'You can use JPG, PNG, and GIF formats, each under 2000px in dimension.',
					'quillcrm'
				)}
				value={props.src}
				alt={props.alt}
				onChange={({ src, alt }) => onChange({ src, alt })}
				uploadId="banner"
				placeholder="Describe the banner"
				showRotation={true}
				rotation={props.rotation}
				onRotationChange={(rotation) => onChange({ rotation })}
			/>

			{/* Rotation Controls */}
			<RotationControl
				value={props.rotation}
				onChange={(rotation) => onChange({ rotation })}
			/>

			{/* Alt Text */}
			<AltTextInput
				value={props.alt}
				onChange={(alt) => onChange({ alt })}
				placeholder="Describe the banner"
			/>

			{/* Link Input */}
			<LinkInput
				label={__('Link', 'quillcrm')}
				value={props.link}
				onChange={(link) => onChange({ link })}
				placeholder="https://example.com"
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
