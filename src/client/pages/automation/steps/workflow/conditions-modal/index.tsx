/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState, useEffect } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';
import { useSelect } from '@wordpress/data';

/**
 * External dependencies
 */

/**
 * Internal dependencies
 */
import './style.scss';
import type { AutomationStep } from '@doublescale/client';
import ConfigAPI from '@doublescale/config';
import {
	buildConditionSettings,
	getConditionCustomLabel,
	getConditionRuleGroups,
} from '@doublescale/utils';
import { AlertTriangleIcon, ConditionAutomationIcon, CustomDialogHeader } from '@doublescale/components';
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import {
	automationDialogBodyClassName,
	automationDialogConditionsInlineSize,
	automationDialogSurfaceConditions,
	automationModalOverlayClassName,
} from '../automation-dialog-presets';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import RulesBuilder from '@/components/rules-builder';
import { useAutomationContext } from '../../../state/context';

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
	// Get automation context
	const { automation } = useAutomationContext();

	// Get form context and current trigger from store
	const formContext = useSelect((select: any) => {
		return select('doublescale/core').getFormContext();
	}, []);

	const currentTrigger = useSelect((select: any) => {
		return select('doublescale/core').getCurrentTrigger();
	}, []);

	// Check for condition warning
	const conditionWarning = automation?._warnings?.find(
		(warning) => warning.type === 'condition' && warning.step_id === step.id
	);

	const hasConditionWarning = step._condition_warning === true;
	const unavailableRulesCount = step._unavailable_rules_count || 0;
	const unavailableRules = step._unavailable_rules || [];

	const [rulesGroups, setRulesGroups] = useState(
		ConfigAPI.getAutomationRules()
	);

	// Filter rules groups by current trigger, disabled status, and automation context
	const filterRulesByTrigger = (groups: any) => {
		if (!currentTrigger) return groups;
		if (!groups || typeof groups !== 'object') return {};

		const filteredGroups: any = {};
		Object.keys(groups).forEach((groupKey) => {
			const group = groups[groupKey];
			// Skip if group is not valid
			if (!group || typeof group !== 'object') {
				return;
			}
			// Filter out disabled groups
			if (group.is_disabled) {
				return;
			}
			// Skip groups without rules
			if (!group.rules || typeof group.rules !== 'object') {
				return;
			}
			// Include group if it has no triggers property (available for all)
			// or if the triggers array includes the current trigger
			if (!group.triggers || group.triggers.includes(currentTrigger)) {
				// Filter rules within the group based on required_triggers and is_automation
				const filteredRules: any = {};
				Object.keys(group.rules).forEach((ruleKey) => {
					const rule = group.rules[ruleKey];
					if (!rule || typeof rule !== 'object') {
						return;
					}

					// If rule has no required_triggers, include it
					if (
						!rule.required_triggers ||
						rule.required_triggers.length === 0
					) {
						filteredRules[ruleKey] = rule;
					}
					// If rule has required_triggers and current trigger is in it, include it
					else if (rule.required_triggers.includes(currentTrigger)) {
						filteredRules[ruleKey] = rule;
					}
				});

				// Only add group if it has at least one rule after filtering
				if (Object.keys(filteredRules).length > 0) {
					filteredGroups[groupKey] = {
						...group,
						// Ensure group has a name, fallback to key
						name: group.name || groupKey,
						key: group.key || groupKey,
						rules: filteredRules,
					};
				}
			}
		});

		return filteredGroups;
	};

	// Get filtered rules groups based on current trigger
	const filteredRulesGroups = filterRulesByTrigger(rulesGroups);

	const getInitialRule = () => {
		const firstGroup = Object.keys(filteredRulesGroups)[0];
		const firstRule = firstGroup
			? Object.keys(filteredRulesGroups[firstGroup].rules)[0]
			: '';
		return {
			rule: firstRule,
			operator: 'is',
			value: '',
			selectedGroup: firstGroup,
		};
	};

	const [rules, setRules] = useState<
		Array<
			Array<{
				rule: string;
				operator: string;
				value: string;
				selectedGroup: string;
			}>
		>
	>(() => {
		const stepRules = getConditionRuleGroups(step.settings);
		return stepRules.length > 0 ? stepRules : [[getInitialRule()]];
	});
	const [isSaving, setIsSaving] = useState(false);

	// Sync rules state with step.settings when modal opens
	useEffect(() => {
		if (visible) {
			const stepRules = getConditionRuleGroups(step.settings);
			setRules(stepRules.length > 0 ? stepRules : [[getInitialRule()]]);
			// Reset handled in RulesBuilder
		}
	}, [visible, step.settings]);

	// Fetch dynamic rules when form_context is available
	useEffect(() => {
		const fetchDynamicRules = async () => {
			if (formContext && formContext.formId && formContext.triggerId) {
				try {
					const params: any = {
						form_id: formContext.formId,
						trigger_id: formContext.triggerId,
					};

					// Add post_id for Elementor forms
					if (formContext.postId) {
						params.post_id = formContext.postId;
					}

					const response = (await apiFetch({
						path: addQueryArgs('/doublescale/v1/automations/rules', params),
						method: 'GET',
					})) as any;

					if (response) {
						setRulesGroups(response);
						ConfigAPI.setAutomationRules(response);
					}
				} catch (error) {
					console.error('Failed to fetch dynamic rules:', error);
				}
			}
		};

		if (visible) {
			fetchDynamicRules();
		}
	}, [formContext, visible]);

	// Repair rows whose saved entity/rule disappeared after filters reload or trigger change (e.g. Deal ↔ Contact).
	useEffect(() => {
		if (!visible || Object.keys(rulesGroups).length === 0) {
			return;
		}
		const filtered = filterRulesByTrigger(rulesGroups);
		const keys = Object.keys(filtered);
		if (keys.length === 0) {
			return;
		}
		const firstGroupKey = keys[0];
		const firstRuleKey = firstGroupKey
			? Object.keys(filtered[firstGroupKey].rules)[0] || ''
			: '';

		setRules((prev) => {
			let changed = false;
			const next = prev.map((group) =>
				group.map((r) => {
					if (!filtered[r.selectedGroup]) {
						changed = true;
						return {
							...r,
							selectedGroup: firstGroupKey,
							rule: firstRuleKey,
							operator: 'is',
							value: '',
						};
					}
					const gRules = filtered[r.selectedGroup].rules;
					if (!gRules[r.rule]) {
						changed = true;
						const nk = Object.keys(gRules)[0] || '';
						return {
							...r,
							rule: nk,
							operator: 'is',
							value: '',
						};
					}
					return r;
				})
			);
			return changed ? next : prev;
		});
	}, [visible, rulesGroups, currentTrigger]);

	const save = async (data: Partial<AutomationStep>) => {
		setIsSaving(true);
		try {
			await onSave(data);
			onClose();
		} catch (error) {
			console.error(error);
		} finally {
			setIsSaving(false);
		}
	};

	return (
		<Dialog open={visible} onOpenChange={(open) => !open && onClose()}>
			<DialogContent
				style={automationDialogConditionsInlineSize}
				className={cn(
					automationDialogSurfaceConditions,
					'z-[150460]'
				)}
				overlayClassName={cn(
					automationModalOverlayClassName,
					'z-[150459]'
				)}
			>
				<DialogHeader className="shrink-0 space-y-0  bg-white p-6 text-left">
					<div className="flex items-start gap-1">
						<CustomDialogHeader
							title={__('Create a Condition', 'doublescale')}
							subtitle={__(
								'Add up to 5 conditions. Define whether any or all of them must be applicable, for the condition to be met.',
								'doublescale'
							)}
							icon={<ConditionAutomationIcon />}
						/>
					</div>
				</DialogHeader>

				<div
					className={cn(
						automationDialogBodyClassName,
						'bg-white'
					)}
				>
					{/* Show warning if condition has plugin dependency issues */}
					{(hasConditionWarning || conditionWarning) &&
						unavailableRulesCount > 0 && (
							<Alert
								variant="destructive"
								className="mb-5 border-orange-500/80 bg-orange-50/90"
							>
								<AlertTriangleIcon width={20} height={20} color="#EA580C" />
								<AlertDescription className="text-sm text-orange-800">
									{conditionWarning?.message}
									{conditionWarning?.plugin_labels &&
										conditionWarning.plugin_labels.length >
										0 && (
											<span className="block mt-1 font-medium">
												{__(
													'Required plugins:',
													'doublescale'
												)}{' '}
												{conditionWarning.plugin_labels.join(
													', '
												)}
											</span>
										)}
									{unavailableRules.length > 0 && (
										<div className="mt-2">
											<p className="font-medium mb-1">
												{__(
													'Unavailable rules:',
													'doublescale'
												)}
											</p>
											<ul className="list-disc list-inside space-y-1">
												{unavailableRules.map(
													(rule: any, index: number) => (
														<li
															key={index}
															className="text-xs"
														>
															{rule.rule_slug} (
															{rule.plugin_label})
														</li>
													)
												)}
											</ul>
										</div>
									)}
								</AlertDescription>
							</Alert>
						)}

					<RulesBuilder
						rules={rules}
						onChange={setRules}
						rulesGroups={filteredRulesGroups}
					/>
				</div>
				<DialogFooter className="shrink-0 gap-2  bg-white p-6 flex-row justify-end">
					<Button
						type="button"
						variant="outline"
						className="rounded-lg border-brandPrimary bg-white text-brandPrimary shadow-none hover:bg-brandPrimary/10 hover:text-brandPrimary"
						disabled={isSaving}
						onClick={onClose}
					>
						{__('Cancel', 'doublescale')}
					</Button>
					<Button
						type="button"
						variant="default"
						className="rounded-lg px-5 shadow-none"
						disabled={isSaving}
						onClick={() =>
							save({
								settings: buildConditionSettings(
									rules,
									getConditionCustomLabel(step.settings)
								),
							})
						}
					>
						{isSaving
							? __('Saving...', 'doublescale')
							: __('Create a Condition', 'doublescale')}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};

export default ConditionsModal;
