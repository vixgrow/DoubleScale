import React from 'react';
export type PageSettings = {
	path: string;
	exact?: boolean;
	component: React.FC | JSX.Element | React.Component;
	requiresInitialPayload?: boolean;
	label: string;
	icon?: React.ReactNode;
	hidden?: boolean;
	requiredCapability?: string;
};
export type Pages = Record<string, PageSettings>;
