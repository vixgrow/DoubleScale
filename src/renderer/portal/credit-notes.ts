/**
 * Credit Notes portal flags from localized config.
 */

import { getPortalConfig } from './config';

export const isCreditNotesPortalModuleEnabled = (): boolean =>
	Boolean(getPortalConfig()?.credit_notes_module_enabled);

export const isCreditNotesPortalProActive = (): boolean =>
	Boolean(getPortalConfig()?.credit_notes_pro_active);

export const getCreditNotePublicRestUrl = (): string | undefined =>
	getPortalConfig()?.credit_note_public_rest_url;
