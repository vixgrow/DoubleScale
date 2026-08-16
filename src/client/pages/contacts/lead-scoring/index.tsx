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
 * Internal dependencies
 */
import './style.scss';
import { PageTabs, ToolsIcon, CategoryIcon } from '@doublescale/components';
import Rules, { RulesRef } from './rules';
import Levels, { LevelsRef } from './levels';

export interface LeadScoringRef {
	openCreateModal: () => void;
}

interface LeadScoringProps {
	activeTab?: string;
	onTabChange?: (tab: string) => void;
}

const LeadScoring = forwardRef<LeadScoringRef, LeadScoringProps>(
	({ onTabChange }, ref) => {
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

		const handleTabChange = (value: string) => {
			setCurrentTab(value);
			onTabChange?.(value);
		};

		const dir =
			typeof document !== 'undefined'
				? document.documentElement.getAttribute('dir') || undefined
				: undefined;

		return (
			<div
				className="doublescale-lead-scoring min-w-0 w-full rounded-[20px] bg-white p-6 shadow-[0px_4px_24px_0px_rgba(59,130,246,0.2)]"
				dir={dir}
			>
				<PageTabs
					className="min-w-0 w-full"
					tabsContentClassName="min-w-0 w-full"
					tabsListClassName="flex w-full justify-start bg-transparent text-foreground gap-3"
					defaultValue="rules"
					value={currentTab}
					onValueChange={handleTabChange}
					tabsList={[
						{
							label: __('Rules', 'doublescale'),
							value: 'rules',
							icon: <ToolsIcon width={20} height={20} />,
						},
						{
							label: __('Levels', 'doublescale'),
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
					tabsListWrapperClassName="border !border-border px-5 py-3 rounded-lg mb-4"
				/>
			</div>
		);
	}
);

LeadScoring.displayName = 'LeadScoring';

export default LeadScoring;
