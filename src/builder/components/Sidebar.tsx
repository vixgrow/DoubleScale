import { __ } from '@wordpress/i18n';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ColumnBlock from '../blocks/layout/ColumnBlock';
import ContainerBlock from '../blocks/layout/ContainerBlock';

const BlockSidebar = () => {
	const tabStyles =
		'data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#1E3A8A] data-[state=active]:to-[#3B82F6] data-[state=active]:text-primary-foreground px-7 py-3.5 rounded-xl';
	return (
		<div className="bg-white w-full max-w-[300px] align-center py-4 h-full">
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
						<ContainerBlock />
					</TabsContent>
					<TabsContent value="layouts">
						<ColumnBlock />
					</TabsContent>
				</div>
			</Tabs>
		</div>
	);
};

export default BlockSidebar;
