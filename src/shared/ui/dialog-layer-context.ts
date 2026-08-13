import * as React from 'react';

/**
 * The fixed inset wrapper that owns a dialog's stacking context.
 * Portaled Select / Popover / Dropdown menus should render here so they
 * stack with the dialog instead of behind it on document.body.
 */
export const DialogLayerContext = React.createContext<HTMLElement | null>(
	null
);

export function useDialogLayerContainer(): HTMLElement | undefined {
	return React.useContext(DialogLayerContext) ?? undefined;
}
