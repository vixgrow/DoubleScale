// contexts/ImportContext.tsx
import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import type { ImporterField } from '@quillcrm/config';

export interface ImportState {
	currentStep: number;
	importing: boolean;
	showingCompletion: boolean; // Add this new state
	count: number;
	source: string;
	offset: number;
	cursor: string | null; // Add cursor for pagination
	fileData: {
		file_name: string;
		header_columns: string[];
	} | null;
	isFetching: boolean;
	sourceData: {
		[key: string]: ImporterField;
	} | null;
	credentials: Record<string, any>;
	assignedLists: number[];
	assignedTags: number[];
	newStatus: string;
	updateExisting: boolean;
	uploadProgress: number;
	isUploading: boolean;
	values: Record<string, any>;
}

type ImportAction =
	| { type: 'SET_CURRENT_STEP'; payload: number }
	| { type: 'SET_IMPORTING'; payload: boolean }
	| { type: 'SET_SHOWING_COMPLETION'; payload: boolean } // Add this action
	| { type: 'SET_COUNT'; payload: number }
	| { type: 'SET_SOURCE'; payload: string }
	| { type: 'SET_OFFSET'; payload: number }
	| { type: 'SET_CURSOR'; payload: string | null } // Add cursor action
	| { type: 'SET_FILE_DATA'; payload: ImportState['fileData'] }
	| { type: 'SET_IS_FETCHING'; payload: boolean }
	| { type: 'SET_SOURCE_DATA'; payload: ImportState['sourceData'] }
	| { type: 'SET_CREDENTIALS'; payload: Record<string, any> }
	| { type: 'SET_ASSIGNED_LISTS'; payload: number[] }
	| { type: 'SET_ASSIGNED_TAGS'; payload: number[] }
	| { type: 'SET_NEW_STATUS'; payload: string }
	| { type: 'SET_UPDATE_EXISTING'; payload: boolean }
	| { type: 'SET_UPLOAD_PROGRESS'; payload: number }
	| { type: 'SET_IS_UPLOADING'; payload: boolean }
	| { type: 'SET_VALUES'; payload: Record<string, any> }
	| { type: 'RESET_STATE' };

const initialState: ImportState = {
	currentStep: 1,
	importing: false,
	showingCompletion: false, // Add this to initial state
	count: 0,
	source: 'csv',
	offset: 0,
	cursor: null, // Add cursor to initial state
	fileData: null,
	isFetching: false,
	sourceData: null,
	credentials: {},
	assignedLists: [],
	assignedTags: [],
	newStatus: 'unverified',
	updateExisting: false,
	uploadProgress: 0,
	isUploading: false,
	values: {},
};

function importReducer(state: ImportState, action: ImportAction): ImportState {
	switch (action.type) {
		case 'SET_CURRENT_STEP':
			return { ...state, currentStep: action.payload };
		case 'SET_IMPORTING':
			return { ...state, importing: action.payload };
		case 'SET_SHOWING_COMPLETION':
			return { ...state, showingCompletion: action.payload }; // Add this case
		case 'SET_COUNT':
			return { ...state, count: action.payload };
		case 'SET_SOURCE':
			return { ...state, source: action.payload };
		case 'SET_OFFSET':
			return { ...state, offset: action.payload };
		case 'SET_CURSOR':
			return { ...state, cursor: action.payload };
		case 'SET_FILE_DATA':
			return { ...state, fileData: action.payload };
		case 'SET_IS_FETCHING':
			return { ...state, isFetching: action.payload };
		case 'SET_SOURCE_DATA':
			return { ...state, sourceData: action.payload };
		case 'SET_CREDENTIALS':
			return { ...state, credentials: action.payload };
		case 'SET_ASSIGNED_LISTS':
			return { ...state, assignedLists: action.payload };
		case 'SET_ASSIGNED_TAGS':
			return { ...state, assignedTags: action.payload };
		case 'SET_NEW_STATUS':
			return { ...state, newStatus: action.payload };
		case 'SET_UPDATE_EXISTING':
			return { ...state, updateExisting: action.payload };
		case 'SET_UPLOAD_PROGRESS':
			return { ...state, uploadProgress: action.payload };
		case 'SET_IS_UPLOADING':
			return { ...state, isUploading: action.payload };
		case 'SET_VALUES':
			return { ...state, values: action.payload };
		case 'RESET_STATE':
			return initialState;
		default:
			return state;
	}
}

interface ImportContextType {
	state: ImportState;
	dispatch: React.Dispatch<ImportAction>;
	// Helper functions
	updateValues: (key: string, value: any) => void;
	updateCredentials: (key: string, value: any) => void;
	resetState: () => void;
}

const ImportContext = createContext<ImportContextType | undefined>(undefined);

export const useImportContext = () => {
	const context = useContext(ImportContext);
	if (context === undefined) {
		throw new Error(
			'useImportContext must be used within an ImportProvider'
		);
	}
	return context;
};

interface ImportProviderProps {
	children: ReactNode;
}

export const ImportProvider: React.FC<ImportProviderProps> = ({ children }) => {
	const [state, dispatch] = useReducer(importReducer, initialState);

	const updateValues = (key: string, value: any) => {
		dispatch({
			type: 'SET_VALUES',
			payload: { ...state.values, [key]: value },
		});
	};

	const updateCredentials = (key: string, value: any) => {
		dispatch({
			type: 'SET_CREDENTIALS',
			payload: { ...state.credentials, [key]: value },
		});
	};

	const resetState = () => {
		dispatch({ type: 'RESET_STATE' });
	};

	const value = {
		state,
		dispatch,
		updateValues,
		updateCredentials,
		resetState,
	};

	return (
		<ImportContext.Provider value={value}>
			{children}
		</ImportContext.Provider>
	);
};
