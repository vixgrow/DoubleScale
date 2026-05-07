/**
 * wordpress dependencies
 */
import { __ } from '@wordpress/i18n';
/**
 * internal dependencies
 */
import { TimerBlockIcon } from '@doublescale/components';

const TimerBlock = {
	type: 'timer',
	name: __('Timer', 'doublescale'),
	icon: TimerBlockIcon,
	isProActivated: false,
	isPro: true,
};

export default TimerBlock;
