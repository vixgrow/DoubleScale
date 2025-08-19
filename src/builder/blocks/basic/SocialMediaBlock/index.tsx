/**
 * wordpress dependencies
 */
import { __ } from '@wordpress/i18n';
/**
 * internal dependencies
 */
import { SocialMediaBlockIcon } from '@quillcrm/components';
import { SocialMediaBlockRenderer } from './Renderer';
import { SocialMediaBlockEditor } from './Editor';

export interface SocialMediaBlockProps {
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
}

const SocialMediaBlock = {
	type: 'social_media',
	name: __('Social Media', 'quillcrm'),
	icon: SocialMediaBlockIcon,
	defaultProps: {
		platforms: {
			facebook: { enabled: true, link: 'https://facebook.com' },
			x: { enabled: true, link: 'https://x.com' },
			threads: { enabled: false, link: '' },
			instagram: { enabled: true, link: 'https://instagram.com' },
			youtube: { enabled: false, link: '' },
			pinterest: { enabled: false, link: '' },
			spotify: { enabled: false, link: '' },
			snapchat: { enabled: false, link: '' },
			soundcloud: { enabled: false, link: '' },
			mail: { enabled: false, link: '' },
			website: { enabled: false, link: '' },
			vimeo: { enabled: false, link: '' },
			medium: { enabled: false, link: '' },
			tiktok: { enabled: true, link: 'https://tiktok.com' },
			discord: { enabled: false, link: '' },
			linkedin: { enabled: false, link: '' },
		},
		iconSize: 'medium',
		align: 'center',
		shape: 'circle',
		colorMode: 'original',
		color: '',
		padding: {
			top: 16,
			right: 16,
			bottom: 16,
			left: 16,
		},
	} as SocialMediaBlockProps,
	Renderer: SocialMediaBlockRenderer,
	Editor: SocialMediaBlockEditor,
};

export default SocialMediaBlock;
