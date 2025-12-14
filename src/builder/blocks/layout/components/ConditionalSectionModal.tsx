/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState, useEffect } from '@wordpress/element';
import { useSelect, useDispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import RulesBuilder from '@/components/rules-builder';
import ListTagFilter from '@/components/list-tag-filter';
import type { Filter as FilterType } from '@quillcrm/client';
import {
	getFilteredRulesGroups,
	getInitialRule,
	mapRulesToFilters,
	mapFiltersToRules,
} from '@/utils';
import { STORE_KEY } from '@/stores/email-builder/constants';

interface ConditionalSectionModalProps {
	sectionId: string;
	visible: boolean;
	onClose: () => void;
}

const ConditionalSectionModal: React.FC<ConditionalSectionModalProps> = ({
	sectionId,
	visible,
	onClose,
}) => {
	const dispatch = useDispatch();

	// Get current section
	const section = useSelect(
		(select) => {
			const sections = select(STORE_KEY).getSections();
			return sections.find((s: any) => s.id === sectionId);
		},
		[sectionId]
	);

	const [filterBy, setFilterBy] = useState('list-tags');
	const [listTagFilters, setListTagFilters] = useState<FilterType[]>([]);
	const filteredRulesGroups = getFilteredRulesGroups();
	const [rules, setRules] = useState([[getInitialRule(filteredRulesGroups)]]);

	// Helper function to check if a filter is a list-tag filter
	const isListTagFilter = (filter: FilterType): boolean => {
		return (
			filter.group === 'segments' &&
			(filter.filter === 'lists_segment' ||
				filter.filter === 'tags_segment')
		);
	};

	// Initialize from existing section conditions
	useEffect(() => {
		if (visible && section?.conditions && section.conditions.length > 0) {
			// Separate conditions into list-tags and advanced filters
			const listTagConditions: FilterType[] = [];
			const advancedConditions: FilterType[] = [];

			section.conditions.forEach((condition: FilterType) => {
				if (isListTagFilter(condition)) {
					listTagConditions.push(condition);
				} else {
					advancedConditions.push(condition);
				}
			});

			// Determine which mode to show based on which type has conditions
			if (
				listTagConditions.length > 0 &&
				advancedConditions.length === 0
			) {
				setFilterBy('list-tags');
				setListTagFilters(listTagConditions);
				setRules([[getInitialRule(filteredRulesGroups)]]);
			} else if (
				advancedConditions.length > 0 &&
				listTagConditions.length === 0
			) {
				setFilterBy('advanced');
				setRules(
					mapFiltersToRules(advancedConditions, filteredRulesGroups)
				);
				setListTagFilters([]);
			} else if (
				listTagConditions.length > 0 &&
				advancedConditions.length > 0
			) {
				// If both exist, default to list-tags but keep both states
				setFilterBy('list-tags');
				setListTagFilters(listTagConditions);
				setRules(
					mapFiltersToRules(advancedConditions, filteredRulesGroups)
				);
			} else {
				// No conditions
				setListTagFilters([]);
				setRules([[getInitialRule(filteredRulesGroups)]]);
			}
		} else if (visible) {
			// Reset for new conditional setup
			setListTagFilters([]);
			setFilterBy('list-tags');
			setRules([[getInitialRule(filteredRulesGroups)]]);
		}
	}, [visible, section?.conditions]);

	const handleApply = () => {
		let conditionsToSave: FilterType[] = [];

		// Only save conditions from the currently selected mode
		if (filterBy === 'list-tags') {
			conditionsToSave = listTagFilters;
		} else {
			conditionsToSave = mapRulesToFilters(rules);
		}

		dispatch(STORE_KEY).updateSection(sectionId, {
			conditions: conditionsToSave,
		});
		onClose();
	};

	const handleClearAll = () => {
		setListTagFilters([]);
		setRules([[getInitialRule(filteredRulesGroups)]]);
	};

	const handleFilterModeChange = (value: string) => {
		setFilterBy(value);
	};

	if (!visible) return null;

	return (
		<Dialog open={visible} onOpenChange={onClose}>
			<DialogContent className="max-w-5xl">
				<DialogHeader>
					<DialogTitle className="text-2xl font-bold">
						{__('Conditional Section', 'quillcrm')}
					</DialogTitle>
				</DialogHeader>

				<div className="space-y-6 py-4">
					{/* Conditions Setup */}
					<div className="space-y-4">
						<div>
							<p className="text-base font-bold mb-2 text-black">
								{__('Filter By', 'quillcrm')}
							</p>
							<RadioGroup
								value={filterBy}
								onValueChange={handleFilterModeChange}
								className="flex gap-4"
							>
								<Label
									htmlFor="list-tags"
									className={`flex items-center space-x-4 w-1/2 border rounded-lg p-4 cursor-pointer ${
										filterBy === 'list-tags'
											? 'border-blue-500 bg-blue-50 text-blue-500'
											: 'border-gray-300 bg-white'
									}`}
								>
									<RadioGroupItem
										value="list-tags"
										id="list-tags"
									/>
									<span>
										{__('Lists and Tags', 'quillcrm')}
									</span>
								</Label>
								<Label
									htmlFor="advanced"
									className={`flex items-center space-x-4 w-1/2 border rounded-lg py-2 px-3 cursor-pointer ${
										filterBy === 'advanced'
											? 'border-blue-500 bg-blue-50'
											: 'border-gray-300 bg-white'
									}`}
								>
									<RadioGroupItem
										value="advanced"
										id="advanced"
									/>
									<span>
										{__('Advanced Filter', 'quillcrm')}
									</span>
								</Label>
							</RadioGroup>
						</div>

						<div className="space-y-4 mt-4">
							<div
								className={
									filterBy === 'list-tags'
										? 'block'
										: 'hidden'
								}
							>
								<ListTagFilter
									filters={listTagFilters}
									setFilters={setListTagFilters}
									showBtns={false}
								/>
							</div>
							<div
								className={
									filterBy === 'advanced' ? 'block' : 'hidden'
								}
							>
								<RulesBuilder
									rules={rules}
									onChange={setRules}
									rulesGroups={filteredRulesGroups}
								/>
							</div>
						</div>
					</div>
				</div>

				<div className="flex items-center justify-between">
					<Button variant="destructive" onClick={handleClearAll}>
						{__('Clear All', 'quillcrm')}
					</Button>

					<Button variant="gradient" onClick={handleApply}>
						{__('Apply Filters', 'quillcrm')}
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
};

export default ConditionalSectionModal;
