/**
 * WordPress dependencies
 */
import {
	useState,
	useEffect,
	forwardRef,
	useImperativeHandle,
} from '@wordpress/element';
import { __ } from '@wordpress/i18n';

import { Plus as PlusOutlined } from 'lucide-react';

/**
 * Internal dependencies
 */
import { useApi, useNotice, useEvent } from '@/hooks/booking';
import './style.scss';
import {
	CardHeader,
	ProIcon,
	QuestionOutlineIcon,
} from '@/components/booking';
import { EventTabHandle, EventTabProps, Fields } from '@/types/booking';
import Question from './question';
import { applyFilters } from '@wordpress/hooks';
import { ACTIVE_PRO_URL } from '@/constants/booking';

import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent } from '@/components/ui/dialog';

const FIELDS_UPSELL_Z_INDEX = 150310;

/** Rendered beside Event Setup (not inside it) so the modal is visible and clickable. */
export const FieldsProUpsellOverlay = ({
	open,
	onClose,
}: {
	open: boolean;
	onClose: () => void;
}) => (
	<Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
		<DialogContent
			data-doublescale-stacked-overlay
			className="max-w-[800px] pointer-events-auto"
			style={{ zIndex: FIELDS_UPSELL_Z_INDEX + 1 }}
			overlayClassName="pointer-events-auto"
			overlayStyle={{ zIndex: FIELDS_UPSELL_Z_INDEX }}
		>
			<div className="flex flex-col items-center text-center py-10 ">
				<div className="bg-secondary rounded-full p-4 mb-6 flex items-center justify-center">
					<ProIcon width={72} height={72} />
				</div>
				<div>
					<h2 className="text-base font-semibold mb-2 text-foreground">
						{__(
							'Add another Questions feature is available in Pro Version',
							'doublescale'
						)}
					</h2>
					<p className="text-muted-foreground  text-sm">
						{__(
							'Please upgrade to get all the advanced features.',
							'doublescale'
						)}
					</p>
					<div className="mt-6">
						<a
							className="bg-primary h-10 text-primary-foreground hover:!text-white rounded-lg py-3 px-4 font-medium"
							href={ACTIVE_PRO_URL}
							target="_blank"
							rel="noopener noreferrer"
						>
							{__('Upgrade To Pro Now', 'doublescale')}
						</a>
					</div>
				</div>
			</div>
		</DialogContent>
	</Dialog>
);

const LoadingSkeleton = () => (
	<Card><CardContent>
            <Skeleton className='h-4 w-full' />
            <Card className="mt-4"><CardContent>
                    <Skeleton className='h-10 w-full rounded-md' />
                    <Skeleton className='h-10 w-full rounded-md' />
                    {[1, 2].map((i) => (
                        <Card key={i} className="mt-4"><CardContent>
                                <Skeleton className='h-4 w-full' />
                            </CardContent></Card>
                    ))}
                </CardContent></Card>
            <Card className="mt-4"><CardContent>
                    <Skeleton className='h-10 w-full rounded-md' />
                    <Skeleton className='h-10 w-full rounded-md' />
                    <Card className="mt-4"><CardContent>
                            <Skeleton className='h-4 w-full' />
                        </CardContent></Card>
                </CardContent></Card>
        </CardContent></Card>
);

