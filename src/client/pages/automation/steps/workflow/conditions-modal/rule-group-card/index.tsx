/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * External dependencies
 */
import { map } from 'lodash';

/**
 * Internal dependencies
 */
import { Rule, PlusIcon } from '@quillcrm/components';
import { getRuleBySlug } from '@quillcrm/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';

interface Rule {
	rule: string;
	operator: string;
	value: string;
	selectedGroup: string;
}

interface RuleGroupCardProps {
	ruleGroup: Array<Rule>;
	groupIndex: number;
	rulesGroups: Record<
		string,
		{
			name: string;
			rules: Record<
				string,
				{
					name: string;
				}
			>;
		}
	>;
	rules: Array<Array<Rule>>;
	onRulesChange: (newRules: Array<Array<Rule>>) => void;
}

const RuleGroupCard: React.FC<RuleGroupCardProps> = ({
	ruleGroup,
	groupIndex,
	rulesGroups,
	rules,
	onRulesChange,
}) => {
	return (
		<Card className="shadow-none">
			<CardContent className="pt-6">
				<div className="flex flex-col gap-6">
					{map(ruleGroup, (rule, ruleIndex) => (
						<div
							key={ruleIndex}
							className="flex items-center gap-4 w-full border rounded-xl p-3"
						>
							<Select
								value={rule.selectedGroup}
								onValueChange={(value) => {
									const newRules = [...rules];
									const firstRuleInGroup =
										Object.keys(
											rulesGroups[value].rules
										)[0] || '';
									newRules[groupIndex][ruleIndex] = {
										...newRules[groupIndex][ruleIndex],
										selectedGroup: value,
										rule: firstRuleInGroup,
									};
									onRulesChange(newRules);
								}}
							>
								<SelectTrigger className="w-[150px] h-12 border-[#D3D4D6] rounded-lg">
									<SelectValue
										placeholder={__(
											'Select a group',
											'quillcrm'
										)}
									/>
								</SelectTrigger>
								<SelectContent>
									{map(rulesGroups, (group, key) => (
										<SelectItem key={key} value={key}>
											{group.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
							{rule.selectedGroup && (
								<Select
									value={rule.rule}
									onValueChange={(value) => {
										const newRules = [...rules];
										newRules[groupIndex][ruleIndex] = {
											...newRules[groupIndex][ruleIndex],
											rule: value,
										};
										onRulesChange(newRules);
									}}
								>
									<SelectTrigger className="w-[200px] h-12 border-[#D3D4D6] rounded-lg">
										<SelectValue
											placeholder={__(
												'Select a rule',
												'quillcrm'
											)}
										/>
									</SelectTrigger>
									<SelectContent className="max-h-[200px] overflow-y-auto">
										{Object.keys(
											rulesGroups[rule.selectedGroup]
												.rules
										).length > 0 ? (
											map(
												rulesGroups[rule.selectedGroup]
													.rules,
												(ruleOption, key) => (
													<SelectItem
														key={key}
														value={key}
													>
														{ruleOption.name}
													</SelectItem>
												)
											)
										) : (
											<div className="relative flex items-center justify-center py-2 pl-2 pr-8 text-sm text-gray-500">
												{__(
													'No options available',
													'quillcrm'
												)}
											</div>
										)}
									</SelectContent>
								</Select>
							)}
							{rule.selectedGroup && rule.rule && (
								<Rule
									ruleSettings={getRuleBySlug(rule.rule)}
									rule={rule}
									onChange={(key, value) => {
										const newRules = [...rules];
										newRules[groupIndex][ruleIndex] = {
											...newRules[groupIndex][ruleIndex],
											[key]: value,
										};
										onRulesChange(newRules);
									}}
									onRemove={
										rules.length === 1 &&
										ruleGroup.length === 1
											? undefined
											: () => {
													const newRules = [...rules];
													const removeRule = {
														singleRuleInGroup: () =>
															newRules.splice(
																groupIndex,
																1
															),
														multipleRulesInGroup:
															() =>
																newRules[
																	groupIndex
																].splice(
																	ruleIndex,
																	1
																),
													};

													removeRule[
														ruleGroup.length === 1
															? 'singleRuleInGroup'
															: 'multipleRulesInGroup'
													]();
													onRulesChange(newRules);
												}
									}
								/>
							)}
						</div>
					))}
					<div className="flex items-center gap-4">
						<Button
							onClick={() => {
								const newRules = [...rules];
								const firstGroup = Object.keys(rulesGroups)[0];
								const firstRule = firstGroup
									? Object.keys(
											rulesGroups[firstGroup].rules
										)[0]
									: '';
								newRules[groupIndex].push({
									rule: firstRule,
									operator: 'is',
									value: '',
									selectedGroup: firstGroup,
								});
								onRulesChange(newRules);
							}}
							className="text-[#414141] bg-[#CECECE] border border-[#D3D3D3] rounded-md p-0 px-2 shadow-none hover:bg-transparent font-semibold"
						>
							<PlusIcon />
							{__('Add another condition (And)', 'quillcrm')}
						</Button>
					</div>
				</div>
			</CardContent>
		</Card>
	);
};

export default RuleGroupCard;
