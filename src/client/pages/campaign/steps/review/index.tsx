/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useDispatch } from '@wordpress/data';
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import './style.scss';
import { useCampaignStep, StepLayout } from '../shared';
import { PanelSettings, CategoryIcon, FormField } from '@quillcrm/components';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { isEmpty } from 'lodash';

const Review: React.FC = () => {
	const { campaign, saveCampaignStep, saveCampaignSettings, goToStep } =
		useCampaignStep();
	const { createNotice } = useDispatch('quillcrm/core');
	const [runType, setRunType] = useState<string>(
		campaign && campaign.status !== 'draft' ? campaign.status : 'processing'
	);
	const [executeAt, setExecuteAt] = useState<string>(
		campaign?.execute_at || new Date().toISOString()
	);

	const save = async () => {
		if (!campaign) {
			return;
		}

		if (!runType) {
			createNotice({
				type: 'error',
				message: __('Please select a run type', 'quillcrm'),
			});
			return;
		}

		if (runType === 'schedule' && isEmpty(executeAt)) {
			createNotice({
				type: 'error',
				message: __('Please select a schedule date', 'quillcrm'),
			});
			return;
		}

		try {
			// Save review step data
			const reviewStepData = {
				run_type: runType,
				execute_at: runType === 'schedule' ? executeAt : null,
			};

			// Save the final step data
			const saveSuccess = await saveCampaignStep(
				'review',
				reviewStepData
			);

			if (saveSuccess) {
				// Update campaign status using shared helper
				const data: any = {
					status: runType,
				};

				if (runType === 'schedule') {
					data.execute_at = executeAt;
				}

				await saveCampaignSettings(data);

				goToStep('overview');
			}
		} catch (error) {
			console.error(error);
			createNotice({
				type: 'error',
				message: __(
					'Failed to save campaign. Please try again.',
					'quillcrm'
				),
			});
		}
	};

	return (
		<StepLayout
			breadcrumbItems={[
				{
					label: __('Create Campaign', 'quillcrm'),
					href: 'campaigns',
				},
				{
					label: __('Review & Schedule', 'quillcrm'),
				},
			]}
			totalSteps={1}
			currentStep={0}
			onNext={save}
			onBack={async () => {
				// Save current review data before going back
				const reviewStepData = {
					run_type: runType,
					execute_at: runType === 'schedule' ? executeAt : null,
				};
				await saveCampaignStep('review', reviewStepData);
				goToStep('contacts');
			}}
		>
			<div className="w-full max-w-2xl">
				<PanelSettings
					title={__('Review & Schedule', 'quillcrm')}
					description={__(
						'Review your campaign settings and choose when to send it.',
						'quillcrm'
					)}
					icon={<CategoryIcon />}
				>
					<div className="space-y-6">
						<FormField
							label={__('Select Run Type', 'quillcrm')}
							required={true}
						>
							<RadioGroup
								value={runType}
								onValueChange={setRunType}
								className="flex gap-4"
							>
								<Label
									htmlFor="now"
									className={`flex items-center space-x-4 w-1/2 border rounded-lg py-3 px-4 cursor-pointer ${
										runType === 'processing'
											? 'border-blue-500 bg-blue-50'
											: 'border-gray-300'
									}`}
								>
									<RadioGroupItem
										value="processing"
										id="now"
									/>
									<span>{__('Send Now', 'quillcrm')}</span>
								</Label>
								<Label
									htmlFor="schedule"
									className={`flex items-center space-x-4 w-1/2 border rounded-lg py-3 px-4 cursor-pointer ${
										runType === 'schedule'
											? 'border-blue-500 bg-blue-50'
											: 'border-gray-300'
									}`}
								>
									<RadioGroupItem
										value="schedule"
										id="schedule"
									/>
									<span>{__('Schedule', 'quillcrm')}</span>
								</Label>
							</RadioGroup>
						</FormField>

						{runType === 'schedule' && (
							<FormField
								label={__('Schedule Date & Time', 'quillcrm')}
								required={true}
							>
								<Input
									type="datetime-local"
									value={
										executeAt
											? new Date(executeAt)
													.toISOString()
													.slice(0, 16)
											: ''
									}
									onChange={(e) => {
										if (e.target.value) {
											setExecuteAt(
												new Date(
													e.target.value
												).toISOString()
											);
										}
									}}
									className="w-full"
								/>
								<p className="text-sm text-muted-foreground mt-2">
									{__(
										'Select the date and time when you want to send this campaign.',
										'quillcrm'
									)}
								</p>
							</FormField>
						)}

						<div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
							<p className="text-sm text-blue-800">
								<strong>{__('Note:', 'quillcrm')}</strong>{' '}
								{runType === 'processing'
									? __(
											'The campaign will be sent immediately after you click Save.',
											'quillcrm'
										)
									: __(
											'The campaign will be sent at the scheduled time.',
											'quillcrm'
										)}
							</p>
						</div>
					</div>
				</PanelSettings>
			</div>
		</StepLayout>
	);
};

export default Review;
