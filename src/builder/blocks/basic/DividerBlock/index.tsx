/**
 * wordpress dependencies
 */
import { __ } from '@wordpress/i18n';
/**
 * internal dependencies
 */
import { DividerBlockIcon } from '@quillcrm/components';

const DividerBlock = {
	type: 'divider' as const,
	name: __('Divider', 'quillcrm'),
	icon: DividerBlockIcon,
	isProActivated: false,
	isPro: true,
};

export default DividerBlock;
