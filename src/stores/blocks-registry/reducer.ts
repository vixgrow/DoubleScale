import type { Reducer } from 'redux';
import BannerBlock from '../../builder/blocks/basic/BannerBlock';
import ButtonBlock from '../../builder/blocks/basic/ButtonBlock';
import DividerBlock from '../../builder/blocks/basic/DividerBlock';
import HtmlBlock from '../../builder/blocks/basic/HtmlBlock';
import ImageBlock from '../../builder/blocks/basic/ImageBlock';
import MenuBlock from '../../builder/blocks/basic/MenuBlock';
import PreheaderBlock from '../../builder/blocks/basic/PreheaderBlock';
import ProductBlock from '../../builder/blocks/basic/ProductBlock';
import SocialMediaBlock from '../../builder/blocks/basic/SocialMediaBlock';
import TextBlock from '../../builder/blocks/basic/TextBlock';
import TimerBlock from '../../builder/blocks/basic/TimerBlock';
import UnknownBlock from '../../builder/blocks/basic/UnknownBlock';
import VideoBlock from '../../builder/blocks/basic/VideoBlock';
import { REGISTER_BLOCKS } from './constants';
import type { BlocksRegistryActionTypes, BlocksRegistryState } from './types';

// Initial state with default blocks
// Ensure all blocks have required properties
const initialState: BlocksRegistryState = {
  blocks: {
    image: { ...ImageBlock, type: 'image' } as any,
    text: { ...TextBlock, type: 'text' } as any,
    button: { ...ButtonBlock, type: 'button' } as any,
    divider: { ...DividerBlock, type: 'divider' } as any,
    html: { ...HtmlBlock, type: 'html' } as any,
    banner: { ...BannerBlock, type: 'banner' } as any,
    menu: { ...MenuBlock, type: 'menu' } as any,
    preheader: { ...PreheaderBlock, type: 'preheader' } as any,
    social_media: { ...SocialMediaBlock, type: 'social_media' } as any,
    timer: { ...TimerBlock, type: 'timer' } as any,
    video: { ...VideoBlock, type: 'video' } as any,
    product: { ...ProductBlock, type: 'product' } as any,
    unknown: { ...UnknownBlock, type: 'unknown', isPro: false, isProActivated: false } as any,
  },
};

const reducer: Reducer<BlocksRegistryState, BlocksRegistryActionTypes> = (
  state = initialState,
  action
) => {
  switch (action.type) {
    case REGISTER_BLOCKS:
      const mergedBlocks = Object.keys(action.blocks).reduce((acc, key) => {
        acc[key] = {
          ...state.blocks[key],
          ...action.blocks[key],
        };
        return acc;
      }, {} as Record<string, any>);

      return {
        ...state,
        blocks: {
          ...state.blocks,
          ...mergedBlocks,
        },
      };
    default:
      return state;
  }
};

export default reducer;

