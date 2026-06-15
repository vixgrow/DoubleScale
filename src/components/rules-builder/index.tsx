/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useRef } from '@wordpress/element';

/**
 * External dependencies
 */
import { map } from 'lodash';

/**
 * Internal dependencies
 */
import { PlusIcon } from '@doublescale/components';
import { Button } from '@/components/ui/button';
import LogicConnector from '@/components/logic-connector';
import { useLogicBracketStyleFromList } from '@/hooks/use-logic-bracket-style';
import RuleGroupCard from '../../client/pages/automation/steps/workflow/conditions-modal/rule-group-card';

export interface RuleItem {
	rule: string;
	operator: string;
	// Value can be string, number, array, or object – we keep it as-is
	value: any;
	selectedGroup: string;
}

export interface RulesGroupsMap {
	[groupKey: string]: {
		name: string;
		rules: Record<string, { name: string }>;
	};
}

interface RulesBuilderProps {
	rules: Array<Array<RuleItem>>;
	onChange: (rules: Array<Array<RuleItem>>) => void;
	rulesGroups: RulesGroupsMap;
	className?: string;
}

const RulesBuilder: React.FC<RulesBuilderProps> = ({
	rules,
	onChange,
	rulesGroups,
	className,
}) => {
	const containerRef = useRef<HTMLDivElement | null>(null);
	const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
	const orBracketStyle = useLogicBracketStyleFromList(
		rules.length > 1,
		containerRef,
		cardRefs,
		rules.length
	);

	const addOrGroup = () => {
		const firstGroup = Object.keys(rulesGroups)[0];
		const firstRule = firstGroup
			? Object.keys(rulesGroups[firstGroup].rules)[0]
			: '';
		const getInitialRule = () => ({
			rule: firstRule,
			operator: 'is',
			value: '',
			selectedGroup: firstGroup,
		});
		onChange([...(rules || []), [getInitialRule()]]);
	};

	return (
		<div className={className}>
			<div
				ref={containerRef}
				className="relative flex min-w-0 w-full flex-col gap-4"
			>
				<LogicConnector
					label={__('OR', 'doublescale')}
					style={orBracketStyle}
					variant="or"
				/>
				{map(rules, (ruleGroup, groupIndex) => (
					<div
						key={groupIndex}
						ref={(el) => (cardRefs.current[groupIndex] = el)}
						className="min-w-0 w-full"
					>
						<RuleGroupCard
							ruleGroup={ruleGroup}
							groupIndex={groupIndex}
							rulesGroups={rulesGroups}
							rules={rules}
							onRulesChange={onChange}
						/>
					</div>
				))}
				<div className="flex justify-start items-start">
					<Button
						onClick={addOrGroup}
						variant="secondary"
						className=""
					>
						<PlusIcon />
						{__('OR', 'doublescale')}
					</Button>
				</div>
			</div>
		</div>
	);
};

export default RulesBuilder;
