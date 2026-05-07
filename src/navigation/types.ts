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
	/** When set, the page is registered only if this module exists in admin config and is enabled. */
	requiresModule?: string;
};
export type Pages = Record<string, PageSettings>;
