/**
 * No-op stub when DoubleScale Pro is not present in the build tree.
 */
import type { TicketPriority } from '@/constants/support';
import type { SupportCustomFieldDefinition } from '@/types/support';

export interface PortalNewTicketCustomFieldsContext {
	title: string;
	content: string;
	priority?: TicketPriority | string;
}

export interface PortalNewTicketCustomFieldsBlockProps {
	scope: 'admin' | 'portal';
	context: PortalNewTicketCustomFieldsContext;
	customData: Record<string, unknown>;
	onCustomDataChange: (next: Record<string, unknown>) => void;
	errors: Record<string, string>;
	onErrorsChange: (next: Record<string, string>) => void;
	onDefinitionsChange?: (defs: SupportCustomFieldDefinition[]) => void;
}

export const PortalNewTicketCustomFieldsBlock = (): null => null;

export const preparePortalNewTicketCustomData = (
	_scope: 'admin' | 'portal',
	_defs: SupportCustomFieldDefinition[],
	customData: Record<string, unknown>,
	_context: Record<string, unknown>
): { payload: Record<string, unknown>; errors: Record<string, string> } => ({
	payload: customData,
	errors: {},
});
