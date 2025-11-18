/**
 * wordpress dependencies
 */
import { __ } from '@wordpress/i18n';
/**
 * internal dependencies
 */
import { TimerBlockIcon } from '@quillcrm/components';

const TimerBlock = {
	type: 'timer',
	name: __('Timer', 'quillcrm'),
	icon: TimerBlockIcon,
	isProActivated: false,
	isPro: true,
};

export default TimerBlock;
