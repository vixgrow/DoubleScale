/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	useState,
	useLayoutEffect,
	useRef,
	useEffect,
} from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';
import { useSelect } from '@wordpress/data';

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
import {
	CustomDialogHeader,
	GradientConditionIcon,
	PlusIcon,
} from '@quillcrm/components';
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
	// Get form context and current trigger from store
	const formContext = useSelect((select: any) => {
		return select('quillcrm/core').getFormContext();
	}, []);

	const currentTrigger = useSelect((select: any) => {
		return select('quillcrm/core').getCurrentTrigger();
	}, []);

	const [rulesGroups, setRulesGroups] = useState(
		ConfigAPI.getAutomationRules()
	);

	// Filter rules groups by current trigger
	const filterRulesByTrigger = (groups: any) => {
		if (!currentTrigger) return groups;

		const filteredGroups: any = {};
		Object.keys(groups).forEach((groupKey) => {
			const group = groups[groupKey];
			// Include group if it has no triggers property (available for all)
			// or if the triggers array includes the current trigger
			if (!group.triggers || group.triggers.includes(currentTrigger)) {
				filteredGroups[groupKey] = group;
			}
		});

		return filteredGroups;
	};

	// Get filtered rules groups based on current trigger
	const filteredRulesGroups = filterRulesByTrigger(rulesGroups);

	const firstGroup = Object.keys(filteredRulesGroups)[0];
	const firstRule = firstGroup
		? Object.keys(filteredRulesGroups[firstGroup].rules)[0]
		: '';
	const getInitialRule = () => ({
		rule: firstRule,
		operator: 'is',
		value: '',
		selectedGroup: firstGroup,
	});
	const stepRules = step.settings || [[getInitialRule()]];
	const [rules, setRules] = useState<
		Array<
			Array<{
				rule: string;
				operator: string;
				value: string;
				selectedGroup: string;
			}>
		>
	>(stepRules);
	const [isSaving, setIsSaving] = useState(false);
	const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
	const [orBracketStyle, setOrBracketStyle] = useState<{
		top: number;
		height: number;
	}>({ top: 0, height: 0 });
	const containerRef = useRef<HTMLDivElement | null>(null);

	// Fetch dynamic rules when form_context is available
	useEffect(() => {
		const fetchDynamicRules = async () => {
			if (formContext && formContext.formId && formContext.triggerId) {
				try {
					const response = (await apiFetch({
						path: addQueryArgs('/qc/v1/automations/rules', {
							form_id: formContext.formId,
							trigger_id: formContext.triggerId,
						}),
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

	useLayoutEffect(() => {
		const updateBracket = () => {
			if (
				rules.length <= 1 ||
				!containerRef.current ||
				!cardRefs.current[0] ||
				!cardRefs.current[rules.length - 1]
			) {
				return;
			}
			const containerRect = containerRef.current.getBoundingClientRect();
			const firstCard = cardRefs.current[0];
			const lastCard = cardRefs.current[rules.length - 1];
			if (firstCard && lastCard) {
				const firstRect = firstCard.getBoundingClientRect();
				const lastRect = lastCard.getBoundingClientRect();
				const firstMid =
					firstRect.top - containerRect.top + firstRect.height / 2;
				const lastMid =
					lastRect.top - containerRect.top + lastRect.height / 2;
				const height = lastMid - firstMid;
				setOrBracketStyle({ top: firstMid, height });
			}
		};
		updateBracket();
		window.addEventListener('resize', updateBracket);
		return () => window.removeEventListener('resize', updateBracket);
	}, [rules]);

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
					<div
						ref={containerRef}
						className="flex flex-col gap-4 relative"
					>
						{rules.length > 1 && orBracketStyle.height > 0 && (
							<div
								className="absolute left-4"
								style={{
									top: `${orBracketStyle.top}px`,
									height: `${orBracketStyle.height}px`,
								}}
							>
								<div className="h-full w-12 border-2 border-[#3B82F6] border-r-0 rounded-l-2xl"></div>
								<span className="absolute -left-6 top-1/2 -translate-y-1/2 text-base font-bold text-white bg-gradient-to-r from-[#1E3A8A] to-[#3B82F6] px-3 py-1 rounded-full">
									{__('OR', 'quillcrm')}
								</span>
							</div>
						)}
						{map(rules, (ruleGroup, groupIndex) => (
							<div
								key={groupIndex}
								ref={(el) =>
									(cardRefs.current[groupIndex] = el)
								}
							>
								<RuleGroupCard
									ruleGroup={ruleGroup}
									groupIndex={groupIndex}
									rulesGroups={filteredRulesGroups}
									rules={rules}
									onRulesChange={setRules}
								/>
							</div>
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
						{isSaving
							? __('Adding...', 'quillcrm')
							: __('Add condition', 'quillcrm')}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};

export default ConditionsModal;
