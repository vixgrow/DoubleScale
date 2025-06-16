// External dependencies
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { __ } from '@wordpress/i18n';

type TabListItem = {
	value: string;
	label: string;
	icon: React.ReactNode;
};

type TabContent = {
	value: string;
	children: React.ReactNode;
};

interface PageTabsProps {
	defaultValue: string;
	className?: string;
	tabsList: TabListItem[];
	tabsContent: TabContent[];
}
const PageTabs: React.FC<PageTabsProps> = ({
	defaultValue,
	tabsList,
	tabsContent,
	className,
}) => {
	return (
		<Tabs defaultValue={defaultValue} className={className}>
			<div className="border px-5 py-3 rounded-lg">
				<TabsList className="bg-transparent text-foreground gap-3">
					{tabsList.map((tab) => (
						<TabsTrigger
							key={tab.value}
							value={tab.value}
							className="px-3 py-2 gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
						>
							{tab.icon}
							{__(tab.label, '@quillcrm')}
						</TabsTrigger>
					))}
				</TabsList>
			</div>

			{tabsContent.map((content) => (
				<TabsContent key={content.value} value={content.value}>
					{content.children}
				</TabsContent>
			))}
		</Tabs>
	);
};

export default PageTabs;
