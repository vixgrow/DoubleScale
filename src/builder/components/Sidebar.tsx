import { __ } from '@wordpress/i18n';
import { useState } from 'react';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ColumnBlock from '../blocks/layout/ColumnBlock';
import ContainerBlock from '../blocks/layout/ContainerBlock';

interface SidebarItem {
	id: string;
	title: string;
	component: React.ComponentType<any>;
}

const BlockSidebar = () => {
	const [activeSidebar, setActiveSidebar] = useState<SidebarItem | null>(null);
	const tabStyles =
		'data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#1E3A8A] data-[state=active]:to-[#3B82F6] data-[state=active]:text-primary-foreground px-7 py-3.5 rounded-xl';

	return (
		<div className="bg-white w-full max-w-[300px] align-center py-4 h-full relative">
			<Tabs defaultValue="elements" className="w-full">
				<div className="border-b border-border w-full flex flex-col items-center pb-4">
					<TabsList className="px-4 h-16">
						<TabsTrigger value="elements" className={tabStyles}>
							{__('Elements', 'quillcrm')}
						</TabsTrigger>
						<TabsTrigger value="layouts" className={tabStyles}>
							{__('Layouts', 'quillcrm')}
						</TabsTrigger>
					</TabsList>
				</div>
				<div className="py-6 px-9">
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
					<div className="flex flex-col items-center justify-center px-8 pt-7">
						<h2 className="text-base font-bold text-primary text-center w-full pb-4">
							{activeSidebar.title}
						</h2>
						<div className='border-b-2 border-gray-200 w-full'></div>
					</div>
					<div className="overflow-y-auto p-4 flex-1">
						<activeSidebar.component />
					</div>
				</div>
			)}
		</div>
	);
};

export default BlockSidebar;
