import React, { useState, useEffect } from 'react';
import { NavLink, useParams } from '@quillcrm/navigation';
import { __ } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';
import { useDispatch } from '@wordpress/data';

// Import components
import AddSequenceMail from './components/add-sequence-mail';
import EditSequenceMail from './components/edit-sequence-mail';
import SequenceReportsModal from './components/sequence-reports-modal';
import { END_POINT, SEQUENCE_MAIL_TYPE } from '../constants';

// Import types
import { EmailSequence, SequenceMail } from '../types';
import EmailSequenceFlowChart from './components/email-sequence-flow-chart';
import CloseIcon from '@quillcrm/components/icons/close';
import { DeleteEmail } from './components/deleteEmail';

const SequencesMail: React.FC = () => {
	const { id } = useParams<{ id: string }>();
	const { createNotice } = useDispatch('quillcrm/core');
	const [loading, setLoading] = useState(true);
	const [sequenceName, setSequenceName] = useState('');
	const [, setSequenceData] = useState<EmailSequence | null>(null);
	const [sequenceEmails, setSequenceEmails] = useState<SequenceMail[]>([]);
	const [isAddingEmail, setIsAddingEmail] = useState(false);
	const [isEditingEmail, setIsEditingEmail] = useState(false);
	const [editingEmailId, setEditingEmailId] = useState<number | null>(null);
	const [isShowingReports, setIsShowingReports] = useState(false);
	const [reportingEmailId, setReportingEmailId] = useState<number | null>(
		null
	);
	const [reportingEmailName, setReportingEmailName] = useState<string>('');
	const [isShowingDeleteDialog, setIsShowingDeleteDialog] = useState(false);
	const [deletingEmailId, setDeletingEmailId] = useState<number | null>(null);

	// Fetch sequence emails on component mount
	useEffect(() => {
		fetchSequenceEmails();
	}, [id]);

	const fetchSequenceEmails = async () => {
		setLoading(true);
		try {
			const sequenceResponse = await apiFetch<EmailSequence>({
				path: END_POINT + `/${id}`,
			});

			setSequenceData(sequenceResponse);
			setSequenceName(sequenceResponse.name || '');
			setSequenceEmails(sequenceResponse.sequences_mail || []);
		} catch (error: any) {
			createNotice({
				type: 'error',
				message:
					error.message ||
					__('Failed to fetch sequence emails', 'quillcrm'),
			});
		} finally {
			setLoading(false);
		}
	};

	const handleEdit = (id: number) => {
		setIsAddingEmail(false);
		setEditingEmailId(id);
		setIsEditingEmail(true);
	};

	const handleDelete = (emailId: number) => {
		setDeletingEmailId(emailId);
		setIsShowingDeleteDialog(true);
	};

	const handleConfirmDelete = async () => {
		if (!deletingEmailId) return;

		try {
			await apiFetch({
				path: `${END_POINT}/${deletingEmailId}`,
				method: 'DELETE',
			});

			createNotice({
				type: 'success',
				message: __('Email deleted successfully', 'quillcrm'),
			});

			setIsShowingDeleteDialog(false);
			setDeletingEmailId(null);
			fetchSequenceEmails();
		} catch (error: any) {
			createNotice({
				type: 'error',
				message:
					error.message || __('Failed to delete email', 'quillcrm'),
			});
			setIsShowingDeleteDialog(false);
			setDeletingEmailId(null);
		}
	};

	const handleDuplicate = async (emailId: number) => {
		try {
			const emailToDuplicate = sequenceEmails.find(
				(email) => email.id === emailId
			);

			if (!emailToDuplicate) {
				throw new Error('Email not found');
			}

			await apiFetch({
				path: END_POINT + `/${emailId}/duplicate`,
				method: 'POST',
				data: {
					type: SEQUENCE_MAIL_TYPE,
				},
			});

			createNotice({
				type: 'success',
				message: __('Email duplicated successfully', 'quillcrm'),
			});

			fetchSequenceEmails();
		} catch (error: any) {
			createNotice({
				type: 'error',
				message:
					error.message ||
					__('Failed to duplicate email', 'quillcrm'),
			});
		}
	};

	const handleShowReport = (emailId: number) => {
		const email = sequenceEmails.find((e) => e.id === emailId);
		setReportingEmailId(emailId);
		setReportingEmailName(email?.name || `Email ${emailId}`);
		setIsShowingReports(true);
	};

	const handleAddSequenceEmail = () => {
		setIsEditingEmail(false);
		setEditingEmailId(null);
		setIsAddingEmail(true);
	};

	// Check if any panel is open
	const isPanelOpen = isAddingEmail || isEditingEmail;

	return (
		<div className="email-sequence-detail h-screen flex flex-col overflow-hidden">
			{/* Header - Always visible */}
			<div className="flex-shrink-0 border-b bg-white px-6 py-4">
				<h1 className="text-xl font-medium">
					<NavLink to={`campaigns`}>
						{__('Email Sequences', 'quillcrm')}
					</NavLink>
					/ {sequenceName || id}
				</h1>
			</div>

			{/* Main Content Area - Side by Side Layout */}
			<div className="flex-1 flex overflow-y-auto ">
				{/* Left Side - FlowChart (75% when panel open, 100% when closed) - No Scroll */}
				<div
					className={`transition-all duration-300 ${isPanelOpen ? 'w-3/4' : 'w-full'}`}
				>
					<EmailSequenceFlowChart
						sequenceEmails={sequenceEmails}
						loading={loading}
						onAddEmail={handleAddSequenceEmail}
						onEditEmail={handleEdit}
						onDeleteEmail={handleDelete}
						onDuplicateEmail={handleDuplicate}
						onShowReport={handleShowReport}
					/>
				</div>

				{/* Right Side - Add/Edit Panel (25% of screen) - With Scroll */}
				{isAddingEmail && (
					<div className="w-1/2 h-full relative bg-white">
						{/* X Button */}
						<div className="absolute -left-14 top-6 z-[9999]">
							<button
								onClick={() => setIsAddingEmail(false)}
								className="h-10 w-10 bg-white hover:bg-gray-100 rounded-full  shadow-[0_4px_20px_0_rgba(59,130,246,0.14)] flex items-center justify-center transition-all hover:scale-110"
							>
								<CloseIcon
									color="#374151"
									width={32}
									height={32}
								/>
							</button>
						</div>

						<div className="h-full overflow-y-auto border-l border-gray-200">
							<AddSequenceMail
								isAdding={isAddingEmail}
								setIsAdding={setIsAddingEmail}
								sequenceId={id || ''}
								onSuccess={fetchSequenceEmails}
							/>
						</div>
					</div>
				)}

				{isEditingEmail && editingEmailId && (
					<div className="w-1/2  relative h-full bg-white">
						<div className="absolute -left-14 top-6 z-[9999]">
							<button
								onClick={() => setIsEditingEmail(false)}
								className="h-10 w-10 bg-white hover:bg-gray-100 rounded-full  shadow-[0_4px_20px_0_rgba(59,130,246,0.14)] flex items-center justify-center transition-all hover:scale-110"
							>
								<CloseIcon
									color="#374151"
									width={32}
									height={32}
								/>
							</button>
						</div>
						<div className="h-full overflow-y-auto border-l border-gray-200">
							<EditSequenceMail
								isEditing={isEditingEmail}
								setIsEditing={setIsEditingEmail}
								sequenceId={id || ''}
								emailId={editingEmailId}
								onSuccess={fetchSequenceEmails}
							/>
						</div>
					</div>
				)}
			</div>

			{/* Reports Modal - Overlay style */}
			{reportingEmailId && (
				<SequenceReportsModal
					open={isShowingReports}
					onOpenChange={setIsShowingReports}
					sequenceId={id || ''}
					emailId={reportingEmailId}
					emailName={reportingEmailName}
				/>
			)}
			{isShowingDeleteDialog && deletingEmailId && (
				<DeleteEmail
					visible={isShowingDeleteDialog}
					onClose={() => {
						setIsShowingDeleteDialog(false);
						setDeletingEmailId(null);
					}}
					email={sequenceEmails.find((e) => e.id === deletingEmailId)}
					onConfirm={handleConfirmDelete}
				/>
			)}
		</div>
	);
};

export default SequencesMail;
