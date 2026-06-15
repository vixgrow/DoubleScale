/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useRef } from '@wordpress/element';

/**
 * External dependencies
 */
import { map } from 'lodash';
import { AlertTriangle } from 'lucide-react';

/**
 * Internal dependencies
 */
import { Rule, PlusIcon } from '@doublescale/components';
import { getRuleBySlug } from '@doublescale/utils';
import LogicConnector from '@/components/logic-connector';
import { useLogicBracketStyle } from '@/hooks/use-logic-bracket-style';
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
					required_triggers?: string[];
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
	const wrapperRef = useRef<HTMLDivElement | null>(null);
	const containerRef = useRef<HTMLDivElement | null>(null);
	const firstRowRef = useRef<HTMLDivElement | null>(null);
	const lastRowRef = useRef<HTMLDivElement | null>(null);
	const bracketStyle = useLogicBracketStyle(
		ruleGroup.length > 1,
		wrapperRef,
		firstRowRef,
		lastRowRef,
		[ruleGroup.length]
	);

	return (
		<Card
			className={`shadow-none bg-[#F7F8FA] border-border min-w-0 max-w-full overflow-x-auto overflow-y-hidden ${
				rules.length > 1
					? 'ml-[2.2rem] w-[calc(100%-2.2rem)]'
					: 'w-full'
			}`}
		>
			<CardContent className="min-w-0 pt-6">
				<div ref={wrapperRef} className="relative">
					<LogicConnector
						label={__('AND', 'doublescale')}
						style={bracketStyle}
						variant="and"
					/>
					<div
						ref={containerRef}
						className={`flex flex-col gap-6 ${ruleGroup.length > 1 ? 'pl-8' : ''}`}
					>
						{map(ruleGroup, (rule, ruleIndex) => (
							<div
								key={ruleIndex}
								ref={
									ruleIndex === 0
										? firstRowRef
										: ruleIndex === ruleGroup.length - 1
											? lastRowRef
											: undefined
								}
								className="flex w-full min-w-0 gap-3 max-sm:flex-col max-sm:items-stretch sm:flex-row sm:items-center sm:max-lg:w-max sm:max-lg:[&_.doublescale-rule]:w-auto sm:max-lg:[&_.doublescale-rule]:flex-none sm:max-lg:[&_.doublescale-rule-row]:w-auto sm:max-lg:[&_.doublescale-rule-row]:flex-none sm:max-lg:[&_.doublescale-rule-row>div]:flex-none sm:max-lg:[&_.doublescale-rule-row>div]:basis-auto"
							>
								<Select
									value={rule.selectedGroup}
									onValueChange={(value) => {
										const newRules = [...rules];
										// Check if the selected group exists in rulesGroups
										const firstRuleInGroup =
											rulesGroups[value] &&
											rulesGroups[value].rules
												? Object.keys(
														rulesGroups[value].rules
													)[0] || ''
												: '';
										newRules[groupIndex][ruleIndex] = {
											...newRules[groupIndex][ruleIndex],
											selectedGroup: value,
											rule: firstRuleInGroup,
										};
										onRulesChange(newRules);
									}}
								>
									<SelectTrigger className="h-12 w-full rounded-lg border-[#D3D4D6] sm:w-[150px] sm:max-lg:shrink-0">
										<SelectValue
											placeholder={__(
												'Select a group',
												'doublescale'
											)}
										/>
									</SelectTrigger>
									<SelectContent className="max-h-[200px] overflow-y-auto">
										{map(rulesGroups, (group, key) => (
											<SelectItem key={key} value={key}>
												{group.name}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
								{rule.selectedGroup &&
								rulesGroups[rule.selectedGroup] ? (
									<Select
										value={rule.rule}
										onValueChange={(value) => {
											const newRules = [...rules];
											newRules[groupIndex][ruleIndex] = {
												...newRules[groupIndex][
													ruleIndex
												],
												rule: value,
											};
											onRulesChange(newRules);
										}}
									>
										<SelectTrigger className="h-12 w-full rounded-lg border-[#D3D4D6] sm:w-[200px] sm:max-lg:shrink-0">
											<SelectValue
												placeholder={__(
													'Select a rule',
													'doublescale'
												)}
											/>
										</SelectTrigger>
										<SelectContent className="max-h-[200px] overflow-y-auto">
											{rulesGroups[rule.selectedGroup]
												.rules &&
											Object.keys(
												rulesGroups[rule.selectedGroup]
													.rules
											).length > 0 ? (
												map(
													rulesGroups[
														rule.selectedGroup
													].rules,
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
														'doublescale'
													)}
												</div>
											)}
										</SelectContent>
									</Select>
								) : rule.selectedGroup ? (
									<div className="flex items-center gap-2 px-3 py-2 bg-orange-50 border border-orange-200 rounded-lg">
										<AlertTriangle className="h-4 w-4 text-orange-500" />
										<span className="text-sm text-orange-700">
											{__(
												'This rule requires an inactive plugin',
												'doublescale'
											)}
										</span>
									</div>
								) : null}
								{rule.selectedGroup && rule.rule && (
									<Rule
										ruleSettings={getRuleBySlug(rule.rule)}
										rule={rule}
										onChange={(key, value) => {
											const newRules = [...rules];
											newRules[groupIndex][ruleIndex] = {
												...newRules[groupIndex][
													ruleIndex
												],
												[key]: value,
											};
											onRulesChange(newRules);
										}}
										onRemove={
											rules.length === 1 &&
											ruleGroup.length === 1
												? undefined
												: () => {
														const newRules = [
															...rules,
														];
														const removeRule = {
															singleRuleInGroup:
																() =>
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
															ruleGroup.length ===
															1
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
					</div>
				</div>
				<div className="mt-4">
					<Button
						onClick={() => {
							const newRules = [...rules];
							const firstGroup = Object.keys(rulesGroups)[0];
							const firstRule = firstGroup
								? Object.keys(rulesGroups[firstGroup].rules)[0]
								: '';
							newRules[groupIndex].push({
								rule: firstRule,
								operator: 'is',
								value: '',
								selectedGroup: firstGroup,
							});
							onRulesChange(newRules);
						}}
						variant="secondary"
						className=""
					>
						<PlusIcon />
						{__('AND', 'doublescale')}
					</Button>
				</div>
			</CardContent>
		</Card>
	);
};

export default RuleGroupCard;
