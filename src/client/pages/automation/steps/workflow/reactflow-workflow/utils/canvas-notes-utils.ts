/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';

/**
 * Internal dependencies
 */
import type { Automation, CanvasNote } from '@doublescale/client';

export const getCanvasNotes = (automation?: Automation | null): CanvasNote[] => {
	const notes = automation?.settings?.canvas_notes;
	return Array.isArray(notes) ? notes : [];
};

export const createCanvasNote = (position: {
	x: number;
	y: number;
}): CanvasNote => ({
	id:
		typeof crypto !== 'undefined' && crypto.randomUUID
			? crypto.randomUUID()
			: `note-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
	content: '',
	position,
});

export const saveCanvasNotes = async (
	automation: Automation,
	notes: CanvasNote[],
	updateAutomation: (payload: Partial<Automation>) => void
): Promise<void> => {
	const updatedAutomation: Automation = {
		...automation,
		settings: {
			...automation.settings,
			canvas_notes: notes,
		},
	};

	updateAutomation(updatedAutomation);

	await apiFetch({
		path: `/doublescale/v1/automations/${automation.id}`,
		method: 'POST',
		data: updatedAutomation,
	});
};

export const updateStepCustomLabel = async (
	step: import('@doublescale/client').AutomationStep,
	customLabel: string,
	steps: import('@doublescale/client').AutomationStep[],
	setSteps: (steps: import('@doublescale/client').AutomationStep[]) => void,
	updateStep: (
		stepId: number,
		payload: Partial<import('@doublescale/client').AutomationStep>
	) => void,
	createNotice: (notice: { type: string; message: string }) => void
): Promise<void> => {
	const settings = { ...(step.settings || {}) };
	const trimmed = customLabel.trim();

	if (trimmed) {
		settings.custom_label = trimmed;
	} else {
		delete settings.custom_label;
	}

	try {
		const response = (await apiFetch({
			path: `/doublescale/v1/automation-steps/${step.id}`,
			method: 'POST',
			data: {
				...step,
				settings,
				status: 'active',
			},
		})) as import('@doublescale/client').AutomationStep;

		updateStep(response.id, response);
		setSteps(steps.map((item) => (item.id === response.id ? response : item)));

		createNotice({
			type: 'success',
			message: trimmed
				? __('Action renamed', 'doublescale')
				: __('Action name reset', 'doublescale'),
		});
	} catch (error: any) {
		createNotice({
			type: 'error',
			message:
				error?.message || __('Failed to rename action', 'doublescale'),
		});
		throw error;
	}
};
