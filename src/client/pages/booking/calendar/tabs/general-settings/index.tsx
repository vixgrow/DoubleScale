/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import {
	TimezoneSelect,
	CardHeader,
	AdvancedSettingsIcon,
	HostSelect,
} from '@/components/booking';
import { useBreadcrumbs } from '@/hooks/booking';
import { useCalendarContext } from '../../state/context';
import AvatarSelector from './avatar-selector';
import FeaturedImageSelector from './featured-image-selector';

import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Main Calendars Component.
 */
const GeneralSettings: React.FC = () => {
	const { state, actions } = useCalendarContext();
	const setBreadcrumbs = useBreadcrumbs();

	useEffect(() => {
		if (!state) {
			return;
		}

		setBreadcrumbs([
			{
				path: `calendars/${state.id}/general`,
				title: __('Settings', 'doublescale'),
			},
		]);
	}, [state]);

	if (!state) {
		return <Skeleton className='h-4 w-full' />;
	}

	const handleChange = (key: string, value: any) => {
		actions.setCalendar({ ...state, [key]: value });
	};

	return (
        <Card className="doublescale-booking-calendar-settings"><CardContent>
                <CardHeader
                    title={__('General Host Settings', 'doublescale')}
                    description={__(
                        'Manage general settings for this calendar.',
                        'doublescale'
                    )}
                    icon={<AdvancedSettingsIcon />}
                    border={false}
                />
                <Card className="mb-2"><CardContent>
                        <div className='flex flex-col gap-5'>
                            <FeaturedImageSelector
                                value={state.featured_image}
                                onChange={(value) =>
                                    handleChange('featured_image', value)
                                }
                            />
                            <div className='flex flex-col mx-auto md:flex-row justify-center  md:justify-between items-center md:items-start w-full gap-5'>
                                <AvatarSelector
                                    value={state.avatar}
                                    onChange={(value) => handleChange('avatar', value)}
                                />
                                <div className='flex flex-col gap-[50px] w-full min-w-0'>
                                    <div className='flex flex-col gap-1'>
                                        <div className="text-base font-semibold">
                                            {__(
                                                'Host Name / Calendar Title',
                                                'doublescale'
                                            )}
                                        </div>
                                        <Input
                                            value={state.name}
                                            onChange={(e) =>
                                                handleChange('name', e.target.value)
                                            }
                                            placeholder={__(
                                                'Host Name / Calendar Title',
                                                'doublescale'
                                            )}
                                            className="rounded-lg h-[48px]"
                                        />
                                    </div>
                                    <div className='flex flex-col gap-1'>
                                        <div className="text-base font-semibold">
                                            {__('About', 'doublescale')}
                                        </div>
                                        <Textarea
                                            value={state.description}
                                            rows={6}
                                            onChange={(e) =>
                                                handleChange(
                                                    'description',
                                                    e.target.value
                                                )
                                            }
                                            placeholder={__(
                                                'Type your a description for this calendar',
                                                'doublescale'
                                            )}
                                            className="rounded-lg"
                                        />
                                        <div className="text-[#9197A4]">
                                            {__(
                                                'Will be shown on your calendar landing page / team block UI',
                                                'doublescale'
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <Card className="mt-4"><CardContent>
                                    <div className='flex flex-col gap-2'>
                                        <div className='flex flex-col gap-1'>
                                            <div className="text-base font-semibold">
                                                {__('Host Timezone', 'doublescale')}
                                            </div>
                                            <TimezoneSelect
                                                value={state.timezone}
                                                onChange={(value) =>
                                                    handleChange('timezone', value)
                                                }
                                            />
                                        </div>
                                        {state.type === 'team' && (
                                            <div className='flex flex-col gap-1 mt-4'>
                                                <div className="text-base font-semibold">
                                                    {__('Team Members', 'doublescale')}
                                                </div>
                                                <HostSelect
                                                    value={state.team_members || []}
                                                    onChange={(value) =>
                                                        handleChange('team_members', value)
                                                    }
                                                    multiple
                                                    placeholder={__(
                                                        'Select team members…',
                                                        'doublescale'
                                                    )}
                                                />
                                                <div className="text-[#9197A4]">
                                                    {__(
                                                        'Add or remove members from this team. Only CRM team members appear here.',
                                                        'doublescale'
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                        {/* <Divider /> */}
                                        {/* <Checkbox
                                            className="custom-check text-base font-semibold"
                                            checked={state.enable_landing_page || false}
                                            onChange={(e) =>
                                                handleChange(
                                                    'enable_landing_page',
                                                    e.target.checked
                                                )
                                            }
                                        >
                                            {__(
                                                'Enable Landing Page Features for this calendar',
                                                'doublescale'
                                            )}
                                        </Checkbox>
                                        <Flex vertical gap={6} className="mt-4">
                                            <div className="text-base font-semibold">
                                                {__(
                                                    'Which Booking Forms to Show?',
                                                    'doublescale'
                                                )}
                                            </div>
                                            <Radio.Group
                                                value={bookingForms}
                                                onChange={(e) =>
                                                    setBookingForms(e.target.value)
                                                }
                                                className="flex"
                                            >
                                                <Radio
                                                    value="all"
                                                    className={`custom-radio border w-[300px] rounded-lg p-3 font-semibold cursor-pointer transition-all duration-300 text-[#3F4254]
                                            ${
                                                bookingForms === 'all'
                                                    ? 'bg-secondary border-primary'
                                                    : 'border'
                                            }`}
                                                >
                                                    {__(
                                                        'All Active Booking Forms',
                                                        'doublescale'
                                                    )}
                                                </Radio>
                                                <Radio
                                                    value="select"
                                                    className={`custom-radio border w-[300px] rounded-lg p-3 font-semibold cursor-pointer transition-all duration-300 text-[#3F4254]
                                            ${
                                                bookingForms === 'select'
                                                    ? 'bg-secondary border-primary'
                                                    : 'border'
                                            }`}
                                                >
                                                    {__(
                                                        'Only Selected Active Booking Types',
                                                        'doublescale'
                                                    )}
                                                </Radio>
                                            </Radio.Group>
                                        </Flex> */}
                                    </div>
                                </CardContent></Card>
                        </div>
                    </CardContent></Card>
            </CardContent></Card>
    );
};

export default GeneralSettings;
