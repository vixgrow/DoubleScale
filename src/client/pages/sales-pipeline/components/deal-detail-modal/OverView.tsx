/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState, useEffect, useMemo, useCallback } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
/**
 * Internal dependencies
 */
import { useDealOperations } from '../../hooks/use-deal-operations';
import { Deal } from '../../types';
import './style.scss';
import { useCapabilities } from '@quillcrm/hooks/use-capabilities';
import EditHeaderIcon from '@quillcrm/components/icons/edit-header';
import DealValueIcon from '@quillcrm/components/icons/deal-value';
import { formatCurrency, getCurrencySymbol } from '../../utils/currency';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@quillcrm/components/ui/select';
import { useUsers } from '../../hooks/use-users';
import { SOURCE_OPTIONS } from '../../../../../config/types/config-data';
import ConfigAPI from '@quillcrm/config';
import DealOverviewSkeleton from './deal-overview-skeleton';
import { useDispatch } from '@wordpress/data';
import { DatePicker } from '@quillcrm/components/ui/date-picker';

interface DealOverViewModalProps {
	dealId: number | null;
	deal?: Deal | null;
	onUpdate?: () => void;
	onEdit?: (deal: Deal) => void;
	onNotice?: (notice: { type: 'success' | 'error'; message: string }) => void;
}

interface Contact {
	id: number;
	first_name: string;
	last_name: string;
	email: string;
}

