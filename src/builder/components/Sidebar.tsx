import { __ } from '@wordpress/i18n';
import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import ColumnBlock from '../blocks/layout/ColumnBlock';
import ContainerBlock from '../blocks/layout/ContainerBlock';
import { STORE_KEY } from '../../stores/email-builder/constants';
import { useSelect } from '@wordpress/data';
import {
	DashboardIcon,
	GlobalEmailSettingsIcon,
	MyTemplatesSidebarIcon,
	ReadyToUseIcon,
} from '@/components/icons';
import MyTemplatesPanel from './MyTemplatesPanel';
import TemplateSuggestionsPanel from './TemplateSuggestionsPanel';
import {
	Tooltip,
	TooltipTrigger,
	TooltipContent,
	TooltipProvider,
} from '@/components/ui/tooltip';
import './style.scss';

interface SidebarItem {
	id: string;
	title: string;
	component: React.ComponentType<any>;
}

interface BlockSidebarProps {
	sidebarCloseTrigger?: number;
	templatesRefreshKey?: number;
	openGlobalSettings?: () => void;
	/** Open “My templates” drawer when the builder first mounts (used by Pro sequence mail / open-builder flow). */
	openTemplatesOnMount?: boolean;
}

type SidebarView =
	| { type: 'none' }
	| { type: 'myTemplates' }
	| { type: 'templateSuggestions' }
	| { type: 'active'; item: SidebarItem };

