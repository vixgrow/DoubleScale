import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { __ } from '@wordpress/i18n';

import { cn } from '@/lib/utils';
import { DialogLayerContext } from '@/components/ui/dialog-layer-context';

const Dialog = DialogPrimitive.Root;

const DialogTrigger = DialogPrimitive.Trigger;

const DialogPortal = DialogPrimitive.Portal;

const DialogClose = DialogPrimitive.Close;

/** Radix default layer; every dialog stacks at least one step above it. */
const BASE_DIALOG_Z_INDEX = 50;

const DialogOverlay = React.forwardRef<
	React.ElementRef<typeof DialogPrimitive.Overlay>,
	React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
	<DialogPrimitive.Overlay
		ref={ref}
		className={cn(
			'pointer-events-auto fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
			className
		)}
		{...props}
	/>
));
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

/**
 * Page-level shells (contact page, import wizard, automation editor…) fill the
 * viewport instead of being centered. Match on whole class tokens so that a
 * centered modal merely clamped with `max-h-screen` is not mistaken for one.
 */
function isFullscreenDialogShell(className?: string) {
	if (!className) {
		return false;
	}
	return (
		/(?:^|\s)!?(?:inset-0|w-screen|h-screen|h-\[100dvh\])(?=\s|$)/.test(
			className
		) || className.includes('doublescale-automation-editor-dialog')
	);
}

/**
 * Call sites declare their layer inconsistently — Tailwind `z-[150200]`
 * classes, inline `style.zIndex`, or nothing. Read every source and return one
 * step above the highest, so the panel also clears sibling overlays that some
 * call sites still render themselves next to `DialogContent`.
 */
function resolveLayerZIndex(
	className?: string,
	overlayClassName?: string,
	style?: React.CSSProperties,
	overlayStyle?: React.CSSProperties
) {
	let highest = BASE_DIALOG_Z_INDEX;

	for (const value of [className, overlayClassName]) {
		if (!value) {
			continue;
		}
		for (const match of value.matchAll(/\bz-\[(\d+)\]/g)) {
			highest = Math.max(highest, Number.parseInt(match[1], 10));
		}
	}

	for (const value of [style?.zIndex, overlayStyle?.zIndex]) {
		const parsed =
			typeof value === 'number' ? value : Number.parseInt(`${value}`, 10);
		if (Number.isFinite(parsed)) {
			highest = Math.max(highest, parsed);
		}
	}

	return highest + 1;
}

/** The layer lives on the wrapper, so z-index classes below it are noise. */
function stripZIndexClasses(className?: string) {
	if (!className) {
		return className;
	}
	return className
		.replace(/(?:^|\s)!?-?z-(?:\[[^\]]*\]|\d+|auto)(?=\s|$)/g, ' ')
		.replace(/\s+/g, ' ')
		.trim();
}

/**
 * Old LTR centering used !translate-x/y-[-50%] against `left-50%`. The panel is
 * flex-centered now, so those shifts push it off screen — worse under RTL,
 * where `rtlcss` flips `left` but not the translate.
 */
function stripLegacyCenterTranslate(className?: string) {
	if (!className) {
		return className;
	}
	return className
		.replace(
			/(?:max-sm:)?!?-?translate-[xy]-(?:\[-50%\]|1\/2|0)(?=\s|$)/g,
			''
		)
		.replace(/(?:max-sm:)?!top-4(?=\s|$)/g, '')
		.replace(/\s+/g, ' ')
		.trim();
}

const DialogContent = React.forwardRef<
	React.ElementRef<typeof DialogPrimitive.Content>,
	React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & {
		removePortal?: boolean;
		hideCloseButton?: boolean;
		/** Skip the built-in backdrop when the call site renders its own. */
		hideOverlay?: boolean;
		/** Merged into the backdrop, e.g. `bg-black/45` for nested dialogs. */
		overlayClassName?: string;
		overlayStyle?: React.CSSProperties;
	}
