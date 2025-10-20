/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';

/**
 * External dependencies
 */
import { map } from 'lodash';

/**
 * Internal dependencies
 */
import './style.scss';
import type { AutomationStep } from '@quillcrm/client';
import ConfigAPI from '@quillcrm/config';
import { CustomDialogHeader, GradientConditionIcon, PlusIcon } from '@quillcrm/components';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogFooter,
	DialogOverlay,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import RuleGroupCard from './rule-group-card';

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
	const rulesGroups = ConfigAPI.getAutomationRules();
	const firstGroup = Object.keys(rulesGroups)[0];
	const firstRule = firstGroup ? Object.keys(rulesGroups[firstGroup].rules)[0] : '';
	const getInitialRule = () => ({
		rule: firstRule,
		operator: 'is',
		value: '',
		selectedGroup: firstGroup
	});
	const stepRules = step.settings || [[getInitialRule()]];
	const [rules, setRules] = useState<Array<Array<{
		rule: string;
		operator: string;
		value: string;
		selectedGroup: string;
	}>>>(stepRules);
	const [isSaving, setIsSaving] = useState(false);

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
			<DialogOverlay className="z-[150300]" />
			<DialogContent className="max-w-[1000px] max-h-[90vh] z-[150300] overflow-y-auto">
				<DialogHeader>
					<CustomDialogHeader
						title={__('Create a condition', 'quillcrm')}
						subtitle={__(
							'Add up to 5 conditions. Define whether any or all of them must be applicable, for the condition to be met.',
							'quillcrm'
						)}
						icon={<GradientConditionIcon />}
					/>
				</DialogHeader>
				<div className="py-4">
					<div className="flex flex-col gap-4">
						{map(rules, (ruleGroup, groupIndex) => (
							<>
								<RuleGroupCard
									key={groupIndex}
									ruleGroup={ruleGroup}
									groupIndex={groupIndex}
									rulesGroups={rulesGroups}
									rules={rules}
									onRulesChange={setRules}
								/>
								{groupIndex < rules.length - 1 && (
									<div className="flex justify-center items-center gap-4">
										<div className="flex-1 h-[2px] bg-gradient-to-r from-[#1E3A8A] to-[#3B82F6]"></div>
										<span className="text-base font-bold text-white bg-gradient-to-r from-[#1E3A8A] to-[#3B82F6] px-3 py-1 rounded-full">
											{__('OR', 'quillcrm')}
										</span>
										<div className="flex-1 h-[2px] bg-gradient-to-l from-[#1E3A8A] to-[#3B82F6]"></div>
									</div>
								)}
							</>
						))}
						<div className="flex justify-start items-start">
							<Button
								onClick={() => {
									const newRules = [...rules];
									newRules.push([getInitialRule()]);
									setRules(newRules);
								}}
								className="text-[#414141] bg-[#CECECE] border border-[#D3D3D3] rounded-md p-0 px-2 shadow-none hover:bg-transparent font-semibold"
							>
								<PlusIcon />
								{__('Add another condition (Or)', 'quillcrm')}
							</Button>
						</div>
					</div>
				</div>
				<DialogFooter>
					<Button
						onClick={() => save({ settings: rules })}
						disabled={isSaving}
						size="xl"
						className="w-full"
						variant="gradient"
					>
						{isSaving ? __('Adding...', 'quillcrm') : __('Add condition', 'quillcrm')}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};

export default ConditionsModal;