import { __ } from '@wordpress/i18n';
import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import ColumnBlock from '../blocks/layout/ColumnBlock';
import ContainerBlock from '../blocks/layout/ContainerBlock';
import { MyTemplatesIcon } from '@/components/icons';

interface SidebarItem {
	id: string;
	title: string;
	component: React.ComponentType<any>;
}

interface BlockSidebarProps {
	sidebarCloseTrigger?: number;
}

const BlockSidebar = ({ sidebarCloseTrigger }: BlockSidebarProps = {}) => {
	const [activeSidebar, setActiveSidebar] = useState<SidebarItem | null>(
		null
	);
	const tabStyles =
		'data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#1E3A8A] data-[state=active]:to-[#3B82F6] data-[state=active]:text-primary-foreground px-7 py-3.5 rounded-xl';

	// Close sidebar when drag starts
	useEffect(() => {
		if (sidebarCloseTrigger && sidebarCloseTrigger > 0) {
			setActiveSidebar(null);
		}
	}, [sidebarCloseTrigger]);

	return (
		<div className="flex">
			<div className="bg-white p-4">
				<div className="border rounded p-4 flex flex-col items-center cursor-pointer">
					<span className="text-[#374151]">
						<MyTemplatesIcon />
					</span>
					<p>{__('My', 'quillcrm')}</p>
					<p>{__('Templates', 'quillcrm')}</p>
				</div>
			</div>
			<div className="bg-white w-full max-w-[320px] align-center h-full relative flex flex-col border-l">
				<Tabs
					defaultValue="elements"
					className="w-full h-full flex flex-col"
				>
					<div className="border-b border-border w-full flex flex-col items-center py-4 flex-shrink-0">
						<TabsList className="px-4 h-16">
							<TabsTrigger value="elements" className={tabStyles}>
								{__('Elements', 'quillcrm')}
							</TabsTrigger>
							<TabsTrigger value="layouts" className={tabStyles}>
								{__('Layouts', 'quillcrm')}
							</TabsTrigger>
						</TabsList>
					</div>
					<div className="py-6 px-9 flex-1 overflow-auto">
						<TabsContent value="elements">
							<ContainerBlock
								activeSidebar={activeSidebar}
								setActiveSidebar={setActiveSidebar}
							/>
						</TabsContent>
						<TabsContent value="layouts">
							<ColumnBlock />
						</TabsContent>
					</div>
				</Tabs>

				{/* Active Sidebar */}
				{activeSidebar && (
					<div className="absolute top-0 left-[102%] w-72 h-full overflow-y-auto z-20 bg-white shadow-lg">
						<div className="flex flex-col px-8 pt-7">
							<div className="flex items-center justify-between w-full pb-4">
								<h2 className="text-base font-bold text-primary text-center flex-1">
									{activeSidebar.title}
								</h2>
								<Button
									variant="ghost"
									size="sm"
									onClick={() => setActiveSidebar(null)}
									className="h-6 w-6 p-0 hover:bg-gray-100"
								>
									<X className="h-4 w-4" />
								</Button>
							</div>
							<div className="border-b-2 border-gray-200 w-full"></div>
						</div>
						<div
							className="overflow-y-auto p-4 flex-1"
							style={{ zIndex: 100000 }}
						>
							<activeSidebar.component
								onSidebarClose={() => setActiveSidebar(null)}
							/>
						</div>
					</div>
				)}
			</div>
		</div>
	);
};

export default BlockSidebar;
