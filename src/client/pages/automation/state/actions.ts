/**
 * Internal dependencies
 */
import type { Automation, AutomationStep } from '@quillcrm/client';
import {
	SET_AUTOMATION,
	UPDATE_AUTOMATION,
	UPDATE_SETTINGS,
	SET_STEPS,
	ADD_STEP,
	REMOVE_STEP,
	UPDATE_STEP,
} from './constants';
import type { AutomationAction, StepAction } from './types';

export default (dispatch: React.Dispatch<AutomationAction | StepAction>) => {
	return {
		setAutomation: (automation: Automation) => {
			dispatch({
				type: SET_AUTOMATION,
				automation,
			});
		},
		updateAutomation: (payload: Record<string, any>) => {
			dispatch({
				type: UPDATE_AUTOMATION,
				payload,
			});
		},
		updateSettings: (key: string, value: any) => {
			dispatch({
				type: UPDATE_SETTINGS,
				key,
				value,
			});
		},
		setSteps: (steps: AutomationStep[]) => {
			dispatch({
				type: SET_STEPS,
				steps,
			});
		},
		addStep: (step: AutomationStep) => {
			dispatch({
				type: ADD_STEP,
				step,
			});
		},
		removeStep: (stepId: number) => {
			dispatch({
				type: REMOVE_STEP,
				stepId,
			});
		},
		updateStep: (stepId: number, payload: Record<string, any>) => {
			dispatch({
				type: UPDATE_STEP,
				stepId,
				payload,
			});
		},
	};
};
