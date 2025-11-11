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
// import { message } from 'antd';

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
import { User, UserService } from '../../../../../services/user-service';
import { SOURCE_OPTIONS } from '../../../../../config/types/config-data';
import './style.scss';
import ConfigAPI from '@quillcrm/config';
import { CustomDialogHeader } from '@quillcrm/components';
import AddDealIcon from '@quillcrm/components/icons/add-deal';
import DealValueIcon from '@quillcrm/components/icons/deal-value';
import { DateRangePicker } from '@quillcrm/components/ui/date-range-picker';


export interface NewDealModalProps {
	visible: boolean;
	onClose: () => void;
	onSuccess: () => void;
	pipeline: any;
	initialStageId?: number;
}

interface DealFormData {
	title: string;
	contact_id: number;
	stage_id: number;
	value?: number;
	expected_close_date?: string;
	priority?: string;
	source?: string;
	owner_id?: number;
	label?: string;
}

interface Contact {
	id: number;
	first_name: string;
	last_name: string;
	email: string;
}

// stages

import { CustomFieldsSection } from '../deal-custom-fields';
import { DatePicker } from '@quillcrm/components/ui/date-picker';
import { convertDate } from '@quillcrm/utils';


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







export const NewDealModal: React.FC<NewDealModalProps> = ({
	visible,
	onClose,
	onSuccess,
	pipeline,
	initialStageId
}) => {
	// const [form] = Form.useForm();
	const [loading, setLoading] = useState(false);
	const [contacts, setContacts] = useState<Contact[]>([]);
	const [contactsLoading, setContactsLoading] = useState(false);
	const [customFields, setCustomFields] = useState<Record<string, any>>({});
		// Get current user as default owner
		const [currentUserId, setCurrentUserId] = useState<number | undefined>(
			undefined
		);

	const [formData, setFormData] = useState<{
		title: string;
		contact_id: string | number;
		stage_id: string | number;
		value: string | number;
		source: string;
		owner_id: string | number;
		expected_close_date: {
			from: string;
			to: string;
		};
		priority?: string;
		label?: string;
		custom_fields: Record<string, any>;
	}>({
		title: '',
		contact_id: '',
		stage_id: '',
		value: '',
		source: '',
		owner_id: '',
		expected_close_date: { from: '', to: '' },
		priority: '',
		label: '',
		custom_fields: {},
	});
	const dispatch = useDispatch('quillcrm/core');
	const createNotice = dispatch?.createNotice;
	const priorities = useMemo(() => {
		return ConfigAPI.getDealPriorities();
	}, []);

	// Use shared users hook
	const {
		users: owners,
		loading: ownersLoading,
		loadUsers: loadOwners,
		searchUsers: searchOwners,
		ensureUserIncluded,
	} = useUsers();
	const { createDeal } = useDealOperations();

	const handleSubmit = async (values: DealFormData) => {
		if (!pipeline) {
			createNotice?.({
				type: 'error',
				message: __(
					`Please select a pipeline first`,
					'quillcrm'
				),
			});
			return;
		}
		// Ensure owner_id is set as fallback
		if (!values.owner_id && defaultOwnerId) {
			values.owner_id = defaultOwnerId;
		}

		setLoading(true);
		try {
			const dealData = {
				...values,
				pipeline_id: pipeline.id,
				currency: 'USD',
				expected_close_date: values.expected_close_date
                ? convertDate(values.expected_close_date)
                : null,
			};

			await createDeal(dealData);
			createNotice?.({
				type: 'success',
				message: __(
					`Deal created successfully!`,
					'quillcrm'
				),
			});
			onClose();
			onSuccess();
		} catch (error: any) {
			createNotice?.({
				type: 'error',
				message: error.message || __(
					`Deal created successfully!`,
					'quillcrm'
				),
			});
		} finally {
			setLoading(false);
		}
	};

	const handleChange = (field: keyof DealFormData, value: any) => {
		setFormData((prev) => ({
			...prev,
			[field]: value,
		}));
	};

	const handleCancel = () => {
		setFormData({
			title: '',
			contact_id: '',
			stage_id: '',
			value: '',
			source: '',
			owner_id: '',
			expected_close_date: { from: '', to: '' },
			custom_fields: {},
		});
		onClose();
	};
	// Get the first stage as default if available (sorted by sort_order)
	const defaultStageId = useMemo(() => {
		if (!pipeline?.stages?.length) return undefined;
		const sortedStages = [...pipeline.stages].sort(
			(a, b) => a.sort_order - b.sort_order
		);
		return sortedStages[0].id;
	}, [pipeline?.stages]);


	// Get current user ID from WordPress using centralized service
	useEffect(() => {
		const fetchCurrentUser = async () => {
			try {
				// Try global object first
				const globalUserId = (window as any)?.qcData?.currentUser?.id;
				if (globalUserId) {
					setCurrentUserId(Number(globalUserId));
					return;
				}

				// Use centralized UserService
				const currentUser = await UserService.getCurrentUser();
				if (currentUser) {
					setCurrentUserId(currentUser.id);
				}
			} catch (error) {
				console.error('Failed to get current user:', error);
				// Final fallback - will be handled by backend
				setCurrentUserId(undefined);
			}
		};

		fetchCurrentUser();
	}, []);

	const defaultOwnerId = useMemo(() => {
		return currentUserId;
	}, [currentUserId]);

	useEffect(() => {
		if (visible) {
			setFormData((prev) => ({
			  ...prev,
			  stage_id: initialStageId ?? defaultStageId,  // ← أهم حاجة
			  owner_id: defaultOwnerId || prev.owner_id,
			}));
		  }
	}, [initialStageId,defaultStageId, defaultOwnerId, visible]);

	// Load initial contacts
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

			// Handle both array and paginated response
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

	// Load contacts and owners when modal opens
	useEffect(() => {
		if (visible) {
			loadContacts();
			loadOwners();
		}
	}, [visible, loadContacts, loadOwners]);

	// Ensure current user is in the owners list when loaded
	useEffect(() => {
		if (currentUserId && owners.length > 0) {
			const currentUserExists = owners.find(
				(owner) => Number(owner.id) === Number(currentUserId)
			);

			if (!currentUserExists) {
				// If current user not in list, we need to fetch it using centralized service
				const ensureCurrentUser = async () => {
					try {
						const currentUser =
							await UserService.getUserById(currentUserId);
						if (currentUser) {
							// Use the hook's method to ensure user is included
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

	return (
		<Dialog
			open={visible}
			onOpenChange={(open) => {
				if (!open) {
					handleCancel();
					
				}
			}}
		>
			<DialogContent className="w-full max-w-3xl max-h-[80vh] my-2 sm:mx-auto overflow-y-auto  p-8 rounded-[16px] ">
				<DialogHeader>
					<DialogTitle className="!mb-0">
						<CustomDialogHeader
							title={__('Add New Deal', 'quillcrm')}
							subtitle="Add basic information below to add new deal"
							icon={<AddDealIcon />}
						/>
					</DialogTitle>
				</DialogHeader>
				<div className="  w-full grid grid-cols-1 md:grid-cols-2 gap-6 my-3">
					{/* related contact */}
					<div className="flex flex-col gap-2">
						<label className=" font-normal text-[#09090B] text-base">
							{__('Related Contact', 'quillcrm')}
						</label>
						<Select
							value={
								formData.contact_id
									? String(formData.contact_id)
									: ''
							}
							onValueChange={(v) =>
								handleChange('contact_id', Number(v))
							}
						>
							<SelectTrigger className=" h-12 !shadow-none py-[5px] px-4 rounded-[8px] border border-[#DEE1E6] !text-[#09090B] font-sm text-sm landing-[150%] tracking-[-.5px]">
								<SelectValue
									placeholder={
										contactsLoading
											? __(
													'Loading contacts...',
													'quillcrm'
												)
											: __('Select contact', 'quillcrm')
									}
								/>
							</SelectTrigger>
							<SelectContent>
								{contactsLoading ? (
									<div className=" px-3 py-2 text-sm">
										{__('Loading contacts...', 'quillcrm')}
									</div>
								) : contacts.length === 0 ? (
									<div className=" px-3 py-2 text-sm">
										{__('No contacts found', 'quillcrm')}
									</div>
								) : (
									contacts.map((c) => (
										<SelectItem
											key={c.id}
											value={String(c.id)}
										>
											{c.first_name} {c.last_name}
										</SelectItem>
									))
								)}
							</SelectContent>
						</Select>
					</div>
					{/*deal value  */}
					<div className="flex flex-col gap-2">
						<label className=" font-normal text-[#09090B] text-base">
							{__('Deal Value', 'quillcrm')}
						</label>
						<div className=" flex justify-between gap-3">
							<Input
								type="number"
								value={formData.value}
								// onChange={(e) =>
								// 	handleChange('value', e.target.value)
								// }
								onChange={(e) => handleChange('value', Number(e.target.value))}
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
							value={formData.title}
							onChange={(e) =>
								handleChange('title', e.target.value)
							}
							placeholder={__('Deal Name', 'quillcrm')}
							className="h-12 !shadow-none py-[5px] px-4 !rounded-[8px] outline-none border !border-[#DEE1E6] !text-[#09090B] font-sm text-sm landing-[150%] tracking-[-.5px]"
						/>
					</div>
					{/* deal owner */}
					<div className="flex flex-col gap-2">
						<label className="font-normal text-[#09090B] text-base">
							{__('Deal Owner', 'quillcrm')}
						</label>

						<Select
							value={
								formData.owner_id
									? String(formData.owner_id)
									: ''
							}
							onValueChange={(v) =>
								handleChange('owner_id', Number(v))
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
											: __('Select Owner', 'quillcrm')
									}
								/>
							</SelectTrigger>

							<SelectContent>
								{ownersLoading ? (
									<div className="px-3 py-2 text-sm">
										{__('Loading owners...', 'quillcrm')}
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
											{owner.display_name} ({owner.email})
										</SelectItem>
									))
								)}
							</SelectContent>
						</Select>
					</div>
					{/* source option */}
					<div className="flex flex-col gap-2">
						<label className="font-normal text-[#09090B] text-base">
							{__('Deal Source', 'quillcrm')}
						</label>

						<Select
							value={
								formData.source ? String(formData.source) : ''
							}
							onValueChange={(v) => handleChange('source', v)}
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
						<label className="block mb-1 font-normal text-[#09090B] text-base">
							{__('Expected Close Date', 'quillcrm')}
						</label>

						<DateRangePicker
						   
							value={{
								from: formData.expected_close_date?.from
									? new Date(
											formData.expected_close_date.from
										)
									: null,
								to: formData.expected_close_date?.to
									? new Date(formData.expected_close_date.to)
									: null,
							}}
							onChange={(range) =>
								handleChange('expected_close_date', {
									from: range?.from
										? range.from.toISOString()
										: '',
									to: range?.to ? range.to.toISOString() : '',
								})
							}
							placeholder={__('From-To', 'quillcrm')}
							className="w-full h-12  !shadow-none rounded-[8px] border border-[#DEE1E6] !text-[#09090B] bg-white !font-normal !text-base tracking-[-.5px]"
						/>
						{/* <DatePicker
		value={
			typeof formData.expected_close_date === 'string' && formData.expected_close_date
				? new Date(formData.expected_close_date)
				: ''
		}
		onChange={(value: string) =>
			handleChange('expected_close_date', value)
		}
		
		placeholder={__('Select Date', 'quillcrm')}
		className="!w-full h-12 !shadow-none rounded-[8px] border border-[#DEE1E6] !text-[#09090B] !bg-white !font-normal !text-base tracking-[-.5px]"
	/> */}
						
					</div>
					{pipeline?.stages && pipeline.stages.length > 0 && (
						<div className="flex flex-col gap-2">
							<label className="block mb-1 font-normal text-[#09090B] text-base">
								{__('Pipeline', 'quillcrm')}
							</label>

							<Select
								value={pipeline?.id ? String(pipeline.id) : ''}
								onValueChange={() => {}}
							>
								<SelectTrigger className="w-full h-12 rounded-[8px] border border-[#DEE1E6] text-[#09090B] bg-white font-normal text-base tracking-[-.5px]">
									<SelectValue
										// placeholder={__(
										// 	'Select stage',
										// 	'quillcrm'
										// )}
										placeholder={
											pipeline?.name ||
											__('Select pipeline', 'quillcrm')
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
					{pipeline?.stages && pipeline.stages.length > 0 && (
						<div className="flex flex-col  gap-2 mt-2">
							<label className="block mb-1 font-normal text-[#09090B] text-base">
								{__('Deal stage', 'quillcrm')}
							</label>
							<div className=" flex  flex-wrap gap-2 ">
								{[...pipeline.stages]
									.sort((a, b) => a.sort_order - b.sort_order)
									.map((stage: any, index: number) => {
										const selectedIndex =
											pipeline.stages.findIndex(
												(s: any) =>
													s.id === formData.stage_id
											);
										const isSelected =
											index === selectedIndex;
										const isPrevious =
											index < selectedIndex;

										return (
											<div
												key={stage.id}
												onClick={() =>
													handleChange(
														'stage_id',
														stage.id
													)
												}
												className="cursor-pointer transition-all duration-200"
												
												title={stage.name}
											>
												<PipelineStageHeaderBox
													stage={stage}
													index={index}
													totalStages={
														pipeline.stages.length
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
				<div className="w-full grid grid-cols-1 gap-6">
					{/* priority */}
					<div className="flex flex-col gap-2">
						<label className="font-normal text-[#09090B] text-base">
							{__('Priority', 'quillcrm')}
						</label>

						<div className="flex gap-3">
							{Object.keys(priorities).map((key) => {
								const isSelected = formData.priority === key;
								return (
									<button
										key={key}
										type="button"
										onClick={() =>
											handleChange('priority', key)
										}
										className={`flex items-center gap-3 px-4 py-2 rounded-[8px] border transition-all duration-200 ${
											isSelected
												? 'border-[#1E3A8A] bg-[#E4EEFD]'
												: 'border-[#DEE1E6] bg-white hover:bg-[#F9FAFB]'
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

					{/* custom Filed  */}
					{/* <CustomFieldsSection
					deal={formData || { custom_fields: [] }} 
						onChange={(fields) => setCustomFields(fields)}
					/> */}
					<CustomFieldsSection
  deal={formData}
  onChange={(fields) =>
    setFormData((prev) => ({
      ...prev,
      custom_fields: fields,
    }))
  }
/>
					
					
				
					
					

				</div>
				{/* Apply Button */}
				<div className="mt-4">
					<Button
						className="w-full bg-gradient-to-r from-[#1E3A8A] via-[#1E3A8A] to-[#3B82F6] text-white flex h-12 p-[10px] gap-1 rounded-md font-manrope text-base font-normal tracking-tight"
						onClick={() =>
							handleSubmit({
								...formData,
								contact_id: Number(formData.contact_id),
								stage_id: Number(formData.stage_id),
								owner_id: Number(formData.owner_id),
								value: formData.value
									? Number(formData.value)
									: undefined,
								expected_close_date:
									formData.expected_close_date?.to || '',
							})
						}
						disabled={loading}
						title={__('Add Deal', 'quillcrm')}
					>
						{loading
							? __('Creating deal...', 'quillcrm')
							: __('Add Deal', 'quillcrm')}
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
};




