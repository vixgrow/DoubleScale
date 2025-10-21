/**
 * Video Block Editor - REFACTORED
 *
 * Improvements:
 * - Uses BaseBlockEditor wrapper
 * - Uses grouped control imports
 * - Better type safety and organization
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
import { VideoBlockProps } from '..';
import {
	BaseBlockEditor,
	BlockEditorErrorBoundary,
} from '../../shared/BaseBlockEditor';
import * as LayoutControls from '../../shared/control-groups/layout';
import * as StyleControls from '../../shared/control-groups/style';
import * as MediaControls from '../../shared/control-groups/media';

export interface VideoBlockEditorProps {
	props: VideoBlockProps;
	onChange: (updates: Partial<VideoBlockProps>) => void;
}

export const VideoBlockEditor: React.FC<VideoBlockEditorProps> = ({
	props,
	onChange,
}) => {
	return (
		<BlockEditorErrorBoundary>
			<BaseBlockEditor props={props} onChange={onChange}>
				{(props, onChange) => (
					<>
						{/* Video URL Input */}
						<MediaControls.LinkInput
							label={__('Video URL', 'quillcrm')}
							value={props.videoUrl}
							onChange={(videoUrl) => onChange({ videoUrl })}
							placeholder="https://example.com/video.mp4"
						/>

						{/* Video Thumbnail Upload Section */}
						<MediaControls.ImageUploadControl
							label={__('Video Thumbnail', 'quillcrm')}
							description={__(
								'Upload an image that will appear as the video thumbnail.',
								'quillcrm'
							)}
							value={props.imageUrl}
							alt={props.alt}
							onChange={({ src, alt }) =>
								onChange({ imageUrl: src, alt })
							}
							uploadId="video-thumbnail"
							placeholder="Describe the video"
						/>

						{/* Alt Text */}
						<MediaControls.AltTextInput
							value={props.alt}
							onChange={(alt) => onChange({ alt })}
							placeholder="Describe the video"
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
