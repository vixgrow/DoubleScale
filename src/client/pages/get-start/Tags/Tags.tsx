/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';
import { useState } from '@wordpress/element';
import { useDispatch } from '@wordpress/data';
import type { Tag as ContactTag, TagsResponse } from '@quillcrm/client';
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

type TagsProps = Readonly<{
	onNext: () => void;
	onPrevious: () => void;
	onSkip: () => void;
}>;

export default function Tags({ onNext, onPrevious, onSkip }: TagsProps) {
	const { createNotice } = useDispatch('quillcrm/core');
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
		items: tags,
		loading,
		isSaving,
		page,
		perPage,
		totalRecords,
		setPage,
		setPerPage,
		setIsSaving,
		refetch,
	} = usePaginatedSegments<ContactTag>({
		endpoint: '/qc/v1/tags',
		parseResponse: (response) => response as TagsResponse,
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
			const tagData = {
				name: newSegment.name,
				slug: newSegment.slug || generateSlug(newSegment.name),
				description: '',
			};

			await apiFetch({
				path: '/qc/v1/tags',
				method: 'POST',
				data: tagData,
			});

			setNewSegment({ name: '', slug: '' });

			createNotice({
				type: 'success',
				message: __('Tag created successfully', 'quillcrm'),
			});

			await refetch();
		} catch (error) {
			// eslint-disable-next-line no-console
			console.error('Failed to create tag:', error);

			createNotice({
				type: 'error',
				message: getApiErrorMessage(
					error,
					__('Failed to create tag', 'quillcrm')
				),
			});
		} finally {
			setIsSaving(false);
		}
	};

	const handleStartEdit = (item: { id: number; name: string; slug: string }) => {
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
				path: `/qc/v1/tags/${id}`,
				method: 'PUT',
				data: {
					name: editingValues.name,
					slug: editingValues.slug || generateSlug(editingValues.name),
				},
			});

			setEditingId(null);
			setEditingValues({
				name: '',
				slug: '',
			});

			createNotice({
				type: 'success',
				message: __('Tag updated successfully', 'quillcrm'),
			});

			await refetch();
		} catch (error) {
			// eslint-disable-next-line no-console
			console.error('Failed to update tag:', error);

			createNotice({
				type: 'error',
				message: getApiErrorMessage(
					error,
					__('Failed to update tag', 'quillcrm')
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
				path: '/qc/v1/tags',
				method: 'DELETE',
				data: { ids: [id] },
			});

			createNotice({
				type: 'success',
				message: __('Tag deleted successfully', 'quillcrm'),
			});

			await refetch();
		} catch (error) {
			// eslint-disable-next-line no-console
			console.error('Failed to delete tag:', error);

			createNotice({
				type: 'error',
				message: getApiErrorMessage(
					error,
					__('Failed to delete tag', 'quillcrm')
				),
			});
		} finally {
			setIsSaving(false);
		}
	};

	return (
		<div className="flex flex-col gap-10">
			<div>
				<h3 className="text-[#170F49] text-[32px] font-semibold">
					{__(
						'Tag Your Contacts—Organize CRM Segments with Ease',
						'quillcrm'
					)}
				</h3>
				<p className="text-[#777] text-lg font-normal leading-7">
					{__(
						'Add tags to your contacts to label VIPs, product users, and more—making it easier to filter, track, and personalize your CRM outreach. Smart tagging helps you stay organized and automate actions with precision.',
						'quillcrm'
					)}
				</p>
			</div>

			<SegmentTable
				items={tags}
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
					'No tags yet. Create your first tag above.',
					'quillcrm'
				)}
				deleteConfirmationMessage={__(
					'Are you sure you want to delete this tag?',
					'quillcrm'
				)}
			/>

			<div className="flex justify-between pt-8">
				<div className="flex gap-2">
					<ButtonComponent onClick={onPrevious} type="" disabled={isSaving}>
						{__('Previous', 'quillcrm')}
					</ButtonComponent>
					<ButtonComponent type="no" onClick={onSkip} disabled={isSaving}>
						{__('Skip →', 'quillcrm')}
					</ButtonComponent>
				</div>
				<ButtonComponent type="go" onClick={onNext} disabled={isSaving}>
					{__('Next Step', 'quillcrm')}
				</ButtonComponent>
			</div>
		</div>
	);
}

