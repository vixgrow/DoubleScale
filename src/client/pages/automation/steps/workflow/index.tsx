/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import { useDispatch } from '@wordpress/data';

/**
 * External dependencies
 */
import { Card, Flex, Modal, Tag } from 'antd';
import {
	TrophyOutlined,
	BranchesOutlined,
	DisconnectOutlined,
	RocketOutlined,
	ThunderboltOutlined,
} from '@ant-design/icons';
import { map } from 'lodash';

/**
 * Internal dependencies
 */
import './style.scss';
import { useAutomationContext } from '../../state/context';
import type { AutomationStep } from '@quillcrm/client';
import { Fields } from '@quillcrm/components';
import StepFieldsModal from './step-fields-modal';
import AddStep from './add-step';
import { getAction, getGoal, getTrigger } from '@quillcrm/utils';

const Workflow: React.FC = () => {
	const { automation, steps, isLoading, updateAutomation } =
		useAutomationContext();
	const [currentStep, setCurrentStep] = useState<AutomationStep | null>(null);
	const [visible, setVisible] = useState<boolean>(false);
	const [isSaving, setIsSaving] = useState<boolean>(false);
	const { createNotice } = useDispatch('quillcrm/core');

	const save = async () => {
		if (!automation) {
			return;
		}

		setIsSaving(true);

		try {
			const response = (await apiFetch({
				path: `/qc/v1/automations/${automation.id}`,
				method: 'POST',
				data: automation,
			})) as any;

			updateAutomation(response);
		} catch (error) {
			createNotice({
				type: 'error',
				message: __('Failed to save automation', 'quillcrm'),
			});
		} finally {
			setIsSaving(false);
			setVisible(false);
		}
	};

	const trigger = automation ? getTrigger(automation.trigger) : null;
	const typesOptions = {
		action: {
			label: __('Action', 'quillcrm'),
			icon: <ThunderboltOutlined />,
		},
		condition: {
			label: __('Condition', 'quillcrm'),
			icon: <BranchesOutlined />,
		},
		goal: {
			label: __('Goal', 'quillcrm'),
			icon: <TrophyOutlined />,
		},
		end_automation: {
			label: __('End Automation', 'quillcrm'),
			icon: <DisconnectOutlined />,
		},
	};

	const getStep = (step: AutomationStep) => {
		switch (step.type) {
			case 'goal':
				return getGoal(step.action);
			case 'action':
				return getAction(step.action);
			default:
				return {
					label: '',
					description: '',
					fields: {},
				};
		}
	};

	return (
		<Card loading={isLoading}>
			{automation && (
				<>
					<Flex
						style={{ width: 'auto' }}
						gap={20}
						justify="center"
						align="center"
						vertical={true}
					>
						<Flex
							className="qcrm-automation-workflow"
							vertical={true}
							gap={20}
						>
							<div className="qcrm-automation-workflow__item">
								<Card
									className="qcrm-automation-workflow__card"
									hoverable
									onClick={() =>
										trigger?.fields && setVisible(true)
									}
								>
									<Flex gap={10}>
										<div className="qcrm-automation-workflow__card-icon">
											<RocketOutlined />
										</div>
										<div className="qcrm-automation-workflow__card-title">
											{trigger?.label}
										</div>
									</Flex>
								</Card>
							</div>
							{map(steps, (step, key) => {
								return (
									<div
										key={key}
										className="qcrm-automation-workflow__item"
									>
										<Card
											className="qcrm-automation-workflow__card"
											hoverable
											onClick={() => setCurrentStep(step)}
										>
											<Flex gap={10}>
												<div className="qcrm-automation-workflow__card-icon">
													{
														typesOptions[step.type]
															.icon
													}
												</div>
												<div className="qcrm-automation-workflow__card-title">
													{step.action
														? getStep(step).label
														: typesOptions[
																step.type
															].label}
													{!step.action &&
														step.type !==
															'end_automation' && (
															<Tag
																color="warning"
																style={{
																	display:
																		'block',
																	marginTop:
																		'5px',
																}}
															>
																{__(
																	'Action not set',
																	'quillcrm'
																)}
															</Tag>
														)}
												</div>
											</Flex>
										</Card>
									</div>
								);
							})}
						</Flex>
						<AddStep setStep={setCurrentStep} />
					</Flex>
				</>
			)}
			{currentStep && (
				<StepFieldsModal step={currentStep} setStep={setCurrentStep} />
			)}
			<Modal
				title={__('Trigger', 'quillcrm')}
				open={visible}
				onOk={() => save()}
				onCancel={() => setVisible(false)}
				confirmLoading={isSaving}
				style={{ minWidth: '800px', minHeight: '500px' }}
				closable={false}
			>
				<Fields
					fields={trigger?.fields}
					values={automation?.settings || {}}
					onChange={(value) => {
						updateAutomation({
							...automation,
							settings: value,
						});
					}}
				/>
			</Modal>
		</Card>
	);
};

export default Workflow;
