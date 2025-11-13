/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState, useMemo, useEffect, useCallback } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import { useDispatch } from '@wordpress/data';

/**
 * External dependencies
 */
import { useForm } from 'react-hook-form';
import { z } from 'zod';

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
import { Button } from '@/components/ui/button';
import { Input } from '@quillcrm/components/ui/input';

/**
 * Internal dependencies
 */
import { useDealOperations } from '../../hooks/use-deal-operations';
import { useUsers } from '../../hooks/use-users';
import { UserService } from '../../../../../services/user-service';
import { SOURCE_OPTIONS } from '../../../../../config/types/config-data';
import './style.scss';
import ConfigAPI from '@quillcrm/config';
import { CustomDialogHeader } from '@quillcrm/components';
import AddDealIcon from '@quillcrm/components/icons/add-deal';
import DealValueIcon from '@quillcrm/components/icons/deal-value';
import { CustomFieldsSection } from '../deal-custom-fields';
import { DatePicker } from '@quillcrm/components/ui/date-picker';

export interface NewDealModalProps {
	visible: boolean;
	onClose: () => void;
	onSuccess: () => void;
	pipeline: any;
	initialStageId?: number;
}

interface Contact {
	id: number;
	first_name: string;
	last_name: string;
	email: string;
}

interface PipelineStageBoxProps {
	stage: {
		name: string;
		color: string;
	};
	index: number;
	totalStages: number;
	isSelected?: boolean;
	isPrevious?: boolean;
}

