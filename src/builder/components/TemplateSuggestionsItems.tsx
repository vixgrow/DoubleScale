/**
 * wordpress dependencies
 */
import { __ } from '@wordpress/i18n';
/**
 * external dependencies
 */
import { ChevronRight } from 'lucide-react';
/**
 * internal dependencies
 */
import {
	AnnouncementsTemplates,
	HolidayTemplates,
	GreetingTemplates,
	EcommerceTemplates,
	PlainTextTemplates,
	EngagementTemplates,
} from '../blocks/templates';

interface TemplateSuggestionsItemsProps {
	activeSidebar?: any;
	setActiveSidebar?: (sidebar: any) => void;
}

const TemplateSuggestionsItems = ({
	activeSidebar,
	setActiveSidebar,
}: TemplateSuggestionsItemsProps) => {
	const templateItems = [
		{
			id: 'announcements',
			title: __('Announcements', 'quillcrm'),
			component: AnnouncementsTemplates,
		},
		{
			id: 'holiday',
			title: __('Holiday', 'quillcrm'),
			component: HolidayTemplates,
		},
		{
			id: 'greeting',
			title: __('Greeting', 'quillcrm'),
			component: GreetingTemplates,
		},
		{
			id: 'ecommerce',
			title: __('Ecommerce', 'quillcrm'),
			component: EcommerceTemplates,
		},
		{
			id: 'plain-text',
			title: __('Plain Text', 'quillcrm'),
			component: PlainTextTemplates,
		},
		{
			id: 'engagement',
			title: __('Engagement', 'quillcrm'),
			component: EngagementTemplates,
		},
	];

	const handleItemClick = (itemId: string) => {
		const selectedItem = templateItems.find((item) => item.id === itemId);
		if (activeSidebar?.id === itemId) {
			setActiveSidebar?.(null);
		} else {
			setActiveSidebar?.(selectedItem);
		}
	};

	return (
		<div className="space-y-2 p-4">
			{templateItems.map((item) => (
				<div
					key={item.id}
					onClick={() => handleItemClick(item.id)}
					className={`flex items-center justify-between w-full px-4 py-3 rounded-md cursor-pointer transition-colors ${
						activeSidebar?.id === item.id
							? 'bg-secondary text-white'
							: 'text-muted-foreground'
					}`}
				>
					<span className="text-base">{item.title}</span>
					<ChevronRight
						className={`transition-transform ${
							activeSidebar?.id === item.id ? 'rotate-180' : ''
						}`}
					/>
				</div>
			))}
		</div>
	);
};

export default TemplateSuggestionsItems;
