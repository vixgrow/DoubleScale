/**
 * Wordpress dependencies
 */
import { __ } from '@wordpress/i18n';

import { filter } from 'lodash';

/**
 * Internal dependencies
 */
import { Availability } from '@/types/booking';
import { useApi, useNavigate } from '@/hooks/booking';
import { NavLink as Link } from '@doublescale/navigation';
import {
	ConfirmationModal,
	CopyWhiteIcon,
	EditAvailabilityIcon,
	TrashIcon,
} from '@/components/booking';
import { useState } from '@wordpress/element';

interface AvailabilityActionsProps {
	availabilityId: number;
	availabilities: Partial<Availability>[];
	setAvailabilities: (availabilities: Partial<Availability>[]) => void;
	isAvailabilityDefault: boolean;
	eventsCount: number;
	setNotice: (
		notice: {
			type: 'success' | 'error';
			title: string;
			message: string;
		} | null
	) => void;
}

const AvailabilityActions: React.FC<AvailabilityActionsProps> = ({
	availabilityId,
	availabilities,
	setAvailabilities,
	isAvailabilityDefault,
	eventsCount,
	setNotice,
}) => {
	const navigate = useNavigate();
	const { callApi } = useApi();
	const [showConfirmation, setShowConfirmation] = useState(false);

	const deleteAvailability = async (availabilityId: number) => {
		try {
			if (isAvailabilityDefault) {
				setNotice({
					type: 'error',
					title: __('Error', 'doublescale'),
					message: __(
						'You cannot delete the default availability. Please set another availability as default first.',
						'doublescale'
					),
				});
				return;
			}

			await callApi({
				path: `availabilities/${availabilityId}`,
				method: 'DELETE',
				onSuccess: () => {
					const updatedAvailability = filter(
						availabilities,
						(a) => a.id !== availabilityId
					);
					setAvailabilities(updatedAvailability);
					setNotice({
						type: 'success',
						title: __('Success', 'doublescale'),
						message: __(
							'Availability deleted successfully',
							'doublescale'
						),
					});
				},
				onError: () => {
					setNotice({
						type: 'error',
						title: __('Error', 'doublescale'),
						message: __(
							'Failed to delete availability',
							'doublescale'
						),
					});
				},
			});
		} catch (error) {
			console.error('Error in deleteAvailability:', error);
			setNotice({
				type: 'error',
				title: __('Error', 'doublescale'),
				message: __(
					'An unexpected error occurred while deleting the availability',
					'doublescale'
				),
			});
		}
	};

	const setCloneAvailability = async (availabilityId: number) => {
		try {
			await callApi({
				path: `availabilities/${availabilityId}/clone`,
				method: 'POST',
				onSuccess: (data) => {
					navigate(`booking/availability/${data.id}`);
					setNotice({
						type: 'success',
						title: __('Success', 'doublescale'),
						message: __(
							'Availability duplicated successfully',
							'doublescale'
						),
					});
				},
				onError: () => {
					setNotice({
						type: 'error',
						title: __('Error', 'doublescale'),
						message: __(
							'Failed to duplicate availability',
							'doublescale'
						),
					});
				},
			});
		} catch (error) {
			console.error('Error in setCloneAvailability:', error);
			setNotice({
				type: 'error',
				title: __('Error', 'doublescale'),
				message: __(
					'An unexpected error occurred while duplicating the availability',
					'doublescale'
				),
			});
		}
	};

	const getTitle = () => {
		if (eventsCount > 0) {
			return __(
				'This availability is used by some events and can not be deleted',
				'doublescale'
			);
		}

		if (isAvailabilityDefault) {
			return __(
				'You cannot delete the default availability. Please set another availability as default first.',
				'doublescale'
			);
		}

		return __(
			'Are you sure you want to delete this availability?',
			'doublescale'
		);
	};

	const getDescription = () => {
		if (eventsCount > 0 || isAvailabilityDefault) {
			return '';
		}

		return __(
			"By deleting this availability you won't be able to restore it again!",
			'doublescale'
		);
	};

	return (
        <div className='flex gap-2.5 items-center'>
            <Link to={`booking/availability/${availabilityId}`}>
				<div className="border border-[#EDEBEB] p-2 rounded-lg cursor-pointer">
					<EditAvailabilityIcon width={20} height={20} />
				</div>
			</Link>
            <div
				className="border border-[#EDEBEB] p-2 rounded-lg cursor-pointer"
				onClick={() => setCloneAvailability(availabilityId)}
			>
				<CopyWhiteIcon width={21} height={21} />
			</div>
            <div
				className="border border-[#EDEBEB] p-2 rounded-lg cursor-pointer text-[#B3261E]"
				onClick={() => setShowConfirmation(true)}
			>
				<TrashIcon width={20} height={22} />
			</div>
            <ConfirmationModal
				title={getTitle()}
				description={getDescription()}
				onSave={() => deleteAvailability(availabilityId)}
				showModal={showConfirmation}
				setShowModal={setShowConfirmation}
				isSaveBtnDisabled={eventsCount > 0 || isAvailabilityDefault}
			/>
        </div>
    );
};

export default AvailabilityActions;
