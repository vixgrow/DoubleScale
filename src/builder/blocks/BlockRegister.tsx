import TextBlock from './basic/TextBlock';
import ImageBlock from './basic/ImageBlock';
import ButtonBlock from './basic/ButtonBlock';
import DividerBlock from './basic/DividerBlock';
import SocialMediaBlock from './basic/SocialMediaBlock';
import TimerBlock from './basic/TimerBlock';
import VideoBlock from './basic/VideoBlock';
// import TableBlock from './basic/TableBlock';
// import SignatureBlock from './basic/SignatureBlock';
import BannerBlock from './basic/BannerBlock';
import MenuBlock from './basic/MenuBlock';
import HtmlBlock from './basic/HtmlBlock';
import PreheaderBlock from './basic/PreheaderBlock';
import ProductBlock from './basic/ProductBlock';

export const blocksRegistry = {
	image: ImageBlock,
	text: TextBlock,
	button: ButtonBlock,
	divider: DividerBlock,
	social_media: SocialMediaBlock,
	html: HtmlBlock,
	timer: TimerBlock,
	video: VideoBlock,
	// table: TableBlock,
	// signature: SignatureBlock,
	banner: BannerBlock,
	menu: MenuBlock,
	preheader: PreheaderBlock,
	product: ProductBlock,
};
