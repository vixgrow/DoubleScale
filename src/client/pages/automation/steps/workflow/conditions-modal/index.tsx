/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState, useEffect } from '@wordpress/element';
import { useSelect } from '@wordpress/data';

/**
 * External dependencies
 */
import { Button, Card, Popover, List, Modal, Flex } from 'antd';
import {
	LeftOutlined,
	PlusCircleOutlined,
	RightOutlined,
} from '@ant-design/icons';
import { map, isEmpty, filter } from 'lodash';
import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';

/**
 * Internal dependencies
 */
import './style.scss';
import type { Rules as RulesType, AutomationStep } from '@quillcrm/client';
import { getRuleBySlug } from '@quillcrm/utils';
import ConfigAPI from '@quillcrm/config';
import type { RulesGroup, AutomationRules } from '@quillcrm/config';
import { Rule } from '@quillcrm/components';

interface RulesProps {
	step: AutomationStep;
	onSave: (data: Partial<AutomationStep>) => void;
	visible: boolean;
	onClose: () => void;
}

const ConditionsModal: React.FC<RulesProps> = ({
	step,
	onSave,
	visible,
	onClose,
}) => {
	const stepRules = step.settings || ([] as RulesType[]);
	const [rules, setRules] = useState<RulesType[]>(stepRules);
	const [isSaving, setIsSaving] = useState(false);
	const [dynamicRules, setDynamicRules] = useState<AutomationRules | null>(
		null
	);

	// Get form context from store
	const { formContext } = useSelect((select) => ({
		formContext: select('quillcrm/core').getFormContext(),
	}));

	// Load dynamic rules when form context changes or when component mounts
	useEffect(() => {
		loadDynamicRules();
	}, [formContext?.formId, formContext?.triggerId, visible]);

	const loadDynamicRules = async () => {
		// Only load dynamic rules if we have form context
		if (!formContext?.formId || !formContext?.triggerId) {
			setDynamicRules(null);
			return;
		}

		try {
			const params: any = {
				trigger_id: formContext.triggerId,
				form_id: formContext.formId,
			};

			if (formContext.automationId) {
				params.automation_id = formContext.automationId;
			}

			const apiPath = addQueryArgs('/qc/v1/automations/rules', params);

			const response = (await apiFetch({
				path: apiPath,
			})) as AutomationRules;

			setDynamicRules(response);
		} catch (error) {
			console.error('Error loading dynamic rules:', error);
			// Fallback to static rules on error
			setDynamicRules(null);
		}
	};

	const save = async (data: Partial<AutomationStep>) => {
		setIsSaving(true);
		try {
			await onSave(data);
		} catch (error) {
			console.error(error);
		} finally {
			setIsSaving(false);
		}
	};

	return (
		<Modal
			className="qcrm-rules"
			open={visible}
			onCancel={() => onClose()}
			title={__('Conditions', 'quillcrm')}
			style={{ minWidth: '800px' }}
			onOk={() => {
				save({ settings: rules });
			}}
			confirmLoading={isSaving}
		>
			{!isEmpty(rules) && (
				<Flex vertical gap={20}>
					{map(rules, (ruleGroup, index) => {
						const groupRules = ruleGroup || [];
						return (
							<>
								<Card
									key={index}
									title={__('Rules', 'quillcrm')}
									extra={
										<ConditionButton
											rules={rules}
											type="and"
											parentIndex={index}
											onChange={(newRules) => {
												setRules(newRules);
											}}
											dynamicRules={dynamicRules}
										>
											<Button
												type="primary"
												icon={<PlusCircleOutlined />}
											>
												{__('AND', 'quillcrm')}
											</Button>
										</ConditionButton>
									}
								>
									<Flex gap={10} vertical>
										{map(groupRules, (rule, ruleIndex) => {
											const ruleData = getRuleBySlug(
												rule.rule,
												dynamicRules
											);

											return (
												<Rule
													key={ruleIndex}
													ruleSettings={ruleData}
													rule={rule}
													onChange={(key, value) => {
														const newRules = [
															...rules,
														];
														newRules[index][
															ruleIndex
														] = {
															...newRules[index][
																ruleIndex
															],
															[key]: value,
														};
														setRules(newRules);
													}}
													onRemove={() => {
														const newRules = [
															...rules,
														];
														newRules[index].splice(
															ruleIndex,
															1
														);
														setRules(newRules);
													}}
												/>
											);
										})}
									</Flex>
								</Card>
							</>
						);
					})}
					<ConditionButton
						rules={rules}
						type="or"
						parentIndex={0}
						onChange={(newRules) => {
							setRules(newRules);
						}}
						dynamicRules={dynamicRules}
					>
						<Button icon={<PlusCircleOutlined />}>
							{__('OR', 'quillcrm')}
						</Button>
					</ConditionButton>
				</Flex>
			)}
			{isEmpty(rules) && (
				<ConditionButton
					rules={rules}
					type="or"
					parentIndex={0}
					onChange={(newRules) => {
						setRules(newRules);
					}}
					dynamicRules={dynamicRules}
				>
					<Button type="primary" icon={<PlusCircleOutlined />}>
						{__('Add Rule', 'quillcrm')}
					</Button>
				</ConditionButton>
			)}
		</Modal>
	);
};

