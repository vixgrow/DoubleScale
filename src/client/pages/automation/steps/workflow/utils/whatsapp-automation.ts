/**
 * Helpers for Send WhatsApp automation steps.
 */
import type { AutomationStep } from '@doublescale/client';

export type WhatsAppTemplateSettings = {
	message_type?: 'template' | 'text';
	body?: string;
	template_sid?: string;
	template_variables?: Record<string, string>;
};

export function isFreeformWhatsappStep(step: AutomationStep): boolean {
	return (
		step.action === 'send_whatsapp' &&
		step.settings?.whatsapp_template?.message_type === 'text'
	);
}

export function resetFreeformWhatsappSettings(
	settings: Record<string, unknown> = {}
): Record<string, unknown> {
	const whatsappTemplate = settings.whatsapp_template as
		| WhatsAppTemplateSettings
		| undefined;

	if (!whatsappTemplate || whatsappTemplate.message_type !== 'text') {
		return settings;
	}

	return {
		...settings,
		whatsapp_template: {
			message_type: 'template',
			template_sid: '',
			template_variables: {},
			body: '',
		},
	};
}

export function getFreeformWhatsappSteps(
	steps: AutomationStep[]
): AutomationStep[] {
	return steps.filter(isFreeformWhatsappStep);
}
