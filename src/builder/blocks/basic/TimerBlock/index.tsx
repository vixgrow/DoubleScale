/**
 * wordpress dependencies
 */
import { __ } from '@wordpress/i18n';
/**
 * internal dependencies
 */
import { TimerBlockIcon } from '@quillcrm/components';
import { TimerBlockRenderer } from './Renderer';
import { TimerBlockEditor } from './Editor';

export interface TimerBlockProps {
	content: string;
	fontSize: number;
	color: string;
	align: string;
}

const TimerBlock = {
	type: 'timer',
	name: __('Timer', 'quillcrm'),
	icon: TimerBlockIcon,
	defaultProps: {
		content: 'Your text here',
		fontSize: 16,
		color: '#333',
		align: 'center',
	} as TimerBlockProps,
	Renderer: TimerBlockRenderer,
	Editor: TimerBlockEditor,
};

export default TimerBlock;
