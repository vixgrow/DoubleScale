/**
 * Internal dependencies
 */
import {
	SET_AUTOMATION,
	UPDATE_AUTOMATION,
	UPDATE_SETTINGS,
	SET_STEPS,
	ADD_STEP,
	REMOVE_STEP,
	UPDATE_STEP,
	SET_UPDATED_STEPS,
} from './constants';
import type { Automation, AutomationStep } from '@doublescale/client';

export type setAutomation = {
	type: typeof SET_AUTOMATION;
	automation: Automation;
};

export type updateAutomation = {
	type: typeof UPDATE_AUTOMATION;
	payload: Partial<Automation>;
};

export type updateSettings = {
	type: typeof UPDATE_SETTINGS;
	key: keyof Automation['settings'];
	value: Automation['settings'][keyof Automation['settings']];
};

export type setSteps = {
	type: typeof SET_STEPS;
	steps: AutomationStep[];
};

export type addStep = {
	type: typeof ADD_STEP;
	step: AutomationStep;
};

export type removeStep = {
	type: typeof REMOVE_STEP;
	stepId: number;
};

export type updateStep = {
	type: typeof UPDATE_STEP;
	stepId: number;
	payload: Partial<AutomationStep>;
};

export type setUpdatedSteps = {
	type: typeof SET_UPDATED_STEPS;
	steps: {
		[stepId: number]: Partial<AutomationStep>;
	};
};

export type AutomationAction =
	| setAutomation
	| updateAutomation
	| updateSettings;

export type StepAction = setSteps | addStep | removeStep | updateStep;