const PipelineStageHeaderBox: React.FC<PipelineStageBoxProps> = ({
	stage,
	index,
	totalStages,
	// children,
	isSelected,
	isPrevious,

}) => {
	const backgroundColor =
		isSelected || isPrevious ? stage.color : '#DEE1E6';

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




// Zod Schema
const dealFormSchema = z.object({
	title: z
		.string()
		.min(3, __('Deal title must be at least 3 characters', 'quillcrm')),
	contact_id: z.number().min(1, __('Please select a contact', 'quillcrm')),
	stage_id: z.number().min(1, __('Please select a stage', 'quillcrm')),
	value: z.number().optional(),
	expected_close_date: z.string().optional(),
	priority: z.string().optional(),
	source: z.string().optional(),
	owner_id: z.number().min(1, __('Please select an owner', 'quillcrm')),
	custom_fields: z.record(z.string(), z.any()).optional(),
});

type DealFormData = z.infer<typeof dealFormSchema>;

export const NewDealModal: React.FC<NewDealModalProps> = ({
	visible,
	onClose,
	onSuccess,
	pipeline,
	initialStageId,
}) => {
	const [loading, setLoading] = useState(false);
	const [contacts, setContacts] = useState<Contact[]>([]);
	const [contactsLoading, setContactsLoading] = useState(false);
	const [currentUserId, setCurrentUserId] = useState<number | undefined>(
		undefined
	);

	const dispatch = useDispatch('quillcrm/core');
	const createNotice = dispatch?.createNotice;

	const priorities = useMemo(() => {
		return ConfigAPI.getDealPriorities();
	}, []);

	const {
		users: owners,
		loading: ownersLoading,
		loadUsers: loadOwners,
		ensureUserIncluded,
	} = useUsers();
	const { createDeal } = useDealOperations();

	// Get the first stage as default
	const defaultStageId = useMemo(() => {
		if (!pipeline?.stages?.length) return undefined;
		const sortedStages = [...pipeline.stages].sort(
			(a, b) => a.sort_order - b.sort_order
		);
		return sortedStages[0].id;
	}, [pipeline?.stages]);

	const defaultOwnerId = useMemo(() => {
		return currentUserId;
	}, [currentUserId]);

	// React Hook Form
	const {
		register,
		handleSubmit,
		watch,
		setValue,
		reset,
		formState: { errors },
	} = useForm<DealFormData>({
		defaultValues: {
			title: '',
			contact_id: 0,
			stage_id: 0,
			value: undefined,
			expected_close_date: '',
			priority: '',
			source: '',
			owner_id: 0,
			custom_fields: {},
		},
	});

	const formValues = watch();

	// Get current user ID
	useEffect(() => {
		const fetchCurrentUser = async () => {
			try {
				const globalUserId = (window as any)?.qcData?.currentUser?.id;
				if (globalUserId) {
					setCurrentUserId(Number(globalUserId));
					return;
				}

				const currentUser = await UserService.getCurrentUser();
				if (currentUser) {
					setCurrentUserId(currentUser.id);
				}
			} catch (error) {
				console.error('Failed to get current user:', error);
				setCurrentUserId(undefined);
			}
		};

		fetchCurrentUser();
	}, []);

	// Update form when modal opens
	useEffect(() => {
		if (visible) {
			reset({
				title: '',
				contact_id: 0,
				stage_id: initialStageId || defaultStageId || 0,
				value: undefined,
				expected_close_date: '',
				priority: '',
				source: '',
				owner_id: defaultOwnerId || 0,
				custom_fields: {},
			});
		}
	}, [visible, initialStageId, defaultStageId, defaultOwnerId, reset]);

	// Load contacts
	const loadContacts = useCallback(async (searchTerm = '') => {
		setContactsLoading(true);
		try {
			const params = new URLSearchParams();
			if (searchTerm) {
				params.append('search', searchTerm);
			}
			params.append('per_page', '20');
			params.append('page', '1');

			const response = await apiFetch({
				path: `/qc/v1/contacts?${params.toString()}`,
				method: 'GET',
			});

			const contactsData = Array.isArray(response)
				? response
				: (response as any)?.data || [];
			setContacts(contactsData);
		} catch (error) {
			console.error('Failed to load contacts:', error);
			setContacts([]);
		} finally {
			setContactsLoading(false);
		}
	}, []);

	// Load data when modal opens
	useEffect(() => {
		if (visible) {
			loadContacts();
			loadOwners();
		}
	}, [visible, loadContacts, loadOwners]);

	// Ensure current user is in owners list
	useEffect(() => {
		if (currentUserId && owners.length > 0) {
			const currentUserExists = owners.find(
				(owner) => Number(owner.id) === Number(currentUserId)
			);

			if (!currentUserExists) {
				const ensureCurrentUser = async () => {
					try {
						const currentUser =
							await UserService.getUserById(currentUserId);
						if (currentUser) {
							ensureUserIncluded(currentUser);
						}
					} catch (error) {
						console.error(
							'Failed to fetch current user details:',
							error
						);
					}
				};

				ensureCurrentUser();
			}
		}
	}, [currentUserId, owners, ensureUserIncluded]);

	// Submit handler
	const onSubmit = async (values: DealFormData) => {
		// Validate with Zod
		try {
			dealFormSchema.parse(values);
		} catch (error) {
			if (error instanceof z.ZodError) {
				for (const err of error.issues) {
					createNotice?.({
						type: 'error',
						message: err.message,
					});
				}
				
			}
			return;
		}

		if (!pipeline) {
			createNotice?.({
				type: 'error',
				message: __('Please select a pipeline first', 'quillcrm'),
			});
			return;
		}

		if (values.value !== undefined && values.value <= 0) {
			createNotice?.({
				type: 'error',
				message: __(
					'Deal value must be greater than zero',
					'quillcrm'
				),
			});
			return;
		}

		setLoading(true);
		try {
			// The DatePicker already returns the date in YYYY-MM-DD format,
			// so we can use it directly without conversion to avoid timezone issues
			const dealData = {
				...values,
				pipeline_id: pipeline.id,
				currency: 'USD',
				expected_close_date: values.expected_close_date || null,
			};

			await createDeal(dealData);

			createNotice?.({
				type: 'success',
				message: __('Deal created successfully!', 'quillcrm'),
			});

			reset();
			onClose();
			await onSuccess();
		} catch (error: any) {
			createNotice?.({
				type: 'error',
				message:
					error.message ||
					__('Failed to create deal. Please try again.', 'quillcrm'),
			});
		} finally {
			setLoading(false);
		}
	};

	const handleCancel = () => {
		reset();
		onClose();
	};

	return (
		<Dialog
			open={visible}
			onOpenChange={(open) => {
				if (!open) {
					handleCancel();
				}
			}}
		>
			<DialogContent className="w-full max-w-3xl max-h-[80vh] my-2 sm:mx-auto overflow-y-auto p-8 rounded-[16px]">
				<DialogHeader>
					<DialogTitle className="!mb-0">
						<CustomDialogHeader
							title={__('Add New Deal', 'quillcrm')}
							subtitle={__(
								'Add basic information below to add new deal',
								'quillcrm'
							)}
							icon={<AddDealIcon />}
						/>
					</DialogTitle>
				</DialogHeader>

				<form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
					<div className="w-full grid grid-cols-1 md:grid-cols-2 gap-6 my-3">
						{/* Related Contact */}
						<div className="flex flex-col gap-2">
							<label className="font-normal text-[#09090B] text-base">
								{__('Related Contact', 'quillcrm')}
								<span className="text-red-500 ml-1">*</span>
							</label>
							<Select
								value={
									formValues.contact_id
										? String(formValues.contact_id)
										: ''
								}
								onValueChange={(v) =>
									setValue('contact_id', Number(v))
								}
							>
								<SelectTrigger className="h-12 !shadow-none py-[5px] px-4 rounded-[8px] border border-[#DEE1E6] !text-[#09090B] font-sm text-sm landing-[150%] tracking-[-.5px]">
									<SelectValue
										placeholder={
											contactsLoading
												? __(
														'Loading contacts...',
														'quillcrm'
													)
												: __(
														'Select contact',
														'quillcrm'
													)
										}
									/>
								</SelectTrigger>
								<SelectContent>
									{contactsLoading ? (
										<div className="px-3 py-2 text-sm">
											{__(
												'Loading contacts...',
												'quillcrm'
											)}
										</div>
									) : contacts.length === 0 ? (
										<div className="px-3 py-2 text-sm">
											{__(
												'No contacts found',
												'quillcrm'
											)}
										</div>
									) : (
										contacts.map((c) => (
											<SelectItem
												key={c.id}
												value={String(c.id)}
											>
												<div className="flex">
													<span className="font-medium">
														{c.first_name}{' '}
														{c.last_name}
													</span>
												</div>
											</SelectItem>
										))
									)}
								</SelectContent>
							</Select>
							{errors.contact_id && (
								<span className="text-sm text-red-500">
									{errors.contact_id.message}
								</span>
							)}
						</div>

						{/* Deal Value */}
						<div className="flex flex-col gap-2">
							<label className="font-normal text-[#09090B] text-base">
								{__('Deal Value', 'quillcrm')}
							</label>
							<div className="flex justify-between gap-3">
								<Input
									type="number"
									step="0.01"
									min="0"
									{...register('value', {
										valueAsNumber: true,
									})}
									placeholder={__('0.00', 'quillcrm')}
									className="h-12 !shadow-none py-[5px] px-4 !rounded-[8px] outline-none border !border-[#DEE1E6] !text-[#09090B] font-sm text-sm landing-[150%] tracking-[-.5px]"
								/>
								<div className="h-12 rounded-[8px] flex justify-center items-center gap-1 border border-[#DEE1E6] bg-[#F0F0F0] py-[5px] px-[12px] min-w-[80px]">
									<DealValueIcon />
									<span className="font-medium">USD</span>
								</div>
							</div>
						</div>

						{/* Deal Title */}
						<div className="flex flex-col gap-2">
							<label className="font-normal text-[#09090B] text-base">
								{__('Deal Title', 'quillcrm')}
								<span className="text-red-500 ml-1">*</span>
							</label>
							<Input
								{...register('title')}
								type="text"
								placeholder={__(
									'Enter deal title',
									'quillcrm'
								)}
								className="h-12 !shadow-none py-[5px] px-4 !rounded-[8px] outline-none border !border-[#DEE1E6] !text-[#09090B] font-sm text-sm landing-[150%] tracking-[-.5px]"
							/>
							{errors.title && (
								<span className="text-sm text-red-500">
									{errors.title.message}
								</span>
							)}
						</div>

						{/* Deal Owner */}
						<div className="flex flex-col gap-2">
							<label className="font-normal text-[#09090B] text-base">
								{__('Deal Owner', 'quillcrm')}
								<span className="text-red-500 ml-1">*</span>
							</label>
							<Select
								value={
									formValues.owner_id
										? String(formValues.owner_id)
										: ''
								}
								onValueChange={(v) =>
									setValue('owner_id', Number(v))
								}
							>
								<SelectTrigger className="h-12 !shadow-none py-[5px] px-4 rounded-[8px] border border-[#DEE1E6] !text-[#09090B] font-sm text-sm leading-[150%] tracking-[-.5px]">
									<SelectValue
										placeholder={
											ownersLoading
												? __(
														'Loading owners...',
														'quillcrm'
													)
												: __(
														'Select Owner',
														'quillcrm'
													)
										}
									/>
								</SelectTrigger>
								<SelectContent>
									{ownersLoading ? (
										<div className="px-3 py-2 text-sm">
											{__(
												'Loading owners...',
												'quillcrm'
											)}
										</div>
									) : owners.length === 0 ? (
										<div className="px-3 py-2 text-sm">
											{__('No users found', 'quillcrm')}
										</div>
									) : (
										owners.map((owner) => (
											<SelectItem
												key={owner.id}
												value={String(owner.id)}
											>
												{owner.display_name} (
												{owner.email})
											</SelectItem>
										))
									)}
								</SelectContent>
							</Select>
							{errors.owner_id && (
								<span className="text-sm text-red-500">
									{errors.owner_id.message}
								</span>
							)}
						</div>

						{/* Deal Source */}
						<div className="flex flex-col gap-2">
							<label className="font-normal text-[#09090B] text-base">
								{__('Deal Source', 'quillcrm')}
							</label>
							<Select
								value={formValues.source || ''}
								onValueChange={(v) => setValue('source', v)}
							>
								<SelectTrigger className="h-12 !shadow-none py-[5px] px-4 rounded-[8px] border border-[#DEE1E6] !text-[#09090B] font-sm text-sm leading-[150%] tracking-[-.5px]">
									<SelectValue
										placeholder={__(
											'Select Deal source',
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

						{/* Expected Close Date */}
						<div className="flex flex-col gap-2">
							<label className="font-normal text-[#09090B] text-base">
								{__('Expected Close Date', 'quillcrm')}
							</label>
							<DatePicker
								value={
									formValues.expected_close_date
										? new Date(
												formValues.expected_close_date
											)
										: null
								}
								onChange={(value: string) => {
									setValue('expected_close_date', value);
								}}
								placeholder={__('Select Date', 'quillcrm')}
								
								
								// className="!w-full h-12 !shadow-none rounded-[8px] border border-[#DEE1E6] !text-[#09090B] !bg-white !font-normal !text-base tracking-[-.5px]"
							/>
						</div>

						{/* Pipeline */}
						{pipeline?.stages && pipeline.stages.length > 0 && (
							<div className="flex flex-col gap-2">
								<label className="font-normal text-[#09090B] text-base">
									{__('Pipeline', 'quillcrm')}
								</label>
								<Select
									value={
										pipeline?.id ? String(pipeline.id) : ''
									}
									disabled
								>
									<SelectTrigger className="w-full h-12 rounded-[8px] border border-[#DEE1E6] text-[#09090B] bg-white font-normal text-base tracking-[-.5px]">
										<SelectValue
											placeholder={
												pipeline?.name ||
												__(
													'Select pipeline',
													'quillcrm'
												)
											}
										/>
									</SelectTrigger>
									<SelectContent>
										<SelectItem
											value={
												pipeline?.id
													? String(pipeline.id)
													: '0'
											}
										>
											{pipeline?.name}
										</SelectItem>
									</SelectContent>
								</Select>
							</div>
						)}

						{/* Deal Stage */}
						{pipeline?.stages && pipeline.stages.length > 0 && (
							<div className="flex flex-col gap-2">
								<label className="font-normal text-[#09090B] text-base">
									{__('Deal Stage', 'quillcrm')}
									
								</label>
								<div className="flex flex-wrap gap-2">
									{[...pipeline.stages]
										.sort(
											(a, b) =>
												a.sort_order - b.sort_order
										)
										.map((stage: any, index: number) => {
											const selectedIndex =
												pipeline.stages.findIndex(
													(s: any) =>
														s.id ===
														formValues.stage_id
												);
											const isSelected =
												index === selectedIndex;
											const isPrevious =
												index < selectedIndex;

											return (
												<div
													key={stage.id}
													onClick={() =>
														setValue(
															'stage_id',
															stage.id
														)
													}
													className="cursor-pointer transition-all duration-200 "
													title={stage.name}
												>
													<PipelineStageHeaderBox
														stage={stage}
														index={index}
														totalStages={
															pipeline.stages
																.length
														}
														isSelected={isSelected}
														isPrevious={isPrevious}
													/>
												</div>
											);
										})}
								</div>
								{errors.stage_id && (
									<span className="text-sm text-red-500">
										{errors.stage_id.message}
									</span>
								)}
							</div>
						)}
					</div>

					<div className="w-full grid grid-cols-1 gap-6">
						{/* Priority */}
						<div className="flex flex-col gap-2">
							<label className="font-normal text-[#09090B] text-base">
								{__('Priority', 'quillcrm')}
							</label>
							<div className="flex gap-3 flex-wrap">
								{Object.keys(priorities).map((key) => {
									const isSelected =
										formValues.priority === key;
									return (
										<button
											key={key}
											type="button"
											onClick={() =>
												setValue('priority', key)
											}
											className={`flex items-center gap-3 px-4 py-2 rounded-[8px] border transition-all duration-200 ${
												isSelected
													? 'border-[#1E3A8A] bg-[#E4EEFD] shadow-sm'
													: 'border-[#DEE1E6] bg-white hover:bg-[#F9FAFB] hover:border-[#9CA3AF]'
											}`}
										>
											<span
												className="inline-block w-6 h-6 rounded-[8px]"
												style={{
													backgroundColor:
														priorities[key].color,
												}}
											/>
											<span className="text-[#09090B] text-sm font-normal tracking-[-.32px]">
												{priorities[key].label}
											</span>
										</button>
									);
								})}
							</div>
						</div>

						<div className="h-[1px] bg-[#DEE1E6] w-full"></div>

						{/* Custom Fields */}
						<CustomFieldsSection
							deal={{
								...formValues,
								custom_fields: formValues.custom_fields || {},
							}}
							onChange={(fields) =>
								setValue('custom_fields', fields)
							}
						/>
					</div>

					{/* Submit Button */}
					<div className="mt-6 flex gap-3">
						<Button
							type="button"
							variant="outline"
							onClick={handleCancel}
							className="flex-1 h-12 rounded-md border-[#DEE1E6] text-[#09090B] hover:bg-[#F9FAFB]"
							disabled={loading}
						>
							{__('Cancel', 'quillcrm')}
						</Button>
						<Button
							type="submit"
							className="flex-1 bg-gradient-to-r from-[#1E3A8A] via-[#1E3A8A] to-[#3B82F6] text-white h-12 rounded-md font-manrope text-base font-normal tracking-tight hover:opacity-90"
							disabled={loading}
						>
							{loading
								? __('Creating deal...', 'quillcrm')
								: __('Create Deal', 'quillcrm')}
						</Button>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	);
};