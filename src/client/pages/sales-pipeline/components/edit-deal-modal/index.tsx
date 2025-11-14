/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState, useMemo, useEffect, useCallback } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';

/**
 * External dependencies
 */
// import {InputNumber, DatePicker, message } from 'antd';

import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from '@quillcrm/components/ui/dialog';
import {
	Select,
	SelectTrigger,
	SelectValue,
	SelectContent,
	SelectItem,
} from '@/components/ui/select';
import { debounce } from 'lodash';
import dayjs from 'dayjs';

/**
 * Internal dependencies
 */

import { useDealOperations } from '../../hooks/use-deal-operations';
import { useUsers } from '../../hooks/use-users';
import { useCapabilities } from '@quillcrm/hooks/use-capabilities';
import { Deal } from '../../types';
import './style.scss';
import ConfigAPI, { SOURCE_OPTIONS } from '@quillcrm/config';
import { CustomDialogHeader, NoticeBanner } from '@quillcrm/components';
import DealValueIcon from '@quillcrm/components/icons/deal-value';
import { Input } from '@quillcrm/components/ui/input';
import { DateRangePicker } from '@quillcrm/components/ui/date-range-picker';
import { CustomFieldsSection } from '../deal-custom-fields';
import { Button } from '@quillcrm/components/ui/button';
import AllDealIcon from '@quillcrm/components/icons/all-deals';
import { useDispatch } from '@wordpress/data';
import { convertDate } from '@quillcrm/utils';
import { DatePicker } from '@quillcrm/components/ui/date-picker';

interface PipelineStageBoxProps {
	stage: {
		color: string;
	};
	index: number;
	totalStages: number;
	children?: React.ReactNode;
	triangleWidth?: number;
	triangleHeight?: number;
	boxHeight?: number;
	isSelected?: boolean;
	isPrevious?: boolean;
}
const PipelineStageHeaderBox: React.FC<PipelineStageBoxProps> = ({
	stage,
	index,
	totalStages,
	children,
	isSelected,
	isPrevious,
}) => {
	const backgroundColor = isSelected || isPrevious ? stage.color : '#DEE1E6';

	const isFirst = index === 0;
	const isLast = index === totalStages - 1;

	return (
		<div
			className="relative flex items-center"
			style={{
				zIndex: 100 - index,
				marginLeft: isFirst ? 0 : -5,
			}}
		>
			<div
				className={`relative flex items-center justify-center h-8 px-3 ${
					isFirst ? 'rounded-l-[6px]' : ''
				} ${isLast ? 'rounded-r-[6px]' : ''}`}
				style={{
					backgroundColor,
					minWidth: 40,
					zIndex: 100 - index,
					boxShadow: isSelected ? '0 0 6px rgba(0,0,0,0.1)' : 'none',
				}}
			>
				<span className="text-[11px] font-medium text-[#09090B] whitespace-nowrap">
					{children}
				</span>
				{!isLast && (
					<span
						className="absolute top-0 right-[-8px] w-0 h-0"
						style={{
							borderTop: '16px solid transparent',
							borderBottom: '16px solid transparent',
							borderLeft: `9px solid ${backgroundColor}`,
							zIndex: 100 - index,
						}}
					/>
				)}

				{!isFirst && (
					<span
						className="absolute top-0 left-0 w-0 h-0"
						style={{
							borderTop: '16px solid transparent',
							borderBottom: '16px solid transparent',
							borderLeft: '9px solid white',
							zIndex: 99 - index,
						}}
					/>
				)}
			</div>
		</div>
	);
};

export interface EditDealModalProps {
	visible: boolean;
	onClose: () => void;
	onSuccess: () => void;
	deal: Deal | null;
	pipelines: any[];
}

interface DealFormData {
	title: string;
	contact_id: number;
	pipeline_id: number;
	stage_id: number;
	value?: number;
	expected_close_date?: string;
	// probability?: number;
	source?: string;
	owner_id?: number;
	priority?: string;
}