const BlockSidebar = ({
	sidebarCloseTrigger,
	templatesRefreshKey,
	openGlobalSettings = () => {},
	openTemplatesOnMount = false,
}: BlockSidebarProps = {}) => {
	const [view, setView] = useState<SidebarView>({ type: 'none' });
	const [suggestionActiveItem, setSuggestionActiveItem] =
		useState<SidebarItem | null>(null);

	const isGlobalSettingsClosed = useSelect(
		(select) =>
			select(STORE_KEY).getSelectedBlockId() ||
			select(STORE_KEY).getSelectedSectionId() ||
			select(STORE_KEY).getSelectedColumnId()
	);

	const tabStyles =
		'data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#1E3A8A] data-[state=active]:to-[#3B82F6] data-[state=active]:text-primary-foreground px-7 py-3.5 rounded-xl';

	// Close sidebar when drag starts
	useEffect(() => {
		if (sidebarCloseTrigger && sidebarCloseTrigger > 0) {
			setView({ type: 'none' });
			setSuggestionActiveItem(null);
		}
	}, [sidebarCloseTrigger]);

	useEffect(() => {
		if (openTemplatesOnMount) {
			setSuggestionActiveItem(null);
			setView({ type: 'myTemplates' });
		}
	}, [openTemplatesOnMount]);

	const HandleMyTemplates = () => {
		setSuggestionActiveItem(null);
		setView((prev) =>
			prev.type === 'myTemplates'
				? { type: 'none' }
				: { type: 'myTemplates' }
		);
	};

	const HandleTemplateSuggestions = () => {
		setSuggestionActiveItem(null);
		setView((prev) =>
			prev.type === 'templateSuggestions'
				? { type: 'none' }
				: { type: 'templateSuggestions' }
		);
	};

	return (
		<div className="flex flex-1 max-w-[350px]">
			<div className="bg-white p-4 flex flex-col justify-between items-center">
				<div className="flex flex-col gap-4 items-center">
					<div
						className={`cursor-pointer ${view.type === 'none' ? 'text-[#1E3A8A]' : ''}	`}
						onClick={() => setView({ type: 'none' })}
					>
						<DashboardIcon width={32} height={32} />
					</div>

					<div>
						<TooltipProvider>
							<Tooltip>
								<TooltipTrigger asChild>
									<div
										className="flex flex-col items-center cursor-pointer"
										onClick={HandleMyTemplates}
									>
										<MyTemplatesSidebarIcon
											width={32}
											height={32}
											active={view.type === 'myTemplates'}
										/>
									</div>
								</TooltipTrigger>
								<TooltipContent>
									<p>{__('My Templates', 'doublescale')}</p>
								</TooltipContent>
							</Tooltip>
						</TooltipProvider>
					</div>

					<div>
						<TooltipProvider>
							<Tooltip>
								<TooltipTrigger asChild>
									<div
										className="flex flex-col items-center cursor-pointer"
										onClick={HandleTemplateSuggestions}
									>
										<ReadyToUseIcon
											width={32}
											height={32}
											active={view.type === 'templateSuggestions'}
										/>
									</div>
								</TooltipTrigger>
								<TooltipContent>
									<p>{__('Ready-To-Use', 'doublescale')}</p>
								</TooltipContent>
							</Tooltip>
						</TooltipProvider>
					</div>
				</div>

				<div>
					<TooltipProvider>
						<Tooltip>
							<TooltipTrigger asChild>
								<div
									className={`cursor-pointer ${isGlobalSettingsClosed ? '' : 'text-[#1E3A8A]'}`}
									onClick={openGlobalSettings}
								>
									<GlobalEmailSettingsIcon
										width={32}
										height={32}
									/>
								</div>
							</TooltipTrigger>
							<TooltipContent>
								<p>{__('Global Email Settings', 'doublescale')}</p>
							</TooltipContent>
						</Tooltip>
					</TooltipProvider>
				</div>
			</div>
			<div className="bg-white w-full align-center h-full relative flex flex-col border-l">
				<Tabs
					defaultValue="elements"
					className="w-full h-full flex flex-col"
				>
					<div className="border-b border-border w-full flex flex-col items-center py-4 flex-shrink-0">
						<TabsList className="px-4 h-16">
							<TabsTrigger value="elements" className={tabStyles}>
								{__('Elements', 'doublescale')}
							</TabsTrigger>
							<TabsTrigger value="layouts" className={tabStyles}>
								{__('Layouts', 'doublescale')}
							</TabsTrigger>
						</TabsList>
					</div>
					<div className="py-6 px-6 flex-1 overflow-auto custom-scrollbar">
						<TabsContent value="elements">
							<ContainerBlock
								activeSidebar={
									view.type === 'active' ? view.item : null
								}
								setActiveSidebar={(item: SidebarItem | null) =>
									setView(
										item
											? { type: 'active', item }
											: { type: 'none' }
									)
								}
							/>
						</TabsContent>
						<TabsContent value="layouts">
							<ColumnBlock />
						</TabsContent>
					</div>
				</Tabs>

				{/* Active Sidebar */}
				{view.type === 'active' && (
					<div className="absolute top-0 left-[102%] w-72 h-full overflow-y-auto z-20 bg-white shadow-lg active-sidebar-scrollbar">
						<div className="flex flex-col px-8 pt-7">
							<div className="flex items-center justify-between w-full pb-4">
								<h2 className="text-base font-bold text-primary text-center flex-1">
									{view.item.title}
								</h2>
								<Button
									variant="ghost"
									size="sm"
									onClick={() => setView({ type: 'none' })}
									className="h-6 w-6 p-0 hover:bg-gray-100"
								>
									<X className="h-4 w-4" />
								</Button>
							</div>
							<div className="border-b-2 border-gray-200 w-full"></div>
						</div>
						<div
							className="overflow-y-auto p-4 flex-1 active-sidebar-scrollbar"
							style={{ zIndex: 100000 }}
						>
							<view.item.component
								onSidebarClose={() => setView({ type: 'none' })}
							/>
						</div>
					</div>
				)}

				{/* MyTemplates Panel */}
				<MyTemplatesPanel
					isOpen={view.type === 'myTemplates'}
					onClose={() => setView({ type: 'none' })}
					refreshKey={templatesRefreshKey}
				/>

				{/* Template Suggestions Active Sidebar */}
				{view.type === 'templateSuggestions' &&
					suggestionActiveItem && (
						<div className="absolute top-0 left-[102%] w-72 h-full overflow-y-auto z-40 bg-white shadow-lg active-sidebar-scrollbar">
							<div className="flex flex-col px-8 pt-7">
								<div className="flex items-center justify-between w-full pb-4">
									<h2 className="text-base font-bold text-primary text-start flex-1">
										{suggestionActiveItem.title}
									</h2>
									<Button
										variant="ghost"
										size="sm"
										onClick={() =>
											setSuggestionActiveItem(null)
										}
										className="h-6 w-6 p-0 hover:bg-gray-100"
									>
										<X className="h-4 w-4" />
									</Button>
								</div>
								<div className="border-b-2 border-gray-200 w-full"></div>
							</div>
							<div
								className="overflow-y-auto p-4 flex-1 active-sidebar-scrollbar"
								style={{ zIndex: 100000 }}
							>
								<suggestionActiveItem.component
									onSidebarClose={() =>
										setSuggestionActiveItem(null)
									}
								/>
							</div>
						</div>
					)}

				{/* Template Suggestions Panel */}
				<TemplateSuggestionsPanel
					isOpen={view.type === 'templateSuggestions'}
					onClose={() => {
						setSuggestionActiveItem(null);
						setView({ type: 'none' });
					}}
					activeSidebar={suggestionActiveItem}
					setActiveSidebar={setSuggestionActiveItem}
				/>
			</div>
		</div>
	);
};

export default BlockSidebar;
