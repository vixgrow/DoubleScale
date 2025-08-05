import { __ } from '@wordpress/i18n';

import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { ChevronDown } from 'lucide-react';
import Sections from '../../components/Sections';
// import Layouts from './layouts';
// import Blocks from './elements/blocks';

const ContainerBlock = () => {
	const defaultStyle =
		'flex flex-row items-center justify-center w-full bg-secondary text-primary-foreground px-4 py-3  rounded-md text-base cursor-pointer';
	return (
		<>
			<Collapsible className="group/collapsible mb-4">
				<CollapsibleTrigger asChild>
					<div className={defaultStyle}>
						{__('Library', 'quillcrm')}
						<ChevronDown className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-180" />
					</div>
				</CollapsibleTrigger>
				<CollapsibleContent>content</CollapsibleContent>
			</Collapsible>

			<Collapsible defaultOpen className="group/collapsible">
				<CollapsibleTrigger asChild>
					<div className={defaultStyle}>
						{__('Sections', 'quillcrm')}
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
