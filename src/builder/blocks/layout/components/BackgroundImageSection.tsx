import { __ } from '@wordpress/i18n';
import React from 'react';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@quillcrm/components/ui/select';
import { ImageUploadControl } from '../../basic/shared';

interface BackgroundImage {
	id: number;
	name: string;
	url: string;
	size: number;
}

interface BackgroundImageSectionProps {
	backgroundImage: BackgroundImage | null;
	backgroundRepeat: string;
	backgroundSize: string;
	backgroundPosition: string;
	onBackgroundImageChange: (image: BackgroundImage | null) => void;
	onBackgroundRepeatChange: (value: string) => void;
	onBackgroundSizeChange: (value: string) => void;
	onBackgroundPositionChange: (value: string) => void;
}

export const BackgroundImageSection: React.FC<BackgroundImageSectionProps> = ({
	backgroundImage,
	backgroundRepeat,
	backgroundSize,
	backgroundPosition,
	onBackgroundImageChange,
	onBackgroundRepeatChange,
	onBackgroundSizeChange,
	onBackgroundPositionChange,
}) => {
	return (
		<>
			<ImageUploadControl
				label={__('Background Image', 'quillcrm')}
				description={__(
					'You can use JPG, PNG, and GIF formats, each under 2000px in dimension.',
					'quillcrm'
				)}
				value={backgroundImage?.url || ''}
				alt={backgroundImage?.name || 'Background Image'}
				onChange={({ src, alt }) => {
					if (src) {
						onBackgroundImageChange({
							id: backgroundImage?.id || 0,
							name: alt,
							url: src,
							size: backgroundImage?.size || 0,
						});
					} else {
						onBackgroundImageChange(null);
					}
				}}
				uploadId="layout-bg-upload"
				placeholder={__('No background image selected', 'quillcrm')}
			/>

			{backgroundImage && (
				<div className="space-y-4">
					<div className="space-y-2">
						<label className="text-sm text-[#333333]">
							{__('Background Repeat', 'quillcrm')}
						</label>
						<Select
							value={backgroundRepeat}
							onValueChange={onBackgroundRepeatChange}
						>
							<SelectTrigger className="w-full rounded-lg bg-white h-10">
								<SelectValue
									placeholder={__(
										'Background Repeat',
										'quillcrm'
									)}
								/>
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="no-repeat">
									{__('No Repeat', 'quillcrm')}
								</SelectItem>
								<SelectItem value="repeat">
									{__('Repeat', 'quillcrm')}
								</SelectItem>
								<SelectItem value="repeat-x">
									{__('Repeat X', 'quillcrm')}
								</SelectItem>
								<SelectItem value="repeat-y">
									{__('Repeat Y', 'quillcrm')}
								</SelectItem>
							</SelectContent>
						</Select>
					</div>

					<div className="space-y-2">
						<label className="text-sm text-[#333333]">
							{__('Background Size', 'quillcrm')}
						</label>
						<Select
							value={backgroundSize}
							onValueChange={onBackgroundSizeChange}
						>
							<SelectTrigger className="w-full rounded-lg bg-white h-10">
								<SelectValue
									placeholder={__(
										'Background Size',
										'quillcrm'
									)}
								/>
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="cover">
									{__('Cover', 'quillcrm')}
								</SelectItem>
								<SelectItem value="contain">
									{__('Contain', 'quillcrm')}
								</SelectItem>
								<SelectItem value="auto">
									{__('Auto', 'quillcrm')}
								</SelectItem>
							</SelectContent>
						</Select>
					</div>

					<div className="space-y-2">
						<label className="text-sm text-[#333333]">
							{__('Background Position', 'quillcrm')}
						</label>
						<Select
							value={backgroundPosition}
							onValueChange={onBackgroundPositionChange}
						>
							<SelectTrigger className="w-full rounded-lg bg-white h-10">
								<SelectValue
									placeholder={__(
										'Background Position',
										'quillcrm'
									)}
								/>
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="center">
									{__('Center', 'quillcrm')}
								</SelectItem>
								<SelectItem value="top">
									{__('Top', 'quillcrm')}
								</SelectItem>
								<SelectItem value="bottom">
									{__('Bottom', 'quillcrm')}
								</SelectItem>
								<SelectItem value="left">
									{__('Left', 'quillcrm')}
								</SelectItem>
								<SelectItem value="right">
									{__('Right', 'quillcrm')}
								</SelectItem>
								<SelectItem value="top left">
									{__('Top Left', 'quillcrm')}
								</SelectItem>
								<SelectItem value="top right">
									{__('Top Right', 'quillcrm')}
								</SelectItem>
								<SelectItem value="bottom left">
									{__('Bottom Left', 'quillcrm')}
								</SelectItem>
								<SelectItem value="bottom right">
									{__('Bottom Right', 'quillcrm')}
								</SelectItem>
							</SelectContent>
						</Select>
					</div>
				</div>
			)}
		</>
	);
};