const EventFieldsTab = forwardRef<EventTabHandle, EventTabProps>(
	(props, ref) => {
		const { currentEvent: event } = useEvent();
		const { callApi, loading } = useApi();
		const { callApi: saveApi } = useApi();
		const { errorNotice } = useNotice();
		const [fields, setFields] = useState<Fields | null>(null);

		useImperativeHandle(ref, () => ({
			saveSettings: async () => {
				if (fields) {
					return saveFields(fields);
				}
				return Promise.resolve();
			},
		}));

		useEffect(() => {
			if (event) {
				fetchFields();
			}
		}, [event]);

		const fetchFields = () => {
			if (!event) return;
			callApi({
				path: `events/${event.id}/meta/fields`,
				method: 'GET',
				onSuccess(response: Fields) {
					setFields(response);
				},
				onError(error) {
					errorNotice(error.message);
				},
			});
		};

		const handleUpdate = (values: any, editingFieldKey: string) => {
			if (!fields || !editingFieldKey) return;
			const updatedFields = { ...fields };
			const group = updatedFields.system[editingFieldKey]
				? 'system'
				: updatedFields.location[editingFieldKey]
					? 'location'
					: updatedFields.other?.[editingFieldKey]
						? 'other'
						: 'custom';
			const updatedField = {
				...(updatedFields[group]?.[editingFieldKey] ?? {}),
				...values,
			};

			(updatedFields[group] ??= {})[editingFieldKey] = updatedField;
			setFields(updatedFields);
			props.setDisabled(false);
		};

		const saveFields = async (fields: Fields) => {
			try {
				// Validate required data
				if (!event) {
					console.warn('Cannot save fields - event is undefined');
					return;
				}

				// Validate fields structure if needed
				if (!fields || typeof fields !== 'object') {
					console.error('Invalid fields data structure:', fields);
					throw new Error('Invalid fields data');
				}

				await saveApi({
					path: `events/${event.id}`,
					method: 'POST',
					data: {
						fields: structuredClone(fields), // Deep clone to avoid mutation issues
					},
					onSuccess() {
						props.setDisabled(true);
					},
					onError(error) {
						console.error('API error while saving fields:', error);
						throw new Error(error.message); // Re-throw to be caught by outer try-catch
					},
				});
			} catch (error: any) {
				console.error('Failed to save fields:', error);
				// Consider adding error recovery or state reset here if needed
				throw new Error(error.message); // Re-throw to allow calling code to handle
			}
		};

		const removeField = async (
			fieldKey: string,
			group: 'system' | 'location' | 'custom' | 'other'
		) => {
			if (!event || !fields) return;

			const updatedFields = { ...fields };
			delete (updatedFields[group] ?? {})[fieldKey];
			setFields(updatedFields);
			props.setDisabled(false);
		};

		const moveField = (fieldKey: string, direction: 'up' | 'down') => {
			props.setDisabled(false);
			setFields((prevFields) => {
				if (!prevFields) {
					return { system: {}, location: {}, custom: {} };
				}
				const allFields = {
					...prevFields.system,
					...prevFields.location,
					...prevFields.custom,
				};
				const sortedFields = Object.keys(allFields).sort(
					(a, b) => allFields[a].order - allFields[b].order
				);
				const index = sortedFields.indexOf(fieldKey);
				if (index === -1) return prevFields;

				const newIndex = direction === 'up' ? index - 1 : index + 1;
				if (newIndex < 0 || newIndex >= sortedFields.length)
					return prevFields;

				const temp = sortedFields[index];
				sortedFields[index] = sortedFields[newIndex];
				sortedFields[newIndex] = temp;

				const reorderedFields = sortedFields.reduce(
					(acc, key, idx) => {
						const group = prevFields.system[key]
							? 'system'
							: prevFields.location[key]
								? 'location'
								: 'custom';
						acc[group][key] = {
							...prevFields[group][key],
							order: idx + 1,
						};
						return acc;
					},
					{ system: {}, location: {}, custom: {} } as Fields
				);
				reorderedFields.other = prevFields.other || {};

				return reorderedFields;
			});
		};

		if (loading || !fields) {
			return <LoadingSkeleton />;
		}

		const allFields = fields
			? { ...fields.system, ...fields.location, ...fields.custom }
			: {};

		const sortedFields = Object.keys(allFields).sort(
			(a, b) => allFields[a].order - allFields[b].order
		);

		const otherFields = { ...fields.other };

		return (
            <>
                <Card><CardContent>
                        <CardHeader
                            title={__('Question Settings', 'doublescale')}
                            description={__(
                                'Customize the queston asked on the booking page.',
                                'doublescale'
                            )}
                            icon={<QuestionOutlineIcon width={24} height={24} />}
                            border={false}
                        />
                        <Card><CardContent>
                                <div>
                                    <h3 className="text-xl font-semibold text-color-primary-text">
                                        {__('Booking Questions', 'doublescale')}
                                    </h3>
                                    <p className="text-base font-normal text-[#71717A]">
                                        {__(
                                            'To lock the timezone on booking page, useful for in-person events',
                                            'doublescale'
                                        )}
                                    </p>
                                </div>
                                {sortedFields.length > 0 && (
                                    <>
                                        {sortedFields.map((fieldKey, index) => (
                                            <Question
                                                allFields={allFields}
                                                fieldKey={fieldKey}
                                                onUpdate={handleUpdate}
                                                index={index}
                                                moveField={moveField}
                                                removeField={removeField}
                                                sortedFields={sortedFields}
                                            />
                                        ))}
                                    </>
                                )}
                                {
                                    applyFilters(
                                        'doublescale_booking_event_fields_add_field_component',
                                        <div
                                            className="w-full text-center border border-primary text-primary rounded-lg py-4 border-dashed bg-secondary font-bold cursor-pointer hover:bg-primary hover:text-white transition-all duration-200 ease-in-out mt-2"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                props.onOpenFieldsUpsell?.();
                                            }}
                                        >
                                            <div className="flex items-center justify-center gap-2">
                                                <PlusOutlined />
                                                {__('Add New Question', 'doublescale')}
                                            </div>
                                        </div>,
                                        {
                                            event,
                                            fields,
                                            setFields,
                                            setDisabled: props.setDisabled,
                                        }
                                    ) as any
                                }
                            </CardContent></Card>
                        <Card className="mt-4"><CardContent>
                                <div>
                                    <h3 className="text-xl font-semibold text-color-primary-text">
                                        {__('Other Questions', 'doublescale')}
                                    </h3>
                                    <p className="text-base font-normal text-[#71717A]">
                                        {__(
                                            'Customize Booking Cancel and Reschedule Fields',
                                            'doublescale'
                                        )}
                                    </p>
                                </div>
                                <>
                                    {Object.keys(otherFields).map((fieldKey, index) => (
                                        <Question
                                            allFields={otherFields}
                                            fieldKey={fieldKey}
                                            onUpdate={handleUpdate}
                                            index={index}
                                            moveField={moveField}
                                            removeField={removeField}
                                            sortedFields={Object.keys(otherFields)}
                                        />
                                    ))}
                                </>
                            </CardContent></Card>
                    </CardContent></Card>
            </>
        );
	}
);
export default EventFieldsTab;
