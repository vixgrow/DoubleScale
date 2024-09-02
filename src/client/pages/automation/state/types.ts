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
} from './constants';
import type { Automation, AutomationStep } from '../../types';

export type setAutomation = {
	type: typeof SET_AUTOMATION;
	automation: Automation;
};

export type updateAutomation = {
	type: typeof UPDATE_AUTOMATION;
	payload: {
		[key: string]: any;
	};
};

export type updateSettings = {
	type: typeof UPDATE_SETTINGS;
	key: string;
	value: any;
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
	payload: {
		[key: string]: any;
	};
};

export type AutomationAction =
	| setAutomation
	| updateAutomation
	| updateSettings;

export type StepAction = setSteps | addStep | removeStep | updateStep;
