/**
 * Invoices & payments portal flags from localized config.
 */

import { getPortalConfig } from './config';

export const isInvoicesPaymentsPortalProActive = (): boolean =>
	Boolean(getPortalConfig()?.invoices_payments_pro_active);
