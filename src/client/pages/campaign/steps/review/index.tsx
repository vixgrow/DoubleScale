/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useDispatch } from '@wordpress/data';
import { useState } from '@wordpress/element';

/**
 * External dependencies
 */
import { Button, DatePicker, Card, Radio, Typography } from 'antd';
import en from 'antd/es/date-picker/locale/en_US';
import dayjs from 'dayjs';
import type { RadioChangeEvent } from 'antd';

/**
 * Internal dependencies
 */
import './style.scss';
import { useCampaignContext } from '../../state/context';
import { useNavigate, getToLink } from '@quillcrm/navigation';
import { isEmpty, isString } from 'lodash';

const Review: React.FC = () => {
	const { campaign, isLoading, saveCampaign, isSaving } =
		useCampaignContext();
	const navigate = useNavigate();
	const { createNotice } = useDispatch('quillcrm/core');
	const [runType, setRunType] = useState<string>(campaign && campaign.status !== 'draft' ? campaign.status : 'processing');
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

		const data = {
			status: runType,
		};

		if (runType === 'schedule') {
			data['execute_at'] = executeAt;
		}

		try {
			await saveCampaign(data);
			navigate(getToLink(`campaigns/${campaign.id}/overview`));
		} catch (error) {
			console.error(error);
		}
	};

	return (
		<Card loading={isLoading}>
			{campaign && (
				<>
					<div className="qcrm-review-campaign qcrm-fields">
						<div className="qcrm-review-select-run-type qcrm-field">
							<div className="qcrm-field-label">
								<Typography.Text>
									{__('Select Run Type', 'quillcrm')}
								</Typography.Text>
							</div>
							<div className="qcrm-field-input">
								<Radio.Group
									value={runType}
									onChange={(e: RadioChangeEvent) => {
										setRunType(e.target.value);
									}}
									optionType="button"
									buttonStyle="solid"
								>
									<Radio value="processing">
										{__('Now', 'quillcrm')}
									</Radio>
									<Radio value="schedule">
										{__('Schedule', 'quillcrm')}
									</Radio>
								</Radio.Group>
							</div>
						</div>
						{runType === 'schedule' && (
							<div className="qcrm-review-schedule-date qcrm-field">
								<div className="qcrm-field-label">
									<Typography.Text>
										{__('Schedule Date', 'quillcrm')}
									</Typography.Text>
								</div>
								<div className="qcrm-field-input">
									<DatePicker
										locale={en}
										format="YYYY-MM-DD HH:mm:ss"
										showTime
										showSecond={false}
										value={dayjs(executeAt)}
										// @ts-ignore
										onChange={(date, dateString) => {
											if (!isString(dateString)) {
												return;
											}
											setExecuteAt(dateString);
										}}
									/>
								</div>
							</div>
						)}
					</div>
					<div className="qcrm-review-actions">
						<Button
							type="default"
							onClick={() =>
								navigate(
									getToLink(
										`campaigns/${campaign.id}/contacts`
									)
								)
							}
						>
							{__('Back', 'quillcrm')}
						</Button>
						<Button
							type="primary"
							loading={isSaving}
							onClick={save}
							disabled={
								!runType ||
								(runType === 'schedule' && isEmpty(executeAt))
							}
						>
							{__('Save', 'quillcrm')}
						</Button>
					</div>
				</>
			)}
		</Card>
	);
};

export default Review;
