/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

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

const Review: React.FC = () => {
	const { campaign, updateCampaign, isLoading, saveCampaign, isSaving } =
		useCampaignContext();
	const navigate = useNavigate();

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
									value={campaign.status}
									onChange={(e: RadioChangeEvent) => {
										updateCampaign({
											status: e.target.value,
										});
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
						{campaign.status === 'schedule' && (
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
										value={dayjs(campaign.execute_at)}
										// @ts-ignore
										onChange={(date, dateString) => {
											updateCampaign({
												execute_at: dateString,
											});
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
							onClick={saveCampaign}
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
