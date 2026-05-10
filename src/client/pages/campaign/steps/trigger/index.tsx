/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState, useEffect, useRef, useCallback } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
/**
 * Internal dependencies
 */
import { useCampaignStep, automatedCampaignSteps } from '../shared';
import {
	PanelLayout,
	PanelSettings,
	PlayIcon,
	Stepper,
	SetUpInfoIcon,
	NoticeBanner,
	CalendarIcon,
	ScheduleIcon,
} from '@doublescale/components';
import type { NoticeMessage } from '@doublescale/client';
import type {
	AutomatedTriggerConfig,
	AutomatedTriggerType,
	EventTrigger,
	ScheduleFrequency,
	ScheduleDay,
	ScheduleTrigger,
} from '@doublescale/client';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { MultiSelect, type MultiSelectOption } from '@/components/ui/multi-select';

const triggerTypeOptions: {
	label: string;
	description: string;
	type: AutomatedTriggerType;
	icon: React.ReactNode;
}[] = [
	{
		label: __('Event-Based', 'doublescale'),
		description: __(
			'Send when a specific event occurs, like publishing a post.',
			'doublescale'
		),
		type: 'event',
		icon: <CalendarIcon width={24} height={24} />,
	},
	{
		label: __('Schedule-Based', 'doublescale'),
		description: __(
			'Send on a recurring schedule: daily, weekly, monthly, or custom.',
			'doublescale'
		),
		type: 'schedule',
		icon: <ScheduleIcon width={24} height={24} />,
	},
];

const frequencyOptions: { value: ScheduleFrequency; label: string }[] = [
	{ value: 'daily', label: __('Daily', 'doublescale') },
	{ value: 'weekly', label: __('Weekly', 'doublescale') },
	{ value: 'monthly', label: __('Monthly', 'doublescale') },
];

const timeOfDayOptions: { value: string; label: string }[] = (() => {
	const options: { value: string; label: string }[] = [];
	for (let h = 0; h < 24; h++) {
		for (let m = 0; m < 60; m += 15) {
			const time = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
			options.push({ value: time, label: time });
		}
	}
	return options;
})();

const dayOptions: { value: ScheduleDay; label: string }[] = [
	{ value: 'monday', label: __('Every Monday', 'doublescale') },
	{ value: 'tuesday', label: __('Every Tuesday', 'doublescale') },
	{ value: 'wednesday', label: __('Every Wednesday', 'doublescale') },
	{ value: 'thursday', label: __('Every Thursday', 'doublescale') },
	{ value: 'friday', label: __('Every Friday', 'doublescale') },
	{ value: 'saturday', label: __('Every Saturday', 'doublescale') },
	{ value: 'sunday', label: __('Every Sunday', 'doublescale') },
];

