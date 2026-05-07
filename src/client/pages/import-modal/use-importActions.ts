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
import { useEffect, useRef } from 'react';
/**
 * internal dependencies
 */
import ConfigAPI from '@doublescale/config';
import { useImportContext, type ImportStats } from './contexts';
import { useGoHighLevelOAuth } from './hooks/use-gohighlevel-oauth';

export const useImportActions = () => {
	const { state, dispatch } = useImportContext();
	const { createNotice } = useDispatch('doublescale/core');
	const importers = ConfigAPI.getImporters();
	const importer = importers[state.source] || null;

	// Use a ref to track the accumulated import stats across batches
	const importStatsRef = useRef<ImportStats>({ imported: 0, skipped: 0, failed: 0 });

	// GoHighLevel OAuth hook
	const goHighLevelOAuth = useGoHighLevelOAuth({
		onSuccess: (data) => {
			console.log('GoHighLevel OAuth successful:', data);
		},
		onError: (error) => {
			console.error('GoHighLevel OAuth error:', error);
			dispatch({ type: 'SET_IS_FETCHING', payload: false });
		},
		onDataFetched: (data) => {
			console.log('GoHighLevel: onDataFetched called with:', data);
			dispatch({ type: 'SET_SOURCE_DATA', payload: data });
			dispatch({ type: 'SET_IS_FETCHING', payload: false });
			// For integration importers, advance to step 2 when source data is fetched
			dispatch({ type: 'SET_CURRENT_STEP', payload: 2 });
		},
	});

	// Track if we've already initiated a fetch for FluentCRM/FunnelKit
	const hasFetchedRef = useRef<string | null>(null);

	// Reset sourceData and currentStep when source changes for integration importers
	useEffect(() => {
		if (
			importer?.is_integration &&
			[
				'mailerlite',
				'activecampaign',
				'hubspot',
				'pipedrive',
				'gohighlevel',
			].includes(state.source)
		) {
			console.log(
				'Resetting sourceData for integration importer:',
				state.source
			);
			dispatch({ type: 'SET_SOURCE_DATA', payload: null });
			dispatch({ type: 'SET_CURRENT_STEP', payload: 1 });
		}

		// Reset fetch tracking when source changes
		if (hasFetchedRef.current !== state.source) {
			hasFetchedRef.current = null;
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
			'pipedrive',
			'gohighlevel',
		].includes(currentSource);

		if (!requiresCredentials) {
			return true;
		}

		for (const key in importer.credentials) {
			const field = importer.credentials[key];
			// Skip info fields and OAuth connected status - they're not user inputs
			if (field.type === 'info' || field.type === 'oauth_connected')
				continue;

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
			// Special handling for GoHighLevel OAuth flow
			if (state.source === 'gohighlevel') {
				// GoHighLevel uses OAuth component which handles its own connection flow
				// The OAuth component will call onDataFetched when ready
				// For now, just try to fetch source data if OAuth is already connected
				try {
					console.log(
						'GoHighLevel: Checking if already connected and fetching source data...'
					);
					await goHighLevelOAuth.fetchSourceData();
					console.log(
						'GoHighLevel: Source data fetch completed successfully'
					);
				} catch (error: any) {
					console.error(
						'GoHighLevel: Source data fetch failed:',
						error
					);
					// Handle the error properly by setting an error message
					createNotice({
						type: 'error',
						message:
							error.message ||
							__('Failed to fetch GoHighLevel data', 'doublescale'),
					});
					dispatch({ type: 'SET_IS_FETCHING', payload: false });
				}
				return;
			}

			const response = (await apiFetch({
				path: addQueryArgs(`/qc/v1/import-export/${state.source}`, {
					credentials: state.credentials,
				}),
			})) as { [key: string]: any };

			dispatch({ type: 'SET_SOURCE_DATA', payload: response });

			// For API-based integration importers (not FluentCRM/FunnelKit), advance to step 2
			// FluentCRM and FunnelKit stay on step 1 since they only have lists/tags mapping
			if (importer?.is_integration && !['fluentcrm', 'wpfunnelkit'].includes(state.source)) {
				dispatch({ type: 'SET_CURRENT_STEP', payload: 2 });
			}
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
						'doublescale'
					);
				} else if (error.message.includes('404')) {
					errorMessage = __(
						'ActiveCampaign API endpoint not found. Please verify your API URL format.',
						'doublescale'
					);
				} else if (error.message.includes('403')) {
					errorMessage = __(
						'Access denied. Please ensure your API key has the necessary permissions.',
						'doublescale'
					);
				}
			} else if (state.source === 'mailerlite') {
				if (
					error.message.includes('401') ||
					error.message.includes('unauthorized')
				) {
					errorMessage = __(
						'Invalid MailerLite API token. Please check your credentials.',
						'doublescale'
					);
				} else if (error.message.includes('403')) {
					errorMessage = __(
						'MailerLite API token lacks required permissions. Please generate a new token with read access.',
						'doublescale'
					);
				}
			} else if (state.source === 'hubspot') {
				if (
					error.message.includes('401') ||
					error.message.includes('unauthorized')
				) {
					errorMessage = __(
						'Invalid HubSpot access token. Please verify your Private App token.',
						'doublescale'
					);
				} else if (error.message.includes('403')) {
					errorMessage = __(
						'HubSpot access denied. Please ensure your Private App has crm.objects.contacts.read and crm.lists.read scopes.',
						'doublescale'
					);
				} else if (error.message.includes('404')) {
					errorMessage = __(
						'HubSpot API endpoint not found. Please check your access token.',
						'doublescale'
					);
				}
			} else if (state.source === 'pipedrive') {
				if (
					error.message.includes('401') ||
					error.message.includes('unauthorized')
				) {
					errorMessage = __(
						'Invalid Pipedrive credentials. Please verify your API Domain and Token.',
						'doublescale'
					);
				} else if (error.message.includes('403')) {
					errorMessage = __(
						'Pipedrive API access denied. Please check your API token permissions.',
						'doublescale'
					);
				} else if (error.message.includes('404')) {
					errorMessage = __(
						'Pipedrive API endpoint not found. Please check your domain format.',
						'doublescale'
					);
				} else if (
					error.message.includes('Pipedrive API Domain') ||
					error.message.includes('invalid')
				) {
					errorMessage = __(
						'Invalid Pipedrive API Domain or Token. Please check your credentials.',
						'doublescale'
					);
				}
				// Always reset sourceData for Pipedrive credential errors to go back to step 1
				dispatch({ type: 'SET_SOURCE_DATA', payload: null });
				dispatch({ type: 'SET_CURRENT_STEP', payload: 1 });
			} else if (state.source === 'gohighlevel') {
				if (
					error.message.includes('OAuth connection has expired') ||
					error.message.includes('invalid') ||
					error.message.includes('401') ||
					error.message.includes('unauthorized')
				) {
					errorMessage = __(
						'GoHighLevel OAuth connection has expired. Please reconnect your account.',
						'doublescale'
					);
				} else if (error.message.includes('403')) {
					errorMessage = __(
						'GoHighLevel API access denied. Please check your OAuth permissions.',
						'doublescale'
					);
				} else if (
					error.message.includes(
						'connect to your GoHighLevel account'
					)
				) {
					errorMessage = __(
						'Please connect to your GoHighLevel account using OAuth first.',
						'doublescale'
					);
				}
				// Always reset sourceData for GoHighLevel OAuth errors to go back to step 1
				dispatch({ type: 'SET_SOURCE_DATA', payload: null });
				dispatch({ type: 'SET_CURRENT_STEP', payload: 1 });
			}

			createNotice({
				type: 'error',
				message: errorMessage,
			});

			// Reset source data and step on error (only if not already reset above)
			if (state.source !== 'pipedrive' && state.source !== 'gohighlevel') {
				dispatch({ type: 'SET_SOURCE_DATA', payload: null });
				// For integration importers, reset to step 1 when sourceData is cleared
				if (importer?.is_integration) {
					dispatch({ type: 'SET_CURRENT_STEP', payload: 1 });
				}
			}
		} finally {
			dispatch({ type: 'SET_IS_FETCHING', payload: false });
		}
	};

	const startImport = async (currentOffset = 0): Promise<boolean> => {
		dispatch({ type: 'SET_IMPORTING', payload: true });

		// Reset stats at the start of import (only on first call)
		if (currentOffset === 0) {
			importStatsRef.current = { imported: 0, skipped: 0, failed: 0 };
			dispatch({ type: 'SET_IMPORT_STATS', payload: { imported: 0, skipped: 0, failed: 0 } });
		}

		try {
			const response = (await apiFetch({
				path: addQueryArgs('/qc/v1/import-export/import'),
				method: 'POST',
				data: {
					source: state.source,
					offset: currentOffset,
					cursor: state.cursor, // Add cursor support
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
				cursor?: string; // Add cursor to response type
				status: string;
				processed: number;
				imported?: number;
				skipped?: number;
				failed?: number;
			};

			// Update progress
			dispatch({ type: 'SET_COUNT', payload: response.total });
			dispatch({ type: 'SET_OFFSET', payload: response.offset });

			// Update import stats if present (accumulate in ref for accurate tracking)
			if (response.imported !== undefined || response.skipped !== undefined || response.failed !== undefined) {
				importStatsRef.current = {
					imported: importStatsRef.current.imported + (response.imported || 0),
					skipped: importStatsRef.current.skipped + (response.skipped || 0),
					failed: importStatsRef.current.failed + (response.failed || 0),
				};
				dispatch({
					type: 'SET_IMPORT_STATS',
					payload: importStatsRef.current,
				});
			}

			// Update cursor if present (for cursor-based pagination)
			if (response.cursor !== undefined) {
				dispatch({ type: 'SET_CURSOR', payload: response.cursor });
			}

			if (response.status === 'in_progress') {
				// ✅ FIX: Directly await the next batch (no setTimeout)
				return await startImport(response.offset);
			} else {
				// Import completed - ensure 100% is shown
				dispatch({ type: 'SET_COUNT', payload: response.total });
				dispatch({ type: 'SET_OFFSET', payload: response.total });
				handleImportComplete(importStatsRef.current);
				return true;
			}
		} catch (error: any) {
			handleImportError(error);
			return false;
		}
	};

	const handleImportComplete = (stats: ImportStats) => {
		console.log('Import completed', stats);

		const hasStats = stats.imported > 0 || stats.skipped > 0 || stats.failed > 0;

		let message = __('Import completed', 'doublescale');
		if (hasStats) {
			const parts: string[] = [];
			if (stats.imported > 0) {
				parts.push(`${stats.imported} ${__('imported', 'doublescale')}`);
			}
			if (stats.skipped > 0) {
				parts.push(`${stats.skipped} ${__('skipped', 'doublescale')}`);
			}
			if (stats.failed > 0) {
				parts.push(`${stats.failed} ${__('failed', 'doublescale')}`);
			}
			message = `${__('Import completed', 'doublescale')}: ${parts.join(', ')}`;

			// Add hint about log management if there are failures
			if (stats.failed > 0) {
				message += `. ${__('Check Settings > System for error logs.', 'doublescale')}`;
			}
		}

		createNotice({
			type: stats.failed > 0 ? 'warning' : 'success',
			message,
			duration: stats.failed > 0 ? 10000 : 5000, // Longer duration for failures
		});

		// First set importing to false
		dispatch({ type: 'SET_IMPORTING', payload: false });

		// Use requestAnimationFrame to ensure the 100% progress renders
		// before showing the completion state
		requestAnimationFrame(() => {
			dispatch({ type: 'SET_SHOWING_COMPLETION', payload: true });
			// Don't automatically reset the completion state - let the modal handle closing
		});
	};

	const handleImportError = (error: any) => {
		console.error('Import error:', error);

		// Platform-specific import error handling
		let errorMessage =
			error.message || __('Failed to import contacts', 'doublescale');

		if (state.source === 'activecampaign') {
			if (
				error.message?.includes('rate limit') ||
				error.message?.includes('429')
			) {
				errorMessage = __(
					'ActiveCampaign API rate limit reached. Please wait a few minutes and try again.',
					'doublescale'
				);
			} else if (error.message?.includes('timeout')) {
				errorMessage = __(
					'ActiveCampaign connection timeout. The import will resume from where it left off.',
					'doublescale'
				);
			}
		} else if (state.source === 'mailerlite') {
			if (
				error.message?.includes('rate limit') ||
				error.message?.includes('429')
			) {
				errorMessage = __(
					'MailerLite API rate limit reached. Please wait and try again.',
					'doublescale'
				);
			} else if (error.message?.includes('no groups')) {
				errorMessage = __(
					'No MailerLite groups found to import from. Please create groups in your MailerLite account first.',
					'doublescale'
				);
			}
		} else if (state.source === 'hubspot') {
			if (
				error.message?.includes('rate limit') ||
				error.message?.includes('429')
			) {
				errorMessage = __(
					'HubSpot API rate limit reached. Please wait and try again later.',
					'doublescale'
				);
			} else if (error.message?.includes('timeout')) {
				errorMessage = __(
					'HubSpot connection timeout. The import will resume from where it left off.',
					'doublescale'
				);
			} else if (error.message?.includes('no contacts')) {
				errorMessage = __(
					'No HubSpot contacts found to import. Please ensure you have contacts in your HubSpot account.',
					'doublescale'
				);
			}
		} else if (state.source === 'pipedrive') {
			if (
				error.message?.includes('rate limit') ||
				error.message?.includes('429')
			) {
				errorMessage = __(
					'Pipedrive API rate limit reached. Please wait and try again later.',
					'doublescale'
				);
			} else if (error.message?.includes('timeout')) {
				errorMessage = __(
					'Pipedrive connection timeout. The import will resume from where it left off.',
					'doublescale'
				);
			} else if (
				error.message?.includes('invalid') ||
				error.message?.includes('credentials') ||
				error.message?.includes('Token is invalid') ||
				error.message?.includes('API Domain') ||
				error.message?.includes('401') ||
				error.message?.includes('403')
			) {
				errorMessage = __(
					'Invalid Pipedrive credentials. Please check your API Domain and Token.',
					'doublescale'
				);
				// Reset sourceData to force user back to credentials step
				dispatch({ type: 'SET_SOURCE_DATA', payload: null });
				dispatch({ type: 'SET_CURRENT_STEP', payload: 1 });
			} else if (
				error.message?.includes('no persons') ||
				error.message?.includes('no contacts')
			) {
				errorMessage = __(
					'No Pipedrive contacts found to import. Please ensure you have contacts in your Pipedrive account.',
					'doublescale'
				);
			}
		} else if (state.source === 'gohighlevel') {
			if (
				error.message?.includes('OAuth connection has expired') ||
				error.message?.includes('invalid') ||
				error.message?.includes('401') ||
				error.message?.includes('403')
			) {
				errorMessage = __(
					'GoHighLevel OAuth connection has expired. Please reconnect your account.',
					'doublescale'
				);
			} else if (
				error.message?.includes('rate limit') ||
				error.message?.includes('429')
			) {
				errorMessage = __(
					'GoHighLevel API rate limit reached. Please wait and try again later.',
					'doublescale'
				);
			} else if (error.message?.includes('timeout')) {
				errorMessage = __(
					'GoHighLevel connection timeout. The import will resume from where it left off.',
					'doublescale'
				);
			} else if (
				error.message?.includes('no contacts') ||
				error.message?.includes('connect to your GoHighLevel account')
			) {
				errorMessage = __(
					'Please connect to your GoHighLevel account using OAuth first.',
					'doublescale'
				);
			}
			// For GoHighLevel, always reset sourceData on ANY import error to go back to step 1
			dispatch({ type: 'SET_SOURCE_DATA', payload: null });
			dispatch({ type: 'SET_CURRENT_STEP', payload: 1 });
		}

		createNotice({
			type: 'error',
			message: errorMessage,
		});

		// Stop importing state but don't reset progress counters
		// This prevents returning to step 2 unexpectedly
		dispatch({ type: 'SET_IMPORTING', payload: false });
		// Don't reset count and offset - keep the current state
		// dispatch({ type: 'SET_COUNT', payload: 0 });
		// dispatch({ type: 'SET_OFFSET', payload: 0 });
		dispatch({ type: 'SET_CURSOR', payload: null });
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
			dispatch({ type: 'SET_CURSOR', payload: null });
		}
	};

	// Auto-fetch source data for FluentCRM and FunnelKit when selected
	useEffect(() => {
		const shouldAutoFetch =
			importer?.is_integration &&
			['fluentcrm', 'wpfunnelkit'].includes(state.source) &&
			!state.sourceData &&
			!state.isFetching &&
			hasFetchedRef.current !== state.source;

		if (shouldAutoFetch) {
			console.log('Auto-fetching source data for:', state.source);
			hasFetchedRef.current = state.source;
			getSourceData();
		}
	}, [state.source, state.sourceData, state.isFetching, importer?.is_integration]);

	// Cleanup on unmount
	useEffect(() => {
		return () => {
			// Cleanup if needed
		};
	}, []);


	return {
		validateCredentials,
		getSourceData,
		importContacts: startImport, // Rename for clarity
		cancelImport,
	};
};
