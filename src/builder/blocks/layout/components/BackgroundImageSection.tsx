import { __ } from '@wordpress/i18n';
import React from 'react';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@doublescale/components/ui/select';
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
				label={__('Background Image', 'doublescale')}
				description={__(
					'You can use JPG, PNG, and GIF formats, each under 2000px in dimension.',
					'doublescale'
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
				placeholder={__('No background image selected', 'doublescale')}
			/>

			{backgroundImage && (
				<div className="space-y-4">
					<div className="space-y-2">
						<label className="text-sm text-white">
							{__('Background Repeat', 'doublescale')}
						</label>
						<Select
							value={backgroundRepeat}
							onValueChange={onBackgroundRepeatChange}
						>
							<SelectTrigger
								className="h-11 w-full rounded-lg !border-none !ring-0 !ring-offset-0 !text-white"
								style={{
									backgroundColor: 'rgba(255,255,255,0.05)',
								}}
							>
								<SelectValue
									placeholder={__(
										'Background Repeat',
										'doublescale'
									)}
								/>
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="no-repeat">
									{__('No Repeat', 'doublescale')}
								</SelectItem>
								<SelectItem value="repeat">
									{__('Repeat', 'doublescale')}
								</SelectItem>
								<SelectItem value="repeat-x">
									{__('Repeat X', 'doublescale')}
								</SelectItem>
								<SelectItem value="repeat-y">
									{__('Repeat Y', 'doublescale')}
								</SelectItem>
							</SelectContent>
						</Select>
					</div>

					<div className="space-y-2">
						<label className="text-sm text-white">
							{__('Background Size', 'doublescale')}
						</label>
						<Select
							value={backgroundSize}
							onValueChange={onBackgroundSizeChange}
						>
							<SelectTrigger className="h-11 w-full rounded-lg !border-none !ring-0 !ring-offset-0 !text-white"
							style={{
								backgroundColor: 'rgba(255,255,255,0.05)',
							}}
							>
								<SelectValue
									placeholder={__(
										'Background Size',
										'doublescale'
									)}
								/>
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="cover">
									{__('Cover', 'doublescale')}
								</SelectItem>
								<SelectItem value="contain">
									{__('Contain', 'doublescale')}
								</SelectItem>
								<SelectItem value="auto">
									{__('Auto', 'doublescale')}
								</SelectItem>
							</SelectContent>
						</Select>
					</div>

					<div className="space-y-2">
						<label className="text-sm text-white">
							{__('Background Position', 'doublescale')}
						</label>
						<Select
							value={backgroundPosition}
							onValueChange={onBackgroundPositionChange}
						>
							<SelectTrigger className="h-11 w-full rounded-lg !border-none !ring-0 !ring-offset-0 !text-white"
							style={{
								backgroundColor: 'rgba(255,255,255,0.05)',
							}}
							>
								<SelectValue
									placeholder={__(
										'Background Position',
										'doublescale'
									)}
								/>
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="center">
									{__('Center', 'doublescale')}
								</SelectItem>
								<SelectItem value="top">
									{__('Top', 'doublescale')}
								</SelectItem>
								<SelectItem value="bottom">
									{__('Bottom', 'doublescale')}
								</SelectItem>
								<SelectItem value="left">
									{__('Left', 'doublescale')}
								</SelectItem>
								<SelectItem value="right">
									{__('Right', 'doublescale')}
								</SelectItem>
								<SelectItem value="top left">
									{__('Top Left', 'doublescale')}
								</SelectItem>
								<SelectItem value="top right">
									{__('Top Right', 'doublescale')}
								</SelectItem>
								<SelectItem value="bottom left">
									{__('Bottom Left', 'doublescale')}
								</SelectItem>
								<SelectItem value="bottom right">
									{__('Bottom Right', 'doublescale')}
								</SelectItem>
							</SelectContent>
						</Select>
					</div>
				</div>
			)}
		</>
	);
};
