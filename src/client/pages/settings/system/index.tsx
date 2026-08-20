/**
 * System Settings Component
 *
 * Main wrapper with nested tabs for Cron Jobs and Debugging
 *
 * @since 1.0.0
 * @package DoubleScale
 */

import { useMemo, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { PageTabs, DebuggingIcon, TimerBlockIcon } from '@doublescale/components';
import CronJobs from './cron-jobs';
import DebuggingLogs from '../debugging';

const SystemSettings: React.FC = () => {
	const [activeTab, setActiveTab] = useState<string>('cron');

	const tabsList = useMemo(
		() => [
			{
				value: 'cron',
				label: __('Cron Jobs', 'doublescale'),
				icon: <TimerBlockIcon width={24} height={24} />,
			},
			{
				value: 'debugging',
				label: __('Debugging', 'doublescale'),
				icon: <DebuggingIcon width={24} height={24} />,
			},
		],
		[]
	);

	const tabsContent = useMemo(
		() => [
			{
				value: 'cron',
				children: <CronJobs />,
			},
			{
				value: 'debugging',
				children: <DebuggingLogs />,
			},
		],
		[]
	);

	return (
		<div className="system-settings">
			<div className="text-[#09090B] font-semibold text-2xl mb-6 text-start">
				{__('System', 'doublescale')}
			</div>
			<PageTabs
				defaultValue={activeTab}
				value={activeTab}
				onValueChange={setActiveTab}
				tabsList={tabsList}
				tabsContent={tabsContent}
				tabsListWrapperClassName="border px-5 py-3 rounded-lg mb-6"
				tabsListClassName="bg-transparent text-foreground gap-3 justify-start"
				tabsContentClassName="mt-0"
			/>
		</div>
	);
};

export default SystemSettings;
