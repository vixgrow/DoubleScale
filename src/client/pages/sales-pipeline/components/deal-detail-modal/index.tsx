/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState, useEffect } from '@wordpress/element';

/**
 * External dependencies
 */
import { Spin, message } from 'antd';

/**
 * Internal dependencies
 */
import { useDealOperations } from '../../hooks/use-deal-operations';

import { Deal } from '../../types';
import './style.scss';

import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from '@quillcrm/components/ui/dialog';

import EditHeaderIcon from '@quillcrm/components/icons/edit-header';
import DealValueIcon from '@quillcrm/components/icons/deal-value';
import ActivityActions from './DealActivityAction';
import { DealOverViewModal } from './OverView';

import { CustomFieldsView } from './CustomFileldView';
import { PipelineStagesHeader } from './SatagesHeader';
import Deal_Activites from '../deal-activities';
import { DealDetailSkeleton } from './DealDetailSkeleton';
import { StageTextColor } from '@quillcrm/components/stagebody-color/stagebodyColor';
import DealOverviewSkeleton from './deal-overview-skeleton';
import { Input } from '@quillcrm/components/ui/input';
import { useDispatch } from '@wordpress/data';

interface DealDetailModalProps {
	dealId: number | null;
	visible: boolean;
	onClose: () => void;
	onUpdate?: () => void;
	onDeleted?: () => void;
	onEdit?: (deal: Deal) => void;
	pipeline?: any;
}

