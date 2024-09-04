/**
 * WordPress Dependencies
 */
import { createContext, useContext } from 'react';

/**
 * Internal dependencies
 */
import { Automation, AutomationStep } from '@quillcrm/client';

export const AutomationContext = createContext<{
	automation: Automation | null;
	steps: AutomationStep[];
	isLoading: boolean;
	isSaving: boolean;
	setAutomation: (automation: Automation) => void;
	setIsLoading: (isLoading: boolean) => void;
	setIsSaving: (isSaving: boolean) => void;
	updateAutomation: (payload: { [key: string]: any }) => void;
	saveAutomation: (payload?: { [key: string]: any }) => void;
	updateSettings: (key: string, value: any) => void;
	setSteps: (steps: AutomationStep[]) => void;
	addStep: (step: AutomationStep) => void;
	removeStep: (stepId: number) => void;
	updateStep: (stepId: number, payload: { [key: string]: any }) => void;
}>({
	automation: null,
	steps: [],
	isLoading: false,
	isSaving: false,
	setAutomation: (_automation: Automation) => {
		throw new Error('setAutomation() not implemented');
	},
	setIsLoading: (_isLoading: boolean) => {
		throw new Error('setIsLoading() not implemented');
	},
	setIsSaving: (_isSaving: boolean) => {
		throw new Error('setIsSaving() not implemented');
	},
	updateAutomation: (_payload: { [key: string]: any }) => {
		throw new Error('updateAutomation() not implemented');
	},
	saveAutomation: (_payload?: { [key: string]: any }) => {
		throw new Error('saveAutomation() not implemented');
	},
	updateSettings: (_key: string, _value: any) => {
		throw new Error('updateSettings() not implemented');
	},
	setSteps: (_steps: AutomationStep[]) => {
		throw new Error('setSteps() not implemented');
	},
	addStep: (_step: AutomationStep) => {
		throw new Error('addStep() not implemented');
	},
	removeStep: (_stepId: number) => {
		throw new Error('removeStep() not implemented');
	},
	updateStep: (_stepId: number, _payload: { [key: string]: any }) => {
		throw new Error('updateStep() not implemented');
	},
});

const Provider = AutomationContext.Provider;
const useAutomationContext = () => useContext(AutomationContext);

export { Provider, useAutomationContext };
