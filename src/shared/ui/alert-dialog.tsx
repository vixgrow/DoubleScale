import * as React from "react"
import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

const AlertDialog = AlertDialogPrimitive.Root

const AlertDialogTrigger = AlertDialogPrimitive.Trigger

const AlertDialogPortal = AlertDialogPrimitive.Portal

/** Radix default layer; every dialog stacks at least one step above it. */
const BASE_ALERT_DIALOG_Z_INDEX = 50

const AlertDialogOverlay = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Overlay
    className={cn(
      "pointer-events-auto fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    {...props}
    ref={ref}
  />
))
AlertDialogOverlay.displayName = AlertDialogPrimitive.Overlay.displayName

/** See dialog.tsx — one step above every declared layer, including sibling overlays. */
function resolveLayerZIndex(
  className?: string,
  overlayClassName?: string,
  style?: React.CSSProperties
) {
  let highest = BASE_ALERT_DIALOG_Z_INDEX

  for (const value of [className, overlayClassName]) {
    if (!value) continue
    for (const match of value.matchAll(/\bz-\[(\d+)\]/g)) {
      highest = Math.max(highest, Number.parseInt(match[1], 10))
    }
  }

  const inline =
    typeof style?.zIndex === "number"
      ? style.zIndex
      : Number.parseInt(`${style?.zIndex}`, 10)
  if (Number.isFinite(inline)) highest = Math.max(highest, inline)

  return highest + 1
}

/** See dialog.tsx — the layer lives on the wrapper, so z-index classes below it are noise. */
function stripZIndexClasses(className?: string) {
  if (!className) return className
  return className
    .replace(/(?:^|\s)!?-?z-(?:\[[^\]]*\]|\d+|auto)(?=\s|$)/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

/** See dialog.tsx — strip legacy !translate centering hacks. */
function stripLegacyCenterTranslate(className?: string) {
  if (!className) return className
  return className
    .replace(
      /(?:max-sm:)?!?-?translate-[xy]-(?:\[-50%\]|1\/2|0)(?=\s|$)/g,
      ""
    )
    .replace(/(?:max-sm:)?!top-4(?=\s|$)/g, "")
    .replace(/\s+/g, " ")
    .trim()
}

const AlertDialogContent = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Content> & {
    /** Merged into `AlertDialogOverlay` (e.g. `bg-black/45` for nested dialogs). */
    overlayClassName?: string
  }
>(({ className, overlayClassName, style, ...props }, ref) => (
  <AlertDialogPortal>
    {/* The wrapper owns the layer, so the backdrop and the panel share a single
        stacking context and the panel can never end up behind it. */}
    <div
      className="pointer-events-none fixed inset-0"
      style={{ zIndex: resolveLayerZIndex(className, overlayClassName, style) }}
    >
      <AlertDialogOverlay
        className={cn(stripZIndexClasses(overlayClassName), "!absolute !inset-0")}
        style={{ zIndex: 0 }}
      />
      <div className="pointer-events-none absolute inset-0 z-[1] flex items-center justify-center p-4 max-sm:p-2">
        <AlertDialogPrimitive.Content
          ref={ref}
          data-doublescale-dialog-center=""
          className={cn(
            // Flex-centered: no left/translate, so WP rtlcss flipping is a no-op.
            "pointer-events-auto relative z-[1] grid w-full max-w-lg gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 sm:rounded-lg",
            stripLegacyCenterTranslate(className)
          )}
          style={style}
          {...props}
        />
      </div>
    </div>
  </AlertDialogPortal>
))
AlertDialogContent.displayName = AlertDialogPrimitive.Content.displayName

const AlertDialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-2 text-center sm:text-left",
      className
    )}
    {...props}
  />
)
AlertDialogHeader.displayName = "AlertDialogHeader"

const AlertDialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
      className
    )}
    {...props}
  />
)
AlertDialogFooter.displayName = "AlertDialogFooter"

const AlertDialogTitle = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Title
    ref={ref}
    className={cn("text-lg font-semibold", className)}
    {...props}
  />
))
AlertDialogTitle.displayName = AlertDialogPrimitive.Title.displayName

const AlertDialogDescription = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
AlertDialogDescription.displayName =
  AlertDialogPrimitive.Description.displayName

const AlertDialogAction = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Action>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Action>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Action
    ref={ref}
    className={cn(buttonVariants(), className)}
    {...props}
  />
))
AlertDialogAction.displayName = AlertDialogPrimitive.Action.displayName

const AlertDialogCancel = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Cancel>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Cancel>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Cancel
    ref={ref}
    className={cn(
      buttonVariants({ variant: "outline" }),
      "mt-2 sm:mt-0",
      className
    )}
    {...props}
  />
))
AlertDialogCancel.displayName = AlertDialogPrimitive.Cancel.displayName

export {
  AlertDialog,
  AlertDialogPortal,
  AlertDialogOverlay,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
}
