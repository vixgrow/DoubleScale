/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useLayoutEffect, useRef, useState } from '@wordpress/element';

/**
 * External dependencies
 */
import { map } from 'lodash';
import { AlertTriangle } from 'lucide-react';

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
	const [bracketStyle, setBracketStyle] = useState<{
		top: number;
		height: number;
	}>({ top: 0, height: 0 });

	useLayoutEffect(() => {
		const update = () => {
			if (
				!wrapperRef.current ||
				!firstRowRef.current ||
				!lastRowRef.current
			)
				return;
			const containerRect = wrapperRef.current.getBoundingClientRect();
			const firstRect = firstRowRef.current.getBoundingClientRect();
			const lastRect = lastRowRef.current.getBoundingClientRect();
			const firstMid =
				firstRect.top - containerRect.top + firstRect.height / 2;
			const lastMid =
				lastRect.top - containerRect.top + lastRect.height / 2;
			setBracketStyle({
				top: firstMid,
				height: Math.max(0, lastMid - firstMid),
			});
		};
		update();
		window.addEventListener('resize', update);
		return () => window.removeEventListener('resize', update);
	}, [ruleGroup.length]);

	return (
		<Card
			className={`shadow-none ${rules.length > 1 ? 'ml-16' : 'w-full'}`}
		>
			<CardContent className="pt-6">
				<div ref={wrapperRef} className="relative">
					{ruleGroup.length > 1 && (
						<div
							className="absolute"
							style={{
								left: 8,
								top: bracketStyle.top,
								height: bracketStyle.height,
							}}
						>
							<div className="h-full w-12 border-2 border-[#3B82F6] border-r-0 rounded-l-2xl"></div>
							<span className="absolute -left-7 top-1/2 -translate-y-1/2 text-base font-bold text-white bg-gradient-to-r from-[#1E3A8A] to-[#3B82F6] px-3 py-1 rounded-full">
								{__('And', 'quillcrm')}
							</span>
						</div>
					)}
					<div
						ref={containerRef}
						className={`flex flex-col gap-6 ${ruleGroup.length > 1 ? 'pl-14' : ''}`}
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
								className="flex items-center gap-3 w-full border rounded-xl p-3"
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
									<SelectTrigger className="w-[150px] h-12 border-[#D3D4D6] rounded-lg">
										<SelectValue
											placeholder={__(
												'Select a group',
												'quillcrm'
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
										<SelectTrigger className="w-[200px] h-12 border-[#D3D4D6] rounded-lg">
											<SelectValue
												placeholder={__(
													'Select a rule',
													'quillcrm'
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
														'quillcrm'
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
												'quillcrm'
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
						className="text-[#414141] bg-[#CECECE] border border-[#D3D3D3] rounded-md p-0 px-2 shadow-none hover:bg-transparent font-semibold"
					>
						<PlusIcon />
						{__('Add another condition (And)', 'quillcrm')}
					</Button>
				</div>
			</CardContent>
		</Card>
	);
};

export default RuleGroupCard;
