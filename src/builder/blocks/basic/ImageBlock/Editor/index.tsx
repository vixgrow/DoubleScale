/**
 * Image Block Editor - REFACTORED EXAMPLE
 *
 * This is a refactored version demonstrating best practices:
 * - Uses BaseBlockEditor wrapper
 * - Uses grouped control imports
 * - Better type safety
 * - Cleaner organization
 * - Follows React best practices
 *
 * To use: Rename this file to index.tsx (backup the old one first)
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
import { ImageBlockProps } from '..';
import {
	BaseBlockEditor,
	BlockEditorErrorBoundary,
} from '../../shared/BaseBlockEditor';
import * as LayoutControls from '../../shared/control-groups/layout';
import * as StyleControls from '../../shared/control-groups/style';
import * as MediaControls from '../../shared/control-groups/media';

export interface ImageBlockEditorProps {
	props: ImageBlockProps;
	onChange: (updates: Partial<ImageBlockProps>) => void;
}

/**
 * Image Block Editor Component
 */
export const ImageBlockEditor: React.FC<ImageBlockEditorProps> = ({
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
						<MediaControls.AltTextInput
							value={props.alt}
							onChange={(alt) => onChange({ alt })}
							placeholder="Describe the image"
						/>

						{/* Link Input */}
						<MediaControls.LinkInput
							label={__('Link', 'quillcrm')}
							value={props.link}
							onChange={(link) => onChange({ link })}
							placeholder="https://example.com"
						/>

						{/* Width and Height */}
						<LayoutControls.WidthHeightControl
							width={props.width}
							height={props.height}
							onWidthChange={(width) => onChange({ width })}
							onHeightChange={(height) => onChange({ height })}
							widthOptions={[
								{
									value: '100%',
									label: __('100%', 'quillcrm'),
								},
								{ value: '75%', label: __('75%', 'quillcrm') },
								{ value: '50%', label: __('50%', 'quillcrm') },
								{ value: '25%', label: __('25%', 'quillcrm') },
							]}
							heightOptions={[
								{
									value: 'auto',
									label: __('Auto', 'quillcrm'),
								},
								{
									value: '600px',
									label: __('600px', 'quillcrm'),
								},
								{
									value: '400px',
									label: __('400px', 'quillcrm'),
								},
								{
									value: '300px',
									label: __('300px', 'quillcrm'),
								},
								{
									value: '200px',
									label: __('200px', 'quillcrm'),
								},
								{
									value: '150px',
									label: __('150px', 'quillcrm'),
								},
							]}
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