interface Contact {
	id: number;
	first_name: string;
	last_name: string;
	email: string;
}

const dealSchema = z.object({
	title: z.string().min(1, __('Title is required', 'quillcrm')),
	contact_id: z.number().optional(),
	pipeline_id: z.number().optional(),
	stage_id: z.number().optional(),
	value: z.number().optional(),
	expected_close_date: z.any().optional(),
	source: z.string().optional(),
	owner_id: z.number().optional(),
	priority: z.string().optional(),
});

export const EditDealModal: React.FC<EditDealModalProps> = ({
	visible,
	onClose,
	onSuccess,
	deal,
	pipelines,
}) => {
	// const [form] = Form.useForm();
	const [loading, setLoading] = useState(false);
	const [contacts, setContacts] = useState<Contact[]>([]);
	const [contactSearchLoading, setContactSearchLoading] = useState(false);

	// Use shared users hook
	const {
		users: owners,
		loading: ownersLoading,
		loadUsers: loadOwners,
		searchUsers: searchOwners,
		ensureUserIncluded,
	} = useUsers();
	const [selectedPipelineId, setSelectedPipelineId] = useState<number | null>(
		null
	);

	const { updateDeal } = useDealOperations();
	const { isDealOwner } = useCapabilities();

	const form = useForm<z.infer<typeof dealSchema>>({
		resolver: zodResolver(dealSchema),
		defaultValues: {
			title: '',
			contact_id: undefined,
			pipeline_id: undefined,
			stage_id: undefined,
			value: undefined,
			expected_close_date: undefined,
			source: '',
			owner_id: undefined,
			priority: '',
		},
	});

	const priorities = useMemo(() => {
		return ConfigAPI.getDealPriorities();
	}, []);

	// Check if current user is restricted (deal owner)
	const isRestrictedUser = isDealOwner();

	const dispatch = useDispatch('quillcrm/core');
	const createNotice = dispatch?.createNotice;
	// Load initial contacts when modal opens
	useEffect(() => {
		if (visible) {
			fetchInitialContacts();
		}
	}, [visible]);

	// Initialize form when deal changes - with proper timing
	useEffect(() => {
		if (deal && visible && pipelines.length > 0) {
			setSelectedPipelineId(deal.pipeline?.id || 0);

			form.reset({
				title: deal.title,
				stage_id: deal.stage?.id ? Number(deal.stage.id) : undefined,
				value: deal.value,

				expected_close_date: deal.expected_close_date
					? new Date(deal.expected_close_date)
					: undefined,
				// source: deal.source || undefined,
				source: deal.source?.toLowerCase() ?? '',
				priority: deal.priority || undefined,
				...(isRestrictedUser
					? {}
					: {
							contact_id: deal.contact?.id,
							pipeline_id: deal.pipeline?.id
								? Number(deal.pipeline.id)
								: undefined,
							owner_id: deal.owner?.id
								? Number(deal.owner.id)
								: undefined,
						}),
			});

			fetchInitialOwners();
		}
	}, [deal, visible, pipelines, isRestrictedUser]);

	// Reset state when modal closes
	useEffect(() => {
		if (!visible) {
			setContacts([]);
			setSelectedPipelineId(null);
			// Note: form.resetFields() not needed here because destroyOnClose={true} handles form cleanup
		}
	}, [visible]);

	// Fetch initial contacts (recent contacts + current contact)
	const fetchInitialContacts = useCallback(async () => {
		setContactSearchLoading(true);
		try {
			const response = await apiFetch({
				path: '/qc/v1/contacts?per_page=20&sort_by=updated_at&sort_order=desc',
			});

			const contactsData = Array.isArray(response)
				? response
				: (response as any)?.data || (response as any)?.items || [];

			// Ensure current deal's contact is included if not in recent list
			let finalContacts = [...contactsData];
			if (
				deal?.contact &&
				!finalContacts.find((c) => c.id === deal.contact?.id)
			) {
				finalContacts.unshift(deal.contact);
			}

			setContacts(finalContacts);
		} catch (error) {
			console.error('Failed to fetch initial contacts:', error);
			// Fallback to current contact only
			if (deal?.contact) {
				setContacts([deal.contact]);
			}
		} finally {
			setContactSearchLoading(false);
		}
	}, [deal?.contact]);

	// Fetch contacts with search
	const fetchContacts = useCallback(
		debounce(async (searchTerm: string) => {
			if (!searchTerm || searchTerm.length < 2) {
				fetchInitialContacts();
				return;
			}

			setContactSearchLoading(true);
			try {
				const response = await apiFetch({
					path: `/qc/v1/contacts?search=${encodeURIComponent(searchTerm)}&per_page=20`,
				});

				const contactsData = Array.isArray(response)
					? response
					: (response as any)?.data || (response as any)?.items || [];

				setContacts(contactsData);
			} catch (error) {
				console.error('Failed to fetch contacts:', error);
			} finally {
				setContactSearchLoading(false);
			}
		}, 300),
		[fetchInitialContacts]
	);

	// Fetch initial owners using our custom users endpoint
	const fetchInitialOwners = useCallback(async () => {
		await loadOwners();

		// Ensure current deal's owner is included
		if (deal?.owner) {
			ensureUserIncluded(deal.owner);
		}
	}, [deal?.owner, loadOwners, ensureUserIncluded]);

	const handleSubmit = form.handleSubmit(async (values) => {
		if (!deal) return;
		setLoading(true);

		try {
			const updateData: any = {
				title: values.title,
				stage_id: values.stage_id,
				value: values.value || 0,
				currency: 'USD',
				expected_close_date: values.expected_close_date || '',


				source: values.source,
				priority: values.priority,
			};

			if (!isRestrictedUser) {
				updateData.contact_id = values.contact_id;
				updateData.pipeline_id = values.pipeline_id;
				updateData.owner_id = values.owner_id;
			}

			await updateDeal(deal.id, updateData);
			createNotice?.({
				type: 'success',
				message: __(
					`Deal "${values.title}" updated successfully!`,
					'quillcrm'
				),
			});

			onSuccess();
			onClose();
		} catch (error) {
			const err = error as Error;
			createNotice?.({
				type: 'error',
				message: err.message || __('Failed to update deal', 'quillcrm'),
			});
		} finally {
			setLoading(false);
		}
	});

	const handleCancel = () => {
		onClose();
	};

	const handlePipelineChange = (pipelineId: number) => {
		// Clear stage selection when pipeline changes
		setSelectedPipelineId(pipelineId);
		form.setValue('stage_id', undefined);
	};
	// console.log(deal?.source, SOURCE_OPTIONS)
	const currentPipeline = pipelines?.find(
		(p: any) => String(p.id) === String(deal?.pipeline?.id)
	);

	return (
		<Dialog
			open={visible}
			onOpenChange={(open) => {
				if (!open) {
					handleCancel();
				}
			}}
		>
			<DialogContent className="w-full max-w-3xl max-h-[80vh] my-2 sm:mx-auto overflow-y-auto z-[100000]  p-8 rounded-[16px] ">
				<DialogHeader>
					<DialogTitle className="!mb-0">
						<CustomDialogHeader
							title={__('Edit Deal', 'quillcrm')}
							subtitle=""
							icon={<AllDealIcon />}
						/>
					</DialogTitle>
				</DialogHeader>

				<div className="w-full grid grid-cols-1 md:grid-cols-2 gap-6 my-3">
					{/* Related Contact */}
					{isRestrictedUser ? (
						<div className="flex flex-col gap-2">
							<label className="font-normal text-[#09090B] text-base">
								{__('ٌRelated Contact', 'quillcrm')}
							</label>
							<input
								className="h-12 !shadow-none py-[5px] px-4 rounded-[8px] border border-[#DEE1E6] !text-[#09090B] font-sm text-sm landing-[150%] tracking-[-.5px]"
								value={
									deal?.contact
										? `${deal.contact.first_name} ${deal.contact.last_name} (${deal.contact.email})`
										: __('No contact', 'quillcrm')
								}
								disabled
								placeholder={__('Contact (fixed)', 'quillcrm')}
							/>
						</div>
					) : (
						<div className="flex flex-col gap-2">
							<label className="font-normal text-[#09090B] text-base ">
								{__('Related Contact', 'quillcrm')}
							</label>

							<Select
								onValueChange={(value) =>
									form.setValue('contact_id', Number(value))
								}
								value={form.watch('contact_id')?.toString()}
								onOpenChange={(open) => {
									if (open && contacts.length === 0) {
										fetchInitialContacts();
									}
								}}
							>
								<SelectTrigger className="h-12 !shadow-none py-[5px] px-4 rounded-[8px] border border-[#DEE1E6] !text-[#09090B] font-sm text-sm landing-[150%] tracking-[-.5px]">
									<SelectValue
										placeholder={__(
											'Select a contact',
											'quillcrm'
										)}
									/>
								</SelectTrigger>

								<SelectContent>
									{contactSearchLoading ? (
										<div className="px-3 py-2 text-sm text-muted-foreground">
											{__('Loading...', 'quillcrm')}
										</div>
									) : contacts.length > 0 ? (
										contacts.map((contact) => (
											<SelectItem
												key={contact.id}
												value={String(contact.id)}
											>
												{contact.first_name}{' '}
												{contact.last_name} (
												{contact.email})
											</SelectItem>
										))
									) : (
										<div className="px-3 py-2 text-sm text-muted-foreground">
											{__(
												'No contacts found',
												'quillcrm'
											)}
										</div>
									)}
								</SelectContent>
							</Select>
						</div>
					)}
					{/* Deal value */}
					<div className="flex flex-col gap-2">
						<label className=" font-normal text-[#09090B] text-base">
							{__('Deal Value', 'quillcrm')}
						</label>
						<div className=" flex justify-between gap-3">
							<Input
								type="number"
								value={form.watch('value')}
								onChange={(e) =>
									form.setValue(
										'value',
										Number(e.target.value)
									)
								}
								placeholder={__('Deal Value', 'quillcrm')}
								className=" h-12 !shadow-none py-[5px] px-4 !rounded-[8px] outline-none border !border-[#DEE1E6] !text-[#09090B] font-sm text-sm landing-[150%] tracking-[-.5px]"
							/>
							<div className=" h-12 rounded-[8px] flex justify-center items-center gap-1 border border-[#DEE1E6] bg-[#F0F0F0] py-[5px] px-[12px]">
								<DealValueIcon />
								<span>USD</span>
							</div>
						</div>
					</div>
					{/* deal name */}
					<div className="flex flex-col gap-2">
						<label className="font-normal text-[#09090B] text-base">
							{__('Deal Title', 'quillcrm')}
						</label>
						<Input
							type="text"
							value={form.watch('title')}
							onChange={(e) =>
								form.setValue('title', e.target.value)
							}
							placeholder={__('Deal Name', 'quillcrm')}
							className="h-12 !shadow-none py-[5px] px-4 !rounded-[8px] outline-none border !border-[#DEE1E6] !text-[#09090B] font-sm text-sm landing-[150%] tracking-[-.5px]"
						/>
					</div>
					{/* Deal Owner */}
					{isRestrictedUser ? (
						<div className="flex flex-col gap-2">
							<label className="font-normal text-[#09090B] text-base">
								{__('Deal Owner', 'quillcrm')}
							</label>
							<input
								className="h-12 w-full rounded-[8px] border border-input bg-muted px-4 py-[5px] text-sm"
								value={
									deal?.owner
										? `${deal.owner.display_name} (${deal.owner.email})`
										: __('Current User', 'quillcrm')
								}
								disabled
								placeholder={__('Owner (fixed)', 'quillcrm')}
							/>
						</div>
					) : (
						<div className="flex flex-col gap-2">
							<label className="font-normal text-[#09090B] text-base ">
								{__('Deal Owner', 'quillcrm')}
							</label>

							<Select
								value={
									form.watch('owner_id')
										? String(form.watch('owner_id'))
										: ''
								}
								onValueChange={(v) =>
									form.setValue('owner_id', Number(v))
								}
								onOpenChange={(open) => {
									if (open && owners.length === 0) {
										fetchInitialOwners();
									}
								}}
							>
								<SelectTrigger className="h-12  !shadow-none py-[5px] px-4 rounded-[8px] border border-[#DEE1E6] text-[#09090B] text-sm leading-[150%] tracking-[-.5px]">
									<SelectValue
										placeholder={
											ownersLoading
												? __(
														'Loading owners...',
														'quillcrm'
													)
												: __('Select Owner', 'quillcrm')
										}
									/>
								</SelectTrigger>

								<SelectContent>
									{ownersLoading ? (
										<div className="px-3 py-2 text-sm text-muted-foreground ">
											{__(
												'Loading owners...',
												'quillcrm'
											)}
										</div>
									) : owners.length > 0 ? (
										owners.map((owner) => (
											<SelectItem
												key={owner.id}
												value={String(owner.id)}
											>
												{owner.display_name} (
												{owner.email})
											</SelectItem>
										))
									) : (
										<div className="px-3 py-2 text-sm text-muted-foreground">
											{__('No users found', 'quillcrm')}
										</div>
									)}
								</SelectContent>
							</Select>
						</div>
					)}
					{/* deal source */}
					<div className="flex flex-col gap-2">
						<label className="font-normal text-[#09090B] text-base">
							{__('Deal Source', 'quillcrm')}
						</label>

						<Select
							value={form.watch('source') || ''}
							onValueChange={(value) =>
								form.setValue('source', value)
							}
						>
							<SelectTrigger className="h-12 !shadow-none py-[5px] px-4 rounded-[8px] border border-[#DEE1E6] !text-[#09090B] text-sm leading-[150%] tracking-[-.5px]">
								<SelectValue
									placeholder={__(
										'Select deal source',
										'quillcrm'
									)}
								/>
							</SelectTrigger>

							<SelectContent>
								{SOURCE_OPTIONS.map((source) => (
									<SelectItem
										key={source.value}
										value={source.value}
									>
										{source.label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
					{/* expeted close date */}
					<div className="flex flex-col gap-2 z-[120]">
						<label className="block mb-1 font-normal text-[#09090B] text-base">
							{__('Expected Close Date', 'quillcrm')}
						</label>

						<DatePicker
							value={
								form.watch('expected_close_date')
									? new Date(
											form.watch('expected_close_date')
										)
									: null
							}
							onChange={(value: string) => {
								form.setValue(
									'expected_close_date',
									value || ''
								);
							}}

							placeholder={__('Select Date', 'quillcrm')}
							buttonClassName="w-full h-12 justify-start text-left font-normal rounded-[8px] border border-[#DEE1E6] bg-white text-[#09090B] text-base tracking-[-.5px] px-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E3A8A] focus-visible:ring-offset-2 data-[state=open]:ring-2 data-[state=open]:ring-[#1E3A8A]"

						/>
					</div>
					{/* pipeline */}
					<div className="flex flex-col gap-2">
						<label className="block mb-1 font-normal text-[#09090B] text-base">
							{__('Pipeline', 'quillcrm')}
						</label>

						<Input
							value={
								deal?.pipeline?.name ||
								__('No pipeline', 'quillcrm')
							}
							disabled
							className="w-full h-12 rounded-[8px] border disabled:bg-[#F5F5F5] font-normal text-base tracking-[-.5px] disabled:text-[#09090B] disabled:border-[#DEE1E6]  cursor-not-allowed"
						/>
					</div>
					{/* stages  */}

					{currentPipeline?.stages &&
						currentPipeline.stages.length > 0 && (
							<div className="flex flex-col gap-2 mt-2">
								<label className="block mb-1 font-normal text-[#09090B] text-base">
									{__('Deal Stage', 'quillcrm')}
								</label>

								<div className="flex flex-wrap gap-2">
									{[...currentPipeline.stages]
										.sort(
											(a, b) =>
												a.sort_order - b.sort_order
										)
										.map((stage: any, index: number) => {
											const selectedIndex =
												currentPipeline.stages.findIndex(
													(s: any) =>
														s.id ===
														form.watch('stage_id')
												);

											const isSelected =
												index === selectedIndex;
											const isPrevious =
												index < selectedIndex;

											return (
												<div
													key={stage.id}
													onClick={() =>
														form.setValue(
															'stage_id',
															stage.id
														)
													}
													className={`cursor-pointer transition-all duration-200 `}
													title={stage.name}
												>
													<PipelineStageHeaderBox
														stage={stage}
														index={index}
														totalStages={
															currentPipeline
																.stages.length
														}
														isSelected={isSelected}
														isPrevious={isPrevious}
													/>
												</div>
											);
										})}
								</div>
							</div>
						)}
				</div>
				{/* Priority select */}
				<div className="w-full grid grid-cols-1 gap-6">
					{priorities && (
						<div className="flex flex-col gap-2 mt-2">
							<label className="block mb-1 font-normal text-[#09090B] text-base">
								{__('Priority', 'quillcrm')}
							</label>

							<div className="flex flex-wrap gap-2">
								{Object.entries(priorities).map(
									([key, value]) => {
										const selectedPriority =
											form.watch('priority');
										const isSelected =
											selectedPriority === key;

										return (
											<div
												key={key}
												onClick={() =>
													form.setValue(
														'priority',
														key
													)
												}
												className={`flex items-center gap-2 cursor-pointer px-4 py-2 rounded-md border transition-all duration-200 ${
													isSelected
														? 'border-[#1E3A8A] bg-[#E4EEFD] ring-2 ring-[#1E3A8A]/30'
														: 'border-[#DEE1E6] bg-white hover:bg-[#F9FAFB]'
												}`}
											>
												<span
													className="inline-block w-5 h-5 rounded-md"
													style={{
														backgroundColor:
															value.color,
													}}
												/>
												<span
													className={`text-sm font-medium ${
														isSelected
															? 'text-[#1E3A8A]'
															: 'text-[#09090B]'
													}`}
												>
													{value.label}
												</span>
											</div>
										);
									}
								)}
							</div>
						</div>
					)}
					<div className="h-[1px] bg-[#DEE1E6] w-full"></div>
					{/* custom filed */}

					<CustomFieldsSection
						deal={deal}
						// initialValues={deal?.custom_fields || {}}
						onChange={(fields) => {
							Object.entries(fields).forEach(([key, value]) => {
								form.setValue(key as any, value);
							});
						}}
					/>
					{/*button */}
					<div className="mt-6">
						<Button
							type="button"
							onClick={handleSubmit}
							disabled={loading}
							className="w-full bg-gradient-to-r from-[#1E3A8A] via-[#1E3A8A] to-[#3B82F6] text-white flex h-12 justify-center items-center gap-2 rounded-md text-base font-medium tracking-tight hover:opacity-90 transition-all duration-200"
						>
							{loading
								? __('Updating deal...', 'quillcrm')
								: __('Update Deal', 'quillcrm')}
						</Button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
};
