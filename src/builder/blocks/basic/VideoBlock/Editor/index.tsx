/**
 * wordpress dependencies
 */
import { __ } from '@wordpress/i18n';
/**
 * external dependencies
 */
import { PlayIcon } from 'lucide-react';
/**
 * internal dependencies
 */
import { Input } from '@/components/ui/input';
import { VideoBlockProps } from '..';
import {
	AlignmentControl,
	PaddingControl,
	ColorPickerControl,
	ShapeSelectorControl,
	WidthHeightControl,
	ImageUploadControl,
	AltTextInput,
} from '../../shared';

export interface VideoBlockEditorProps {
	props: VideoBlockProps;
	onChange: (updates: Partial<VideoBlockProps>) => void;
}

export const VideoBlockEditor: React.FC<VideoBlockEditorProps> = ({
	props,
	onChange,
}) => {
	return (
		<div className="grid gap-5">
			{/* Video URL Input */}
			<div className="flex flex-col gap-2 text-[#333333]">
				<div className="flex items-center justify-between">
					<label className="text-sm">
						{__('Video URL', 'quillcrm')}
					</label>
					<PlayIcon className="size-5" />
				</div>
				<Input
					type="url"
					value={props.videoUrl}
					onChange={(e) => onChange({ videoUrl: e.target.value })}
					className="h-10"
					style={{
						borderColor: '#e5e5e5',
						borderRadius: '0.5rem',
					}}
					placeholder="https://example.com/video.mp4"
				/>
			</div>

			{/* Video Thumbnail Upload Section */}
			<ImageUploadControl
				label={__('Video Thumbnail', 'quillcrm')}
				description={__(
					'Upload an image that will appear as the video thumbnail.',
					'quillcrm'
				)}
				value={props.imageUrl}
				alt={props.alt}
				onChange={({ src, alt }) => onChange({ imageUrl: src, alt })}
				uploadId="video-thumbnail"
				placeholder="Describe the video"
			/>

			{/* Alt Text */}
			<AltTextInput
				value={props.alt}
				onChange={(alt) => onChange({ alt })}
				placeholder="Describe the video"
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
