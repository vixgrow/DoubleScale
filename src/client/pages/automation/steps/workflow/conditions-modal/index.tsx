/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';

/**
 * External dependencies
 */
import { map, isEmpty } from 'lodash';
import { PlusCircle, ChevronRight, ChevronLeft } from 'lucide-react';

/**
 * Internal dependencies
 */
import './style.scss';
import type { Rules as RulesType, AutomationStep } from '@quillcrm/client';
import { getRuleBySlug } from '@quillcrm/utils';
import ConfigAPI from '@quillcrm/config';
import type { Rule as AutomationRule, RulesGroup } from '@quillcrm/config';
import { ConditionsIcon, CustomDialogHeader, Rule } from '@quillcrm/components';

// ShadcnUI components
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter,
	DialogOverlay,
} from '@/components/ui/dialog';
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

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
		<Dialog open={visible} onOpenChange={(open) => !open && onClose()}>
			<DialogOverlay className="z-[150300]" />
			<DialogContent className="min-w-[1000px] z-[150300]">
				<DialogHeader>
					<CustomDialogHeader
						title={__('Create a condition', 'quillcrm')}
						subtitle={__(
							'Add up to 5 conditions. Define whether any or all of them must be applicable, for the condition to be met.',
							'quillcrm'
						)}
						icon={<ConditionsIcon />}
					/>
				</DialogHeader>
				<div className="text-base text-[#333333] font-bold">
					{__('condition rules', 'quillcrm')}
				</div>
				<div className="py-4">
					{!isEmpty(rules) && (
						<div className="flex flex-col gap-5">
							{map(rules, (ruleGroup, index) => {
								const groupRules = ruleGroup || [];
								return (
									<Card key={index}>
										<CardHeader>
											<div className="flex justify-between items-center">
												<CardTitle>
													{__('Rules', 'quillcrm')}
												</CardTitle>
												<ConditionButton
													rules={rules}
													type="and"
													parentIndex={index}
													onChange={(newRules) => {
														setRules(newRules);
													}}
												>
													<Button variant="default">
														<PlusCircle className="mr-2 h-4 w-4" />
														{__('AND', 'quillcrm')}
													</Button>
												</ConditionButton>
											</div>
										</CardHeader>
										<CardContent>
											<div className="flex flex-col gap-3">
												{map(
													groupRules,
													(rule, ruleIndex) => {
														const ruleData =
															getRuleBySlug(
																rule.rule
															);

														return (
															<Rule
																key={ruleIndex}
																ruleSettings={
																	ruleData
																}
																rule={rule}
																onChange={(
																	key,
																	value
																) => {
																	const newRules =
																		[
																			...rules,
																		];
																	newRules[
																		index
																	][
																		ruleIndex
																	] = {
																		...newRules[
																			index
																		][
																			ruleIndex
																		],
																		[key]: value,
																	};
																	setRules(
																		newRules
																	);
																}}
																onRemove={() => {
																	const newRules =
																		[
																			...rules,
																		];
																	newRules[
																		index
																	].splice(
																		ruleIndex,
																		1
																	);
																	setRules(
																		newRules
																	);
																}}
															/>
														);
													}
												)}
											</div>
										</CardContent>
									</Card>
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
								<Button variant="outline">
									<PlusCircle className="mr-2 h-4 w-4" />
									{__('OR', 'quillcrm')}
								</Button>
							</ConditionButton>
						</div>
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
							<Button>
								<PlusCircle className="mr-2 h-4 w-4" />
								{__('Add Rule', 'quillcrm')}
							</Button>
						</ConditionButton>
					)}
				</div>

				<DialogFooter>
					<Button
						variant="outline"
						onClick={onClose}
						disabled={isSaving}
					>
						{__('Cancel', 'quillcrm')}
					</Button>
					<Button
						onClick={() => save({ settings: rules })}
						disabled={isSaving}
					>
						{__('Save', 'quillcrm')}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
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
	const [isOpen, setIsOpen] = useState(false);
	const rulesGroups = ConfigAPI.getAutomationRules();

	const RulesContent = () => {
		return (
			<div className="w-[250px] p-2">
				{selectedGroup ? (
					<>
						<button
							className="flex items-center gap-2 w-full p-2 hover:bg-gray-100 rounded-md mb-2 border-b"
							onClick={() => setSelectedGroup('')}
						>
							<ChevronLeft className="h-4 w-4" />
							{__('Back', 'quillcrm')}
						</button>
						<div className="space-y-1">
							{map(
								rulesGroups[selectedGroup].rules,
								(rule, key) => (
									<button
										key={key}
										className="w-full text-left p-2 hover:bg-gray-100 rounded-md"
										onClick={() => {
											const newRules = [...rules];
											if (type === 'or') {
												newRules.push([
													{
														rule: key,
														operator: 'is',
														value: '',
													},
												]);
											} else {
												newRules[parentIndex].push({
													rule: key,
													operator: 'is',
													value: '',
												});
											}

											onChange(newRules);
											setIsOpen(false);
										}}
									>
										{rule.name}
									</button>
								)
							)}
						</div>
					</>
				) : (
					<div className="space-y-1">
						{map(rulesGroups, (group, key) => (
							<button
								key={key}
								className="flex justify-between items-center w-full p-2 hover:bg-gray-100 rounded-md"
								onClick={() => setSelectedGroup(key)}
							>
								<span>{group.name}</span>
								<ChevronRight className="h-4 w-4" />
							</button>
						))}
					</div>
				)}
			</div>
		);
	};

	return (
		<Popover open={isOpen} onOpenChange={setIsOpen}>
			<PopoverTrigger asChild>{children}</PopoverTrigger>
			<PopoverContent className="z-[150300] pointer-events-auto">
				<RulesContent />
			</PopoverContent>
		</Popover>
	);
};

export default ConditionsModal;