>(
	(
		{
			className,
			children,
			removePortal,
			hideCloseButton,
			hideOverlay,
			overlayClassName,
			overlayStyle,
			style,
			...props
		},
		ref
	) => {
		const fullscreen = isFullscreenDialogShell(className);
		const layerZIndex = resolveLayerZIndex(
			className,
			overlayClassName,
			style,
			overlayStyle
		);
		const [layerEl, setLayerEl] = React.useState<HTMLDivElement | null>(
			null
		);

		const tree = (
			<DialogLayerContext.Provider value={layerEl}>
				{/* The wrapper owns the layer, so the backdrop and the panel share a
				    single stacking context and the panel can never end up behind it.
				    `pointer-events-none` is required: with `removePortal` this stays
				    mounted while closed, and a bare `fixed inset-0` would otherwise
				    swallow every click on the page underneath.
				    Select/Popover portal here (not into Content) so overflow-hidden
				    on the panel cannot clip them, and they stack above this dialog. */}
				<div
					ref={setLayerEl}
					className="pointer-events-none fixed inset-0"
					style={{ zIndex: layerZIndex }}
					data-doublescale-dialog-layer=""
				>
				{!hideOverlay && (
					<DialogOverlay
						className={cn(
							stripZIndexClasses(overlayClassName),
							'!absolute !inset-0'
						)}
						style={{ ...overlayStyle, zIndex: 0 }}
					/>
				)}
				<div
					className={cn(
						'pointer-events-none absolute inset-0 z-[1]',
						!fullscreen &&
							'flex items-center justify-center p-4 max-sm:p-2'
					)}
				>
					<DialogPrimitive.Content
						ref={ref}
						aria-describedby={undefined}
						data-doublescale-dialog-center={
							fullscreen ? undefined : ''
						}
						className={cn(
							fullscreen
								? 'pointer-events-auto fixed inset-0 duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0'
								: // Flex-centered: no left/translate, so WP rtlcss flipping is a no-op.
									'pointer-events-auto relative z-[1] grid w-full max-w-lg gap-4 border bg-white p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 sm:rounded-lg',
							fullscreen
								? className
								: stripLegacyCenterTranslate(className)
						)}
						style={style}
						onOpenAutoFocus={(e) => {
							// Allow WordPress media modal to maintain focus
							if (document.querySelector('.media-modal')) {
								e.preventDefault();
							}
						}}
						{...props}
					>
						<DialogPrimitive.Title className="sr-only">
							{__('Dialog', 'doublescale')}
						</DialogPrimitive.Title>
						{children}
						{!hideCloseButton && (
							<DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm text-black opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
								<X className="h-6 w-6" />
								<span className="sr-only">
									{__('Close', 'doublescale')}
								</span>
							</DialogPrimitive.Close>
						)}
					</DialogPrimitive.Content>
				</div>
				</div>
			</DialogLayerContext.Provider>
		);

		if (removePortal) {
			return tree;
		}

		return <DialogPortal>{tree}</DialogPortal>;
	}
);
DialogContent.displayName = DialogPrimitive.Content.displayName;

const DialogHeader = ({
	className,
	...props
}: React.HTMLAttributes<HTMLDivElement>) => (
	<div
		className={cn('flex flex-col text-center sm:text-left', className)}
		{...props}
	/>
);
DialogHeader.displayName = 'DialogHeader';

const DialogFooter = ({
	className,
	...props
}: React.HTMLAttributes<HTMLDivElement>) => (
	<div
		className={cn(
			'flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2',
			className
		)}
		{...props}
	/>
);
DialogFooter.displayName = 'DialogFooter';

const DialogTitle = React.forwardRef<
	React.ElementRef<typeof DialogPrimitive.Title>,
	React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
	<DialogPrimitive.Title
		ref={ref}
		className={cn(
			'text-lg font-semibold leading-none tracking-tight',
			className
		)}
		{...props}
	/>
));
DialogTitle.displayName = DialogPrimitive.Title.displayName;

const DialogDescription = React.forwardRef<
	React.ElementRef<typeof DialogPrimitive.Description>,
	React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
	<DialogPrimitive.Description
		ref={ref}
		className={cn('text-sm text-muted-foreground', className)}
		{...props}
	/>
));
DialogDescription.displayName = DialogPrimitive.Description.displayName;

export {
	Dialog,
	DialogPortal,
	DialogOverlay,
	DialogTrigger,
	DialogClose,
	DialogContent,
	DialogHeader,
	DialogFooter,
	DialogTitle,
	DialogDescription,
};
