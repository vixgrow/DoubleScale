import type { InitialPayload } from './initial-payload';

export type ConfigData = Record<string, unknown> & {
	initialPayload: InitialPayload;
	adminUrl: string;
	pluginDirUrl: string;
	adminEmail: string;
	ajaxUrl: string;
	nonce: string;
};
