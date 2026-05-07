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
						{/* Image Upload Section with URL Support */}
						<MediaControls.ImageUploadControl
							label={__('Image', 'doublescale')}
							description={__(
								'You can use JPG, PNG, and GIF formats, each under 2000px in dimension.',
								'doublescale'
							)}
							value={props.src}
							alt={props.alt}
							onChange={({ src, alt }) => onChange({ src, alt })}
							uploadId="image"
							placeholder="Describe the image"
							enableUrl={true}
						/>

						{/* Alt Text */}
						<MediaControls.AltTextInput
							value={props.alt}
							onChange={(alt) => onChange({ alt })}
							placeholder="Describe the image"
						/>

						{/* Link Input */}
						<MediaControls.LinkInput
							label={__('Link when image is clicked', 'doublescale')}
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
									label: __('100%', 'doublescale'),
								},
								{ value: '75%', label: __('75%', 'doublescale') },
								{ value: '50%', label: __('50%', 'doublescale') },
								{ value: '25%', label: __('25%', 'doublescale') },
							]}
							heightOptions={[
								{
									value: 'auto',
									label: __('Auto', 'doublescale'),
								},
								{
									value: '600px',
									label: __('600px', 'doublescale'),
								},
								{
									value: '400px',
									label: __('400px', 'doublescale'),
								},
								{
									value: '300px',
									label: __('300px', 'doublescale'),
								},
								{
									value: '200px',
									label: __('200px', 'doublescale'),
								},
								{
									value: '150px',
									label: __('150px', 'doublescale'),
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
							label={__('Background Color', 'doublescale')}
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
