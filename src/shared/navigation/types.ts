import React from 'react';
export type PageSettings = {
	path: string;
	exact?: boolean;
	component: React.FC | JSX.Element | React.Component;
	requiresInitialPayload?: boolean;
	label: string;
	icon?: React.ReactNode;
	hidden?: boolean;
	requiredCapability?: string[];
	/**
	 * Module slug for runtime gating (sidebar, filtered routes, ProtectedRoute).
	 * By default the page is not added to the registry when this module is off unless
	 * {@link alwaysRegister} is set.
	 */
	requiresModule?: string;
	/**
	 * When true, always add the page to the registry even if {@link requiresModule} is disabled.
	 * Runtime visibility still uses {@link requiresModule} (routes, sidebar, {@see ProtectedRoute}).
	 * Used for SMTP so turning the module on after load does not require a full reload.
	 */
	alwaysRegister?: boolean;
};
export type Pages = Record<string, PageSettings>;
