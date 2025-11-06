/**
 * Social Media Block Editor - REFACTORED
 *
 * Improvements:
 * - Uses BaseBlockEditor wrapper
 * - Uses grouped control imports
 * - Better organization and type safety
 * - Maintained all platform configurations and features
 */

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * External dependencies
 */
import React from 'react';
import { cn } from '@/lib/utils';

/**
 * Internal dependencies
 */
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
	FacebookIcon,
	InstagramIcon,
	YoutubeIcon,
	XIcon,
	ThreadsIcon,
	PinterestIcon,
	SpotifyIcon,
	SnapchatIcon,
	SoundCloudIcon,
	MailIcon,
	WebsiteIcon,
	VimeoIcon,
	MediumIcon,
	TiktokIcon,
	DiscordIcon,
	LinkedinIcon,
} from '@quillcrm/components';
import {
	BaseBlockEditor,
	BlockEditorErrorBoundary,
} from '../../shared/BaseBlockEditor';
import * as LayoutControls from '../../shared/control-groups/layout';
import * as StyleControls from '../../shared/control-groups/style';

export interface SocialMediaBlockEditorProps {
	props: {
		platforms: {
			facebook: { enabled: boolean; link: string };
			x: { enabled: boolean; link: string };
			threads: { enabled: boolean; link: string };
			instagram: { enabled: boolean; link: string };
			youtube: { enabled: boolean; link: string };
			pinterest: { enabled: boolean; link: string };
			spotify: { enabled: boolean; link: string };
			snapchat: { enabled: boolean; link: string };
			soundcloud: { enabled: boolean; link: string };
			mail: { enabled: boolean; link: string };
			website: { enabled: boolean; link: string };
			vimeo: { enabled: boolean; link: string };
			medium: { enabled: boolean; link: string };
			tiktok: { enabled: boolean; link: string };
			discord: { enabled: boolean; link: string };
			linkedin: { enabled: boolean; link: string };
		};
		iconSize: 'small' | 'medium' | 'large';
		align: 'left' | 'center' | 'right';
		shape: 'circle' | 'square' | 'rounded';
		colorMode: 'original' | 'colored';
		color: string;
		padding: {
			top: number;
			right: number;
			bottom: number;
			left: number;
		};
	};
	onChange: (updates: Partial<SocialMediaBlockEditorProps['props']>) => void;
}

const socialMediaPlatforms = [
	{ key: 'facebook', label: 'Facebook', icon: FacebookIcon },
	{ key: 'x', label: 'X (Twitter)', icon: XIcon },
	{ key: 'threads', label: 'Threads', icon: ThreadsIcon },
	{ key: 'instagram', label: 'Instagram', icon: InstagramIcon },
	{ key: 'youtube', label: 'YouTube', icon: YoutubeIcon },
	{ key: 'pinterest', label: 'Pinterest', icon: PinterestIcon },
	{ key: 'spotify', label: 'Spotify', icon: SpotifyIcon },
	{ key: 'snapchat', label: 'Snapchat', icon: SnapchatIcon },
	{ key: 'soundcloud', label: 'SoundCloud', icon: SoundCloudIcon },
	{ key: 'mail', label: 'Email', icon: MailIcon },
	{ key: 'website', label: 'Website', icon: WebsiteIcon },
	{ key: 'vimeo', label: 'Vimeo', icon: VimeoIcon },
	{ key: 'medium', label: 'Medium', icon: MediumIcon },
	{ key: 'tiktok', label: 'TikTok', icon: TiktokIcon },
	{ key: 'discord', label: 'Discord', icon: DiscordIcon },
	{ key: 'linkedin', label: 'LinkedIn', icon: LinkedinIcon },
];

export const SocialMediaBlockEditor: React.FC<
	SocialMediaBlockEditorProps
