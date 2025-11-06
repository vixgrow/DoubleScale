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
	// Timer settings
	targetDate: string;
	targetHour: number;
	targetMinute: number;
	timezone: string;

	// Display settings
	width: string;
	link: string;
	altText: string;

	// Styling
	backgroundColor: string;
	digitsFontFamily: string;
	digitsFontSize: number;
	digitsColor: string;
	separatorFontFamily: string;
	separatorFontSize: number;
	separatorColor: string;
	padding: {
		top: number;
		right: number;
		bottom: number;
		left: number;
	};

	// Legacy properties (keeping for backward compatibility)
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
		// Timer settings
		targetDate: '',
		targetHour: 0,
		targetMinute: 0,
		timezone: 'UTC',

		// Display settings
		width: '100',
		link: '',
		altText: '',

		// Styling
		backgroundColor: '#ffffff',
		digitsFontFamily: 'Arial, sans-serif',
		digitsFontSize: 24,
		digitsColor: '#333333',
		separatorFontFamily: 'Arial, sans-serif',
		separatorFontSize: 24,
		separatorColor: '#333333',
		padding: {
			top: 20,
			right: 20,
			bottom: 20,
			left: 20,
		},

		// Legacy properties
		content: 'Your text here',
		fontSize: 16,
		color: '#333',
		align: 'center',
	} as TimerBlockProps,
	Renderer: TimerBlockRenderer,
	Editor: TimerBlockEditor,
};

export default TimerBlock;
