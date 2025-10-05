import { withProps } from '@udecode/cn';
import {
	usePlateEditor,
	Plate,
	ParagraphPlugin,
	PlateLeaf,
	KEYS,
} from '@udecode/plate-common/react';
import {
	BoldPlugin,
	ItalicPlugin,
	StrikethroughPlugin,
	SubscriptPlugin,
	SuperscriptPlugin,
	UnderlinePlugin,
} from '@udecode/plate-basic-marks/react';
import { HEADING_KEYS } from '@udecode/plate-heading';
import { HighlightPlugin } from '@udecode/plate-highlight/react';
import { LinkPlugin } from '@udecode/plate-link/react';
// import {
//     MentionInputPlugin,
//     MentionPlugin,
// } from '@udecode/plate-mention/react';

import { useDispatch } from '@wordpress/data';

import { editorPlugins } from './components/plugins/editor-plugins';
import { FixedToolbarPlugin } from './components/plugins/fixed-toolbar-plugin';
import { HeadingElement } from './components/plate-ui/heading-element';
import { HighlightLeaf } from './components/plate-ui/highlight-leaf';
import { LinkElement } from './components/plate-ui/link-element';
import { MentionElement } from './components/plate-ui/mention-element';
import { MentionInputElement } from './components/plate-ui/mention-input-element';
import { ParagraphElement } from './components/plate-ui/paragraph-element';
import { withPlaceholders } from './components/plate-ui/placeholder';
import { at, keys } from 'lodash';

import { KeyHandlingPlugin } from './key-handling-plugin';

export const useCreateEditor = () => {
	// Note: Removed legacy email-editor store dependency
	// Block insertion is now handled by the modern email-builder store
	return usePlateEditor({
		override: {
			components: withPlaceholders({
				[BoldPlugin.key]: withProps(PlateLeaf, { as: 'strong' }),
				[HEADING_KEYS.h1]: withProps(HeadingElement, { variant: 'h1' }),
				[HEADING_KEYS.h2]: withProps(HeadingElement, { variant: 'h2' }),
				[HEADING_KEYS.h3]: withProps(HeadingElement, { variant: 'h3' }),
				[HEADING_KEYS.h4]: withProps(HeadingElement, { variant: 'h4' }),
				[HEADING_KEYS.h5]: withProps(HeadingElement, { variant: 'h5' }),
				[HEADING_KEYS.h6]: withProps(HeadingElement, { variant: 'h6' }),
				[HighlightPlugin.key]: HighlightLeaf,
				[ItalicPlugin.key]: withProps(PlateLeaf, { as: 'em' }),
				[LinkPlugin.key]: LinkElement,
				// [MentionInputPlugin.key]: MentionInputElement,
				// [MentionPlugin.key]: MentionElement,
				[ParagraphPlugin.key]: ParagraphElement,
				[StrikethroughPlugin.key]: withProps(PlateLeaf, { as: 's' }),
				[SubscriptPlugin.key]: withProps(PlateLeaf, { as: 'sub' }),
				[SuperscriptPlugin.key]: withProps(PlateLeaf, { as: 'sup' }),
				[UnderlinePlugin.key]: withProps(PlateLeaf, { as: 'u' }),
			}),
		},
		plugins: [
			...editorPlugins,
			// FixedToolbarPlugin,
			KeyHandlingPlugin,
		],
		value: [
			{
				children: [{ text: 'Playground' }],
				type: 'h1',
			},
		],
	});
};
