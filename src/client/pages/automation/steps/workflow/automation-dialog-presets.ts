/**
 * External dependencies
 */
import { cn } from '@/lib/utils';

/** Backdrop for stacked automation UI (under sidebar z-[150400]). */
export const automationModalOverlayClassName = cn(
	'z-[150299] bg-slate-950/60 backdrop-blur-[2px]'
);

const automationDialogSurfaceCore = cn(
	'flex flex-col gap-0 overflow-hidden p-0',
	'rounded-2xl border border-border/50 bg-card',
	'shadow-[0_22px_60px_-18px_rgba(15,23,42,0.28)] ring-1 ring-black/[0.04] dark:ring-white/[0.06]'
);

/** Large builders (conditions, journey). */
export const automationDialogSurfaceWide = cn(
	automationDialogSurfaceCore,
	'z-[150300] max-h-[min(90vh,920px)] w-[min(96vw,1140px)] max-w-[min(96vw,1140px)]'
);

/** Add step and similar pickers. */
export const automationDialogSurfaceMedium = cn(
	automationDialogSurfaceCore,
	'z-[150300] max-h-[min(90vh,880px)] w-[min(96vw,800px)] max-w-[min(96vw,800px)]'
);

/** Upsell / compact dialogs. */
export const automationDialogSurfaceCompact = cn(
	automationDialogSurfaceCore,
	'z-[150300] max-w-[min(96vw,520px)]'
);

export const automationDialogAccentBarClassName = cn(
	'h-1 w-full shrink-0 bg-gradient-to-r from-indigo-600 via-sky-500 to-violet-600'
);

export const automationDialogHeaderClassName = cn(
	'shrink-0 space-y-0 border-b border-border/50 bg-gradient-to-br from-muted/80 via-muted/40 to-transparent',
	'px-6 py-5 text-left sm:px-8 sm:py-6 sm:text-left'
);

export const automationDialogBodyClassName = cn(
	'min-h-0 flex-1 overflow-y-auto px-6 py-5 sm:px-8 sm:py-6'
);

export const automationDialogFooterClassName = cn(
	'shrink-0 border-t border-border/50 bg-muted/25 px-6 py-4 sm:px-8'
);

/** Confirm / delete dialogs on the canvas. */
export const automationAlertDialogContentClassName = cn(
	'z-[150310] max-w-md rounded-2xl border-border/50 bg-card p-6 shadow-2xl',
	'ring-1 ring-black/[0.04] dark:ring-white/[0.06]'
);
