/**
 * wordpress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useDispatch, useSelect } from '@wordpress/data';
/**
 * external dependencies
 */
import { useState, useEffect } from 'react';
import { X, ChevronLeft } from 'lucide-react';
/**
 * internal dependencies
 */
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { SettingsIcon } from '@doublescale/components';
import { STORE_KEY } from '../../stores/email-builder/constants';
import LayoutItems from './LayoutItems';
import Sections from './Sections';
import ColumnBlock from '../blocks/layout/ColumnBlock';
import BlockEditor from './BlockEditor';
import {
	BuilderBlocksTabIcon,
	BuilderLayoutTabIcon,
	BuilderLibraryTabIcon,
} from './SidebarTabIcons';
import './style.scss';

interface SidebarItem {
	id: string;
	title: string;
	component: React.ComponentType<any>;
}

interface BlockSidebarProps {
	sidebarCloseTrigger?: number;
	openGlobalSettings?: () => void;
}

type SidebarTab = 'library' | 'blocks' | 'layouts' | 'settings';

const TAB_ITEMS: {
	id: SidebarTab;
	label: string;
	iconOnly?: boolean;
	Icon: React.ComponentType<{ className?: string }>;
}[] = [
	{
		id: 'blocks',
		label: __('Blocks', 'doublescale'),
		Icon: BuilderBlocksTabIcon,
	},
	{
		id: 'layouts',
		label: __('Layouts', 'doublescale'),
		Icon: BuilderLayoutTabIcon,
	},
	{
		id: 'library',
		label: __('Library', 'doublescale'),
		Icon: BuilderLibraryTabIcon,
	},
	{
		id: 'settings',
		label: __('Settings', 'doublescale'),
		iconOnly: true,
		Icon: ({ className }) => (
			<span className={cn('inline-flex', className)}>
				<SettingsIcon width={24} height={24} />
			</span>
		),
	},
];

const BlockSidebar = ({ sidebarCloseTrigger }: BlockSidebarProps = {}) => {
	const dispatch = useDispatch();
	const [activeTab, setActiveTab] = useState<SidebarTab>('settings');
	const [librarySubItem, setLibrarySubItem] = useState<SidebarItem | null>(
		null
	);

	const selection = useSelect((select) => {
		return {
			blockId: select(STORE_KEY).getSelectedBlockId(),
			sectionId: select(STORE_KEY).getSelectedSectionId(),
			columnId: select(STORE_KEY).getSelectedColumnId(),
		};
	}, []);

	const hasSelection = !!(
		selection.blockId ||
		selection.sectionId ||
		selection.columnId
	);

	useEffect(() => {
		if (sidebarCloseTrigger && sidebarCloseTrigger > 0) {
			setLibrarySubItem(null);
		}
	}, [sidebarCloseTrigger]);

	useEffect(() => {
		if (hasSelection) {
			setLibrarySubItem(null);
		}
	}, [hasSelection]);

	const handleCloseEditor = () => {
		setActiveTab('settings');
		dispatch(STORE_KEY).clearSelection();
	};

	const handleTabClick = (tab: SidebarTab) => {
		setLibrarySubItem(null);
		setActiveTab(tab);
		dispatch(STORE_KEY).clearSelection();
	};

	const renderTabContent = () => {
		// Only one BlockEditor: the panel below. Avoid duplicate toolbars/headers.
		if (hasSelection) {
			return null;
		}

		switch (activeTab) {
			case 'library':
				return (
					<LayoutItems
						activeSidebar={librarySubItem}
						setActiveSidebar={(item) =>
							setLibrarySubItem(item ?? null)
						}
					/>
				);
			case 'blocks':
				return <Sections />;
			case 'layouts':
				return <ColumnBlock />;
			case 'settings':
			default:
				return <BlockEditor inline />;
		}
	};

	return (
		<div className="doublescale-builder-sidebar flex h-full w-[400px] flex-shrink-0 flex-col text-white">
			{hasSelection ? (
				<div className="doublescale-builder-sidebar__editor-layer flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden p-6">
					<BlockEditor inline panel onClose={handleCloseEditor} />
				</div>
			) : (
				<>
					<div className="relative z-10 flex-shrink-0 p-6">
						<div className="doublescale-builder-sidebar__tabs flex min-w-0 flex-wrap items-center gap-1 rounded-2xl p-2">
							{TAB_ITEMS.map(({ id, label, iconOnly, Icon }) => {
								const isActive = activeTab === id;
								return (
									<button
										type="button"
										key={id}
										onClick={() => handleTabClick(id)}
										title={label}
										aria-label={label}
										className={cn(
											'flex items-center justify-center gap-1.5 rounded-lg text-xs font-medium transition-colors',
											iconOnly
												? 'h-9 w-9 shrink-0 px-0'
												: 'min-w-[4.25rem] flex-1 px-2 py-2',
											isActive
												? 'bg-[#EEF2FF] text-[#1E3A8A]'
												: 'text-white/90 hover:bg-white/10 hover:text-white'
										)}
									>
										<Icon className="h-6 w-6 flex-shrink-0" />
										{!iconOnly && (
											<span className="truncate">
												{label}
											</span>
										)}
									</button>
								);
							})}
						</div>
					</div>

					<div className="relative min-h-0 flex-1 overflow-hidden">
						<div className="absolute inset-0 overflow-y-auto custom-scrollbar px-6 pb-6">
							{renderTabContent()}
						</div>

						{librarySubItem && (
							<div className="absolute inset-0 z-30 flex flex-col bg-white">
								<div className="flex flex-shrink-0 items-center gap-2 border-b border-border/60 px-4 py-3">
									<Button
										variant="ghost"
										size="sm"
										onClick={() => setLibrarySubItem(null)}
										className="h-7 w-7 p-0"
									>
										<ChevronLeft className="h-4 w-4" />
									</Button>
									<h2 className="flex-1 text-sm font-semibold text-foreground">
										{librarySubItem.title}
									</h2>
									<Button
										variant="ghost"
										size="sm"
										onClick={() => setLibrarySubItem(null)}
										className="h-7 w-7 p-0"
									>
										<X className="h-4 w-4" />
									</Button>
								</div>
								<div className="min-h-0 flex-1 overflow-y-auto p-4 active-sidebar-scrollbar">
									<librarySubItem.component
										onSidebarClose={() =>
											setLibrarySubItem(null)
										}
									/>
								</div>
							</div>
						)}
					</div>
				</>
			)}
		</div>
	);
};

export default BlockSidebar;
