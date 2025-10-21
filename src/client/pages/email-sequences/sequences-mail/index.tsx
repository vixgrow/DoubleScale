import React, { useState, useEffect } from 'react';
import { NavLink, useParams } from '@quillcrm/navigation';
import { __ } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';
import { useDispatch } from '@wordpress/data';

// Import shadcn UI components
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { PlusIcon } from 'lucide-react';

// Import components
import AddSequenceMail from './components/add-sequence-mail';
import EditSequenceMail from './components/edit-sequence-mail';
import SequenceReportsModal from './components/sequence-reports-modal';
import { END_POINT, SEQUENCE_MAIL_TYPE } from '../constants';

// Import types
import { EmailSequence, SequenceMail, SequenceMailStats } from '../types';

const SequencesMail: React.FC = () => {
	const { id } = useParams<{ id: string }>();
	const { createNotice } = useDispatch('quillcrm/core');
	const [loading, setLoading] = useState(true);
	const [sequenceName, setSequenceName] = useState('');
	// Store the full sequence data for potential future use
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

	// Fetch sequence emails on component mount
	useEffect(() => {
		fetchSequenceEmails();
	}, [id]);

	const fetchSequenceEmails = async () => {
		setLoading(true);
		try {
			// Fetch sequence details with all sequence emails
			const sequenceResponse = await apiFetch<EmailSequence>({
				path: END_POINT + `/${id}`,
			});

			// Store the full sequence data
			setSequenceData(sequenceResponse);

			// Set the sequence name
			setSequenceName(sequenceResponse.name || '');

			// Set the sequence emails
			setSequenceEmails(sequenceResponse.sequences_mail || []);

			console.log('sequenceEmails', sequenceResponse.sequences_mail);
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

	// Helper function to format delay string
	const formatDelay = (delay: { value: number; unit: string }) => {
		if (!delay) return 'Immediately';
		if (delay.value === 0) return 'Immediately';

		const unit = delay.unit.toLowerCase();
		const unitStr = delay.value === 1 ? unit.slice(0, -1) : unit; // Remove 's' for singular

		return `After ${delay.value} ${unitStr} from starting point`;
	};

	// Helper function to get display stats
	const getDisplayStats = (email: SequenceMail): SequenceMailStats => {
		return {
			sent: email.sent || 0,
			opened: email.opened || 0,
			click: email.click || 0,
		};
	};

	const handleEdit = (id: number) => {
		setEditingEmailId(id);
		setIsEditingEmail(true);
	};

	const handleDelete = async (emailId: number) => {
		if (
			!window.confirm(
				__('Are you sure you want to delete this email?', 'quillcrm')
			)
		) {
			return;
		}

		try {
			await apiFetch({
				path: `${END_POINT}/${emailId}`,
				method: 'DELETE',
			});

			createNotice({
				type: 'success',
				message: __('Email deleted successfully', 'quillcrm'),
			});

			fetchSequenceEmails();
		} catch (error: any) {
			createNotice({
				type: 'error',
				message:
					error.message || __('Failed to delete email', 'quillcrm'),
			});
		}
	};

	const handleDuplicate = async (emailId: number) => {
		try {
			// Find the email to duplicate
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
		// Find the email name for the modal title
		const email = sequenceEmails.find((e) => e.id === emailId);
		setReportingEmailId(emailId);
		setReportingEmailName(email?.name || `Email ${emailId}`);
		setIsShowingReports(true);
	};

	const handleAddSequenceEmail = () => {
		setIsAddingEmail(true);
	};

	return (
		<div className="email-sequence-detail">
			<div className="flex justify-between items-center mb-4">
				<h1 className="text-xl font-medium">
					<NavLink to={`email-sequences`}>
						{__('Email Sequences', 'quillcrm')}
					</NavLink>
					/ {sequenceName || id}
				</h1>
			</div>

			<div className="space-y-4">
				{loading ? (
					<div className="text-center py-8">
						{__('Loading...', 'quillcrm')}
					</div>
				) : sequenceEmails.length === 0 ? (
					<div className="text-center py-8">
						{__(
							'No emails in this sequence yet. Add your first email!',
							'quillcrm'
						)}
					</div>
				) : (
					sequenceEmails.map((email) => {
						const stats = getDisplayStats(email);
						const delay = email.settings?.delay
							? formatDelay(email.settings.delay)
							: 'Immediately';

						return (
							<Card key={email.id} className="p-4">
								<div className="grid grid-cols-[auto_1fr_auto] gap-4">
									<div className="flex items-center justify-center w-8 h-8 bg-blue-500 text-white rounded-md">
										{email.id}
									</div>

									<div className="space-y-1">
										<div className="text-sm text-muted-foreground">
											{delay}
										</div>
										<div className="font-medium">
											{email.name}
										</div>
									</div>

									<div className="flex items-center space-x-4">
										<Button
											variant="ghost"
											size="sm"
											className="text-blue-500"
											onClick={() => handleEdit(email.id)}
										>
											<svg
												width="16"
												height="16"
												viewBox="0 0 24 24"
												fill="none"
												stroke="currentColor"
												strokeWidth="2"
												strokeLinecap="round"
												strokeLinejoin="round"
											>
												<path d="M12 20h9"></path>
												<path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
											</svg>
											<span className="ml-1">
												{__('edit', 'quillcrm')}
											</span>
										</Button>

										<Button
											variant="ghost"
											size="sm"
											className="text-green-500"
											onClick={() =>
												handleShowReport(email.id)
											}
										>
											<svg
												width="16"
												height="16"
												viewBox="0 0 24 24"
												fill="none"
												stroke="currentColor"
												strokeWidth="2"
												strokeLinecap="round"
												strokeLinejoin="round"
											>
												<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
												<polyline points="14 2 14 8 20 8"></polyline>
												<line
													x1="16"
													y1="13"
													x2="8"
													y2="13"
												></line>
												<line
													x1="16"
													y1="17"
													x2="8"
													y2="17"
												></line>
												<polyline points="10 9 9 9 8 9"></polyline>
											</svg>
											<span className="ml-1">
												{__('Show Report', 'quillcrm')}
											</span>
										</Button>

										<Button
											variant="ghost"
											size="sm"
											onClick={() =>
												handleDuplicate(email.id)
											}
										>
											<svg
												width="16"
												height="16"
												viewBox="0 0 24 24"
												fill="none"
												stroke="currentColor"
												strokeWidth="2"
												strokeLinecap="round"
												strokeLinejoin="round"
											>
												<rect
													x="9"
													y="9"
													width="13"
													height="13"
													rx="2"
													ry="2"
												></rect>
												<path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
											</svg>
											<span className="ml-1">
												{__('Duplicate', 'quillcrm')}
											</span>
										</Button>

										<Button
											variant="ghost"
											size="sm"
											className="text-red-500"
											onClick={() =>
												handleDelete(email.id)
											}
										>
											<svg
												width="16"
												height="16"
												viewBox="0 0 24 24"
												fill="none"
												stroke="currentColor"
												strokeWidth="2"
												strokeLinecap="round"
												strokeLinejoin="round"
											>
												<polyline points="3 6 5 6 21 6"></polyline>
												<path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
											</svg>
											<span className="ml-1">
												{__('Delete', 'quillcrm')}
											</span>
										</Button>
									</div>
								</div>

								<div className="mt-4 grid grid-cols-4 text-center">
									<div className="flex flex-col">
										<span className="text-lg font-medium">
											{typeof stats.sent === 'string'
												? parseInt(stats.sent) > 0
													? stats.sent
													: '--'
												: stats.sent > 0
													? stats.sent.toString()
													: '--'}
										</span>
										<span className="text-sm text-muted-foreground">
											{__('Sent', 'quillcrm')}
										</span>
									</div>
									<div className="flex flex-col">
										<span className="text-lg font-medium">
											{stats.opened > 0
												? stats.opened
												: '--'}
										</span>
										<span className="text-sm text-muted-foreground">
											{__('Opened', 'quillcrm')}
										</span>
									</div>
									<div className="flex flex-col">
										<span className="text-lg font-medium">
											{stats.click > 0
												? stats.click
												: '--'}
										</span>
										<span className="text-sm text-muted-foreground">
											{__('Clicked', 'quillcrm')}
										</span>
									</div>
								</div>
							</Card>
						);
					})
				)}

				<div className="flex justify-center mt-8">
					<Button
						variant="outline"
						onClick={handleAddSequenceEmail}
						className="flex items-center gap-2"
					>
						<PlusIcon size={16} />
						{__('Add another Sequence Email', 'quillcrm')}
					</Button>
				</div>
			</div>

			{/* Add Sequence Email Modal */}
			<AddSequenceMail
				isAdding={isAddingEmail}
				setIsAdding={setIsAddingEmail}
				sequenceId={id || ''}
				onSuccess={fetchSequenceEmails}
			/>

			{/* Edit Sequence Email Modal */}
			{editingEmailId && (
				<EditSequenceMail
					isEditing={isEditingEmail}
					setIsEditing={setIsEditingEmail}
					sequenceId={id || ''}
					emailId={editingEmailId}
					onSuccess={fetchSequenceEmails}
				/>
			)}

			{/* Reports Modal */}
			{reportingEmailId && (
				<SequenceReportsModal
					open={isShowingReports}
					onOpenChange={setIsShowingReports}
					sequenceId={id || ''}
					emailId={reportingEmailId}
					emailName={reportingEmailName}
				/>
			)}
		</div>
	);
};

export default SequencesMail;
