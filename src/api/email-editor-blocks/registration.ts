/* eslint-disable no-console */

/**
 * WordPress Dependencies
 */
import { select, dispatch } from '@wordpress/data';

/**
 * External Dependencies
 */
import { pick, isPlainObject } from 'lodash';

/**
 * Internal Dependencies
 */
import { setBlockAdminSettings } from './set-block-admin-settings';
import type { BlockTypeSettings } from '../../stores/email-editor-blocks/types.js';


/**
 * Registers a new block provided a unique name and an object defining its
 * behavior. Once registered, the block is made available as an option to any
 * editor interface where blocks are implemented.
 *
 * @param  name     Block name.
 * @param  settings Block settings.
 *
 * @return The block settings, if it has been successfully registered;
 * otherwise `undefined`.
 */
export const registerBlockType = (
	name: string,
	settings: BlockTypeSettings
): BlockTypeSettings | undefined => {

	if (typeof name !== 'string') {
		console.error('Block names must be strings.');
		return;
	}



	// if (select('quillcrm/email-editor-blocks').getBlockType(name)) {
	// 	console.error('Block "' + name + '" is already registered.');
	// 	return;
	// }

	let { attributes } = settings;

	if (!attributes || !isPlainObject(attributes)) {
		attributes = {};
	}

	settings.attributes = attributes;

	dispatch('quillcrm/email-editor-blocks').addBlockTypes({
		name,
		...pick(settings, ['attributes', 'edit', 'icon', 'title']),
	});
	return settings;
};

/**
 * Returns a registered block type.
 *
 * @param {string} name Block name.
 *
 * @return {?BlockTypeSettingss} Block type.
 */
export function getBlockType(name: string): BlockTypeSettings | undefined {
	return select('quillcrm/email-editor-blocks').getBlockType(name);
}
