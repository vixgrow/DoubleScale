/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * External dependencies
 */
import { useState } from 'react';
import { ChevronUp, ChevronDown, Lock } from 'lucide-react';
import { map } from 'lodash';

/**
 * Internal dependencies
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from '@/components/ui/tooltip';
import ProAutomationModal from '@quillcrm/components/pro-automation-modal';
import type { TriggersGroup } from '@quillcrm/config';
import config from '@quillcrm/config';

interface TriggersGroupRenderProps {
	groups: TriggersGroup[];
	onChange: (value: string) => void;
	value: string;
}

const TriggersGroupRender: React.FC<TriggersGroupRenderProps> = ({
	groups,
	onChange,
	value,
}) => {
	const [collapsedGroups, setCollapsedGroups] = useState<
		Record<string, boolean>
	>({});
	const [showProModal, setShowProModal] = useState(false);
	const [selectedProTrigger, setSelectedProTrigger] = useState<{
		name: string;
		key: string;
	} | null>(null);

	// Check if Pro plugin is active once
	const proPluginData = config.getProPluginData();
	const isProActive = proPluginData.is_active;

	// Helper function to get tooltip message for disabled triggers
	const getDisabledTooltip = (groupLabel: string) => {
		if (groupLabel === 'QuillBooking') {
			return __(
				'QuillBooking plugin is not installed or activated. Install QuillBooking to use these triggers.',
				'quillcrm'
			);
		}
		if (groupLabel === 'WooCommerce') {
			return __(
				'WooCommerce plugin is not installed or activated. Install WooCommerce to use these triggers.',
				'quillcrm'
			);
		}
		if (groupLabel === 'LearnDash') {
			return __(
				'LearnDash plugin is not installed or activated. Install LearnDash to use these triggers.',
				'quillcrm'
			);
		}
		if (groupLabel === 'Tutor LMS') {
			return __(
				'Tutor LMS plugin is not installed or activated. Install Tutor LMS to use these triggers.',
				'quillcrm'
			);
		}
		if (groupLabel === 'LifterLMS') {
			return __(
				'LifterLMS plugin is not installed or activated. Install LifterLMS to use these triggers.',
				'quillcrm'
			);
		}
		if (groupLabel === 'LearnPress') {
			return __(
				'LearnPress plugin is not installed or activated. Install LearnPress to use these triggers.',
				'quillcrm'
			);
		}
		if (groupLabel === 'MemberPress') {
			return __(
				'MemberPress plugin is not installed or activated. Install MemberPress to use these triggers.',
				'quillcrm'
			);
		}
		if (groupLabel === 'Order' || groupLabel === 'SureCart') {
			return __(
				'SureCart plugin is not installed or activated. Install SureCart to use these triggers.',
				'quillcrm'
			);
		}
		if (groupLabel === 'Presto Player') {
			return __(
				'Presto Player plugin is not installed or activated. Install Presto Player to use these triggers.',
				'quillcrm'
			);
		}
		return __(
			'This integration is not available. Please install the required plugin.',
			'quillcrm'
		);
	};

	const toggleGroup = (key: number) => {
		setCollapsedGroups((prev) => ({
			...prev,
			[key]: !prev[key],
		}));
	};

	const handleTriggerClick = (triggerKey: string, trigger: any) => {
		// Check if this is a Pro feature AND Pro plugin is not active
		const isProFeatureLockedOut = trigger.is_pro && !isProActive;

		if (isProFeatureLockedOut) {
			setSelectedProTrigger({ name: trigger.label, key: triggerKey });
			setShowProModal(true);
		} else {
			onChange(triggerKey);
		}
	};

	const handleCloseProModal = () => {
		setShowProModal(false);
		setSelectedProTrigger(null);
	};

	return (
		<>
			<div className="flex flex-col gap-4">
				{map(groups, (group, key) => (
					<Card key={key} className="shadow-none">
						<CardHeader className="px-4 py-2 border-b-2">
							<CardTitle className="flex items-center justify-between font-bold text-base">
								<div className="flex items-center gap-2">
									{group.label}
									{group.is_disabled && (
										<TooltipProvider>
											<Tooltip>
												<TooltipTrigger asChild>
													<span className="text-sm text-muted-foreground">
														(
														{__(
															'Not Available',
															'quillcrm'
														)}
														)
													</span>
												</TooltipTrigger>
												<TooltipContent>
													{getDisabledTooltip(
														group.label
													)}
												</TooltipContent>
											</Tooltip>
										</TooltipProvider>
									)}
								</div>
								<Button
									variant="ghost"
									size="sm"
									onClick={() => toggleGroup(key)}
									className="h-8 w-8 p-0"
								>
									{collapsedGroups[key] ? (
										<ChevronDown className="h-6 w-6" />
									) : (
										<ChevronUp className="h-6 w-6" />
									)}
								</Button>
							</CardTitle>
						</CardHeader>
						{!collapsedGroups[key] && (
							<CardContent className="p-0">
								<div className="flex flex-col divide-y">
									{map(
										group.triggers,
										(trigger, triggerKey) => {
											const triggerButton = (
												<div
													key={triggerKey}
													className="flex items-center justify-between px-4 py-2.5 hover:bg-muted/50 transition-colors"
												>
													<div className="flex items-center gap-2">
														<span className="text-sm">
															{trigger.label}
														</span>
														{trigger.is_pro && !isProActive && (
															<Lock className="h-4 w-4 text-orange-500" />
														)}
													</div>
													<Button
														onClick={() =>
															handleTriggerClick(
																triggerKey,
																trigger
															)
														}
														disabled={
															!trigger.is_pro &&
															group.is_disabled
														}
														className={`text-primary bg-transparent shadow-none font-semibold rounded-full p-2 hover:bg-primary/10 ${
															value === triggerKey
																? 'border-2 border-primary'
																: 'border'
														}`}
													>
														{__(
															'Select',
															'quillcrm'
														)}
													</Button>
												</div>
											);

											if (
												!trigger.is_pro &&
												group.is_disabled
											) {
												return (
													<TooltipProvider
														key={triggerKey}
													>
														<Tooltip>
															<TooltipTrigger
																asChild
															>
																{triggerButton}
															</TooltipTrigger>
															<TooltipContent>
																{getDisabledTooltip(
																	group.label
																)}
															</TooltipContent>
														</Tooltip>
													</TooltipProvider>
												);
											}

											return triggerButton;
										}
									)}
								</div>
							</CardContent>
						)}
					</Card>
				))}
			</div>

			{/* PRO Modal */}
			{selectedProTrigger && (
				<ProAutomationModal
					visible={showProModal}
					onClose={handleCloseProModal}
					featureName={selectedProTrigger.name}
				/>
			)}
		</>
	);
};

export default TriggersGroupRender;
