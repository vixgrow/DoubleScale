/**
 * wordpress dependencies
 */

/**
 * external dependencies
 */
import { cn } from '@/lib/utils';

/**
 * internal dependencies
 */
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

export interface SocialMediaBlockRendererProps {
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
}

const socialMediaIcons = {
	facebook: FacebookIcon,
	x: XIcon,
	threads: ThreadsIcon,
	instagram: InstagramIcon,
	youtube: YoutubeIcon,
	pinterest: PinterestIcon,
	spotify: SpotifyIcon,
	snapchat: SnapchatIcon,
	soundcloud: SoundCloudIcon,
	mail: MailIcon,
	website: WebsiteIcon,
	vimeo: VimeoIcon,
	medium: MediumIcon,
	tiktok: TiktokIcon,
	discord: DiscordIcon,
	linkedin: LinkedinIcon,
};

const getIconSize = (size: 'small' | 'medium' | 'large') => {
	switch (size) {
		case 'small':
			return { width: 24, height: 24 };
		case 'medium':
			return { width: 32, height: 32 };
		case 'large':
			return { width: 40, height: 40 };
		default:
			return { width: 32, height: 32 };
	}
};

const getAlignmentClass = (align: 'left' | 'center' | 'right') => {
	switch (align) {
		case 'left':
			return 'justify-start';
		case 'center':
			return 'justify-center';
		case 'right':
			return 'justify-end';
		default:
			return 'justify-center';
	}
};

export const SocialMediaBlockRenderer: React.FC<
	SocialMediaBlockRendererProps
> = ({ props }) => {
	const enabledPlatforms = Object.entries(props.platforms).filter(
		([_, data]) => data.enabled
	);
	const iconSize = getIconSize(props.iconSize);
	const alignmentClass = getAlignmentClass(props.align);

	if (enabledPlatforms.length === 0) {
		return null;
	}

	return (
		<div
			style={{
				padding: `${props.padding?.top || 0}px ${props.padding?.right || 0}px ${props.padding?.bottom || 0}px ${props.padding?.left || 0}px`,
			}}
		>
			<div className={cn('flex', alignmentClass)}>
				<div className="flex flex-wrap gap-4 justify-center max-w-full" style={{ maxWidth: `${(iconSize.width + 16) * 6}px` }}>
					{enabledPlatforms.map(([platformKey, platformData]) => {
						const IconComponent =
							socialMediaIcons[
							platformKey as keyof typeof socialMediaIcons
							];

						if (!IconComponent) {
							return null;
						}

						return (
							<a
								key={platformKey}
								href={platformData.link || '#'}
								target="_blank"
								rel="noopener noreferrer"
								className="inline-flex items-center justify-center transition-transform hover:scale-110"
								style={{
									width: iconSize.width,
									height: iconSize.height,
								}}
							>
								<IconComponent
									width={iconSize.width}
									height={iconSize.height}
									shape={props.shape}
									color={props.colorMode === 'colored' ? props.color : undefined}
								/>
							</a>
						);
					})}
				</div>
			</div>
		</div>
	);
};
