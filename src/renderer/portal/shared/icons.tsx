/**
 * Portal icons — sidebar nav, PHP slug resolver, and tiny UI chevrons.
 * Brand icons come from @/components/icons (same as admin navbar).
 */

import type { ComponentType } from 'react';

import {
	BookingIcon,
	ClockIcon as BookingClockIcon,
	LocationIcon as BookingLocationIcon,
} from '@/components/booking';
import {
	AttachmentFileIcon,
	DashboardIcon,
	HelpdeskIcon,
	PaymentModeIcon,
	ProjectsIcon,
	RepeatIcon,
} from '@/components/icons';
import type { IconProps } from '@doublescale/config';

type BrandIcon = ComponentType<IconProps>;

const NAV_ICON_SIZE = 24;

const PHP_ICON_MAP: Record<string, BrandIcon> = {
	home: DashboardIcon,
	ticket: HelpdeskIcon,
	calendar: BookingIcon,
	document: AttachmentFileIcon,
	folder: ProjectsIcon,
	clock: BookingClockIcon,
	subscriptions: RepeatIcon,
};

const SECTION_SLUG_MAP: Record<string, BrandIcon> = {
	dashboard: DashboardIcon,
	tickets: HelpdeskIcon,
	bookings: BookingIcon,
	projects: ProjectsIcon,
	documents: AttachmentFileIcon,
};

const renderBrandIcon = (
	Icon: BrandIcon,
	size: number,
	className?: string
) => (
	<span className={className}>
		<Icon width={size} height={size} color="currentColor" />
	</span>
);

export const SectionIcon = ({
	icon,
	className,
	size = NAV_ICON_SIZE,
}: {
	icon: string;
	className?: string;
	size?: number;
}) => renderBrandIcon(PHP_ICON_MAP[icon] || DashboardIcon, size, className);

export const PortalNavIcon = ({
	slug,
	fallbackIcon,
}: {
	slug: string;
	fallbackIcon: string;
}) =>
	renderBrandIcon(
		SECTION_SLUG_MAP[slug] || PHP_ICON_MAP[fallbackIcon] || DashboardIcon,
		NAV_ICON_SIZE,
		'shrink-0'
	);

interface UiIconProps {
	className?: string;
	size?: number;
}

const uiIcon = (Icon: BrandIcon, { className, size = 16 }: UiIconProps) =>
	renderBrandIcon(Icon, size, className);

interface ChevronProps {
	className?: string;
}

const chevronBase = (path: JSX.Element, { className }: ChevronProps) => (
	<svg
		className={className || 'h-6 w-6'}
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

export const ChevronLeftIcon = (props: ChevronProps) =>
	chevronBase(<path d="M15 6l-6 6 6 6" />, props);

export const ChevronRightIcon = (props: ChevronProps) =>
	chevronBase(<path d="M9 6l6 6-6 6" />, props);

export const ClockIcon = (props: UiIconProps) =>
	uiIcon(BookingClockIcon, props);

export const MapPinIcon = (props: UiIconProps) =>
	uiIcon(BookingLocationIcon, props);

export const PaymentIcon = (props: UiIconProps) =>
	uiIcon(PaymentModeIcon, { size: 24, ...props });

export const DocumentIcon = (props: UiIconProps) =>
	uiIcon(AttachmentFileIcon, { size: 24, ...props });
