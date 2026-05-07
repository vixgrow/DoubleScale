/**
 * WordPress Dependencies
 */
import { createContext, useContext } from 'react';

/**
 * Internal dependencies
 */
import { Automation, AutomationStep } from '@doublescale/client';

export interface StepAnalytics {
	step_id: number | null;
	contacts: number;
	conversion_rate: number;
}

export const AutomationContext = createContext<{
	automation: Automation | null;
	steps: AutomationStep[];
	isLoading: boolean;
	isSaving: boolean;
	viewMode?: boolean;
	analyticsData?: StepAnalytics[];
	updatedSteps: {
		[stepId: number]: Partial<AutomationStep>;
	};
	setAutomation: (automation: Automation) => void;
	setIsLoading: (isLoading: boolean) => void;
	setIsSaving: (isSaving: boolean) => void;
	updateAutomation: (payload: Partial<Automation>) => void;
	saveAutomation: (payload?: Partial<Automation>) => Promise<void>;
	refetchAutomation: () => Promise<Automation | undefined>;
	updateSettings: (
		key: keyof Automation['settings'],
		value: Automation['settings'][keyof Automation['settings']]
	) => void;
	setSteps: (steps: AutomationStep[]) => void;
	addStep: (step: AutomationStep) => void;
	removeStep: (stepId: number) => void;
	updateStep: (stepId: number, payload: Partial<AutomationStep>) => void;
	setUpdatedSteps: (steps: {
		[stepId: number]: Partial<AutomationStep>;
	}) => void;
}>({
	automation: null,
	steps: [],
	isLoading: false,
	isSaving: false,
	viewMode: false,
	analyticsData: [],
	updatedSteps: {},
	setAutomation: (_automation: Automation) => {
		throw new Error('setAutomation() not implemented');
	},
	setIsLoading: (_isLoading: boolean) => {
		throw new Error('setIsLoading() not implemented');
	},
	setIsSaving: (_isSaving: boolean) => {
		throw new Error('setIsSaving() not implemented');
	},
	updateAutomation: (_payload: Partial<Automation>) => {
		throw new Error('updateAutomation() not implemented');
	},
	saveAutomation: async (_payload?: Partial<Automation>) => {
		throw new Error('saveAutomation() not implemented');
	},
	refetchAutomation: async () => {
		throw new Error('refetchAutomation() not implemented');
	},
	updateSettings: (
		_key: keyof Automation['settings'],
		_value: Automation['settings'][keyof Automation['settings']]
	) => {
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
	updateStep: (_stepId: number, _payload: Partial<AutomationStep>) => {
		throw new Error('updateStep() not implemented');
	},
	setUpdatedSteps: (_steps: {
		[stepId: number]: Partial<AutomationStep>;
	}) => {
		throw new Error('setUpdatedSteps() not implemented');
	},
});

const Provider = AutomationContext.Provider;
const useAutomationContext = () => useContext(AutomationContext);

export { Provider, useAutomationContext };
