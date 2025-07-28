/**
 * wordpress dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { useDispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { addQueryArgs } from '@wordpress/url';
/**
 * external dependencies
 */
import { isEmpty, trim } from 'lodash';
import { useEffect } from 'react';
/**
 * internal dependencies
 */
import ConfigAPI from '@quillcrm/config';
import { useImportContext } from './contexts';

export const useImportActions = () => {
	const { state, dispatch } = useImportContext();
	const { createNotice } = useDispatch('quillcrm/core');
	const importers = ConfigAPI.getImporters();
	const importer = importers[state.source] || null;


	const validateCredentials = () => {
		if (!importer) {
			return false;
		}

		const currentSource = state.source;
		const requiresCredentials = ['mailerlite', 'activecampaign'].includes(
			currentSource
		);

		if (!requiresCredentials) {
			return true;
		}

		for (const key in importer.credentials) {
			if (
				!state.credentials[key] ||
				isEmpty(trim(state.credentials[key]))
			) {
				return false;
			}
		}

		return true;
	};

	const getSourceData = async () => {
		if (
			!importer ||
			(importer.is_integration && !validateCredentials()) ||
			(!importer.is_integration && isEmpty(importer.fields))
		) {
			return;
		}

		if (!importer.is_integration && !isEmpty(importer.fields)) {
			dispatch({ type: 'SET_SOURCE_DATA', payload: importer.fields });
			return;
		}

		dispatch({ type: 'SET_IS_FETCHING', payload: true });

		try {
			const response = (await apiFetch({
				path: addQueryArgs(`/qc/v1/import-export/${state.source}`, {
					credentials: state.credentials,
				}),
			})) as { [key: string]: any };

			dispatch({ type: 'SET_SOURCE_DATA', payload: response });
		} catch (error: any) {
			createNotice({
				type: 'error',
				message: error.message,
			});
		} finally {
			dispatch({ type: 'SET_IS_FETCHING', payload: false });
		}
	};

	const startImport = async (currentOffset = 0): Promise<boolean> => {
		dispatch({ type: 'SET_IMPORTING', payload: true });

		try {
			const response = await apiFetch({
				path: addQueryArgs('/qc/v1/import-export/import'),
				method: 'POST',
				data: {
					source: state.source,
					offset: currentOffset,
					lists: state.assignedLists,
					tags: state.assignedTags,
					status: state.newStatus,
					update_existing: state.updateExisting,
					...state.values,
					credentials: state.credentials,
				},
			}) as {
				total: number;
				offset: number;
				status: string;
				processed: number;
			};

			console.log('Import response:', {
				total: response.total,
				offset: response.offset,
				status: response.status,
			});

			// Update progress
			dispatch({ type: 'SET_COUNT', payload: response.total });
			dispatch({ type: 'SET_OFFSET', payload: response.offset });

			if (response.status === 'in_progress') {
				// Continue with next batch after a short delay
				setTimeout(() => startImport(response.offset), 1000);
				return true;
			} else {
				// Import completed - ensure 100% is shown
				dispatch({ type: 'SET_COUNT', payload: response.total });
				dispatch({ type: 'SET_OFFSET', payload: response.total });
				handleImportComplete();
				return true;
			}
		} catch (error: any) {
			handleImportError(error);
			return false;
		}
	};



	const handleImportComplete = () => {
		console.log('Import completed');

		createNotice({
			type: 'success',
			message: __('Import completed', 'quillcrm'),
		});

		// First set importing to false
		dispatch({ type: 'SET_IMPORTING', payload: false });

		// Use requestAnimationFrame to ensure the 100% progress renders
		// before showing the completion state
		requestAnimationFrame(() => {
			dispatch({ type: 'SET_SHOWING_COMPLETION', payload: true });

			// Show completion for 2 seconds before resetting
			setTimeout(() => {
				dispatch({ type: 'SET_SHOWING_COMPLETION', payload: false });
				dispatch({ type: 'SET_COUNT', payload: 0 });
				dispatch({ type: 'SET_OFFSET', payload: 0 });
			}, 2000);
		});
	};

	const handleImportError = (error: any) => {
		console.error('Import error:', error);

		createNotice({
			type: 'error',
			message: error.message || __('Failed to import contacts', 'quillcrm'),
		});

		dispatch({ type: 'SET_IMPORTING', payload: false });
		dispatch({ type: 'SET_COUNT', payload: 0 });
		dispatch({ type: 'SET_OFFSET', payload: 0 });
	};

	const cancelImport = async () => {
		try {
			await apiFetch({
				path: '/qc/v1/import-export/import/cancel',
				method: 'POST',
				data: { source: state.source },
			});
		} catch (error) {
			console.error('Cancel import error:', error);
		} finally {
			dispatch({ type: 'SET_IMPORTING', payload: false });
			dispatch({ type: 'SET_COUNT', payload: 0 });
			dispatch({ type: 'SET_OFFSET', payload: 0 });
		}
	};

	// Cleanup on unmount
	useEffect(() => {
		return () => {
			// Cleanup if needed
		};
	}, []);

	useEffect(() => {
		getSourceData();
	}, [state.source]);

	return {
		validateCredentials,
		getSourceData,
		importContacts: startImport, // Rename for clarity
		cancelImport,
	};
};
