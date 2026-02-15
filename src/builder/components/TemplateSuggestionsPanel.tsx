/**
 * wordpress dependencies
 */
import { __ } from '@wordpress/i18n';
/**
 * external dependencies
 */
import { X } from 'lucide-react';
/**
 * internal dependencies
 */
import { Button } from '@/components/ui/button';
import TemplateSuggestionsItems from './TemplateSuggestionsItems';

interface SidebarItem {
	id: string;
	title: string;
	component: React.ComponentType<any>;
}

interface TemplateSuggestionsPanelProps {
	isOpen: boolean;
	onClose: () => void;
	activeSidebar: SidebarItem | null;
	setActiveSidebar: (item: SidebarItem | null) => void;
}

const TemplateSuggestionsPanel = ({
	isOpen,
	onClose,
	activeSidebar,
	setActiveSidebar,
}: TemplateSuggestionsPanelProps) => {
	if (!isOpen) return null;

	return (
		<div className="absolute top-0 left-0 w-full h-full bg-white z-30">
			<div className="flex flex-col h-full">
				<div className="flex items-center justify-between p-6 border-b border-gray-200 mx-2">
					<h2 className="text-lg font-semibold text-gray-900">
						{__('Ready-To-Use', 'quillcrm')}
					</h2>
					<Button
						variant="ghost"
						size="sm"
						onClick={onClose}
						className="h-8 w-8 p-0 hover:bg-gray-100"
					>
						<X className="h-5 w-5" />
					</Button>
				</div>
				<div className="flex-1 overflow-y-auto">
					<TemplateSuggestionsItems
						activeSidebar={activeSidebar}
						setActiveSidebar={setActiveSidebar}
					/>
				</div>
			</div>
		</div>
	);
};

export default TemplateSuggestionsPanel;
