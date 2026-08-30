/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';

/**
 * Internal dependencies
 */
import type { Automation, AutomationStep, CanvasNote } from '@doublescale/client';
import {
	buildConditionSettings,
	getConditionCustomLabel,
	setConditionCustomLabel,
} from '@doublescale/utils';

const getStepTypeLabel = (type: string): string => {
	switch (type) {
		case 'goal':
			return __('Goal', 'doublescale');
		case 'condition':
			return __('Condition', 'doublescale');
		case 'delay':
			return __('Delay', 'doublescale');
		default:
			return __('Action', 'doublescale');
	}
};

export const DEFAULT_CANVAS_NOTE_WIDTH = 220;
export const DEFAULT_CANVAS_NOTE_HEIGHT = 160;
export const MIN_CANVAS_NOTE_WIDTH = 180;
export const MIN_CANVAS_NOTE_HEIGHT = 120;
export const MAX_CANVAS_NOTE_WIDTH = 720;
export const MAX_CANVAS_NOTE_HEIGHT = 640;

const clamp = (value: number, min: number, max: number): number =>
	Math.min(max, Math.max(min, Math.round(value)));

export const getCanvasNoteSize = (
	note?: Pick<CanvasNote, 'width' | 'height'> | null
): { width: number; height: number } => ({
	width:
		note?.width && note.width > 0
			? clamp(note.width, MIN_CANVAS_NOTE_WIDTH, MAX_CANVAS_NOTE_WIDTH)
			: DEFAULT_CANVAS_NOTE_WIDTH,
	height:
		note?.height && note.height > 0
			? clamp(note.height, MIN_CANVAS_NOTE_HEIGHT, MAX_CANVAS_NOTE_HEIGHT)
			: DEFAULT_CANVAS_NOTE_HEIGHT,
});

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
	width: DEFAULT_CANVAS_NOTE_WIDTH,
	height: DEFAULT_CANVAS_NOTE_HEIGHT,
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
	step: AutomationStep,
	customLabel: string,
	steps: AutomationStep[],
	setSteps: (steps: AutomationStep[]) => void,
	updateStep: (stepId: number, payload: Partial<AutomationStep>) => void,
	createNotice: (notice: { type: string; message: string }) => void
): Promise<void> => {
	const trimmed = customLabel.trim();
	const stepLabel = getStepTypeLabel(step.type);
	let settings: AutomationStep['settings'];

	if (step.type === 'condition') {
		settings = setConditionCustomLabel(step.settings, customLabel);
	} else {
		settings = { ...(step.settings || {}) };
		if (trimmed) {
			settings.custom_label = trimmed;
		} else {
			delete settings.custom_label;
		}
	}

	try {
		const response = (await apiFetch({
			path: `/doublescale/v1/automation-steps/${step.id}`,
			method: 'POST',
			data: {
				...step,
				settings,
				status: step.status,
			},
		})) as AutomationStep;

		updateStep(response.id, response);
		setSteps(steps.map((item) => (item.id === response.id ? response : item)));

		createNotice({
			type: 'success',
			message: trimmed
				? sprintf(__('%s renamed', 'doublescale'), stepLabel)
				: sprintf(__('%s name reset', 'doublescale'), stepLabel),
		});
	} catch (error: any) {
		createNotice({
			type: 'error',
			message:
				error?.message ||
				sprintf(__('Failed to rename %s', 'doublescale'), stepLabel.toLowerCase()),
		});
		throw error;
	}
};

export { buildConditionSettings, getConditionCustomLabel };
