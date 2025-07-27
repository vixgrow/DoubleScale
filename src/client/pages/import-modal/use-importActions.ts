/**
 * wordpress dependencies
 */
import { useDispatch } from '@wordpress/data';
import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';
import { __ } from '@wordpress/i18n';
/**
 * external dependencies
 */
import { useEffect } from 'react';
import { isEmpty, trim } from 'lodash';
/**
 * internal dependencies
 */
import { useImportContext } from './contexts';
import ConfigAPI from '@quillcrm/config';

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

	const importContacts = async (currentOffset = 0): Promise<boolean> => {
		dispatch({ type: 'SET_IMPORTING', payload: true });

		try {
			const response = (await apiFetch({
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
			})) as {
				total: number;
				offset: number;
				status: string;
				processed: number;
			};

			console.log('Import response:', {
				total: response.total,
				offset: response.offset,
				processed: response.processed,
				status: response.status,
			});

			// Update count and offset immediately when we get the response
			dispatch({ type: 'SET_COUNT', payload: response.total });
			dispatch({ type: 'SET_OFFSET', payload: response.offset });

			if (response.status === 'in_progress') {
				const progress = Math.min(
					100,
					Math.round((response.offset / response.total) * 100)
				);
				console.log(`Import progress: ${progress}%`);

				// Add a small delay to allow UI to update, then continue polling
				await new Promise((resolve) => setTimeout(resolve, 1000));
				return await importContacts(response.offset);
			} else {
				console.log('Import completed');
				createNotice({
					type: 'success',
					message: __('Import completed', 'quillcrm'),
				});
				dispatch({ type: 'SET_IMPORTING', payload: false });
				// Don't reset count and offset immediately - let the UI show 100% completion
				setTimeout(() => {
					dispatch({ type: 'SET_COUNT', payload: 0 });
					dispatch({ type: 'SET_OFFSET', payload: 0 });
				}, 2000); // Show completion for 2 seconds
				return true; // Signal completion
			}
		} catch (error: any) {
			console.error('Import error:', error);
			createNotice({
				type: 'error',
				message:
					error.message ||
					__('Failed to import contacts', 'quillcrm'),
			});
			dispatch({ type: 'SET_IMPORTING', payload: false });
			dispatch({ type: 'SET_COUNT', payload: 0 });
			dispatch({ type: 'SET_OFFSET', payload: 0 });
			return false;
		}
	};

	useEffect(() => {
		getSourceData();
	}, [state.source]);

	return {
		validateCredentials,
		getSourceData,
		importContacts,
	};
};
