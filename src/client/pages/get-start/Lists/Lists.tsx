/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';
import { useState } from '@wordpress/element';
import { useDispatch } from '@wordpress/data';
import type { List as ContactList, ListsResponse } from '@doublescale/client';
import { isEmpty } from 'validator';

/**
 * Internal dependencies
 */
import ButtonComponent from '../component/button';
import { usePaginatedSegments } from '../hooks/usePaginatedSegments';
import { SegmentTable } from '../components/SegmentTable';
import { generateSlug, getApiErrorMessage } from '@/utils';

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

	const handleAdd = async () => {
		if (isEmpty(newSegment.name || '', { ignore_whitespace: true })) {
			return;
		}

		setIsSaving(true);

		try {
			const listData = {
				name: newSegment.name,
				slug: newSegment.slug || generateSlug(newSegment.name),
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
		<div className="flex flex-col gap-8">
			<div>
				<h3 className="text-foreground text-2xl font-semibold mb-1">
					{__(
						'Create Smart Lists',
						'doublescale'
					)}
				</h3>
				<p className="text-muted-foreground text-sm leading-relaxed">
					{__(
						'Organize leads, customers, and users by type or behavior. Smart lists help you personalize outreach and automate with precision.',
						'doublescale'
					)}
				</p>
			</div>

			<SegmentTable
				items={lists}
				loading={loading}
				isSaving={isSaving}
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

			<div className="flex justify-between pt-6 border-t border-border/40">
				<div className="flex gap-2">
					<ButtonComponent
						onClick={onPrevious}
						type=""
						disabled={isSaving}
					>
						{__('Previous', 'doublescale')}
					</ButtonComponent>
					<ButtonComponent
						type="no"
						onClick={onSkip}
						disabled={isSaving}
					>
						{__('Skip →', 'doublescale')}
					</ButtonComponent>
				</div>
				<ButtonComponent type="go" onClick={onNext} disabled={isSaving}>
					{__('Next Step', 'doublescale')}
				</ButtonComponent>
			</div>
		</div>
	);
}
