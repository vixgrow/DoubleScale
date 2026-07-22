/**
 * Tiny inline-SVG icon set for the portal shell (avoids pulling a full icon
 * dependency into the public bundle). Keyed by the `icon` slug a section
 * descriptor declares server-side.
 */

interface IconProps {
	className?: string;
}

const base = (path: JSX.Element, props: IconProps) => (
	<svg
		className={props.className || 'w-5 h-5'}
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		strokeWidth="1.8"
		strokeLinecap="round"
		strokeLinejoin="round"
		aria-hidden="true"
	>
		{path}
	</svg>
);

export const HomeIcon = (p: IconProps) =>
	base(
		<>
			<path d="M3 10.5 12 3l9 7.5" />
			<path d="M5 9.5V21h14V9.5" />
		</>,
		p
	);

export const TicketIcon = (p: IconProps) =>
	base(
		<>
			<path d="M3 8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4Z" />
			<path d="M13 6v12" strokeDasharray="2 2" />
		</>,
		p
	);

export const CalendarIcon = (p: IconProps) =>
	base(
		<>
			<rect x="3" y="4.5" width="18" height="16" rx="2" />
			<path d="M3 9h18M8 3v3M16 3v3" />
		</>,
		p
	);

export const DocumentIcon = (p: IconProps) =>
	base(
		<>
			<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8Z" />
			<path d="M14 3v5h5M9 13h6M9 17h6" />
		</>,
		p
	);

export const ClockIcon = (p: IconProps) =>
	base(
		<>
			<circle cx="12" cy="12" r="9" />
			<path d="M12 7v5l3 2" />
		</>,
		p
	);

export const MapPinIcon = (p: IconProps) =>
	base(
		<>
			<path d="M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11Z" />
			<circle cx="12" cy="10" r="2.5" />
		</>,
		p
	);

export const FolderIcon = (p: IconProps) =>
	base(
		<path d="M4 5a2 2 0 0 1 2-2h3l2 2h7a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2Z" />,
		p
	);

export const ChevronLeftIcon = (p: IconProps) => base(<path d="M15 6l-6 6 6 6" />, p);

export const PaymentIcon = (p: IconProps) =>
	base(
		<>
			<rect x="2" y="5" width="20" height="14" rx="2" />
			<path d="M2 10h20" />
		</>,
		p
	);

export const ChevronRightIcon = (p: IconProps) => base(<path d="M9 6l6 6-6 6" />, p);

export const RepeatIcon = (p: IconProps) =>
	base(
		<>
			<path d="M17 1l4 4-4 4" />
			<path d="M3 11V9a4 4 0 0 1 4-4h14" />
			<path d="M7 23l-4-4 4-4" />
			<path d="M21 13v2a4 4 0 0 1-4 4H3" />
		</>,
		p
	);

const REGISTRY: Record<string, (p: IconProps) => JSX.Element> = {
	home: HomeIcon,
	ticket: TicketIcon,
	calendar: CalendarIcon,
	document: DocumentIcon,
	folder: FolderIcon,
	clock: ClockIcon,
	subscriptions: RepeatIcon,
};

export const SectionIcon = ({
	icon,
	className,
}: {
	icon: string;
	className?: string;
}) => {
	const Cmp = REGISTRY[icon] || HomeIcon;
	return <Cmp className={className} />;
};