> = ({ props, onChange }) => {
	const handlePlatformToggle = (platformKey: string, enabled: boolean) => {
		onChange({
			platforms: {
				...props.platforms,
				[platformKey]: {
					...props.platforms[
						platformKey as keyof typeof props.platforms
					],
					enabled,
				},
			},
		});
	};

	const handlePlatformLinkChange = (platformKey: string, link: string) => {
		onChange({
			platforms: {
				...props.platforms,
				[platformKey]: {
					...props.platforms[
						platformKey as keyof typeof props.platforms
					],
					link,
				},
			},
		});
	};

	const handleIconSizeChange = (size: 'small' | 'medium' | 'large') => {
		onChange({ iconSize: size });
	};

	const handleShapeChange = (shape: 'circle' | 'square' | 'rounded') => {
		onChange({ shape });
	};

	const handleColorModeChange = (mode: 'original' | 'colored') => {
		onChange({ colorMode: mode });
	};

	return (
		<BlockEditorErrorBoundary>
			<BaseBlockEditor props={props} onChange={onChange}>
				{(props, onChange) => (
					<>
						{/* Icon Size Selection */}
						<div className="flex flex-col gap-2 text-[#333333]">
							<label className="text-sm">
								{__('Icon Size', 'quillcrm')}
							</label>
							<div className="flex gap-2">
								{['small', 'medium', 'large'].map((size) => (
									<button
										key={size}
										onClick={() =>
											handleIconSizeChange(
												size as
													| 'small'
													| 'medium'
													| 'large'
											)
										}
										className={cn(
											'px-4 py-2 border rounded-lg text-sm transition-colors',
											props.iconSize === size
												? 'bg-blue-500 text-white border-blue-500'
												: 'bg-white text-gray-700 border-gray-300 hover:border-blue-500'
										)}
									>
										{size.charAt(0).toUpperCase() +
											size.slice(1)}
									</button>
								))}
							</div>
						</div>

						{/* Shape Selection */}
						<div className="flex flex-col gap-2 text-[#333333]">
							<label className="text-sm">
								{__('Icon Shape', 'quillcrm')}
							</label>
							<div className="flex gap-2">
								{['circle', 'square', 'rounded'].map(
									(shape) => (
										<button
											key={shape}
											onClick={() =>
												handleShapeChange(
													shape as
														| 'circle'
														| 'square'
														| 'rounded'
												)
											}
											className={cn(
												'px-4 py-2 border rounded-lg text-sm transition-colors',
												props.shape === shape
													? 'bg-blue-500 text-white border-blue-500'
													: 'bg-white text-gray-700 border-gray-300 hover:border-blue-500'
											)}
										>
											{shape.charAt(0).toUpperCase() +
												shape.slice(1)}
										</button>
									)
								)}
							</div>
						</div>

						{/* Color Mode Selection */}
						<div className="flex flex-col gap-2 text-[#333333]">
							<label className="text-sm">
								{__('Color Mode', 'quillcrm')}
							</label>
							<div className="flex gap-2">
								{['original', 'colored'].map((mode) => (
									<button
										key={mode}
										onClick={() =>
											handleColorModeChange(
												mode as 'original' | 'colored'
											)
										}
										className={cn(
											'px-4 py-2 border rounded-lg text-sm transition-colors',
											props.colorMode === mode
												? 'bg-blue-500 text-white border-blue-500'
												: 'bg-white text-gray-700 border-gray-300 hover:border-blue-500'
										)}
									>
										{mode.charAt(0).toUpperCase() +
											mode.slice(1)}
									</button>
								))}
							</div>
						</div>

						{/* Icon Color (only shown in colored mode) */}
						{props.colorMode === 'colored' && (
							<StyleControls.ColorPickerControl
								value={props.color}
								onChange={(color) => onChange({ color })}
								label={__('Icon Color', 'quillcrm')}
								id="icon-color"
							/>
						)}

						{/* Platform Configuration */}
						<div className="flex flex-col gap-3 text-[#333333]">
							<label className="text-sm font-medium">
								{__('Social Media Platforms', 'quillcrm')}
							</label>
							<div className="grid gap-3">
								{socialMediaPlatforms.map(
									({ key, label, icon: Icon }) => {
										const platform =
											props.platforms[
												key as keyof typeof props.platforms
											];
										return (
											<div
												key={key}
												className="flex flex-col gap-2 p-3 border rounded-lg"
											>
												<div className="flex items-center gap-2">
													<Checkbox
														id={`platform-${key}`}
														checked={
															platform.enabled
														}
														onCheckedChange={(
															checked
														) =>
															handlePlatformToggle(
																key,
																checked as boolean
															)
														}
													/>
													<Icon className="size-5" />
													<label
														htmlFor={`platform-${key}`}
														className="text-sm font-medium flex-1 cursor-pointer"
													>
														{label}
													</label>
												</div>
												{platform.enabled && (
													<Input
														type="url"
														value={platform.link}
														onChange={(e) =>
															handlePlatformLinkChange(
																key,
																e.target.value
															)
														}
														placeholder={`https://${key}.com/username`}
														className="h-9"
													/>
												)}
											</div>
										);
									}
								)}
							</div>
						</div>

						{/* Alignment */}
						<LayoutControls.AlignmentControl
							value={props.align as 'left' | 'center' | 'right'}
							onChange={(align) =>
								onChange({
									align: align as 'left' | 'center' | 'right',
								})
							}
						/>

						{/* Padding */}
						<LayoutControls.PaddingControl
							value={props.padding}
							onChange={(padding) => onChange({ padding })}
						/>
					</>
				)}
			</BaseBlockEditor>
		</BlockEditorErrorBoundary>
	);
};
