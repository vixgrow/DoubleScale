/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';
import { useState, useMemo } from '@wordpress/element';
import { useDispatch } from '@wordpress/data';
import type { List as ContactList, ListsResponse } from '@doublescale/client';
import { isEmpty } from 'validator';

/**
 * Internal dependencies
 */
import { Button } from '@/components/ui/button';
import { usePaginatedSegments } from '../hooks/usePaginatedSegments';
import { SegmentTable } from '../components/SegmentTable';
import { generateSlug, getApiErrorMessage } from '@doublescale/utils';

type NewSegment = {
	name: string;
	slug: string;
};

type ListsProps = Readonly<{
	onNext: () => void;
	onPrevious: () => void;
	onSkip: () => void;
}>;

export default function Lists({ onNext, onPrevious, onSkip }: ListsProps) {
	const { createNotice } = useDispatch('doublescale/core');
	const [newSegment, setNewSegment] = useState<NewSegment>({
		name: '',
		slug: '',
	});
	const [editingId, setEditingId] = useState<number | null>(null);
	const [editingValues, setEditingValues] = useState<NewSegment>({
		name: '',
		slug: '',
	});

	const {
		items: lists,
		loading,
		isSaving,
		page,
		perPage,
		totalRecords,
		setPage,
		setPerPage,
		setIsSaving,
		refetch,
	} = usePaginatedSegments<ContactList>({
		endpoint: '/doublescale/v1/lists',
		parseResponse: (response) => response as ListsResponse,
	});

	const handleNameChange = (name: string) => {
		setNewSegment({
			name,
			slug: generateSlug(name),
		});
	};

	const canAddNewSegment = useMemo(
		() =>
			!isEmpty(newSegment.name || '', { ignore_whitespace: true }) ||
			!isEmpty(newSegment.slug || '', { ignore_whitespace: true }),
		[newSegment.name, newSegment.slug]
	);

	const handleAdd = async () => {
		const nameTrim = (newSegment.name || '').trim();
		const slugTrim = (newSegment.slug || '').trim();
		if (!nameTrim && !slugTrim) {
			return;
		}

		const name = nameTrim || slugTrim;
		const slug = slugTrim || generateSlug(name);

		setIsSaving(true);

		try {
			const listData = {
				name,
				slug,
				description: '',
			};

			await apiFetch({
				path: '/doublescale/v1/lists',
				method: 'POST',
				data: listData,
			});

			setNewSegment({ name: '', slug: '' });

			createNotice({
				type: 'success',
				message: __('List created successfully', 'doublescale'),
			});

			await refetch();
		} catch (error) {
			// eslint-disable-next-line no-console
			console.error('Failed to create list:', error);

			createNotice({
				type: 'error',
				message: getApiErrorMessage(
					error,
					__('Failed to create list', 'doublescale')
				),
			});
		} finally {
			setIsSaving(false);
		}
	};

	const handleStartEdit = (item: {
		id: number;
		name: string;
		slug: string;
	}) => {
		setEditingId(item.id);
		setEditingValues({
			name: item.name,
			slug: item.slug,
		});
	};

	const handleCancelEdit = () => {
		setEditingId(null);
		setEditingValues({
			name: '',
			slug: '',
		});
	};

	const handleUpdate = async (id: number) => {
		if (isEmpty(editingValues.name || '', { ignore_whitespace: true })) {
			return;
		}

		setIsSaving(true);

		try {
			await apiFetch({
				path: `/doublescale/v1/lists/${id}`,
				method: 'PUT',
				data: {
					name: editingValues.name,
					slug:
						editingValues.slug || generateSlug(editingValues.name),
				},
			});

			setEditingId(null);
			setEditingValues({
				name: '',
				slug: '',
			});

			createNotice({
				type: 'success',
				message: __('List updated successfully', 'doublescale'),
			});

			await refetch();
		} catch (error) {
			// eslint-disable-next-line no-console
			console.error('Failed to update list:', error);

			createNotice({
				type: 'error',
				message: getApiErrorMessage(
					error,
					__('Failed to update list', 'doublescale')
				),
			});
		} finally {
			setIsSaving(false);
		}
	};

	const handleDelete = async (id: number) => {
		setIsSaving(true);

		try {
			await apiFetch({
				path: '/doublescale/v1/lists',
				method: 'DELETE',
				data: { ids: [id] },
			});

			createNotice({
				type: 'success',
				message: __('List deleted successfully', 'doublescale'),
			});

			await refetch();
		} catch (error) {
			// eslint-disable-next-line no-console
			console.error('Failed to delete list:', error);

			createNotice({
				type: 'error',
				message: getApiErrorMessage(
					error,
					__('Failed to delete list', 'doublescale')
				),
			});
		} finally {
			setIsSaving(false);
		}
	};

	return (
		<div className="flex min-h-0 flex-1 flex-col">
			<div className="shrink-0 pb-6">
				<h3 className="mb-2.5 text-2xl font-bold leading-9 text-foreground">
					{__(
						'Segment Your Contacts — Create Smart Lists for Better Targeting',
						'doublescale'
					)}
				</h3>
				<p className="text-base font-medium leading-7 text-muted-foreground">
					{__(
						'Group contacts into smart lists by type, behavior, or tags so you can target the right people with campaigns and automations.',
						'doublescale'
					)}
				</p>
			</div>

			<div className="min-h-0 flex-1 overflow-y-auto pr-0.5">
				<SegmentTable
					items={lists}
					loading={loading}
					isSaving={isSaving}
					canAddNewSegment={canAddNewSegment}
					newSegment={newSegment}
					editingId={editingId}
					editingValues={editingValues}
					perPage={perPage}
					page={page}
					totalRecords={totalRecords}
					onChangeNewName={handleNameChange}
					onChangeNewSlug={(value) =>
						setNewSegment((previous) => ({
							...previous,
							slug: value,
						}))
					}
					onAdd={handleAdd}
					onStartEdit={handleStartEdit}
					onCancelEdit={handleCancelEdit}
					onChangeEditingName={(value) =>
						setEditingValues((previous) => ({
							...previous,
							name: value,
						}))
					}
					onChangeEditingSlug={(value) =>
						setEditingValues((previous) => ({
							...previous,
							slug: value,
						}))
					}
					onUpdate={handleUpdate}
					onDelete={handleDelete}
					onChangePerPage={setPerPage}
					onChangePage={setPage}
					emptyMessage={__(
						'No lists yet. Create your first list above.',
						'doublescale'
					)}
					deleteConfirmationMessage={__(
						'Are you sure you want to delete this list?',
						'doublescale'
					)}
				/>
			</div>

			<div className="z-20 -mx-6 -mb-6 mt-6 shrink-0 bg-white px-6 py-4 shadow-[0_-8px_28px_rgba(15,23,42,0.07)] rounded-b-[20px]">
				<div className="flex flex-wrap items-center justify-between gap-3 lg:justify-end sm:gap-6">
					<Button
						type="button"
						size="lg"
						variant="secondaryDeepBlue"
						onClick={onPrevious}
						disabled={isSaving}
					>
						{__('Back', 'doublescale')}
					</Button>
					
					<Button
						type="button"
						size="lg"
						variant="default"
						onClick={onNext}
						disabled={isSaving}
					>
						{__('Next', 'doublescale')}
					</Button>
				</div>
			</div>
		</div>
	);
}
