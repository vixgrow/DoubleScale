/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useNavigate, useCurrentUser, useNotice } from '@/hooks/booking';
import { GeneralSettingsTab } from './tabs';
import { Header } from '@/components/booking';

/**
 * GlobalSettings component
 * Parent component for all settings tabs
 */
const GlobalSettings: React.FC = () => {
	const navigate = useNavigate();
	const { isAdmin } = useCurrentUser();
	const { errorNotice } = useNotice();

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

	if (!isAdmin()) {
		return null;
	}

	return (
        <div className="doublescale-booking-global-settings">
            <Header
				header={__('Settings', 'doublescale')}
				subHeader={__('Global Settings', 'doublescale')}
			/>
            <div className='flex flex-col gap-5 settings-container'>
				<div className='mt-4 w-full'>
					<GeneralSettingsTab />
				</div>
			</div>
        </div>
    );
};

export default GlobalSettings;
