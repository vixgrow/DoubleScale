// External dependencies
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { __ } from '@wordpress/i18n';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useRef, useState, useEffect } from 'react';

type TabListItem = {
	value: string;
	label: string;
	icon?: React.ReactNode;
};

type TabContent = {
	value: string;
	children: React.ReactNode;
};

interface PageTabsProps {
	defaultValue: string;
	value?: string;
	className?: string;
	tabsList: TabListItem[];
	tabsContent: TabContent[];
	onValueChange?: (value: string) => void;
	tabsListWrapperClassName?: string;
	tabsListClassName?: string;
	scrollThreshold?: number;
	scrollArrowBg?: string;
}
const PageTabs: React.FC<PageTabsProps> = ({
	defaultValue,
	value,
	tabsList,
	tabsContent,
	className,
	onValueChange,
	tabsListWrapperClassName = 'border border-border/60 px-2 py-2 rounded-xl bg-card',
	tabsListClassName = 'bg-transparent text-muted-foreground gap-1',
	scrollThreshold = 10,
	scrollArrowBg = 'bg-card',
}) => {
	const scrollContainerRef = useRef<HTMLDivElement>(null);
	const [showLeftChevron, setShowLeftChevron] = useState(false);
	const [showRightChevron, setShowRightChevron] = useState(false);
	const hasManyTabs = tabsList.length > scrollThreshold;

	const checkScrollButtons = () => {
		if (!scrollContainerRef.current) return;
		const { scrollLeft, scrollWidth, clientWidth } =
			scrollContainerRef.current;
		setShowLeftChevron(scrollLeft > 0);
		setShowRightChevron(scrollLeft < scrollWidth - clientWidth - 1);
	};

	useEffect(() => {
		if (!hasManyTabs) return;

		checkScrollButtons();
		const container = scrollContainerRef.current;
		if (!container) return;

		container.addEventListener('scroll', checkScrollButtons);
		window.addEventListener('resize', checkScrollButtons);

		return () => {
			container.removeEventListener('scroll', checkScrollButtons);
			window.removeEventListener('resize', checkScrollButtons);
		};
	}, [hasManyTabs, tabsList.length]);

	const scroll = (direction: 'left' | 'right') => {
		if (!scrollContainerRef.current) return;
		const scrollAmount = 200;
		const currentScroll = scrollContainerRef.current.scrollLeft;
		const newScroll =
			direction === 'left'
				? currentScroll - scrollAmount
				: currentScroll + scrollAmount;
		scrollContainerRef.current.scrollTo({
			left: newScroll,
			behavior: 'smooth',
		});
	};

	return (
		<Tabs
			defaultValue={defaultValue}
			value={value}
			className={className}
			onValueChange={onValueChange}
		>
			<div
				className={`${tabsListWrapperClassName} ${hasManyTabs ? 'relative' : ''}`}
			>
				{hasManyTabs && showLeftChevron && (
					<button
						onClick={() => scroll('left')}
						className={`absolute left-0 top-0 bottom-0 h-full z-10 ${scrollArrowBg} rounded-r-lg transition-colors flex items-center justify-center px-1`}
						aria-label="Scroll left"
					>
						<ChevronLeft className="w-4 h-4 text-muted-foreground" />
					</button>
				)}
				<div
					ref={scrollContainerRef}
					className={`${hasManyTabs ? 'overflow-x-auto hide-scrollbar' : ''}`}
				>
					<TabsList className={tabsListClassName}>
						{tabsList.map((tab) => (
							<TabsTrigger
								key={tab.value}
								value={tab.value}
								className="gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:bg-muted/70 data-[state=inactive]:hover:text-foreground sm:px-4"
							>
								{tab?.icon}
								{__(tab.label, 'doublescale')}
							</TabsTrigger>
						))}
					</TabsList>
				</div>
				{hasManyTabs && showRightChevron && (
					<button
						onClick={() => scroll('right')}
						className={`absolute right-0 top-0 bottom-0 h-full z-10 ${scrollArrowBg} rounded-l-lg transition-colors flex items-center justify-center px-1`}
						aria-label="Scroll right"
					>
						<ChevronRight className="w-4 h-4 text-muted-foreground" />
					</button>
				)}
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
