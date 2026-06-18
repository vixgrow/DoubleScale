/**
 * Contracts portal flags from localized config.
 */

import { getPortalConfig } from './config';

export const isContractsPortalModuleEnabled = (): boolean =>
	Boolean(getPortalConfig()?.contracts_module_enabled);

export const isContractsPortalProActive = (): boolean =>
	Boolean(getPortalConfig()?.contracts_pro_active);
