/**
 * Banner Block Editor - REFACTORED
 *
 * Improvements:
 * - Uses BaseBlockEditor wrapper
 * - Uses grouped control imports
 * - Better organization
 */

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * External dependencies
 */
import React from 'react';

/**
 * Internal dependencies
 */
import { BannerBlockProps } from '..';
import {
	BaseBlockEditor,
	BlockEditorErrorBoundary,
} from '../../shared/BaseBlockEditor';
import * as LayoutControls from '../../shared/control-groups/layout';
import * as StyleControls from '../../shared/control-groups/style';
import * as MediaControls from '../../shared/control-groups/media';

export interface BannerBlockEditorProps {
	props: BannerBlockProps;
	onChange: (updates: Partial<BannerBlockProps>) => void;
}

export const BannerEditor: React.FC<BannerBlockEditorProps> = ({
	props,
	onChange,
}) => {
	return (
		<BlockEditorErrorBoundary>
			<BaseBlockEditor props={props} onChange={onChange}>
				{(props, onChange) => (
					<>
						{/* Image Upload Section */}
						<MediaControls.ImageUploadControl
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
							onRotationChange={(rotation) =>
								onChange({ rotation })
							}
						/>

						{/* Rotation Controls */}
						<StyleControls.RotationControl
							value={props.rotation}
							onChange={(rotation) => onChange({ rotation })}
						/>

						{/* Alt Text */}
						<MediaControls.AltTextInput
							value={props.alt}
							onChange={(alt) => onChange({ alt })}
							placeholder="Describe the banner"
						/>

						{/* Link Input */}
						<MediaControls.LinkInput
							label={__('Link', 'quillcrm')}
							value={props.link}
							onChange={(link) => onChange({ link })}
							placeholder="https://example.com"
						/>

						{/* Alignment */}
						<LayoutControls.AlignmentControl
							value={
								props.align as
									| 'left'
									| 'center'
									| 'right'
									| 'full'
							}
							onChange={(align) => onChange({ align })}
						/>

						{/* Shape and Border Radius */}
						<StyleControls.ShapeSelectorControl
							value={props.borderRadius}
							onChange={(borderRadius) =>
								onChange({ borderRadius })
							}
							onShapeChange={(shape) => onChange({ shape })}
						/>

						{/* Background Color */}
						<StyleControls.ColorPickerControl
							value={props.backgroundColor}
							onChange={(backgroundColor) =>
								onChange({ backgroundColor })
							}
							label={__('Background Color', 'quillcrm')}
							id="bg-color"
						/>

						{/* Padding */}
						<LayoutControls.PaddingControl
							value={
								props.padding || {
									top: 0,
									right: 0,
									bottom: 0,
									left: 0,
								}
							}
							onChange={(padding) => onChange({ padding })}
						/>
					</>
				)}
			</BaseBlockEditor>
		</BlockEditorErrorBoundary>
	);
};
