import * as React from 'react';
import * as SelectPrimitive from '@radix-ui/react-select';
import { Check, ChevronDown, ChevronUp } from 'lucide-react';

import { cn } from '@/lib/utils';
import { useDialogLayerContainer } from '@/components/ui/dialog-layer-context';
import {
	FLOATING_LAYER_Z_INDEX,
	liftRadixPopper,
	mergeNodeRefs,
} from '@/components/ui/lift-radix-popper';

const Select = SelectPrimitive.Root;

const SelectGroup = SelectPrimitive.Group;

const SelectValue = SelectPrimitive.Value;

const SelectTrigger = React.forwardRef<
	React.ElementRef<typeof SelectPrimitive.Trigger>,
	React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
	<SelectPrimitive.Trigger
		ref={ref}
		className={cn(
			'flex h-10 w-full items-center justify-between whitespace-nowrap rounded-lg border border-border bg-card px-3.5 py-2 text-sm ring-offset-background data-[placeholder]:text-muted-foreground focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1',
			className
		)}
		{...props}
	>
		{children}
		<SelectPrimitive.Icon asChild>
			<ChevronDown className="h-4 w-4 opacity-50" />
		</SelectPrimitive.Icon>
	</SelectPrimitive.Trigger>
));
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName;

const SelectScrollUpButton = React.forwardRef<
	React.ElementRef<typeof SelectPrimitive.ScrollUpButton>,
	React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollUpButton>
>(({ className, ...props }, ref) => (
	<SelectPrimitive.ScrollUpButton
		ref={ref}
		className={cn(
			'flex cursor-default items-center justify-center py-1',
			className
		)}
		{...props}
	>
		<ChevronUp className="h-4 w-4" />
	</SelectPrimitive.ScrollUpButton>
));
SelectScrollUpButton.displayName = SelectPrimitive.ScrollUpButton.displayName;

const SelectScrollDownButton = React.forwardRef<
	React.ElementRef<typeof SelectPrimitive.ScrollDownButton>,
	React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollDownButton>
>(({ className, ...props }, ref) => (
	<SelectPrimitive.ScrollDownButton
		ref={ref}
		className={cn(
			'flex cursor-default items-center justify-center py-1',
			className
		)}
		{...props}
	>
		<ChevronDown className="h-4 w-4" />
	</SelectPrimitive.ScrollDownButton>
));
SelectScrollDownButton.displayName =
	SelectPrimitive.ScrollDownButton.displayName;

const SelectContent = React.forwardRef<
	React.ElementRef<typeof SelectPrimitive.Content>,
	React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content> & {
		container?: HTMLElement | null;
	}
>(
	(
		{
			className,
			children,
			position = 'popper',
			container: containerProp,
			...props
		},
		ref
	) => {
		const dialogContainer = useDialogLayerContainer();
		const contentRef = React.useCallback((node: HTMLElement | null) => {
			liftRadixPopper(node, FLOATING_LAYER_Z_INDEX);
		}, []);

		return (
			<SelectPrimitive.Portal
				container={containerProp ?? dialogContainer}
			>
				<SelectPrimitive.Content
					ref={mergeNodeRefs(ref, contentRef)}
					className={cn(
						// Nested dialogs sit at z-[1800000]. Inner classes cannot
						// lift [data-radix-popper-content-wrapper], so we portal
						// into the dialog layer and also force that wrapper.
						'pointer-events-auto relative z-[2000000] max-h-[--radix-select-content-available-height] min-w-[8rem] overflow-y-auto overflow-x-hidden rounded-xl border border-border/60 bg-popover text-popover-foreground shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-[--radix-select-content-transform-origin]',
						position === 'popper' &&
							'data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1',
						className
					)}
					position={position}
					onCloseAutoFocus={(event) => event.preventDefault()}
					{...props}
				>
					<SelectScrollUpButton />
					<SelectPrimitive.Viewport
						className={cn(
							'p-1',
							position === 'popper' &&
								'min-h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]'
						)}
					>
						{children}
					</SelectPrimitive.Viewport>
					<SelectScrollDownButton />
				</SelectPrimitive.Content>
			</SelectPrimitive.Portal>
		);
	}
);
SelectContent.displayName = SelectPrimitive.Content.displayName;

const SelectLabel = React.forwardRef<
	React.ElementRef<typeof SelectPrimitive.Label>,
	React.ComponentPropsWithoutRef<typeof SelectPrimitive.Label>
>(({ className, ...props }, ref) => (
	<SelectPrimitive.Label
		ref={ref}
		className={cn('px-2 py-1.5 text-sm font-semibold', className)}
		{...props}
	/>
));
SelectLabel.displayName = SelectPrimitive.Label.displayName;

const SelectItem = React.forwardRef<
	React.ElementRef<typeof SelectPrimitive.Item>,
	React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item> & {
		/** When set, `children` render outside `ItemText` (e.g. icons). Only `itemLabel` is mirrored in the trigger via `SelectValue`. */
		itemLabel?: string;
		itemHint?: React.ReactNode;
	}
>(
	(
		{ className, children, itemLabel, itemHint, textValue, ...props },
		ref
	) => (
		<SelectPrimitive.Item
			ref={ref}
			className={cn(
				'relative flex w-full cursor-default select-none rounded-lg py-2 pl-3 pr-8 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
				itemLabel !== undefined ? 'items-start' : 'items-center',
				className
			)}
			textValue={itemLabel ?? textValue}
			onPointerDown={(event) => event.preventDefault()}
			{...props}
		>
			<span className="absolute right-2 top-2 flex h-3.5 w-3.5 items-center justify-center">
				<SelectPrimitive.ItemIndicator>
					<Check className="h-4 w-4" />
				</SelectPrimitive.ItemIndicator>
			</span>
			{itemLabel !== undefined ? (
				<span className="flex w-full min-w-0 flex-1 items-start gap-3 pr-1">
					{children}
					<span className="flex min-w-0 flex-1 flex-col gap-0.5 text-left">
						<SelectPrimitive.ItemText className="truncate font-medium leading-tight">
							{itemLabel}
						</SelectPrimitive.ItemText>
						{itemHint ? (
							<span className="text-xs [&_svg]:inline [&_svg]:shrink-0">
								{itemHint}
							</span>
						) : null}
					</span>
				</span>
			) : (
				<SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
			)}
		</SelectPrimitive.Item>
	)
);
SelectItem.displayName = SelectPrimitive.Item.displayName;

const SelectSeparator = React.forwardRef<
	React.ElementRef<typeof SelectPrimitive.Separator>,
	React.ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>
>(({ className, ...props }, ref) => (
	<SelectPrimitive.Separator
		ref={ref}
		className={cn('-mx-1 my-1 h-px bg-muted', className)}
		{...props}
	/>
));
SelectSeparator.displayName = SelectPrimitive.Separator.displayName;

export {
	Select,
	SelectGroup,
	SelectValue,
	SelectTrigger,
	SelectContent,
	SelectLabel,
	SelectItem,
	SelectSeparator,
	SelectScrollUpButton,
	SelectScrollDownButton,
};
