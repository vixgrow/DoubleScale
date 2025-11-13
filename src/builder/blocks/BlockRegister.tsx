import TextBlock from './basic/TextBlock';
import ImageBlock from './basic/ImageBlock';
import ButtonBlock from './basic/ButtonBlock';
import DividerBlock from './basic/DividerBlock';
import HtmlBlock from './basic/HtmlBlock';
import BannerBlock from './basic/BannerBlock';
import MenuBlock from './basic/MenuBlock';
import PreheaderBlock from './basic/PreheaderBlock';
import UnknownBlock from './basic/UnknownBlock';
import SocialMediaBlock from './basic/SocialMediaBlock';
import TimerBlock from './basic/TimerBlock';
import VideoBlock from './basic/VideoBlock';
import ProductBlock from './basic/ProductBlock';

/**
 * Core registry - mutable to allow Pro plugin extension
 */
export let blocksRegistry: Record<string, any> = {
	image: ImageBlock,
	text: TextBlock,
	button: ButtonBlock,
	divider: DividerBlock,
	html: HtmlBlock,
	banner: BannerBlock,
	menu: MenuBlock,
	preheader: PreheaderBlock,
	social_media: SocialMediaBlock,
	timer: TimerBlock,
	video: VideoBlock,
	product: ProductBlock,
	unknown: UnknownBlock,
};

export const registerBlocks = (blocks: Record<string, any>) => {
	blocksRegistry = {
		...blocksRegistry,
		...blocks,
	};
};

/**
 * Get the current registry
 */
export const getBlocksRegistry = () => blocksRegistry;
