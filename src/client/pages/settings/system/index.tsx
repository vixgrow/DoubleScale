/**
 * System Settings Component
 *
 * Main wrapper with nested tabs for Cron Jobs and Debugging
 *
 * @since 1.0.0
 * @package DoubleScale
 */

import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Clock, Bug } from 'lucide-react';
import CronJobs from './cron-jobs';
import DebuggingLogs from '../debugging';

const SystemSettings: React.FC = () => {
	const [activeTab, setActiveTab] = useState<string>('cron');

	const tabsList = [
		{
			value: 'cron',
			label: __('Cron Jobs', 'doublescale'),
			icon: <Clock className="h-4 w-4" />,
		},
		{
			value: 'debugging',
			label: __('Debugging', 'doublescale'),
			icon: <Bug className="h-4 w-4" />,
		},
	];

	return (
		<div className="system-settings">
			<div className="text-[#09090B] font-semibold text-2xl mb-6">
				{__('System', 'doublescale')}
			</div>
			<Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
				<div className="border px-5 py-3 rounded-lg mb-6">
					<TabsList className="bg-transparent text-foreground gap-3">
						{tabsList.map((tab) => (
							<TabsTrigger
								key={tab.value}
								value={tab.value}
								className="px-3 py-2 gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
							>
								{tab.icon}
								{tab.label}
							</TabsTrigger>
						))}
					</TabsList>
				</div>
				<TabsContent value="cron" className="mt-0">
					<CronJobs />
				</TabsContent>
				<TabsContent value="debugging" className="mt-0">
					<DebuggingLogs />
				</TabsContent>
			</Tabs>
		</div>
	);
};

export default SystemSettings;
