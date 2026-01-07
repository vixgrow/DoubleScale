/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	useState,
	useRef,
	useImperativeHandle,
	forwardRef,
} from '@wordpress/element';

/**
 * External dependencies
 */
import React from 'react';

/**
 * Internal dependencies
 */
import './style.scss';
import { PageTabs, ToolsIcon, CategoryIcon } from '@quillcrm/components';
import Rules, { RulesRef } from './rules';
import Levels, { LevelsRef } from './levels';

export interface LeadScoringRef {
	openCreateModal: () => void;
}

interface LeadScoringProps {
	activeTab?: string;
}

const LeadScoring = forwardRef<LeadScoringRef, LeadScoringProps>(
	(props, ref) => {
		const [currentTab, setCurrentTab] = useState<string>('rules');
		const rulesRef = useRef<RulesRef>(null);
		const levelsRef = useRef<LevelsRef>(null);

		useImperativeHandle(ref, () => ({
			openCreateModal: () => {
				if (currentTab === 'rules') {
					rulesRef.current?.openCreateRuleModal();
				} else if (currentTab === 'levels') {
					levelsRef.current?.openCreateLevelModal();
				}
			},
		}));

		return (
			<div className="qcrm-lead-scoring">
				<PageTabs
					defaultValue="rules"
					value={currentTab}
					onValueChange={(value) => setCurrentTab(value)}
					tabsList={[
						{
							label: __('Rules', 'quillcrm'),
							value: 'rules',
							icon: <ToolsIcon width={20} height={20} />,
						},
						{
							label: __('Levels', 'quillcrm'),
							value: 'levels',
							icon: <CategoryIcon width={20} height={20} />,
						},
					]}
					tabsContent={[
						{
							value: 'rules',
							children: (
								<Rules ref={rulesRef} activeTab={currentTab} />
							),
						},
						{
							value: 'levels',
							children: (
								<Levels
									ref={levelsRef}
									activeTab={currentTab}
								/>
							),
						},
					]}
					tabsListWrapperClassName="border px-5 py-3 rounded-lg mb-4"
					tabsListClassName="bg-transparent text-foreground gap-3"
				/>
			</div>
		);
	}
);

LeadScoring.displayName = 'LeadScoring';

export default LeadScoring;
