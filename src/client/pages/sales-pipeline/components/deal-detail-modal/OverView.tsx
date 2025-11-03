/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState, useEffect } from '@wordpress/element';

/**
 * External dependencies
 */
import {
	Modal,
	Tabs,
	Spin,
	message,
	Button,
	Tag,
	Statistic,
	Row,
	Col,
	Card,
	Typography,
	Avatar,
	Badge,
	Input,
} from 'antd';
import {
	User,
	Calendar,
	DollarSign,
	Target,
	Clock,
	Building,
	Mail,
	Phone,
	Edit3,
	Archive,
	RotateCcw,
	CheckCircle,
	XCircle,
} from 'lucide-react';

/**
 * Internal dependencies
 */
import { useDealOperations } from '../../hooks/use-deal-operations';
import { DealActivities } from '../deal-activities';
import { Deal } from '../../types';
import './style.scss';
// import { DealCustomFields } from '../deal-custom-fields';
import { useCapabilities } from '@quillcrm/hooks/use-capabilities';
import DealCustomFields from '../deal-custom-fields/index copy';
import EditHeaderIcon from '@quillcrm/components/icons/edit-header';
import DealValueIcon from '@quillcrm/components/icons/deal-value';

// const { Title, Text, Paragraph } = Typography;

interface DealOverViewModalProps {
	dealId: number | null;
	// visible: boolean;
	onUpdate?: () => void;
	onEdit?: (deal: Deal) => void;
}

