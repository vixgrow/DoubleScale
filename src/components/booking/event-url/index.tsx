import ConfigAPI from '@/config/booking';
import { __ } from '@wordpress/i18n';
import { CopyWhiteIcon } from '../icons';
import { useCopyToClipboard } from '@/hooks/booking';

const EventUrl: React.FC<{
	calendarSlug: string;
	eventSlug: string;
	className?: string;
}> = ({ calendarSlug, eventSlug, className }) => {
	const copyToClipboard = useCopyToClipboard();
	const siteUrl = ConfigAPI.getSiteUrl();
	// `calendarSlug` retained as a prop for backward compatibility with existing
	// call sites — the public route resolves the calendar from the event slug.
	void calendarSlug;
	const url = `${siteUrl}?doublescale_booking_event=${eventSlug}`;
	return (
		<>
			<a target="_blank" href={url} className={`${className || ''}`}>
				{__('Event URL', 'doublescale')}
			</a>
			<span
				className="flex items-center gap-1 ml-1 text-primary cursor-pointer flex-shrink-0 text-sm"
				onClick={() =>
					copyToClipboard(url, __('Event URL copied', 'doublescale'))
				}
			>
				<CopyWhiteIcon width={14} height={14} />
				{__('Copy', 'doublescale')}
			</span>
		</>
	);
};

export default EventUrl;