// Separate or and and buttons into separate popovers
interface ConditionButtonProps {
	rules: RulesType[];
	type: 'or' | 'and';
	parentIndex: number;
	onChange: (rules: RulesType[]) => void;
	children: React.ReactNode;
	dynamicRules?: AutomationRules | null;
}

const ConditionButton: React.FC<ConditionButtonProps> = ({
	rules,
	type,
	parentIndex,
	onChange,
	children,
	dynamicRules,
}) => {
	const [selectedGroup, setSelectedGroup] = useState<string>('');
	const [isModalVisible, setIsModalVisible] = useState(false);
	const rulesGroups = dynamicRules || ConfigAPI.getAutomationRules();

	// Get current trigger from store
	const { currentTrigger } = useSelect((select) => ({
		currentTrigger: select('quillcrm/core').getCurrentTrigger(),
	}));

	// Filter rules groups by current trigger (same logic as merge tags)
	const filteredRulesGroups = filter(rulesGroups, (group) => {
		return !group.triggers || group.triggers.includes(currentTrigger);
	});

	const PopoverContent = () => {
		return (
			<>
				{selectedGroup ? (
					<>
						<div
							className="qcrm-rule-back"
							onClick={() => setSelectedGroup('')}
							style={{
								cursor: 'pointer',
								padding: '5px 0',
								borderBottom: '1px solid #f0f0f0',
							}}
						>
							<LeftOutlined size={10} />
							{__('Back', 'quillcrm')}
						</div>
						<List
							className="qcrm-rule-groups"
							itemLayout="horizontal"
							dataSource={map(
								rulesGroups[selectedGroup]?.rules || {},
								(rule, key) => {
									return {
										key,
										rule,
									};
								}
							)}
							renderItem={(item: { key: string; rule: any }) => (
								<List.Item
									style={{
										cursor: 'pointer',
										padding: '5px 0',
									}}
								>
									<div
										className="qcrm-rule-item"
										onClick={() => {
											const newRules = [...rules];
											if (type === 'or') {
												newRules.push([
													{
														rule: item.key,
														operator: 'is',
														value: '',
													},
												]);
											} else {
												newRules[parentIndex].push({
													rule: item.key,
													operator: 'is',
													value: '',
												});
											}

											onChange(newRules);
											setSelectedGroup('');
											setIsModalVisible(false);
										}}
									>
										{item.rule.name}
									</div>
								</List.Item>
							)}
						/>
					</>
				) : (
					<List
						dataSource={map(filteredRulesGroups, (group, key) => ({
							key: String(key),
							group,
						}))}
						renderItem={(item: {
							key: string;
							group: RulesGroup;
						}) => (
							<>
								<List.Item
									style={{
										cursor: 'pointer',
										padding: '5px 0',
									}}
								>
									<div
										className="qcrm-rule-item"
										onClick={() =>
											setSelectedGroup(
												item.group.key || item.key
											)
										}
									>
										{item.group.name}
										<RightOutlined />
									</div>
								</List.Item>
							</>
						)}
					/>
				)}
			</>
		);
	};

	return (
		<Popover
			content={PopoverContent()}
			title={__('Select Group', 'quillcrm')}
			trigger="click"
			open={isModalVisible}
			onOpenChange={(visible) => {
				setIsModalVisible(visible);
				if (!visible) {
					setSelectedGroup('');
				}
			}}
		>
			{children}
		</Popover>
	);
};

export default ConditionsModal;
