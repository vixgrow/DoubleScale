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
import { NewPipelineModal } from '../new-pipeline-modal';

interface DealDetailModalProps {
	dealId: number | null;
	visible: boolean;
	onClose: () => void;
	onUpdate?: () => void;
	onEdit?: (deal: Deal) => void;
	pipeline?: any;
}

export const DealDetailModal: React.FC<DealDetailModalProps> = ({
	dealId,
	visible,
	onClose,
	onUpdate,
	onEdit,
	pipeline,
}) => {
	const [deal, setDeal] = useState<Deal | null>(null);
	const [loading, setLoading] = useState(false);
	const [newPipelineModalVisible, setNewPipelineModalVisible] =
		useState(false);

	const { getDeal, deleteDeal } = useDealOperations();

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
			message.error(__('Failed to load deal details', 'quillcrm'));
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
			<DialogContent className="max-h-[98vh] gap-8 w-[calc(100vw-500px)] max-w-none ml-auto mr-0 p-10  rounded-none z-[100000] overflow-y-auto">
				{loading ? (
					<div className="flex justify-center items-center min-h-[200px]">
						<Spin size="large" />
					</div>
				) : (
					<>
						<DialogHeader >
							<DialogTitle className=" flex justify-between ">
								<div className=" p-0 m-0">
									<div className=" flex gap-2 items-center">
										<p className="text-[#09090B] font-bold text-[32px]">
											{__(`${deal?.title}`, 'quillcrm')}
										</p>
										<span className="w-6 h-6 p-1 flex items-center justify-center rounded-full bg-[#E4EEFD]">
											<EditHeaderIcon
												color="#458DC7"
												width={20}
												height={20}
											/>
										</span>
									</div>
									<div className="flex items-center gap-2 text-[#09090B] font-bold text-2xl">
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
									</div>
								</div>
								<ActivityActions
									dealId={deal?.id ?? 0}
									onRefresh={fetchDealDetails}
								/>
							</DialogTitle>
						</DialogHeader>
						{/* contact overview+customfiled */}
						<div className=" grid grid-cols-2 gap-12">
							<div>
								<DealOverViewModal
									dealId={dealId}
									onEdit={onEdit}
									onUpdate={fetchDealDetails}
								/>
							</div>
							<div className="border flex flex-col gap-6 border-[#DEE1E6] bg-[#F8F8F8] rounded-[20px] p-6">
								{deal && <CustomFieldsView deal={deal} />}
							</div>
						</div>

						{pipeline?.stages && (
							<PipelineStagesHeader stages={pipeline.stages} />
						)}
						{/* pipeline */}
						<div className=" flex flex-wrap md:flex-nowrap justify-between items-start md:items-center gap-6 w-full ">
							{/* new pipeline */}
							<div className=" flex gap-4 items-center">
								<div className=" flex flex-col gap-2">
									<p className=" text-[#777] text-base font-medium">
										{__('Pipeline', 'quillcrm')}
									</p>
									<p
										className="text-[#09090B] font-bold text-lg "
									>
										{__('New Pibeline', 'quillcrm')}
									</p>
								</div>
								<span onClick={() =>setNewPipelineModalVisible(true)} className="w-7 h-7 p-1 flex items-center cursor-pointer justify-center rounded-full bg-[#E4EEFD]">
									<EditHeaderIcon
										color="#458DC7"
										width={20}
										height={20}
									/>
								</span>
							</div>
							{/* previous stage pipeline */}
							<div className=" flex gap-4 items-center">
								<div className=" flex flex-col gap-2">
									<p className=" text-[#777] text-base font-medium">
										{__('Previous Stage', 'quillcrm')}
									</p>
									<p
										className="text-[#09090B] font-bold text-lg "
									>
										{previousStage ? previousStage.name : __('No previous stage', 'quillcrm')}
									</p>
								</div>
							</div>
							{/* current stage  */}
							{deal?.stage&&(
								<div className=" flex gap-4 items-center">
								<div className=" flex flex-col gap-2">
									<p className=" text-[#777] text-base font-medium">
										{__('Current Stage', 'quillcrm')}
									</p>
									<p
										className="font-bold text-lg "
										style={{color:deal.stage.color}}
									>
										{deal?.stage?.name}
									</p>
								</div>
							</div>
							)}
							{/* win   */}
							{deal?.probability &&(
								<div className=" flex gap-4 items-center">
								<div className=" flex flex-col gap-2">
									<p className=" text-[#777] text-base font-medium">
										{__('Win Probability (%)', 'quillcrm')}
									</p>
									<p
										className="font-bold text-[#09090B]  text-lg "
									>
										{deal?.probability}
									</p>
								</div>
							</div>
							)}
						</div>
					</>
				)}

				{/* models */}
				<NewPipelineModal
					visible={newPipelineModalVisible}
					onClose={() => setNewPipelineModalVisible(false)}
					onSuccess={() => {
						onUpdate?.();
						setNewPipelineModalVisible(false);
					}}
				/>
			</DialogContent>
		</Dialog>
	);
};
