import { TextBlock } from './basic/TextBlock';
import { ImageBlock } from './basic/ImageBlock';
import { ButtonBlock } from './basic/ButtonBlock';
import { DividerBlock } from './basic/DividerBlock';

export const blocksRegistry = {
	text: TextBlock,
	image: ImageBlock,
	button: ButtonBlock,
	divider: DividerBlock,
};
