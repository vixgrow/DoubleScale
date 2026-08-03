// External dependencies
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
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

type TabsVariant = 'pill' | 'underline';

interface PageTabsProps {
	defaultValue: string;
	value?: string;
	className?: string;
	tabsList: TabListItem[];
	tabsContent: TabContent[];
	onValueChange?: (value: string) => void;
	tabsListWrapperClassName?: string;
	tabsListClassName?: string;
	/** @default 'pill' */
	tabsVariant?: TabsVariant;
	tabsTriggerClassName?: string;
	tabsContentClassName?: string;
	scrollThreshold?: number;
	scrollArrowBg?: string;
	/** When true, always use a horizontal scroll container and show arrows on overflow. */
	enableHorizontalScroll?: boolean;
}

const pillTabsTriggerClassName =
	'gap-2 whitespace-nowrap rounded-lg p-1 text-sm font-medium transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:bg-muted/70 data-[state=inactive]:hover:text-foreground sm:px-4';

const underlineTabsTriggerClassName =
	'group relative inline-flex items-center gap-1.5 whitespace-nowrap rounded-none border-0 border-b-[3px] border-transparent bg-transparent p-2 text-sm font-medium text-foreground shadow-none outline-none transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none';

const underlineIconWrapClassName =
	'inline-flex size-7 shrink-0 items-center justify-center text-muted-foreground transition-colors group-data-[state=active]:text-primary';

const PageTabs: React.FC<PageTabsProps> = ({
	defaultValue,
	value,
	tabsList,
	tabsContent,
	className,
	onValueChange,
	tabsListWrapperClassName = 'border border-border/60 px-2 py-2 rounded-xl bg-card',
	tabsListClassName = 'bg-transparent text-muted-foreground gap-1',
	tabsVariant = 'pill',
	tabsTriggerClassName,
	tabsContentClassName,
	scrollThreshold = 10,
	scrollArrowBg = 'bg-card',
	enableHorizontalScroll = false,
}) => {
	const scrollContainerRef = useRef<HTMLDivElement>(null);
	const [showLeftChevron, setShowLeftChevron] = useState(false);
	const [showRightChevron, setShowRightChevron] = useState(false);
	const usesHorizontalScroll =
		enableHorizontalScroll || tabsList.length > scrollThreshold;

	const resolvedTabsListClassName =
		tabsVariant === 'underline'
			? cn(
				'flex h-auto w-full min-w-0 justify-start !bg-transparent p-0 leading-6 text-sm text-foreground shadow-none ring-0',
				tabsListClassName,
				'gap-[24px]',
			)
			: cn(
				tabsListClassName,
				usesHorizontalScroll && 'w-max min-w-full flex-nowrap justify-start',
			);

	const checkScrollButtons = () => {
		if (!scrollContainerRef.current) return;
		const { scrollLeft, scrollWidth, clientWidth } =
			scrollContainerRef.current;
		const hasOverflow = scrollWidth > clientWidth + 1;
		setShowLeftChevron(hasOverflow && scrollLeft > 0);
		setShowRightChevron(
			hasOverflow && scrollLeft < scrollWidth - clientWidth - 1
		);
	};

	useEffect(() => {
		if (!usesHorizontalScroll) return;

		checkScrollButtons();
		const container = scrollContainerRef.current;
		if (!container) return;

		container.addEventListener('scroll', checkScrollButtons);
		window.addEventListener('resize', checkScrollButtons);

		const resizeObserver = new ResizeObserver(checkScrollButtons);
		resizeObserver.observe(container);

		return () => {
			container.removeEventListener('scroll', checkScrollButtons);
			window.removeEventListener('resize', checkScrollButtons);
			resizeObserver.disconnect();
		};
	}, [usesHorizontalScroll, tabsList.length]);

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
				className={cn(
					tabsListWrapperClassName,
					usesHorizontalScroll && 'relative min-w-0'
				)}
			>
				{usesHorizontalScroll && showLeftChevron && (
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
					className={cn(
						usesHorizontalScroll && 'min-w-0 overflow-x-auto hide-scrollbar'
					)}
				>
					<TabsList className={resolvedTabsListClassName}>
						{tabsList.map((tab) => (
							<TabsTrigger
								key={tab.value}
								value={tab.value}
								className={cn(
									tabsVariant === 'underline'
										? underlineTabsTriggerClassName
										: pillTabsTriggerClassName,
									tabsTriggerClassName,
								)}
							>
								{tabsVariant === 'underline' && tab?.icon ? (
									<span className={underlineIconWrapClassName}>
										{tab.icon}
									</span>
								) : (
									tab?.icon
								)}
								{tabsVariant === 'underline' ? (
									<span className="text-inherit">
										{__(tab.label, 'doublescale')}
									</span>
								) : (
									__(tab.label, 'doublescale')
								)}
							</TabsTrigger>
						))}
					</TabsList>
				</div>
				{usesHorizontalScroll && showRightChevron && (
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
				<TabsContent
					key={content.value}
					value={content.value}
					className={cn(
						tabsVariant === 'underline' ? 'mt-0' : undefined,
						tabsContentClassName,
					)}
				>
					{content.children}
				</TabsContent>
			))}
		</Tabs>
	);
};

export default PageTabs;
