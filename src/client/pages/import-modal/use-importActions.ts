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

	// Reset sourceData when source changes for integration importers
	useEffect(() => {
		if (
			importer?.is_integration &&
			['mailerlite', 'activecampaign', 'hubspot'].includes(state.source)
		) {
			console.log(
				'Resetting sourceData for integration importer:',
				state.source
			);
			dispatch({ type: 'SET_SOURCE_DATA', payload: null });
		}
	}, [state.source, importer?.is_integration]);

	const validateCredentials = () => {
		if (!importer) {
			return false;
		}

		const currentSource = state.source;
		const requiresCredentials = [
			'mailerlite',
			'activecampaign',
			'hubspot',
		].includes(currentSource);

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
		console.log('getSourceData called:', {
			importer: !!importer,
			isIntegration: importer?.is_integration,
			validateCredentials: validateCredentials(),
			hasFields: !isEmpty(importer?.fields),
			currentCredentials: state.credentials,
		});

		if (
			!importer ||
			(importer.is_integration && !validateCredentials()) ||
			(!importer.is_integration && isEmpty(importer.fields))
		) {
			console.log(
				'getSourceData: Early return due to validation failure'
			);
			return;
		}

		// For non-integration importers (like CSV, FluentCRM, etc), set fields directly
		if (!importer.is_integration && !isEmpty(importer.fields)) {
			console.log(
				'Setting sourceData from importer.fields for non-integration importer'
			);
			dispatch({ type: 'SET_SOURCE_DATA', payload: importer.fields });
			return;
		}

		// For integration importers, we must make an API call to fetch data
		if (!importer.is_integration) {
			console.log(
				'Non-integration importer with no fields - cannot proceed'
			);
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
			// Platform-specific error handling
			let errorMessage = error.message;

			if (state.source === 'activecampaign') {
				if (
					error.message.includes('401') ||
					error.message.includes('unauthorized')
				) {
					errorMessage = __(
						'Invalid ActiveCampaign API credentials. Please check your API Key and URL.',
						'quillcrm'
					);
				} else if (error.message.includes('404')) {
					errorMessage = __(
						'ActiveCampaign API endpoint not found. Please verify your API URL format.',
						'quillcrm'
					);
				} else if (error.message.includes('403')) {
					errorMessage = __(
						'Access denied. Please ensure your API key has the necessary permissions.',
						'quillcrm'
					);
				}
			} else if (state.source === 'mailerlite') {
				if (
					error.message.includes('401') ||
					error.message.includes('unauthorized')
				) {
					errorMessage = __(
						'Invalid MailerLite API token. Please check your credentials.',
						'quillcrm'
					);
				} else if (error.message.includes('403')) {
					errorMessage = __(
						'MailerLite API token lacks required permissions. Please generate a new token with read access.',
						'quillcrm'
					);
				}
			} else if (state.source === 'hubspot') {
				if (
					error.message.includes('401') ||
					error.message.includes('unauthorized')
				) {
					errorMessage = __(
						'Invalid HubSpot access token. Please verify your Private App token.',
						'quillcrm'
					);
				} else if (error.message.includes('403')) {
					errorMessage = __(
						'HubSpot access denied. Please ensure your Private App has crm.objects.contacts.read and crm.lists.read scopes.',
						'quillcrm'
					);
				} else if (error.message.includes('404')) {
					errorMessage = __(
						'HubSpot API endpoint not found. Please check your access token.',
						'quillcrm'
					);
				}
			}

			createNotice({
				type: 'error',
				message: errorMessage,
			});

			// Reset source data on error
			dispatch({ type: 'SET_SOURCE_DATA', payload: null });
		} finally {
			dispatch({ type: 'SET_IS_FETCHING', payload: false });
		}
	};

	const startImport = async (currentOffset = 0): Promise<boolean> => {
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

			// Update progress
			dispatch({ type: 'SET_COUNT', payload: response.total });
			dispatch({ type: 'SET_OFFSET', payload: response.offset });

			if (response.status === 'in_progress') {
				// ✅ FIX: Directly await the next batch (no setTimeout)
				return await startImport(response.offset);
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

		// Platform-specific import error handling
		let errorMessage =
			error.message || __('Failed to import contacts', 'quillcrm');

		if (state.source === 'activecampaign') {
			if (
				error.message?.includes('rate limit') ||
				error.message?.includes('429')
			) {
				errorMessage = __(
					'ActiveCampaign API rate limit reached. Please wait a few minutes and try again.',
					'quillcrm'
				);
			} else if (error.message?.includes('timeout')) {
				errorMessage = __(
					'ActiveCampaign connection timeout. The import will resume from where it left off.',
					'quillcrm'
				);
			}
		} else if (state.source === 'mailerlite') {
			if (
				error.message?.includes('rate limit') ||
				error.message?.includes('429')
			) {
				errorMessage = __(
					'MailerLite API rate limit reached. Please wait and try again.',
					'quillcrm'
				);
			} else if (error.message?.includes('no groups')) {
				errorMessage = __(
					'No MailerLite groups found to import from. Please create groups in your MailerLite account first.',
					'quillcrm'
				);
			}
		} else if (state.source === 'hubspot') {
			if (
				error.message?.includes('rate limit') ||
				error.message?.includes('429')
			) {
				errorMessage = __(
					'HubSpot API rate limit reached. Please wait and try again later.',
					'quillcrm'
				);
			} else if (error.message?.includes('timeout')) {
				errorMessage = __(
					'HubSpot connection timeout. The import will resume from where it left off.',
					'quillcrm'
				);
			} else if (error.message?.includes('no contacts')) {
				errorMessage = __(
					'No HubSpot contacts found to import. Please ensure you have contacts in your HubSpot account.',
					'quillcrm'
				);
			}
		}

		createNotice({
			type: 'error',
			message: errorMessage,
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
		// Only fetch source data if we have a valid source and we're not in completion state
		if (state.source && !state.showingCompletion) {
			getSourceData();
		}
	}, [state.source]);

	return {
		validateCredentials,
		getSourceData,
		importContacts: startImport, // Rename for clarity
		cancelImport,
	};
};
