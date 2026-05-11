/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState, useEffect } from '@wordpress/element';
import { addQueryArgs } from '@wordpress/url';

/**
 * Internal dependencies
 */
import { Availability } from '@/types/booking';
import { useApi } from '@/hooks/booking';
import {
	ClockIcon,
	GlobalIcon,
	NoDataComponent,
	TagComponent,
	NoticeBanner,
} from '@/components/booking';
import AvailabilityActions from './availability-actions';

import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface AvailabilityListProps {
	showAllSchedules: boolean;
	openAvailabilityModal: (open: boolean) => void;
}

interface NoticeType {
	type: 'success' | 'error';
	title: string;
	message: string;
}

const AvailabilityList: React.FC<AvailabilityListProps> = ({
	showAllSchedules,
	openAvailabilityModal,
}) => {
	const { callApi } = useApi();
	const [availabilities, setAvailabilities] = useState<
		Partial<Availability>[]
	>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [notice, setNotice] = useState<NoticeType | null>(null);

	const fetchAvailabilities = async () => {
		setIsLoading(true);
		callApi({
			path: addQueryArgs(
				'availabilities',
				showAllSchedules ? { filter: { user: 'all' } } : {}
			),
			method: 'GET',
			onSuccess: (data) => {
				setAvailabilities(data);
				setIsLoading(false);
			},
			onError: () => {
				setNotice({
					type: 'error',
					title: __('Error', 'doublescale'),
					message: __(
						'Failed to load availabilities',
						'doublescale'
					),
				});
				setIsLoading(false);
			},
		});
	};

	useEffect(() => {
		fetchAvailabilities();
	}, [showAllSchedules]);

	if (isLoading) {
		return (
            <>
                {[1, 2, 3].map((key) => (
					<Card className="my-4" key={key}><CardContent>
                            <Skeleton className='h-4 w-full' />
                        </CardContent></Card>
				))}
            </>
        );
	}

	if (availabilities.length === 0) {
		return (
			<NoDataComponent
				setOpen={() => openAvailabilityModal(true)}
				header={__('No availabilities found', 'doublescale')}
				description={__(
					'You have not created any availabilities yet.',
					'doublescale'
				)}
				buttonText={__('Create Availability', 'doublescale')}
				icon={<ClockIcon width={80} height={80} />}
			/>
		);
	}

	return (
        <div>
            {notice && (
				<NoticeBanner
					notice={notice}
					closeNotice={() => setNotice(null)}
				/>
			)}
            <ul className="flex flex-col">
                {Object.values(availabilities).map((availability) => (
                    <li key={availability.id} className="list-none">
                        <Card className="my-4"><CardContent>
                            <div className="flex items-center justify-between w-full">
                                <div className="flex flex-col gap-1">
                                    <div className="flex items-center gap-2">
                                        <h3 className="m-0">{availability.name}</h3>
                                        {availability.is_default && (
                                            <TagComponent
                                                label={__('Default', 'doublescale')}
                                            />
                                        )}
                                    </div>
                                    <div className="flex gap-2 items-center text-muted-foreground text-sm">
                                        <GlobalIcon />
                                        {availability.timezone}
                                    </div>
                                </div>

                                <AvailabilityActions
                                    availabilityId={availability.id || 0}
                                    availabilities={availabilities}
                                    setAvailabilities={setAvailabilities}
                                    isAvailabilityDefault={
                                        availability.is_default || false
                                    }
                                    eventsCount={availability.events_count || 0}
                                    setNotice={setNotice}
                                />
                            </div>
                        </CardContent></Card>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default AvailabilityList;