export const DealDetailModal: React.FC<DealDetailModalProps> = ({
	dealId,
	visible,
	onClose,
	onUpdate,
	onDeleted,
	onEdit,
	pipeline,
}) => {
	const [deal, setDeal] = useState<Deal | null>(null);
	const [loading, setLoading] = useState(false);
	const [showContent, setShowContent] = useState(false);
	const [editingField, setEditingField] = useState<'title' | 'value' | null>(null);
	const [tempTitle, setTempTitle] = useState('');
	const [tempValue, setTempValue] = useState('');

	const { getDeal, deleteDeal,updateDeal } = useDealOperations();
	const dispatch = useDispatch('quillcrm/core');
	const createNotice = dispatch?.createNotice;

	useEffect(() => {
		if (!loading && deal) {
		  const timer = setTimeout(() => setShowContent(true), 150);
		  return () => clearTimeout(timer);
		}
	}, [loading, deal]);

    // to update deal card also
	const handleOverviewUpdate = async () => {
		// Refresh the deal details locally
		await fetchDealDetails();
		if (onUpdate) {
			onUpdate();
		}
	};

	// Fetch deal data when modal opens
	useEffect(() => {
		if (visible && dealId) {
			fetchDealDetails();
		}
	}, [visible, dealId]);

	const fetchDealDetails = async () => {
		if (!dealId) return;

		setLoading(true);
		try {
			const dealData = await getDeal(dealId, true);
			setDeal(dealData);
		} catch (error) {
			createNotice?.({
				type: 'error',
				message:
					error instanceof Error
						? error.message
						: __('Failed to load deal details', 'quillcrm'),
			});
		} finally {
			setLoading(false);
		}
	};
	const previousStage = (() => {
		if (!pipeline?.stages || !deal?.stage?.id) return null;

		const currentIndex = pipeline.stages.findIndex(
			(stage: any) => stage.id === deal?.stage?.id
		);

		if (currentIndex > 0) {
			return pipeline.stages[currentIndex - 1];
		}

		return null;
	})();
	const handleSaveInline = async (field: 'title' | 'weighted_value' | 'value', value: any) => {
		try {
			if (!deal) return;

			const updatedDeal = { ...deal, [field]: value };
			setDeal(updatedDeal);

			await updateDeal(deal.id, { [field]: value });

			if (onUpdate) {
				 onUpdate();
			}
		} catch (error) {
			await fetchDealDetails();
		} finally {
			setEditingField(null);
		}
	};

	const handleStartEdit = (field: 'title' | 'value') => {
		if (field === 'title') {
			setTempTitle(deal?.title || '');
			setEditingField('title');
		} else {
			setTempValue(deal?.value?.toString() || '');
			setEditingField('value');
		}
	};

	const handleCancelEdit = () => {
		setEditingField(null);
	};

	const handleSaveTitle = async () => {
		if (!tempTitle.trim()) {
			handleCancelEdit();
			return;
		}
		await handleSaveInline('title', tempTitle.trim());
	};

	const handleSaveValue = async () => {
		const numValue = parseFloat(tempValue);
		if (isNaN(numValue)) {
			handleCancelEdit();
			return;
		}
		await handleSaveInline('value', numValue);
	};

	const formatCurrency = (value: number): string => {
		let formattedValue = '';

		if (value >= 1_000_000) {
			formattedValue =
				(value / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
		} else if (value >= 1_000) {
			formattedValue =
				(value / 1_000).toFixed(1).replace(/\.0$/, '') + 'K';
		} else {
			formattedValue = value.toString();
		}

		return formattedValue;
	};

	return (
		<Dialog open={visible} onOpenChange={(open) => !open && onClose()}>
			<DialogContent className="max-h-[98vh] gap-8 w-full max-w-[calc(100vw-500px)]  ml-auto my-8 p-10  rounded-none overflow-y-auto">
				{loading || !showContent  ? (
					// <div className="flex justify-center items-center min-h-[200px]">
						<DealDetailSkeleton />
					// </div>
				) : (
					<>
						<DialogHeader>
							<DialogTitle className=" flex justify-between ">
								<div className=" p-0 m-0">
									<div className="flex gap-2 items-center">
										{editingField === 'title' ? (
											<Input
												value={tempTitle}
												onChange={(e) => setTempTitle(e.target.value)}
												className="text-[#09090B] font-bold text-[32px] h-12 border-2 border-[#458DC7]"
												placeholder={__('Deal Title', 'quillcrm')}
												autoFocus
												onBlur={handleSaveTitle}
												onKeyDown={(e) => {
													if (e.key === 'Enter') handleSaveTitle();
													if (e.key === 'Escape') handleCancelEdit();
												}}
											/>
										) : (
											<>
												<p className="text-[#09090B] font-bold text-[32px]">
													{deal?.title}
												</p>
												<span
													className="w-6 h-6 p-1 flex items-center justify-center rounded-full bg-[#E4EEFD] cursor-pointer"
													onClick={() => handleStartEdit('title')}
												>
													<EditHeaderIcon color="#458DC7" width={20} height={20} />
												</span>
											</>
										)}
									</div>
									{/* value */}
									{/* <div className="flex items-center gap-2 text-[#09090B] font-bold text-2xl">
										<p className="mt-1 text-2xl">
											{__(
												`${formatCurrency(deal?.weighted_value ?? 0)}`,
												'quillcrm'
											)}
										</p>
										<span className="text-[#777] text-[20px] flex items-center gap-1">
											<DealValueIcon
												width={20}
												height={20}
											/>
											USD
										</span>
										<span className="w-6 h-6 p-1 flex items-center justify-center rounded-full bg-[#E4EEFD]">
											<EditHeaderIcon
												color="#458DC7"
												width={20}
												height={20}
											/>
										</span>
									</div> */}
									{/* Editable Value */}
									<div className="flex items-center gap-2 text-[#09090B] font-bold text-2xl mt-1">
										{editingField === 'value' ? (
											<div className="relative">
												{/* <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xl text-[#777]">$</span> */}
												<Input
													type="number"
													value={tempValue}
													onChange={(e) => setTempValue(e.target.value)}
													className="text-[#09090B] font-bold text-2xl h-12 pl-8 border-2 border-[#458DC7]"
													placeholder="0"
													autoFocus
													onBlur={handleSaveValue}
													onKeyDown={(e) => {
														if (e.key === 'Enter') handleSaveValue();
														if (e.key === 'Escape') handleCancelEdit();
													}}
												/>
											</div>
										) : (
											<>
												<p className="text-2xl">
													${formatCurrency(deal?.value ?? 0)}
												</p>
												<span className="text-[#777] text-[20px] flex items-center gap-1">
													<DealValueIcon width={20} height={20} />
													USD
												</span>
												<span
													className="w-6 h-6 p-1 flex items-center justify-center rounded-full bg-[#E4EEFD] cursor-pointer"
													onClick={() => handleStartEdit('value')}
												>
													<EditHeaderIcon color="#458DC7" width={20} height={20} />
												</span>
											</>
										)}
									</div>
								
								</div>
								<ActivityActions
									dealId={deal?.id ?? 0}
									onRefresh={fetchDealDetails}
									dealTitle={deal?.title}
									deal={deal}
									dealContactName={deal?.contact?.first_name}
									onDeleted={() => {
										if(onDeleted) onDeleted();
									}}
								/>
							</DialogTitle>
						</DialogHeader>
						{/* contact overview+customfiled */}
						<div className=" grid grid-cols-2 gap-12">
							{loading?(
								<DealOverviewSkeleton/>
							):(
								<div>
								<DealOverViewModal
									dealId={dealId}
									onEdit={onEdit}
									onUpdate={handleOverviewUpdate}

								/>
							</div>
							)}
							<div className="border flex flex-col gap-6 border-[#DEE1E6] bg-[#F8F8F8] rounded-[20px] p-6">
								{deal && <CustomFieldsView deal={deal} />}
							</div>
						</div>

						{pipeline?.stages && (
							<PipelineStagesHeader stages={pipeline.stages} currentStageId={deal?.stage?.id}  />
						)}
						{/* pipeline */}
						<div className=" flex flex-wrap md:flex-nowrap justify-between items-start md:items-center gap-6 w-full ">
							{/* new pipeline */}
							<div className=" flex gap-4 items-center">
								<div className=" flex flex-col gap-2">
									<p className=" text-[#777] text-base font-medium">
										{__('Pipeline', 'quillcrm')}
									</p>
									<p className="text-[#09090B] font-bold text-lg ">
										{deal?.pipeline?.name}
									</p>
								</div>
							</div>
							{/* previous stage pipeline */}
							<div className=" flex gap-4 items-center">
								<div className=" flex flex-col gap-2">
									<p className=" text-[#777] text-base font-medium">
										{__('Previous Stage', 'quillcrm')}
									</p>
									<p className="text-[#09090B] font-bold text-lg ">
										{previousStage
											? previousStage.name
											: __(
													'No previous stage',
													'quillcrm'
												)}
									</p>
								</div>
							</div>
							{/* current stage  */}
							{deal?.stage && (
								<div className=" flex gap-4 items-center">
									<div className=" flex flex-col gap-2">
										<p className=" text-[#777] text-base font-medium">
											{__('Current Stage', 'quillcrm')}
										</p>
										<p
											className="font-bold text-lg "
											style={{ color: StageTextColor(deal.stage.color) }}
										>
											{deal?.stage?.name}
										</p>
									</div>
								</div>
							)}
							{/* win   */}
							{deal?.probability && (
								<div className=" flex gap-4 items-center">
									<div className=" flex flex-col gap-2">
										<p className=" text-[#777] text-base font-medium">
											{__(
												'Win Probability (%)',
												'quillcrm'
											)}
										</p>
										<p className="font-bold text-[#09090B]  text-lg ">
											{deal?.probability}
										</p>
									</div>
								</div>
							)}
						</div>
						{/* avtivites */}
						<Deal_Activites dealId={dealId || undefined} />
					</>
				)}
			</DialogContent>
		</Dialog>
	);
};
