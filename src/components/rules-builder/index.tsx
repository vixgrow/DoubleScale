/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useLayoutEffect, useRef, useState } from '@wordpress/element';

/**
 * External dependencies
 */
import { map } from 'lodash';

/**
 * Internal dependencies
 */
import { PlusIcon } from '@quillcrm/components';
import { Button } from '@/components/ui/button';
import RuleGroupCard from '@/client/pages/automation/steps/workflow/conditions-modal/rule-group-card';

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
	const [orBracketStyle, setOrBracketStyle] = useState<{
		top: number;
		height: number;
	}>({ top: 0, height: 0 });

	// Compute OR bracket across groups
	useLayoutEffect(() => {
		const updateBracket = () => {
			if (
				rules.length <= 1 ||
				!containerRef.current ||
				!cardRefs.current[0] ||
				!cardRefs.current[rules.length - 1]
			) {
				setOrBracketStyle({ top: 0, height: 0 });
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
				const height = Math.max(0, lastMid - firstMid);
				setOrBracketStyle({ top: firstMid, height });
			}
		};

		updateBracket();
		const id1 = setTimeout(updateBracket, 0);
		const id2 = setTimeout(updateBracket, 50);
		window.addEventListener('resize', updateBracket);
		return () => {
			clearTimeout(id1);
			clearTimeout(id2);
			window.removeEventListener('resize', updateBracket);
		};
	}, [rules]);

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
			<div ref={containerRef} className="flex flex-col gap-4 relative">
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
						ref={(el) => (cardRefs.current[groupIndex] = el)}
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
						className="text-[#414141] bg-[#CECECE] border border-[#D3D3D3] rounded-md p-0 px-2 shadow-none hover:bg-transparent font-semibold"
					>
						<PlusIcon />
						{__('Add another condition (Or)', 'quillcrm')}
					</Button>
				</div>
			</div>
		</div>
	);
};

export default RulesBuilder;
