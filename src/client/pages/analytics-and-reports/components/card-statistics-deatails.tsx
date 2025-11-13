/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * External dependencies
 */
import React from 'react';

/**
 * Internal dependencies
 */
import { Card, CardContent } from '../../../../components/ui/card';
import DealValueIcon from '@quillcrm/components/icons/deal-value';
import CloseWinIcon from '@quillcrm/components/icons/close-won';
import WinRateIcon from '@quillcrm/components/icons/win-rate';
import CloseLostIcon from '@quillcrm/components/icons/close-lost';

interface DealStatistic {
	primaryValue: string;
	primaryLabel: string;
	secondaryValue: string;
	secondaryLabel: string;
}

export interface DealsStatisticsCardProps {
	title: string;
	icon: React.ReactNode;
	iconBgColor: string;
	borderColor: string;
	statistics: DealStatistic;
}

const DealsStatisticsCard: React.FC<DealsStatisticsCardProps> = ({
	title,
	icon,
	iconBgColor,
	statistics,
	borderColor
}) => {
	return (
		<Card
		className="shadow-none hover:shadow-lg bg-[#F8F8F8] transition-all duration-300 hover:-translate-y-1  rounded-[12px]"
		style={{ borderLeft: `3px solid ${borderColor}` }}
>
  <div className="flex flex-col justify-center items-center gap-4 !p-4">
    <div className="flex justify-center items-center gap-4">
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center"
        style={{ backgroundColor: iconBgColor }}
      >
        {icon}
      </div>

      <h3 className="text-2xl  leading-normal tracking-[-1] font-semibold text-[#09090B]">
        {title}
      </h3>
    </div>

    <div className="grid grid-cols-2 gap-4 divide-x divide-[#DEE1E6]">
      <div className="text-center pr-2">
        <div className="text-xl  leading-[30px] font-bold text-[#09090B] mb-1">
          {statistics.primaryValue}
        </div>
        <div className="text-base leading-[26px] font-normal text-[#777]">
          {statistics.primaryLabel}
        </div>
      </div>
      <div className="text-center pl-2">
        <div className="text-xl leading-[30px] font-bold text-[#09090B] mb-1">
          {statistics.secondaryValue}
        </div>
        <div className="text-base leading-[26px] font-normal text-[#777]">
          {statistics.secondaryLabel}
        </div>
      </div>
    </div>
  </div>
</Card>
	);
};

// Helper function to convert cardsStatistics to DealsStatisticsCard format
export const convertToDealsStatistics = (
	cardsStatistics: any
): DealsStatisticsCardProps[] => {
	const icons = {
		deals: (
			<DealValueIcon  color='#660FF1'/>
		),
		won: (
			<CloseWinIcon/>
		),
		rate: (
			<WinRateIcon/>
		),
		lost: (
			<CloseLostIcon/>
		),
	};

	return [
		{
			title: __('Deals', 'quillcrm'),
			icon: icons.deals,
			iconBgColor: '#F5EFFF',
			borderColor: '#660FF1',
			statistics: {
				primaryValue: cardsStatistics.total_deals_close_number?.value || '0',
				primaryLabel: __('Total Deals', 'quillcrm'),
				secondaryValue: cardsStatistics.total_deals_close_value?.value || '0',
				secondaryLabel: __('Total Weighted Value', 'quillcrm'),
			},
		},
		{
			title: __('Deals Close Won', 'quillcrm'),
			icon: icons.won,
			iconBgColor: '#D1F6DF',
			borderColor: '#16A34A',
			statistics: {
				primaryValue: cardsStatistics.total_deals_close_won_number?.value || '0',
				primaryLabel:  __('Total Deals Close Won Number', 'quillcrm'),
				secondaryValue: cardsStatistics.total_deals_close_won_value?.value || '0',
				secondaryLabel: __('Total Deals Close Won Value', 'quillcrm'),
			},
		},
		{
			title: __('Win Rate', 'quillcrm'),
			icon: icons.rate,
			iconBgColor: '#E4FAEC',
			borderColor: '#16A34A',
			statistics: {
				primaryValue: cardsStatistics.performance_rate_number?.value || '0',
				primaryLabel:  __('Win Rate Number', 'quillcrm'),
				secondaryValue: cardsStatistics.performance_rate_value?.value || '0',
				secondaryLabel: __('Win Rate Value', 'quillcrm'),
			},
		},
		{
			title: __('Deals Close Lost', 'quillcrm'),
			icon: icons.lost,
			iconBgColor: '#FBE8E8',
			borderColor: '#E13B3B',
			statistics: {
				primaryValue: cardsStatistics.total_deals_close_lost_number?.value || '0',
				primaryLabel:  __('Total Deals Close Lost Number', 'quillcrm'),
				secondaryValue: cardsStatistics.total_deals_close_lost_value?.value || '0',
				secondaryLabel:  __('Total Deals Close Lost Value', 'quillcrm'),
			},
		},
	];
};

export default DealsStatisticsCard;