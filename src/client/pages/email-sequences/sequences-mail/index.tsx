
import React, { useState, useEffect, useCallback } from 'react';
import { __ } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';
import { useDispatch } from '@wordpress/data';
import { ChevronRight, SettingsIcon, X } from 'lucide-react';

// Import components
import AddSequenceMail from './components/add-sequence-mail';
import EditSequenceMail from './components/edit-sequence-mail';
import SequenceReportsModal from './components/sequence-reports-modal';
import EditEmailSequence from '../components/edit-email-sequence';
import { END_POINT, SEQUENCE_MAIL_TYPE } from '../constants';

// Import types
import { EmailSequence, SequenceMail } from '../types';
import EmailSequenceFlowChart from './components/email-sequence-flow-chart';
import CloseIcon from '@doublescale/components/icons/close';
import { DeleteEmail } from './components/deleteEmail';


const SequencesMail: React.FC<{
	navigate: (path: string) => void;
	params: Record<string, string>;
}> = ({ navigate, params }) => {
	const { createNotice } = useDispatch('doublescale/core');
	const [loading, setLoading] = useState(true);
	const [sequenceName, setSequenceName] = useState('');
	const [sequenceData, setSequenceData] = useState<EmailSequence | null>(
		null
	);
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
	const [isEditingSequence, setIsEditingSequence] = useState(false);

	const handleClose = useCallback(() => {
		navigate('email-sequences');
	}, [navigate]);

	useEffect(() => {
		const onKeyDown = (e: KeyboardEvent) => {
			if (e.key === 'Escape') handleClose();
		};
		document.addEventListener('keydown', onKeyDown);
		return () => document.removeEventListener('keydown', onKeyDown);
	}, [handleClose]);

	// Fetch sequence emails on component mount
	useEffect(() => {
		if (params?.id) fetchSequenceEmails();
	}, [params?.id]);

	const fetchSequenceEmails = async () => {
		setLoading(true);
		try {
			const sequenceResponse = await apiFetch<EmailSequence>({
				path: END_POINT + `/${params.id}`,
			});

			setSequenceData(sequenceResponse);
			setSequenceName(sequenceResponse.name || '');
			setSequenceEmails(sequenceResponse.sequences_mail || []);
		} catch (error: any) {
			createNotice({
				type: 'error',
				message:
					error.message ||
					__('Failed to fetch sequence emails', 'doublescale'),
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
				message: __('Email deleted successfully', 'doublescale'),
			});

			setIsShowingDeleteDialog(false);
			setDeletingEmailId(null);
			fetchSequenceEmails();
		} catch (error: any) {
			createNotice({
				type: 'error',
				message:
					error.message || __('Failed to delete email', 'doublescale'),
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
				message: __('Email duplicated successfully', 'doublescale'),
			});

			fetchSequenceEmails();
		} catch (error: any) {
			createNotice({
				type: 'error',
				message:
					error.message ||
					__('Failed to duplicate email', 'doublescale'),
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

	const handleEditSequence = () => {
		setIsEditingSequence(true);
	};

	// Check if any panel is open
	const isPanelOpen = isAddingEmail || isEditingEmail;

	return (
		<div className="fixed inset-0 z-[150000] bg-white flex flex-col">
			{/* Header */}
			<div className="border-b border-[#E4E7EC] pr-14 pl-5 py-4 flex-shrink-0">
				<div className="flex items-center justify-between">
					<div className="text-lg font-medium flex items-center gap-2">
						<span
							onClick={handleClose}
							className="text-base text-normal text-[#667085] cursor-pointer hover:text-[#1E3A8A] transition-colors"
						>
							{__('Email Sequences', 'doublescale')}
						</span>
						<ChevronRight className="h-4 w-4" />
						<span className="capitalize text-normal text-[#374151]">{sequenceName || params?.id}</span>
					</div>
					<div className="flex items-center gap-2">
						<button
							onClick={handleEditSequence}
							className="ml-1 p-1.5 hover:bg-gray-100 rounded transition-colors"
							title={__('Edit Sequence', 'doublescale')}
						>
							<SettingsIcon className="h-4 w-4 text-gray-600 hover:text-gray-900" />
						</button>
						<button
							onClick={handleClose}
							className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100"
						>
							<X className="h-6 w-6" />
							<span className="sr-only">Close</span>
						</button>
					</div>
				</div>
			</div>

			{/* Main Content Area - Side by Side Layout */}
			<div className="flex-1 flex overflow-hidden min-h-0">
				{/* Left Side - FlowChart */}
				<div
					className={`transition-all duration-300 overflow-y-auto ${isPanelOpen ? 'w-3/4' : 'w-full'}`}
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

				{/* Right Side - Add/Edit Panel */}
				{isAddingEmail && (
					<div className="w-1/2 h-full relative bg-white">
						<div className="absolute -left-14 top-6 z-[9999]">
							<button
								onClick={() => setIsAddingEmail(false)}
								className="h-10 w-10 bg-white hover:bg-gray-100 rounded-full shadow-[0_4px_20px_0_rgba(59,130,246,0.14)] flex items-center justify-center transition-all hover:scale-110"
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
								sequenceId={params.id || ''}
								onSuccess={fetchSequenceEmails}
								handleNavigate={navigate}
							/>
						</div>
					</div>
				)}

				{isEditingEmail && editingEmailId && (
					<div className="w-1/2 relative h-full bg-white">
						<div className="absolute -left-14 top-6 z-[9999]">
							<button
								onClick={() => setIsEditingEmail(false)}
								className="h-10 w-10 bg-white hover:bg-gray-100 rounded-full shadow-[0_4px_20px_0_rgba(59,130,246,0.14)] flex items-center justify-center transition-all hover:scale-110"
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
								sequenceId={params.id || ''}
								emailId={editingEmailId}
								onSuccess={fetchSequenceEmails}
								handleNavigate={navigate}
							/>
						</div>
					</div>
				)}
			</div>

			{/* Reports Modal */}
			{reportingEmailId && (
				<SequenceReportsModal
					open={isShowingReports}
					onOpenChange={setIsShowingReports}
					sequenceId={params.id || ''}
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
					email={sequenceEmails.find(
						(e) => e.id === deletingEmailId
					)}
					onConfirm={handleConfirmDelete}
				/>
			)}

			{/* Edit Sequence Modal */}
			{sequenceData && (
				<EditEmailSequence
					id={sequenceData.id}
					name={sequenceData.name}
					settings={sequenceData.settings}
					isEditing={isEditingSequence}
					setIsEditing={setIsEditingSequence}
					onSuccess={() => {
						fetchSequenceEmails();
						setIsEditingSequence(false);
					}}
				/>
			)}
		</div>
	);
};

export default SequencesMail;
