/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import {
	Header,
	SettingsPaymentIcon,
	TabButtons,
} from '@/components/booking';
import {
	Payments,
} from './tabs';
import {
	useCurrentUser,
	useNavigate,
	useNotice,
	useTabs,
} from '@/hooks/booking';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

/**
 * Integration component
 * Parent component for all integrations tabs
 */

const Integrations: React.FC = () => {
	const { isAdmin } = useCurrentUser();
	const canManageAllCalendars = useCurrentUser().hasCapability(
		'doublescale_booking_manage_all_calendars'
	);
	const navigate = useNavigate();
	const { errorNotice } = useNotice();

	// Valid tabs based on user capabilities. SMS integration is configured at
	// the CRM-wide level (Modules/Integrations/Twilio) and intentionally not
	// surfaced here — see RestBookingSettingsController::get_sms_provider_status()
	// for the gate the SMS-notifications event tab uses.
	const validTabs = canManageAllCalendars
		? [
			'payments',
		]
		: ['payments'];

	const { activeTab, handleTabChange } = useTabs({
		defaultTab: 'payments',
		validTabs,
		urlParam: 'tab',
		updateUrl: true,
	});

	useEffect(() => {
		if (!isAdmin()) {
			errorNotice(
				__(
					'You do not have permission to access this page',
					'doublescale'
				)
			);
			navigate('booking/calendars');
			return;
		}
	}, []);

	const renderTabContent = () => {
		switch (activeTab) {
			case 'payments':
				return <Payments />;
			default:
				return <Payments />;
		}
	};

	const items = [
		{
			key: 'payments',
			label: __('Payments', 'doublescale'),
			icon: <SettingsPaymentIcon width={20} height={20} />,
		},
	];

	if (canManageAllCalendars) {
		items.push(
			{
				key: 'payments',
				label: __('Payments', 'doublescale'),
				icon: <SettingsPaymentIcon width={20} height={20} />,
			}
		);
	}

	return (
		<div className="doublescale-booking-integrations-page">
			<Header
				header={__('Integrations', 'doublescale')}
				subHeader={__(
					'Connect Quill Booking to your tools and apps to enhance your scheduling automations.',
					'doublescale'
				)}
			/>
			<div className='flex flex-col gap-5 integrations-container'>
				<Card className="mt-5"><CardContent>
					<div className='flex gap-[15px] items-center justify-start'>
						{items.map(({ key, label, icon }) => (
							<Button
								key={key}
								onClick={() => handleTabChange(key)}
								className={`${activeTab === key ? 'bg-tertiary' : ''}`}
								variant='ghost'
							>
								<TabButtons
									label={label}
									icon={icon}
									isActive={activeTab === key}
								/>
							</Button>
						))}
					</div>
				</CardContent></Card>
				<div className='flex'>{renderTabContent()}</div>
			</div>
		</div>
	);
};

export default Integrations;
