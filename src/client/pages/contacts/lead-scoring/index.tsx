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
				className="doublescale-lead-scoring min-w-0 w-full overflow-hidden rounded-xl bg-white px-6 pt-6 pb-6 shadow-[0px_4px_20px_0px_rgba(59,130,246,0.14)]"
				dir={dir}
			>
				<PageTabs
					className="min-w-0 w-full"
					tabsVariant="underline"
					tabsContentClassName="min-w-0 w-full pt-6"
					defaultValue="rules"
					value={currentTab}
					onValueChange={handleTabChange}
					tabsListWrapperClassName="border-b border-border/60 pb-0"
					tabsListClassName="gap-6"
					tabsTriggerClassName="gap-2 px-1 pb-3 pt-1 text-muted-foreground"
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
				/>
			</div>
		);
	}
);

LeadScoring.displayName = 'LeadScoring';

export default LeadScoring;
