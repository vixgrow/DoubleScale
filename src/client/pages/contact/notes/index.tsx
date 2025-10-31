/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';
import { useEffect, useState } from '@wordpress/element';
import { addQueryArgs } from '@wordpress/url';

/**
 * Internal dependencies
 */
import './style.scss';
import type { Note, NotesResponse, NoticeMessage } from '@quillcrm/client';
import { useContactContext } from '../state/context';
import { Button } from '@/components/ui/button';
import {
	PlusIcon,
	NoticeBanner,
	DeleteModal,
	GradientNotesIcon,
	NoData,
} from '@quillcrm/components';
import { DataTable } from '@/components/ui/data-table';
import DataTablePagination from '@/components/ui/data-table-pagination';
import { useServerSideTable } from '@quillcrm/hooks/use-serverSideTable';
import { getColumns } from './columns';
import NoteDialog from './note-dialog';

interface NotesProps {
	contact_id: number;
}

const Notes: React.FC<NotesProps> = ({ contact_id }) => {
	const {
		notes,
		setNotes,
		addNote,
		deleteNote: removeNote,
		updateNote,
	} = useContactContext();
	const [loading, setLoading] = useState<boolean>(true);
	const [perPage, setPerPage] = useState<number>(10);
	const [page, setPage] = useState<number>(1);
	const [totalRecords, setTotalRecords] = useState<number>(0);
	const [noteModalVisible, setNoteModalVisible] = useState(false);
	const [selectedNote, setSelectedNote] = useState<Note | null>(null);
	const [noteToDelete, setNoteToDelete] = useState<Note | null>(null);
	const [notice, setNotice] = useState<NoticeMessage | null>(null);

	const serverSideTable = useServerSideTable({
		page,
		perPage,
		totalRecords,
		setPage,
		setPerPage,
	});

	// Helper function to show notice
	const showNotice = (type: 'success' | 'error', message: string) => {
		setNotice({ type, message });
	};

	// Helper function to close notice
	const closeNotice = () => {
		setNotice(null);
	};

	const fetchNotes = async () => {
		setLoading(true);

		try {
			const response = (await apiFetch({
				path: addQueryArgs(`/qc/v1/contacts/${contact_id}/notes`, {
					per_page: perPage,
					page,
				}),
			})) as NotesResponse;

			setNotes(response.data);
			setTotalRecords(response.total);
		} catch (error: any) {
			showNotice(
				'error',
				error.message || __('Failed to fetch notes', 'quillcrm')
			);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchNotes();
	}, [page, perPage]);

	const handleEdit = (note: Note) => {
		setSelectedNote(note);
		setNoteModalVisible(true);
	};

	const handleDelete = (note: Note) => {
		setNoteToDelete(note);
	};

	const confirmDelete = async () => {
		if (!noteToDelete) return;

		try {
			await apiFetch({
				path: `/qc/v1/contact-notes/${noteToDelete.id}`,
				method: 'DELETE',
			});

			removeNote(noteToDelete);
			fetchNotes();
			showNotice('success', __('Note deleted successfully', 'quillcrm'));
		} catch (error) {
			showNotice('error', __('Failed to delete note', 'quillcrm'));
		} finally {
			setNoteToDelete(null);
		}
	};

	const handleAddNote = () => {
		setSelectedNote(null);
		setNoteModalVisible(true);
	};

	const columns = getColumns({
		onEdit: handleEdit,
		onDelete: handleDelete,
	});

	return (
		<div className="qcrm-notes flex flex-col gap-5">
			<div className="flex justify-between items-center">
				<h2 className="text-2xl font-semibold">
					{__('Notes', 'quillcrm')}
				</h2>
				<Button
					variant="secondary"
					size="sm"
					className="bg-white"
					onClick={handleAddNote}
				>
					<PlusIcon />
					{__('Add Note', 'quillcrm')}
				</Button>
			</div>
			{notice && (
				<NoticeBanner notice={notice} closeNotice={closeNotice} />
			)}
			<div>
				{!loading && (!notes || notes.length === 0) ? (
					<NoData
						icon={<GradientNotesIcon />}
						title={__('No notes yet', 'quillcrm')}
						subtitle={__('Track subscriber growth, open rates, and conversion trends in real time.', 'quillcrm')}
						onClick={handleAddNote}
						buttonLabel={__('Add Note', 'quillcrm')}
					/>
				) : (
					<>
						<DataTable
							columns={columns}
							data={notes || []}
							loading={loading}
							showPagination={false}
							initialPageSize={perPage}
							showMainActions={false}
							setPage={setPage}
							config={{}}
						/>
						<DataTablePagination table={serverSideTable} />
					</>
				)}
			</div>
			<NoteDialog
				open={noteModalVisible}
				onClose={() => {
					setNoteModalVisible(false);
					setSelectedNote(null);
				}}
				contact_id={contact_id}
				selectedNote={selectedNote}
				onSave={(note) => {
					addNote(note);
					fetchNotes();
				}}
				onUpdate={(note) => {
					updateNote(note);
					fetchNotes();
				}}
				showNotice={showNotice}
			/>
			<DeleteModal
				isOpen={!!noteToDelete}
				onClose={() => setNoteToDelete(null)}
				onConfirm={confirmDelete}
				selectedCount={1}
				activeTab="notes"
			/>
		</div>
	);
};

export default Notes;
