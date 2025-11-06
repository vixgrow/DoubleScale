import { __ } from '@wordpress/i18n';

import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { ChevronDown } from 'lucide-react';
import Sections from '../../components/Sections';
import LayoutItems from '../../components/LayoutItems';

interface ContainerBlockProps {
	activeSidebar?: any;
	setActiveSidebar?: (sidebar: any) => void;
}

const ContainerBlock = ({
	activeSidebar,
	setActiveSidebar,
}: ContainerBlockProps) => {
	const defaultStyle =
		'flex flex-row items-center justify-center w-full bg-secondary text-primary-foreground px-4 py-3 rounded-md text-base cursor-pointer';

	return (
		<>
			<Collapsible className="group/collapsible mb-4">
				<CollapsibleTrigger asChild>
					<div className={defaultStyle}>
						{__('Library', 'quillcrm')}
						<ChevronDown className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-180" />
					</div>
				</CollapsibleTrigger>
				<CollapsibleContent>
					<LayoutItems
						activeSidebar={activeSidebar}
						setActiveSidebar={setActiveSidebar}
					/>
				</CollapsibleContent>
			</Collapsible>

			<Collapsible defaultOpen className="group/collapsible">
				<CollapsibleTrigger asChild>
					<div className={defaultStyle}>
						{__('Blocks', 'quillcrm')}
						<ChevronDown className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-180" />
					</div>
				</CollapsibleTrigger>
				<CollapsibleContent>
					<Sections />
				</CollapsibleContent>
			</Collapsible>
		</>
	);
};

export default ContainerBlock;
