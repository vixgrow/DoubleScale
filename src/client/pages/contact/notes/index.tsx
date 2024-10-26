/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';
import { useEffect, useState } from '@wordpress/element';
import { addQueryArgs } from '@wordpress/url';
import { useDispatch } from '@wordpress/data';

/**
 * External dependencies
 */
import {
	Button,
	Input,
	Card,
	Typography,
	List,
	Modal,
	Select,
	Popconfirm,
	Flex,
	Tag
} from 'antd';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { isEmpty } from 'lodash';

/**
 * Internal dependencies
 */
import './style.scss';
import type { Note, NotesResponse } from '@quillcrm/client';
import { useContactContext } from '../state/context';

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
	const [total, setTotal] = useState<number>(0);
	const [noteModalVisible, setNoteModalVisible] = useState(false);
	const [selectedNote, setSelectedNote] = useState<Note | null>(null);
	const [isSavingNote, setIsSavingNote] = useState(false);
	const [note, setNote] = useState<Partial<Note>>({
		title: '',
		note: '',
		type: 'note',
	});
	const { createNotice } = useDispatch('quillcrm/core');

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
			setTotal(response.total);
		} catch (error: any) {
			createNotice({
				type: 'error',
				message: error.message,
			});
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchNotes();
	}, [page, perPage]);

	const saveNote = async () => {
		if (!note) {
			return;
		}

		if (!validate(note)) {
			setIsSavingNote(false);
			return;
		}

		setIsSavingNote(true);
		try {
			const response = (await apiFetch({
				path: `/qc/v1/contact-notes`,
				method: 'POST',
				data: {
					title: note.title,
					note: note.note,
					type: note.type,
					contact_id: contact_id,
				},
			})) as Note;

			setNote({
				title: '',
				note: '',
				type: 'note',
			});
			addNote({
				...response,
			});
			setNoteModalVisible(false);
			createNotice({
				type: 'success',
				message: __('Note saved successfully', 'quillcrm'),
			});
		} catch (error: any) {
			createNotice({
				type: 'error',
				message: error.message,
			});
		} finally {
			setIsSavingNote(false);
		}
	};

	const editNote = async () => {
		if (!selectedNote) {
			return;
		}

		if (!validate(selectedNote)) {
			setIsSavingNote(false);
			return;
		}

		setIsSavingNote(true);

		try {
			const response = (await apiFetch({
				path: `/qc/v1/contact-notes/${selectedNote.id}`,
				method: 'PUT',
				data: {
					title: selectedNote.title,
					note: selectedNote.note,
					type: selectedNote.type,
					contact_id: contact_id,
				},
			})) as Note;

			setSelectedNote(null);
			updateNote({
				...response,
			});
			createNotice({
				type: 'success',
				message: __('Note updated successfully', 'quillcrm'),
			});
		} catch (error) {
			createNotice({
				type: 'error',
				message: __('Failed to update note', 'quillcrm'),
			});
		} finally {
			setIsSavingNote(false);
			setNoteModalVisible(false);
		}
	};

	const deleteNote = async (note: Note) => {
		try {
			await apiFetch({
				path: `/qc/v1/contact-notes/${note.id}`,
				method: 'DELETE',
			});

			removeNote({
				...note,
			});
		} catch (error) {
			createNotice({
				type: 'error',
				message: __('Failed to delete note', 'quillcrm'),
			});
		}
	};

	const validate = (note: Partial<Note>) => {
		if (!note.title) {
			createNotice({
				type: 'error',
				message: __('Title is required', 'quillcrm'),
			});
			return false;
		}

		if (!note.note) {
			createNotice({
				type: 'error',
				message: __('Note is required', 'quillcrm'),
			});
			return false;
		}

		return true;
	};

	return (
		<>
			<Card className="qcrm-contact-notes" loading={loading}>
				<Flex
					justify="space-between"
					align="center"
					style={{ marginBottom: 20 }}
				>
					<Typography.Title level={4} style={{ margin: 0 }}>
						{__('Notes', 'quillcrm')}
					</Typography.Title>
					<Button
						onClick={() => {
							setSelectedNote(null);
							setNoteModalVisible(true);
						}}
						type="primary"
					>
						{__('Add Note', 'quillcrm')}
					</Button>
				</Flex>
				{isEmpty(notes) ? (
					<p>{__('No notes found.', 'quillcrm')}</p>
				) : (
					<List
						itemLayout="horizontal"
						dataSource={notes}
						pagination={{
							current: page,
							pageSize: perPage,
							total,
							onChange: (page, perPage) => {
								setPage(page);
								setPerPage(perPage);
							},
							position: 'bottom',
							align: 'center',
						}}
						renderItem={(item: Note) => (
							<List.Item
								actions={[
									<Button
										onClick={() => {
											setSelectedNote(item);
											setNoteModalVisible(true);
										}}
										type="link"
									>
										<EditOutlined />
									</Button>,
									<Popconfirm
										title={__(
											'Are you sure you want to delete this note?',
											'quillcrm'
										)}
										onConfirm={() => deleteNote(item)}
										okText={__('Yes', 'quillcrm')}
										cancelText={__('No', 'quillcrm')}
									>
										<Button type="link" danger>
											<DeleteOutlined />
										</Button>
									</Popconfirm>,
								]}
							>
								<Flex vertical gap={10} style={{ width: '100%' }}>
									<Flex align="center">
										<Tag color={item.type === 'system' ? 'blue' : item.type === 'reminder' ? 'orange' : 'green'}>
											{item.type}
										</Tag>
									</Flex>
									<List.Item.Meta
										title={item.title}
										description={item.note}
									/>
								</Flex>
							</List.Item>
						)}
					/>
				)}
			</Card>
			<Modal
				title={
					selectedNote
						? __('Edit Note', 'quillcrm')
						: __('Add Note', 'quillcrm')
				}
				open={noteModalVisible}
				onOk={() => (selectedNote ? editNote() : saveNote())}
				onCancel={() => setNoteModalVisible(false)}
				okText={__('Save', 'quillcrm')}
				cancelText={__('Cancel', 'quillcrm')}
				confirmLoading={isSavingNote}
			>
				<div className="qcrm-fields">
					<div className="qcrm-field">
						<div className="qcrm-field-label">
							<Typography.Text>
								{__('Title', 'quillcrm')}
							</Typography.Text>
						</div>
						<div className="qcrm-field-input">
							<Input
								value={
									selectedNote
										? selectedNote.title
										: note.title
								}
								onChange={(e) => {
									if (selectedNote) {
										setSelectedNote({
											...selectedNote,
											title: e.target.value,
										});
									} else {
										setNote({
											...note,
											title: e.target.value,
										});
									}
								}}
							/>
						</div>
					</div>
					<div className="qcrm-field">
						<div className="qcrm-field-label">
							<Typography.Text>
								{__('Note', 'quillcrm')}
							</Typography.Text>
						</div>
						<div className="qcrm-field-input">
							<Input.TextArea
								value={
									selectedNote ? selectedNote.note : note.note
								}
								onChange={(e) => {
									if (selectedNote) {
										setSelectedNote({
											...selectedNote,
											note: e.target.value,
										});
									} else {
										setNote({
											...note,
											note: e.target.value,
										});
									}
								}}
							/>
						</div>
					</div>
					<div className="qcrm-field">
						<div className="qcrm-field-label">
							<Typography.Text>
								{__('Type', 'quillcrm')}
							</Typography.Text>
						</div>
						<div className="qcrm-field-input">
							<Select
								value={
									selectedNote ? selectedNote.type : note.type
								}
								onChange={(value) => {
									if (selectedNote) {
										setSelectedNote({
											...selectedNote,
											type: value,
										});
									} else {
										setNote({
											...note,
											type: value,
										});
									}
								}}
								style={{ width: '100%' }}
							>
								<Select.Option value="note">
									{__('Note', 'quillcrm')}
								</Select.Option>
								<Select.Option value="reminder">
									{__('Reminder', 'quillcrm')}
								</Select.Option>
							</Select>
						</div>
					</div>
				</div>
			</Modal>
		</>
	);
};

export default Notes;
