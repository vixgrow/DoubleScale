/**
 * wordpress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * external dependencies
 */
import { cn } from '@/lib/utils';

/**
 * internal dependencies
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
	AlignmentControl,
	PaddingControl,
	ColorPickerControl,
} from '../../shared';

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

export const SocialMediaBlockEditor: React.FC<SocialMediaBlockEditorProps> = ({
	props,
	onChange,
}) => {
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

	return (
		<div className="grid gap-5">
			{/* Social Media Platforms */}
			<div className="flex flex-col gap-2 text-[#333333]">
				<div className="text-sm font-medium">
					{__('Social Media Platforms', 'quillcrm')}
				</div>
				<div className="grid grid-cols-2 gap-3">
					{socialMediaPlatforms.map((platform) => {
						const IconComponent = platform.icon;
						const platformData =
							props.platforms[
								platform.key as keyof typeof props.platforms
							];

						return (
							<div key={platform.key} className="space-y-2">
								<div className="flex items-center space-x-2">
									<Checkbox
										id={platform.key}
										checked={platformData.enabled}
										onCheckedChange={(checked) =>
											handlePlatformToggle(
												platform.key,
												!!checked
											)
										}
									/>
									<label
										htmlFor={platform.key}
										className="flex items-center space-x-2 text-sm"
									>
										<IconComponent width={16} height={16} />
										<span>{platform.label}</span>
									</label>
								</div>
								{platformData.enabled && (
									<Input
										type="url"
										placeholder={`${platform.label} URL`}
										value={platformData.link}
										onChange={(e) =>
											handlePlatformLinkChange(
												platform.key,
												e.target.value
											)
										}
										className="text-sm"
									/>
								)}
							</div>
						);
					})}
				</div>
			</div>

			{/* Icon Size */}
			<div className="flex flex-col gap-2 text-[#333333]">
				<div className="text-sm font-medium">
					{__('Icon Size', 'quillcrm')}
				</div>
				<div className="flex items-center justify-between border rounded-lg">
					<div
						className={cn(
							'py-2 px-4 w-full text-center cursor-pointer text-sm',
							props.iconSize === 'small' &&
								'bg-[#C6DFF366] border border-primary rounded-l-lg'
						)}
						onClick={() => onChange({ iconSize: 'small' })}
					>
						{__('Small', 'quillcrm')}
					</div>
					<div
						className={cn(
							'py-2 px-4 w-full text-center cursor-pointer text-sm',
							props.iconSize === 'medium' &&
								'bg-[#C6DFF366] border border-primary'
						)}
						onClick={() => onChange({ iconSize: 'medium' })}
					>
						{__('Medium', 'quillcrm')}
					</div>
					<div
						className={cn(
							'py-2 px-4 w-full text-center cursor-pointer text-sm',
							props.iconSize === 'large' &&
								'bg-[#C6DFF366] border border-primary rounded-r-lg'
						)}
						onClick={() => onChange({ iconSize: 'large' })}
					>
						{__('Large', 'quillcrm')}
					</div>
				</div>
			</div>

			{/* Alignment */}
			<AlignmentControl
				value={props.align}
				onChange={(align) => {
					if (align !== 'full') {
						onChange({ align });
					}
				}}
			/>

			{/* Shape */}
			<div className="flex flex-col gap-2 text-[#333333]">
				<div className="text-sm font-medium">
					{__('Shape', 'quillcrm')}
				</div>
				<div className="flex items-center justify-between border rounded-lg">
					<div
						className={cn(
							'py-2 px-4 w-full text-center cursor-pointer text-sm',
							props.shape === 'circle' &&
								'bg-[#C6DFF366] border border-primary rounded-l-lg'
						)}
						onClick={() => onChange({ shape: 'circle' })}
					>
						{__('Circle', 'quillcrm')}
					</div>
					<div
						className={cn(
							'py-2 px-4 w-full text-center cursor-pointer text-sm',
							props.shape === 'rounded' &&
								'bg-[#C6DFF366] border border-primary'
						)}
						onClick={() => onChange({ shape: 'rounded' })}
					>
						{__('Rounded', 'quillcrm')}
					</div>
					<div
						className={cn(
							'py-2 px-4 w-full text-center cursor-pointer text-sm',
							props.shape === 'square' &&
								'bg-[#C6DFF366] border border-primary rounded-r-lg'
						)}
						onClick={() => onChange({ shape: 'square' })}
					>
						{__('Square', 'quillcrm')}
					</div>
				</div>
			</div>

			{/* Icon Color */}
			<div className="flex flex-col gap-2 text-[#333333]">
				<div className="text-sm font-medium">
					{__('Icon Color', 'quillcrm')}
				</div>
				<div className="flex items-center justify-between border rounded-lg">
					<div
						className={cn(
							'py-2 px-4 w-full text-center cursor-pointer text-sm',
							props.colorMode === 'original' &&
								'bg-[#C6DFF366] border border-primary rounded-l-lg'
						)}
						onClick={() =>
							onChange({ colorMode: 'original', color: '' })
						}
					>
						{__('Original', 'quillcrm')}
					</div>
					<div
						className={cn(
							'py-2 px-4 w-full text-center cursor-pointer text-sm',
							props.colorMode === 'colored' &&
								'bg-[#C6DFF366] border border-primary rounded-r-lg'
						)}
						onClick={() => onChange({ colorMode: 'colored' })}
					>
						{__('Colored', 'quillcrm')}
					</div>
				</div>
				{props.colorMode === 'colored' && (
					<ColorPickerControl
						value={props.color}
						onChange={(color) => onChange({ color })}
						label=""
						id="icon-color"
						placeholder="#000000"
					/>
				)}
			</div>

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