export const DealOverViewModal: React.FC<DealOverViewModalProps> = ({
	dealId,
	deal: initialDeal,
	onUpdate,
	onEdit,
	onNotice
}) => {
	const [deal, setDeal] = useState<Deal | null>(initialDeal || null);
	const [editingField, setEditingField] = useState<string | null>(null);
	const [contacts, setContacts] = useState<Contact[]>([]);
	const [contactsLoading, setContactsLoading] = useState(false);
	const [isSaving, setIsSaving] = useState(false);

	const { updateDeal } = useDealOperations();
	const { isDealOwner } = useCapabilities();
	const {
		users: owners,
		loading: ownersLoading,
		loadUsers: loadOwners,
	} = useUsers();
	const priorities = useMemo(() => ConfigAPI.getDealPriorities(), []);
	const dispatch = useDispatch('quillcrm/core');
	const createNotice = dispatch?.createNotice;
	const handleSaveInline = async (field: string, value: any) => {
		try {
			if (!deal) return;
			setIsSaving(true);

			// Update the deal on server
			await updateDeal(deal.id, { [field]: value });

			// Update local state optimistically
			setDeal({ ...deal, [field]: value });
			onNotice?.({
				type: 'success',
				message: __('Updated successfully', 'quillcrm'),
			  });
			// Notify parent to refresh (this will fetch fresh data)
			if (onUpdate) onUpdate();
		} catch (error) {
			onNotice?.({
				type: 'error',
				message: error instanceof Error ? error.message : __('Failed to update', 'quillcrm'),
			  });
		} finally {
			setEditingField(null);
			setIsSaving(false);
		}
	};

	// Load contacts function
	const loadContacts = useCallback(async (searchTerm = '') => {
		setContactsLoading(true);
		try {
			const params = new URLSearchParams();
			if (searchTerm) {
				params.append('search', searchTerm);
			}
			params.append('per_page', '50');
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
			createNotice?.({
				type: 'error',
				message:
					error instanceof Error
						? error.message
						: __('Failed to load contacts', 'quillcrm'),
			});
			setContacts([]);
		} finally {
			setContactsLoading(false);
		}
	}, []);

	// Update local deal state when prop changes
	useEffect(() => {
		if (initialDeal) {
			const formattedDate = initialDeal.expected_close_date
				? initialDeal.expected_close_date.split('T')[0]
				: null;
			setDeal({
				...initialDeal,
				expected_close_date: formattedDate,
			});
		}
	}, [initialDeal]);

	// Load contacts and owners when modal opens
	useEffect(() => {
		if (dealId) {
			loadContacts();
			loadOwners();
		}
	}, [dealId, loadContacts, loadOwners]);

	const getStatusColor = (status: string) => {
		switch (status) {
			case 'open':
				return 'blue';
			case 'won':
				return 'green';
			case 'lost':
				return 'red';
			default:
				return 'default';
		}
	};

	const formatDate = (dateString: string | null) => {
		if (!dateString) return __('Not set', 'quillcrm');
		const dateOnly = dateString.split('T')[0];
		const [year, month, day] = dateOnly.split('-');

		// Create date at noon UTC to avoid timezone issues
		const date = new Date(
			Date.UTC(Number(year), Number(month) - 1, Number(day), 12, 0, 0)
		);

		return date.toLocaleDateString('en-US', {
			day: 'numeric',
			month: 'long',
			year: 'numeric',
			timeZone: 'UTC',
		});
	};
	if (!deal) return null;

	return (
		<div className={`border flex flex-col gap-6 border-[#DEE1E6] bg-[#F8F8F8] rounded-[20px] p-6 relative transition-opacity ${isSaving ? 'opacity-60 pointer-events-none' : ''}`}>
			{/* title */}
			<p className="text-[#09090B] text-[24px] font-medium leading-normal">
				{__('Overview', 'quillcrm')}
			</p>
			<div className="grid grid-cols-2 gap-5">
					{/* Related Contact - Select */}
					{deal.contact && (
						<div className="flex justify-between items-start">
							<div className="flex flex-col gap-2 w-full">
								<p className="text-[#777] text-base font-medium">
									{__('Related Contact', 'quillcrm')}
								</p>

								{editingField === 'contact' ? (
									<Select
										value={
											deal.contact?.id?.toString() || ''
										}
										onValueChange={async (value) => {
											await handleSaveInline(
												'contact_id',
												Number(value)
											);
											const selectedContact =
												contacts.find(
													(c) =>
														c.id === Number(value)
												);
											if (selectedContact) {
												setDeal((prev) =>
													prev
														? {
																...prev,
																contact:
																	selectedContact,
																contact_id:
																	selectedContact.id,
															}
														: prev
												);
											}
										}}
										onOpenChange={(open) => {
											if (!open) setEditingField(null);
										}}
									>
										<SelectTrigger className="w-full h-12 text-[#09090B] border border-[#DEE1E6] rounded-lg focus:ring-0 focus-visible:ring-0 focus:outline-none">
											<SelectValue
												placeholder={__(
													'Select Contact',
													'quillcrm'
												)}
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
												<div className="px-3 py-2 text-sm text-[#777]">
													{__(
														'No contacts found',
														'quillcrm'
													)}
												</div>
											) : (
												contacts.map((contact) => (
													<SelectItem
														key={contact.id}
														value={contact.id.toString()}
														className="text-[#09090B]"
													>
														{contact.first_name}{' '}
														{contact.last_name}
														{/* {contact.email && (
														<span className="text-xs text-[#777] ml-2">
															({contact.email})
														</span>
													)} */}
													</SelectItem>
												))
											)}
										</SelectContent>
									</Select>
								) : (
									<p className="text-[#09090B] font-bold text-lg">
										{deal.contact.first_name}{' '}
										{deal.contact.last_name}
									</p>
								)}
							</div>

							<span
								className="w-7 h-7 p-1 flex items-center justify-center rounded-full bg-[#E4EEFD] cursor-pointer hover:bg-[#d8e6fa]"
								onClick={() => setEditingField('contact')}
							>
								<EditHeaderIcon
									color="#458DC7"
									width={20}
									height={20}
								/>
							</span>
						</div>
					)}

					{/* Deal Owner - Select */}
					{deal.owner && (
						<div className="flex justify-between items-start border-l border-[#DEE1E6] pl-4">
							<div className="flex flex-col gap-2 w-full">
								<p className="text-[#777] text-base font-medium">
									{__('Deal Owner', 'quillcrm')}
								</p>

								{editingField === 'owner' ? (
									<Select
										value={deal.owner?.id?.toString() || ''}
										onValueChange={async (value) => {
											await handleSaveInline(
												'owner_id',
												Number(value)
											);
											const selectedOwner = owners.find(
												(o) => o.id === Number(value)
											);
											if (selectedOwner) {
												setDeal((prev) =>
													prev
														? {
																...prev,
																owner: selectedOwner,
																owner_id:
																	selectedOwner.id,
															}
														: prev
												);
											}
										}}
										onOpenChange={(open) => {
											if (!open) setEditingField(null);
										}}
									>
										<SelectTrigger className="w-full h-12 border border-[#DEE1E6] text-[#09090B] rounded-lg focus:ring-0 focus-visible:ring-0 focus:outline-none">
											<SelectValue
												placeholder={__(
													'Select Owner',
													'quillcrm'
												)}
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
												<div className="px-3 py-2 text-sm text-[#777]">
													{__(
														'No users found',
														'quillcrm'
													)}
												</div>
											) : (
												owners.map((owner) => (
													<SelectItem
														key={owner.id}
														value={owner.id.toString()}
														className="text-[#09090B]"
													>
														{owner.display_name}
														{owner.email && (
															<span className="text-xs text-[#777] ml-2">
																({owner.email})
															</span>
														)}
													</SelectItem>
												))
											)}
										</SelectContent>
									</Select>
								) : (
									<p className="text-[#09090B] font-bold text-lg">
										{deal.owner.display_name}
									</p>
								)}
							</div>

							<span
								className="w-7 h-7 p-1 flex items-center justify-center rounded-full bg-[#E4EEFD] cursor-pointer hover:bg-[#d8e6fa]"
								onClick={() => setEditingField('owner')}
							>
								<EditHeaderIcon
									color="#458DC7"
									width={20}
									height={20}
								/>
							</span>
						</div>
					)}

					{/* Deal Source - Select */}
					<div className="flex justify-between items-start">
						<div className="flex flex-col gap-2 w-full">
							<p className="text-[#777] text-base font-medium">
								{__('Deal Source', 'quillcrm')}
							</p>

							{editingField === 'source' ? (
								<Select
									value={deal.source || ''}
									onValueChange={async (value) => {
										await handleSaveInline('source', value);
									}}
									onOpenChange={(open) => {
										if (!open) setEditingField(null);
									}}
								>
									<SelectTrigger className="w-full h-12 text-[#09090B] border border-[#DEE1E6] rounded-lg focus:ring-0 focus-visible:ring-0 focus:outline-none">
										<SelectValue
											placeholder={__(
												'Select Source',
												'quillcrm'
											)}
										/>
									</SelectTrigger>
									<SelectContent>
										{SOURCE_OPTIONS.map((source) => (
											<SelectItem
												key={source.value}
												value={source.value}
												className="text-[#09090B]"
											>
												{source.label}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							) : (
								<p className="text-[#09090B] font-bold text-lg">
									{deal.source || '—'}
								</p>
							)}
						</div>

						<span
							className="w-7 h-7 p-1 flex items-center justify-center rounded-full bg-[#E4EEFD] cursor-pointer hover:bg-[#d8e6fa]"
							onClick={() => setEditingField('source')}
						>
							<EditHeaderIcon
								color="#458DC7"
								width={20}
								height={20}
							/>
						</span>
					</div>

					{/* Expected Close Date */}
					<div className="flex justify-between items-start border-l border-[#DEE1E6] pl-4">
						<div className="flex flex-col gap-2 w-full">
							<p className="text-[#777] text-base font-medium">
								{__('Expected Close Date', 'quillcrm')}
							</p>

							{editingField === 'expected_close_date' ? (
								<DatePicker
									value={deal.expected_close_date ?? ''}
									onChange={(value: string) => {
										handleSaveInline(
											'expected_close_date',
											value || null
										);
										setDeal((prev) =>
											prev
												? {
														...prev,
														expected_close_date:
															value || null,
													}
												: prev
										);
										setEditingField(null);
									}}
									placeholder={__('Select Date', 'quillcrm')}
								/>
							) : (
								<p className="text-[#09090B] font-bold text-lg">
									{deal.expected_close_date
										? formatDate(deal.expected_close_date)
										: __('Not set', 'quillcrm')}
								</p>
							)}
						</div>

						<span
							className="w-7 h-7 p-1 flex items-center justify-center rounded-full bg-[#E4EEFD] cursor-pointer hover:bg-[#d8e6fa]"
							onClick={() =>
								setEditingField('expected_close_date')
							}
						>
							<EditHeaderIcon
								color="#458DC7"
								width={20}
								height={20}
							/>
						</span>
					</div>

					{/* Priority - Select */}
					<div className="flex justify-between items-start">
						<div className="flex flex-col gap-2 w-full">
							<p className="text-[#777] text-base font-medium">
								{__('Priority', 'quillcrm')}
							</p>

							{editingField === 'priority' ? (
								<Select
									value={deal.priority || ''}
									onValueChange={async (value) => {
										await handleSaveInline(
											'priority',
											value
										);
									}}
									onOpenChange={(open) => {
										if (!open) setEditingField(null);
									}}
								>
									<SelectTrigger className="w-[140px] h-10 border border-[#DEE1E6] rounded-lg focus:ring-0 focus-visible:ring-0 focus:outline-none">
										<SelectValue
											placeholder={__(
												'Select Priority',
												'quillcrm'
											)}
										/>
									</SelectTrigger>
									<SelectContent>
										{Object.keys(priorities).map((key) => (
											<SelectItem
												key={key}
												value={key}
												className="text-[#09090B]"
											>
												<div className="flex items-center gap-2">
													<span
														className="w-4 h-4 rounded"
														style={{
															backgroundColor:
																priorities[key]
																	.color,
														}}
													/>
													{priorities[key].label}
												</div>
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							) : (
								<span
									className={`
									text-base font-normal py-1 px-2 rounded-[8px] border w-fit
									${
										deal.priority === 'low'
											? 'text-[#16A34A] border-[#16A34A] bg-[#EFFFF5]'
											: deal.priority === 'medium'
												? 'text-[#A67D0A] border-[#E4B123] bg-[#FFF2CE]'
												: 'text-[#E13B3B] border-[#E13B3B] bg-[#FBE8E8]'
									}
								`}
								>
									{deal.priority
										? deal.priority
												.charAt(0)
												.toUpperCase() +
											deal.priority.slice(1)
										: ''}
								</span>
							)}
						</div>

						<span
							className="w-7 h-7 p-1 flex items-center justify-center rounded-full bg-[#E4EEFD] cursor-pointer hover:bg-[#d8e6fa]"
							onClick={() => setEditingField('priority')}
						>
							<EditHeaderIcon
								color="#458DC7"
								width={20}
								height={20}
							/>
						</span>
					</div>

					{/* weighted value */}
					{deal.weighted_value && (
						<div className="flex justify-between items-start border-l border-[#DEE1E6] pl-4">
							<div className="flex flex-col gap-2">
								<p className="text-[#777] text-base font-medium">
									{__('Weighted Value', 'quillcrm')}
								</p>
								<div className="flex items-center">
									<span className="text-[#09090B] font-bold text-lg mr-1">
										{formatCurrency(
											deal.weighted_value,
											deal.currency || 'USD'
										)}
									</span>
									<DealValueIcon width={20} height={20} />
								</div>
							</div>
						</div>
					)}

					{/* create-at */}
					{deal.created_at && (
						<div className="flex justify-between items-start">
							<div className="flex flex-col gap-2">
								<p className="text-[#777] text-base font-medium">
									{__('Create Date', 'quillcrm')}
								</p>
								<p className="text-[#09090B] font-bold text-lg">
									{formatDate(deal.created_at)}
								</p>
							</div>
						</div>
					)}

					{/* last activity date */}
					{deal.updated_at && (
						<div className="flex justify-between items-start border-l border-[#DEE1E6] pl-4">
							<div className="flex flex-col gap-2">
								<p className="text-[#777] text-base font-medium">
									{__('Last activity date', 'quillcrm')}
								</p>
								<p className="text-[#09090B] font-bold text-lg">
									{formatDate(deal.updated_at)}
								</p>
							</div>
						</div>
					)}

					{/* create by */}
					{deal.owner && (
						<div className="flex justify-between items-start">
							<div className="flex flex-col gap-2">
								<p className="text-[#777] text-base font-medium">
									{__('Created by', 'quillcrm')}
								</p>
								<p className="text-[#09090B] font-bold text-lg">
									{deal.owner.display_name}
								</p>
							</div>
						</div>
					)}

					{/* updated at */}
					{deal.updated_at && (
						<div className="flex justify-between items-center border-l border-[#DEE1E6] pl-4">
							<div className="flex flex-col gap-2">
								<p className="text-[#777] text-base font-medium">
									{__('Updated by', 'quillcrm')}
								</p>
								<p className="text-[#09090B] font-bold text-lg">
									{deal.owner?.display_name}
								</p>
							</div>
						</div>
					)}
			</div>
		</div>
	);
};
