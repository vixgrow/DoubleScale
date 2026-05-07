/**
 * Internal dependencies
 */
import type { Automation, AutomationStep } from '@doublescale/client';
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
import type { AutomationAction, StepAction, setUpdatedSteps } from './types';

export default (
	dispatch: React.Dispatch<AutomationAction | StepAction | setUpdatedSteps>
) => {
	return {
		setAutomation: (automation: Automation) => {
			dispatch({
				type: SET_AUTOMATION,
				automation,
			});
		},
		updateAutomation: (payload: Partial<Automation>) => {
			dispatch({
				type: UPDATE_AUTOMATION,
				payload,
			});
		},
		updateSettings: (
			key: keyof Automation['settings'],
			value: Automation['settings'][keyof Automation['settings']]
		) => {
			dispatch({
				type: UPDATE_SETTINGS,
				key,
				value,
			});
		},
		setUpdatedSteps: (steps: {
			[stepId: number]: Partial<AutomationStep>;
		}) => {
			dispatch({
				type: SET_UPDATED_STEPS,
				steps,
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
		updateStep: (stepId: number, payload: Partial<AutomationStep>) => {
			dispatch({
				type: UPDATE_STEP,
				stepId,
				payload,
			});
		},
	};
};