const TriggerStep: React.FC = () => {
	const { campaign, goToStep, saveCampaignSettings, isNewCampaign } = useCampaignStep();

	const [notice, setNotice] = useState<NoticeMessage | null>(null);
	const [isSaving, setIsSaving] = useState(false);
	const noticeBannerRef = useRef<HTMLDivElement>(null);

	const [triggerConfig, setTriggerConfig] = useState<AutomatedTriggerConfig>(
		campaign?.settings?.trigger || {
			trigger_type: 'event',
			event: { event_type: 'post_published', post_type: 'post' },
		}
	);

	const [categoryOptions, setCategoryOptions] = useState<MultiSelectOption[]>([]);
	const [selectedCategories, setSelectedCategories] = useState<MultiSelectOption[]>([]);
	const [isCategoriesLoading, setIsCategoriesLoading] = useState(false);

	const fetchCategories = useCallback(async (postType: string) => {
		setIsCategoriesLoading(true);
		try {
			const taxonomy = postType === 'product' ? 'product_cat' : 'category';
			const cats = (await apiFetch({
				path: `/wp/v2/${taxonomy === 'product_cat' ? 'product_cat' : 'categories'}?per_page=100&hide_empty=false`,
			})) as Array<{ id: number; name: string }>;
			const options = cats.map((cat) => ({
				value: String(cat.id),
				label: cat.name,
			}));
			setCategoryOptions(options);
			return options;
		} catch {
			setCategoryOptions([]);
			return [];
		} finally {
			setIsCategoriesLoading(false);
		}
	}, []);

	useEffect(() => {
		if (campaign?.settings?.trigger) {
			setTriggerConfig(campaign.settings.trigger as AutomatedTriggerConfig);
		}
	}, [campaign?.settings?.trigger]);

	useEffect(() => {
		const event = triggerConfig.event;
		if (
			triggerConfig.trigger_type === 'event' &&
			event?.event_type === 'post_published' &&
			event?.post_type &&
			event.post_type !== 'page'
		) {
			fetchCategories(event.post_type).then((options) => {
				const savedIds = event.categories ?? [];
				if (savedIds.length > 0 && options.length > 0) {
					setSelectedCategories(
						options.filter((o) => savedIds.includes(Number(o.value)))
					);
				}
			});
		} else {
			setCategoryOptions([]);
			setSelectedCategories([]);
		}
	}, [triggerConfig.event?.post_type, triggerConfig.trigger_type, fetchCategories]);

	useEffect(() => {
		if (notice && noticeBannerRef.current) {
			noticeBannerRef.current.scrollIntoView({
				behavior: 'smooth',
				block: 'nearest',
			});
		}
	}, [notice]);

	const handleTriggerTypeChange = (type: AutomatedTriggerType) => {
		if (type === 'event') {
			setTriggerConfig({
				trigger_type: 'event',
				event: { event_type: 'post_published', post_type: 'post' },
			});
		} else {
			setTriggerConfig({
				trigger_type: 'schedule',
				schedule: { frequency: 'daily', time: '09:00' },
			});
		}
	};

	const updateEvent = (updates: Partial<EventTrigger>) => {
		setTriggerConfig((prev) => ({
			...prev,
			event: { ...prev.event!, ...updates },
		}));
	};

	const handleCategoriesChange = (selected: MultiSelectOption[]) => {
		setSelectedCategories(selected);
		updateEvent({
			categories: selected.map((s) => Number(s.value)),
		});
	};

	const updateSchedule = (updates: Partial<ScheduleTrigger>) => {
		setTriggerConfig((prev) => ({
			...prev,
			schedule: { ...prev.schedule!, ...updates },
		}));
	};

	const handleSaveAndNext = async () => {
		if (!campaign) return;

		setIsSaving(true);
		try {
			await saveCampaignSettings({
				settings: {
					...campaign.settings,
					trigger: triggerConfig,
				},
			});

			setNotice({
				type: 'success',
				message: __('Trigger saved successfully', 'doublescale'),
			});

			goToStep('template');
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : String(error);
			setNotice({
				type: 'error',
				message:
					errorMessage ||
					__('An error occurred while saving. Please try again.', 'doublescale'),
			});
		} finally {
			setIsSaving(false);
		}
	};

	return (
		<div>
			<PanelLayout
				items={[
					{
						label: __('Create Campaign', 'doublescale'),
						href: 'campaigns',
					},
					{
						label: __('Automated Campaign', 'doublescale'),
					},
				]}
				panelbtns={[
					<Button variant="secondaryDeepBlue">
						<PlayIcon />
						{__('Watch Tutorial', 'doublescale')}
					</Button>,
				]}
				type="campaign"
			>
			<Stepper
				steps={automatedCampaignSteps}
				canProceed="true"
				currentStep={1}
				onStepClick={goToStep}
				disableNavigation={isNewCampaign}
			/>

				<div className="flex gap-6">
					<PanelSettings
						title={__('Configure Trigger', 'doublescale')}
						description={__(
							'Set up how and when your automated campaign will be triggered.',
							'doublescale'
						)}
						icon={<SetUpInfoIcon />}
						className="w-full h-full"
						showButtons={true}
						onNext={handleSaveAndNext}
						nextLabel={
							isSaving
								? __('Saving...', 'doublescale')
								: __('Next', 'doublescale')
						}
						isLoading={isSaving}
					>
						{notice && (
							<NoticeBanner
								ref={noticeBannerRef}
								notice={notice}
								closeNotice={() => setNotice(null)}
							/>
						)}

						{/* Trigger Type Selection */}
						<div className="grid gap-3">
							<Label className="text-[#09090B] font-normal text-base">
								{__('Choose trigger type', 'doublescale')}
							</Label>
							<div className="flex flex-col gap-3">
								{triggerTypeOptions.map((option) => (
									<div
										key={option.type}
										className={`flex items-center justify-between px-4 py-5 border rounded-xl cursor-pointer transition-colors relative overflow-hidden ${
											triggerConfig.trigger_type === option.type
												? 'border-primary bg-blue-50'
												: 'border-gray-200 hover:border-gray-300'
										}`}
										onClick={() =>
											handleTriggerTypeChange(option.type)
										}
									>
										<div className="flex items-center gap-3 flex-1">
											<div
												className="text-primary-foreground p-2.5 rounded-xl"
												style={{
													background:
														'var(--Linear, linear-gradient(90deg, #1E3A8A 61.06%, #3B82F6 100%))',
												}}
											>
												{option.icon}
											</div>
											<div className="flex-1">
												<p className="font-semibold text-secondary-foreground text-base mb-1">
													{option.label}
												</p>
												<p className="text-muted-foreground text-sm">
													{option.description}
												</p>
											</div>
										</div>
										<div>
											<div
												className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
													triggerConfig.trigger_type ===
													option.type
														? 'border-primary bg-primary'
														: 'border-gray-300'
												}`}
											>
												{triggerConfig.trigger_type ===
													option.type && (
													<div className="w-2 h-2 bg-white rounded-full" />
												)}
											</div>
										</div>
									</div>
								))}
							</div>
						</div>

						{/* Event-Based Configuration */}
						{triggerConfig.trigger_type === 'event' && (
							<div className="grid gap-4 p-4 border rounded-xl bg-gray-50/50 mt-4">
								<Label className="text-[#09090B] font-semibold text-sm">
									{__('Event Configuration', 'doublescale')}
								</Label>

								<div className="grid gap-3">
									<div className="grid gap-1.5">
										<Label className="text-sm text-muted-foreground">
											{__('Trigger Event', 'doublescale')}
										</Label>
										<Select
											value={
												triggerConfig.event?.event_type ||
												'post_published'
											}
											onValueChange={(value) =>
												updateEvent({
													event_type:
														value as EventTrigger['event_type'],
												})
											}
										>
											<SelectTrigger className="h-11 bg-white">
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="post_published">
													{__('Post Published', 'doublescale')}
												</SelectItem>
											</SelectContent>
										</Select>
									</div>

									{(triggerConfig.event?.event_type ===
										'post_published') && (
										<div className="grid gap-1.5">
											<Label className="text-sm text-muted-foreground">
												{__('Post Type', 'doublescale')}
											</Label>
											<Select
												value={
													triggerConfig.event?.post_type ||
													'post'
												}
												onValueChange={(value) => {
													updateEvent({ post_type: value, categories: [] });
													setSelectedCategories([]);
												}}
											>
												<SelectTrigger className="h-11 bg-white">
													<SelectValue />
												</SelectTrigger>
												<SelectContent>
													<SelectItem value="post">
														{__('Post', 'doublescale')}
													</SelectItem>
													<SelectItem value="page">
														{__('Page', 'doublescale')}
													</SelectItem>
													<SelectItem value="product">
														{__(
															'Product (WooCommerce)',
															'doublescale'
														)}
													</SelectItem>
												</SelectContent>
											</Select>
										</div>
									)}

									{triggerConfig.event?.event_type === 'post_published' &&
										triggerConfig.event?.post_type &&
										triggerConfig.event.post_type !== 'page' && (
										<div className="grid gap-1.5">
											<Label className="text-sm text-muted-foreground">
												{__('Categories', 'doublescale')}
											</Label>
											<MultiSelect
												options={categoryOptions}
												selected={selectedCategories}
												onChange={handleCategoriesChange}
												placeholder={__('All Categories', 'doublescale')}
												isLoading={isCategoriesLoading}
												searchPlaceholder={__('Search categories...', 'doublescale')}
												onSearchChange={() => {}}
											/>
											<p className="text-xs text-muted-foreground">
												{__('Leave empty to trigger for all categories.', 'doublescale')}
											</p>
										</div>
									)}
								</div>
							</div>
						)}

						{/* Schedule-Based Configuration */}
						{triggerConfig.trigger_type === 'schedule' && (
							<div className="grid gap-4 p-4 border rounded-xl bg-gray-50/50 mt-4">
								<Label className="text-[#09090B] font-semibold text-sm">
									{__('Schedule Configuration', 'doublescale')}
								</Label>

								<div className="grid gap-3">
									<div className="grid gap-1.5">
										<Label className="text-sm text-muted-foreground">
											{__('Frequency', 'doublescale')}
										</Label>
										<Select
											value={
												triggerConfig.schedule?.frequency ||
												'daily'
											}
											onValueChange={(value) =>
												updateSchedule({
													frequency:
														value as ScheduleFrequency,
												})
											}
										>
											<SelectTrigger className="h-11 bg-white">
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												{frequencyOptions.map((opt) => (
													<SelectItem
														key={opt.value}
														value={opt.value}
													>
														{opt.label}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</div>

									<div className="grid gap-1.5">
										<Label className="text-sm text-muted-foreground">
											{__('Time of Day', 'doublescale')}
										</Label>
										<Select
											value={
												triggerConfig.schedule?.time || '09:00'
											}
											onValueChange={(value) =>
												updateSchedule({
													time: value,
												})
											}
										>
											<SelectTrigger className="h-11 bg-white">
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												{timeOfDayOptions.map((opt) => (
													<SelectItem
														key={opt.value}
														value={opt.value}
													>
														{opt.label}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</div>

									{triggerConfig.schedule?.frequency ===
										'weekly' && (
										<div className="grid gap-1.5">
											<Label className="text-sm text-muted-foreground">
												{__('Day of Week', 'doublescale')}
											</Label>
											<Select
												value={
													triggerConfig.schedule
														?.day_of_week || 'monday'
												}
												onValueChange={(value) =>
													updateSchedule({
														day_of_week:
															value as ScheduleDay,
													})
												}
											>
												<SelectTrigger className="h-11 bg-white">
													<SelectValue />
												</SelectTrigger>
												<SelectContent>
													{dayOptions.map((opt) => (
														<SelectItem
															key={opt.value}
															value={opt.value}
														>
															{opt.label}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
										</div>
									)}

									{triggerConfig.schedule?.frequency ===
										'monthly' && (
										<div className="grid gap-1.5">
											<Label className="text-sm text-muted-foreground">
												{__('Day of Month', 'doublescale')}
											</Label>
											<Select
												value={String(
													triggerConfig.schedule
														?.day_of_month || 1
												)}
												onValueChange={(value) =>
													updateSchedule({
														day_of_month: parseInt(
															value,
															10
														),
													})
												}
											>
												<SelectTrigger className="h-11 bg-white">
													<SelectValue />
												</SelectTrigger>
											<SelectContent>
												{Array.from(
													{ length: 31 },
													(_, i) => i + 1
												).map((day) => (
													<SelectItem
														key={day}
														value={String(day)}
													>
														{`Day-${day}`}
													</SelectItem>
												))}
											</SelectContent>
											</Select>
										</div>
									)}

								</div>
							</div>
						)}
					</PanelSettings>
				</div>
			</PanelLayout>
		</div>
	);
};

export default TriggerStep;
