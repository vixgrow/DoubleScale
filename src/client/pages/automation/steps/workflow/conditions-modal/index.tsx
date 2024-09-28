/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';

/**
 * External dependencies
 */
import { Button, Card, Popover, List, Modal, Flex } from 'antd';
import {
	PlusCircleOutlined,
	RightOutlined,
	LeftOutlined,
} from '@ant-design/icons';
import { map, isEmpty } from 'lodash';

/**
 * Internal dependencies
 */
import './style.scss';
import type { Rules as RulesType, AutomationStep } from '@quillcrm/client';
import { getRuleBySlug } from '@quillcrm/utils';
import ConfigAPI from '@quillcrm/config';
import type { Rule as AutomationRule, RulesGroup } from '@quillcrm/config';
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
												rule.rule
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
}

const ConditionButton: React.FC<ConditionButtonProps> = ({
	rules,
	type,
	parentIndex,
	onChange,
	children,
}) => {
	const [selectedGroup, setSelectedGroup] = useState<string>('');
	const [isModalVisible, setIsModalVisible] = useState(false);
	const rulesGroups = ConfigAPI.getAutomationRules();

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
								rulesGroups[selectedGroup].rules,
								(rule, key) => {
									return {
										key,
										rule,
									};
								}
							)}
							renderItem={(item: {
								key: string;
								rule: AutomationRule;
							}) => (
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
						dataSource={map(rulesGroups, (group, key) => ({
							key,
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
											setSelectedGroup(item.key)
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
			}}
		>
			{children}
		</Popover>
	);
};

export default ConditionsModal;
