/**
 * wordpress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useSelect, useDispatch } from '@wordpress/data';
/**
 * external dependencies
 */
import React from 'react';
import { ChevronLeft } from 'lucide-react';
/**
 * internal dependencies
 */
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@doublescale/components/ui/select';
import { ImageUploadControl, ColorPickerControl } from '../blocks/basic/shared';
import { STORE_KEY } from '../../stores/email-builder/constants';

interface BackgroundSettingsProps {
	onBack?: () => void;
	inline?: boolean;
	/**
	 * When true, render only the form body (no back header). Used inside
	 * Theme settings accordions in Global Email Settings.
	 */
	embedded?: boolean;
}

const BackgroundSettings: React.FC<BackgroundSettingsProps> = ({
	onBack,
	inline = true,
	embedded = false,
}) => {
	const dispatch = useDispatch();
	const settings = useSelect(
		(select) => select(STORE_KEY).getGlobalSettings(),
		[]
	);

	const handleInputChange = (field: string, value: any) => {
		dispatch(STORE_KEY).updateGlobalSettings({ [field]: value });
	};

	const handleImageChange = (updates: { src: string; alt: string }) => {
		if (updates.src) {
			dispatch(STORE_KEY).updateGlobalSettings({
				backgroundImage: {
					id: 0,
					name: updates.alt || 'Background Image',
					url: updates.src,
					size: 0,
				},
			});
		} else {
			dispatch(STORE_KEY).updateGlobalSettings({ backgroundImage: null });
		}
	};

	const body = (
		<>
			<ImageUploadControl
				label={__('Background Image', 'doublescale')}
				description={__(
					'You can use JPG, PNG, and GIF formats, each under 2000px in dimension.',
					'doublescale'
				)}
				value={settings.backgroundImage?.url || ''}
				alt={settings.backgroundImage?.name || 'Background Image'}
				onChange={handleImageChange}
				uploadId="background-image"
			/>

			{settings.backgroundImage && (
				<div className="space-y-4">
					<div className="space-y-2">
						<label
							className={cn(
								'text-sm',
								inline ? 'text-white' : 'text-[#333333]'
							)}
						>
							{__('Background Repeat', 'doublescale')}
						</label>
						<Select
							value={settings.backgroundRepeat}
							onValueChange={(value) =>
								handleInputChange(
									'backgroundRepeat',
									value
								)
							}
						>
							<SelectTrigger
								className={cn(
									'w-full rounded-lg h-11',
									inline
										? 'bg-white/10 border-white/15 text-white'
										: 'bg-white'
								)}
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
							</SelectContent>
						</Select>
					</div>

					<div className="space-y-2">
						<label
							className={cn(
								'text-sm',
								inline ? 'text-white' : 'text-[#333333]'
							)}
						>
							{__('Background Size', 'doublescale')}
						</label>
						<Select
							value={settings.backgroundSize}
							onValueChange={(value) =>
								handleInputChange('backgroundSize', value)
							}
						>
							<SelectTrigger
								className={cn(
									'w-full rounded-lg h-11',
									inline
										? 'bg-white/10 border-white/15 text-white'
										: 'bg-white'
								)}
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
				</div>
			)}

			<ColorPickerControl
				label={__('Canvas Color', 'doublescale')}
				value={settings.canvasColor}
				onChange={(value) => handleInputChange('canvasColor', value)}
				id="canvas-color"
				placeholder="#ffffff"
				className={
					inline
						? 'border-white/15 bg-white/10 [&_input]:bg-transparent [&_input]:text-white'
						: undefined
				}
			/>
		</>
	);

	if (embedded) {
		return (
			<div
				className={cn(
					'space-y-4',
					inline && '[&_label]:text-white [&_.flex.flex-col]:text-white'
				)}
			>
				{body}
			</div>
		);
	}

	return (
		<div className="h-full flex flex-col">
			<div
				className={cn(
					'flex items-center justify-between flex-shrink-0',
					inline
						? 'px-1 pt-2 pb-3 border-b border-white/10'
						: 'border-b-2 px-4 pt-5 pb-4'
				)}
			>
				<div className="flex items-center gap-2">
					<Button
						variant="ghost"
						size="sm"
						onClick={() => onBack?.()}
						className={cn(
							'p-1 h-auto',
							inline &&
							'text-white hover:bg-white/10 hover:text-white'
						)}
					>
						<ChevronLeft className="h-4 w-4" />
					</Button>
					<h3
						className={cn(
							'text-base font-medium',
							inline ? 'text-white' : 'text-[#333333]'
						)}
					>
						{__('Background', 'doublescale')}
					</h3>
				</div>
			</div>

			<div
				className={cn(
					'space-y-4 flex-1 overflow-auto',
					inline ? 'px-1 py-3' : 'p-4'
				)}
			>
				{body}
			</div>
		</div>
	);
};

export default BackgroundSettings;
