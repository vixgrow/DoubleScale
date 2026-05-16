import type { Reducer } from 'redux';
import { __ } from '@wordpress/i18n';
import {
  BannerBlockIcon,
  DividerBlockIcon,
  HtmlBlockIcon,
  ImageBlockIcon,
  MenuBlockIcon,
  PreheaderBlockIcon,
  ProductBlockIcon,
  SignatureBlockIcon,
  SocialMediaBlockIcon,
  TableBlockIcon,
  TimerBlockIcon,
  VideoBlockIcon,
} from '@doublescale/components';
import ButtonBlock from '@/builder/blocks/basic/ButtonBlock';
import TextBlock from '@/builder/blocks/basic/TextBlock';
import UnknownBlock from '@/builder/blocks/basic/UnknownBlock';
import { REGISTER_BLOCKS } from './constants';
import type { BlocksRegistryActionTypes, BlocksRegistryState } from './types';

// Free ships text + button as the two core blocks. The rest are registered as
// Pro stubs (name + icon + isPro: true) so they appear in the blocks sidebar
// with a Pro badge — mirroring how the libraries panel surfaces locked items.
// Pro extends the registry at boot via `registerBlocks({ ... })` from
// DoubleScale-Pro/src/client/index.tsx, which merges in defaultProps/Renderer/Editor
// and flips isProActivated to true. Unknown is the safety fallback for any
// block type the registry doesn't know about at render time.
const proStub = (type: string, name: string, icon: React.FC<any>) => ({
  type,
  name,
  icon,
  isPro: true,
  isProActivated: false,
}) as any;

const initialState: BlocksRegistryState = {
  blocks: {
    text: { ...TextBlock, type: 'text' } as any,
    button: { ...ButtonBlock, type: 'button' } as any,
    image: proStub('image', __('Image', 'doublescale'), ImageBlockIcon),
    divider: proStub('divider', __('Divider', 'doublescale'), DividerBlockIcon),
    html: proStub('html', __('HTML', 'doublescale'), HtmlBlockIcon),
    banner: proStub('banner', __('Banner', 'doublescale'), BannerBlockIcon),
    menu: proStub('menu', __('Menu', 'doublescale'), MenuBlockIcon),
    preheader: proStub('preheader', __('Preheader', 'doublescale'), PreheaderBlockIcon),
    signature: proStub('signature', __('Signature', 'doublescale'), SignatureBlockIcon),
    social_media: proStub('social_media', __('Social Media', 'doublescale'), SocialMediaBlockIcon),
    table: proStub('table', __('Table', 'doublescale'), TableBlockIcon),
    timer: proStub('timer', __('Timer', 'doublescale'), TimerBlockIcon),
    video: proStub('video', __('Video', 'doublescale'), VideoBlockIcon),
    product: proStub('product', __('Product', 'doublescale'), ProductBlockIcon),
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