export const DealOverViewModal: React.FC<DealOverViewModalProps> = ({
	dealId,
	onUpdate,
	onEdit,
}) => {
	const [deal, setDeal] = useState<Deal | null>(null);
	const [loading, setLoading] = useState(false);
	const [activeTab, setActiveTab] = useState('overview');

	const { getDeal, deleteDeal } = useDealOperations();

	const { isDealOwner } = useCapabilities();

	// Fetch deal data when modal opens
	useEffect(() => {
		if ( dealId) {
			fetchDealDetails();
		}
	}, [ dealId]);

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

	const getStatusIcon = (status: string) => {
		switch (status) {
			case 'won':
				return <CheckCircle size={16} />;
			case 'lost':
				return <XCircle size={16} />;
			default:
				return <Clock size={16} />;
		}
	};

    const formatCurrency = (value: number): string => {
	let formattedValue = '';

	if (value >= 1_000_000) {
		formattedValue = (value / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
	} else if (value >= 1_000) {
		formattedValue = (value / 1_000).toFixed(1).replace(/\.0$/, '') + 'K';
	} else {
		formattedValue = value.toString(); 
	}

	return formattedValue;
};

    const formatDate = (dateString: string | null) => {
        if (!dateString) return __('Not set', 'quillcrm');
        
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        });
    };

		if (!deal) return null;

		return (
			<div className=' border flex flex-col gap-6 border-[#DEE1E6] bg-[#F8F8F8] rounded-[20px] p-6'>
                {/* title */}
                <p className=' text-[#09090B] text-[24px] font-medium leading-normal'>{__('Overview','quillcrm')}</p>
                <div className=' grid grid-cols-2 gap-5'>
                   {/* related contact */}
                   {deal.contact &&(
                    <div className=' flex justify-between items-center'>
                    {/* text */}
                    <div className=' flex flex-col gap-2'>
                        <p className=' text-[#777] text-base font-medium'>{__('Related Contact','quillcrm')}</p>
                       <p className='text-[#09090B] font-bold text-lg'>{deal.contact.first_name} {deal.contact.last_name}</p>
                    </div>
                    <span className="w-7 h-7 p-1 flex items-center justify-center rounded-full bg-[#E4EEFD]">
						<EditHeaderIcon
							color="#458DC7"
							width={20}
							height={20}
						/>
					</span>
                 </div>
                   )}
                   {/* deal owner */}
                    {deal.owner &&(
                    <div className=' flex justify-between items-center border-l border-[#DEE1E6] pl-4'>
                    {/* text */}
                    <div className=' flex flex-col gap-2'>
                        <p className=' text-[#777] text-base font-medium'>{__('Deal Owner','quillcrm')}</p>
                       <p className='text-[#09090B] font-bold text-lg'>{deal.owner.display_name}</p>
                    </div>
                    <span className="w-7 h-7 p-1 flex items-center justify-center rounded-full bg-[#E4EEFD]">
						<EditHeaderIcon
							color="#458DC7"
							width={20}
							height={20}
						/>
					</span>
                 </div>
                   )}
                   {/* deal source */}
                   {deal.source &&(
                    <div className=' flex justify-between items-center '>
                    {/* text */}
                    <div className=' flex flex-col gap-2'>
                        <p className=' text-[#777] text-base font-medium'>{__('Deal Source','quillcrm')}</p>
                       <p className='text-[#09090B] font-bold text-lg'>{deal.source}</p>
                    </div>
                    <span className="w-7 h-7 p-1 flex items-center justify-center rounded-full bg-[#E4EEFD]">
						<EditHeaderIcon
							color="#458DC7"
							width={20}
							height={20}
						/>
					</span>
                 </div>
                   )}
                   {/* expected close date */}
                    <div className=' flex justify-between items-center border-l border-[#DEE1E6] pl-4'>
                    <div className=' flex flex-col gap-2'>
                        <p className=' text-[#777] text-base font-medium'>{__('Expected Close Date','quillcrm')}</p>
                       <p className='text-[#09090B] font-bold text-lg'>{formatDate(deal.expected_close_date)}</p>
                    </div>
                    <span className="w-7 h-7 p-1 flex items-center justify-center rounded-full bg-[#E4EEFD]">
						<EditHeaderIcon
							color="#458DC7"
							width={20}
							height={20}
						/>
					</span>
                    </div>
                    {/* priority */}
                   {deal.priority &&(
                    <div className=' flex justify-between items-center '>
                    <div className=' flex flex-col gap-2'>
                        <p className=' text-[#777] text-base font-medium'>{__('Priority','quillcrm')}</p>
                        <span
      className={`
        text-base font-normal tracking-[-.32px] flex justify-center items-center py-1 px-2 rounded-[8px] border
        ${
          deal.priority === 'low'
            ? 'text-[#16A34A] border-[#16A34A] bg-[#EFFFF5]'
            : deal.priority === 'medium'
            ? 'text-[#A67D0A] border-[#E4B123] bg-[#FFF2CE]'
            : deal.priority === 'high'
            ? 'text-[#E13B3B] border-[#E13B3B] bg-[#FBE8E8]'
            : 'text-gray-700 border-gray-300 bg-gray-50'
        }
      `}
    >
      {deal.priority.charAt(0).toUpperCase() + deal.priority.slice(1)}
    </span>
                    </div>
                    <span className="w-7 h-7 p-1 flex items-center justify-center rounded-full bg-[#E4EEFD]">
						<EditHeaderIcon
							color="#458DC7"
							width={20}
							height={20}
						/>
					</span>
                 </div>
                   )}
                   {/* weigthted value */}
                   {deal.weighted_value &&(
                    <div className=' flex justify-between items-center border-l border-[#DEE1E6] pl-4'>
                    {/* text */}
                    <div className=' flex flex-col gap-2'>
                        <p className=' text-[#777] text-base font-medium'>{__('Weighted Value','quillcrm')}</p>
                       <div className='flex items-center'>
                         <span className='text-[#09090B] font-bold text-lg mr-1'> {formatCurrency(deal.weighted_value)}</span>
                         <DealValueIcon width={20} height={20}/>
                         <span className='text-[#777] text-[20px]'>USD</span>
                         </div>
                    </div>
                 </div>
                   )}
                    {/*create-at */}
                    {deal.created_at &&(
                    <div className=' flex justify-between items-center '>
                    <div className=' flex flex-col gap-2'>
                        <p className=' text-[#777] text-base font-medium'>{__('Create Date','quillcrm')}</p>
                       <p className='text-[#09090B] font-bold text-lg'>{formatDate(deal.created_at)}</p>
                    </div>
                 </div>
                   )}
                   {/* last activity date  */}
                   {deal.updated_at &&(
                    <div className=' flex justify-between items-center border-l border-[#DEE1E6] pl-4'>
                    <div className=' flex flex-col gap-2'>
                        <p className=' text-[#777] text-base font-medium'>{__('Last activity date','quillcrm')}</p>
                       <p className='text-[#09090B] font-bold text-lg'>{formatDate(deal.updated_at)}</p>
                    </div>
                 </div>
                   )}
                    {/* create by  */}
                    {deal.owner &&(
                    <div className=' flex justify-between items-center '>
                    {/* text */}
                    <div className=' flex flex-col gap-2'>
                        <p className=' text-[#777] text-base font-medium'>{__('Created by','quillcrm')}</p>
                       <p className='text-[#09090B] font-bold text-lg'>{deal.owner.display_name}</p>
                    </div>
                 </div>
                   )}
                   {/* updated at */}
                   {deal.updated_at &&(
                    <div className=' flex justify-between items-center border-l border-[#DEE1E6] pl-4'>
                    <div className=' flex flex-col gap-2'>
                        <p className=' text-[#777] text-base font-medium'>{__('Updated by','quillcrm')}</p>
                       <p className='text-[#09090B] font-bold text-lg'>{deal.owner?.display_name}</p>
                    </div>
                 </div>
                   )}

                </div>

            </div>
		);
	};

