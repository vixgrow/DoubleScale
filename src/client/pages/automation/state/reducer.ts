/**
 * WordPress Dependencies
 */
import { combineReducers } from '@wordpress/data';

/**
 * External dependencies
 */
import type { Reducer } from 'redux';
import { isObject } from 'lodash';

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
import type { Automation, AutomationStep } from '@quillcrm/client';
import type { AutomationAction, StepAction } from './types';

const automation = (
	state: Automation | null = null,
	action: AutomationAction
) => {
	switch (action.type) {
		case SET_AUTOMATION:
			return action.automation;
		case UPDATE_AUTOMATION:
			return {
				...state,
				...action.payload,
			};
		case UPDATE_SETTINGS:
			if (!state) {
				return state;
			}
			const newSettings = isObject(state.settings)
				? { ...state.settings }
				: {};

			newSettings[action.key] = action.value;

			return {
				...state,
				settings: newSettings,
			};
		default:
			return state;
	}
};

const steps = (state: AutomationStep[] = [], action: StepAction) => {
	switch (action.type) {
		case SET_STEPS:
			return action.steps;
		case ADD_STEP:
			return [...state, action.step];
		case REMOVE_STEP:
			return state.filter((step) => step.id !== action.stepId);
		case UPDATE_STEP:
			return state.map((step) => {
				if (step.id === action.stepId) {
					return {
						...step,
						...action.payload,
					};
				}
				return step;
			});
		default:
			return state;
	}
};

const CombinedReducer: Reducer = combineReducers({
	automation,
	steps,
});

export type State = ReturnType<typeof CombinedReducer>;
export default CombinedReducer;
