/**
 * GoHighLevel OAuth Component
 * 
 * Dedicated component for GoHighLevel OAuth flow, separated from general import logic
 */
/**
 * wordpress dependencies
 */
import { __ } from '@wordpress/i18n';
/**
 * external dependencies
 */
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { AlertCircle, CheckCircle2, Link2, Loader2 } from 'lucide-react';
/**
 * internal dependencies
 */
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
	useGoHighLevelOAuth,
	type GoHighLevelCredentials,
} from '../hooks/use-gohighlevel-oauth';

interface GoHighLevelOAuthProps {
	credentials: {
		oauth_status?: {
			type: 'oauth_connected';
			label: string;
			connected_at: string;
			expires_in: number;
			location_name?: string;
			location_id?: string;
		};
		oauth_setup?: {
			type: 'oauth_setup_required';
			label: string;
			description: string;
			fields: {
				[key: string]: {
					label: string;
					type: string;
					required: boolean;
					description: string;
				};
			};
			redirect_url: string;
		};
	};
	onConnectionChange?: (connected: boolean) => void;
	onDataFetched?: (data: any) => void;
}

const GoHighLevelOAuth: React.FC<GoHighLevelOAuthProps> = ({
	credentials,
	onConnectionChange,
	onDataFetched,
}) => {
	type FormValues = GoHighLevelCredentials & Record<string, string>;
	const form = useForm<FormValues>({
		defaultValues: {},
	});
	const [connectionStatus, setConnectionStatus] = useState<
		'connected' | 'disconnected' | 'setup_required'
	>('disconnected');

	const goHighLevelOAuth = useGoHighLevelOAuth({
		onSuccess: () => {
			setConnectionStatus('connected');
			onConnectionChange?.(true);
		},
		onError: (error) => {
			console.error('GoHighLevel OAuth error:', error);
		},
		onDataFetched: (data) => {
			onDataFetched?.(data);
		},
	});

	useEffect(() => {
		if (credentials.oauth_status) {
			setConnectionStatus('connected');
		} else if (credentials.oauth_setup) {
			setConnectionStatus('setup_required');
		} else {
			setConnectionStatus('disconnected');
		}
	}, [credentials]);

	useEffect(() => {
		if (!credentials.oauth_setup?.fields) {
			return;
		}

		const defaults = Object.keys(credentials.oauth_setup.fields).reduce(
			(acc, key) => {
				acc[key] = '';
				return acc;
			},
			{} as FormValues
		);

		form.reset(defaults);
	}, [credentials.oauth_setup, form]);

	const handleConnect = async (values: FormValues) => {
		const { client_id, client_secret } = values;

		try {
			await goHighLevelOAuth.connectWithCredentials({
				client_id,
				client_secret,
			});
		} catch (error) {
			// Error handling is done in the hook
		}
	};

	const handleDisconnect = async () => {
		try {
			await goHighLevelOAuth.disconnect();
			setConnectionStatus('disconnected');
			onConnectionChange?.(false);
		} catch (error) {
			// Error handling is done in the hook
		}
	};

	const formatTimeRemaining = (seconds: number): string => {
		return goHighLevelOAuth.formatTimeRemaining(seconds);
	};

	// Setup required state
	if (
		connectionStatus === 'setup_required' &&
		credentials.oauth_setup?.type === 'oauth_setup_required'
	) {
		const setup = credentials.oauth_setup;

		return (
			<div className="gohighlevel-oauth-setup">
				<div className="setup-header mb-6">
					<div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
						<AlertCircle className="mt-1 h-5 w-5 text-blue-600" />
						<div className="flex-1">
							<h4 className="mb-2 text-lg font-semibold text-gray-900">
								{setup.label}
							</h4>
							<p className="text-sm text-gray-600">
								{setup.description}
							</p>
						</div>
					</div>
				</div>

				<Form {...form}>
					<form
						onSubmit={form.handleSubmit(handleConnect)}
						className="oauth-credentials-form space-y-6"
					>
						{Object.entries(setup.fields).map(([key, field]) => (
							<FormField
								key={key}
								control={form.control}
								name={key}
								rules={
									field.required
										? {
											required: `${field.label} is required`,
										}
										: undefined
								}
								render={({ field: formField }) => (
									<FormItem>
										<FormLabel className="text-sm font-medium text-gray-900">
											{field.label}
										</FormLabel>
										<FormControl>
											<Input
												type={
													field.type === 'password'
														? 'password'
														: 'text'
												}
												placeholder={field.label}
												className="h-12"
												style={{
													borderRadius: '0.5rem',
												}}
												{...formField}
											/>
										</FormControl>
										{field.description && (
											<FormDescription className="text-xs text-gray-500">
												{field.description}
											</FormDescription>
										)}
										<FormMessage />
									</FormItem>
								)}
							/>
						))}

						{goHighLevelOAuth.error && (
							<Alert variant="destructive" className="flex items-start gap-2">
								<AlertCircle className="mt-[2px] h-4 w-4" />
								<div>
									<AlertTitle>
										{__('Connection error', 'quillcrm')}
									</AlertTitle>
									<AlertDescription>
										{goHighLevelOAuth.error}
									</AlertDescription>
								</div>
							</Alert>
						)}

						<div className="form-actions mb-6">
							<Button
								type="submit"
								size="xl"
								className="w-full"
								disabled={goHighLevelOAuth.connecting}
							>
								{goHighLevelOAuth.connecting ? (
									<>
										<Loader2 className="h-4 w-4 animate-spin" />
										{__('Connecting...', 'quillcrm')}
									</>
								) : (
									<>
										<Link2 className="h-4 w-4" />
										{__('Connect to GoHighLevel', 'quillcrm')}
									</>
								)}
							</Button>
						</div>
					</form>
				</Form>

				<div className="redirect-url-section mt-4">
					<span className="mb-2 block text-sm font-semibold text-gray-900">
						{__('Redirect URL for your GoHighLevel app:', 'quillcrm')}
					</span>
					<div className="flex items-center gap-2 p-2 bg-gray-100 border rounded">
						<code className="flex-1 text-sm">
							{setup.redirect_url}
						</code>
						<Button
							size="sm"
							variant="outline"
							onClick={() =>
								navigator.clipboard.writeText(setup.redirect_url)
							}
						>
							{__('Copy', 'quillcrm')}
						</Button>
					</div>
				</div>
			</div>
		);
	}

	// Connected state
	if (connectionStatus === 'connected' && credentials.oauth_status) {
		const status = credentials.oauth_status;
		const timeRemaining = formatTimeRemaining(status.expires_in);
		const isExpiringSoon = goHighLevelOAuth.isExpiringSoon(status.expires_in);

		return (
			<div className="gohighlevel-oauth-connected">
				<div
					className={`flex items-start gap-3 p-4 rounded-lg border ${isExpiringSoon
						? 'bg-yellow-50 border-yellow-200'
						: 'bg-green-50 border-green-200'
						}`}
				>
					<CheckCircle2
						className={`mt-1 h-5 w-5 ${isExpiringSoon ? 'text-yellow-600' : 'text-green-600'
							}`}
					/>
					<div className="flex-1">
						<h3 className="font-medium text-gray-900 mb-1">
							{status.label}
						</h3>
						<div className="space-y-1 text-sm text-gray-600">
							{status.location_name && (
								<div>
									<strong>{__('Location:', 'quillcrm')}</strong>{' '}
									{status.location_name}
								</div>
							)}
							<div>
								<strong>{__('Connected:', 'quillcrm')}</strong>{' '}
								{status.connected_at}
							</div>
							<div
								className={
									isExpiringSoon
										? 'text-yellow-700 font-medium'
										: ''
								}
							>
								<strong>{__('Expires:', 'quillcrm')}</strong>{' '}
								{timeRemaining}
							</div>
						</div>

						{isExpiringSoon && (
							<div className="mt-2 p-2 bg-yellow-100 border border-yellow-300 rounded text-sm text-yellow-800">
								{__(
									'Connection expires soon. Please reconnect if import takes longer.',
									'quillcrm'
								)}
							</div>
						)}
					</div>
					<div className="flex flex-col gap-2">
						<Button
							variant="destructive"
							size="sm"
							onClick={handleDisconnect}
						>
							{__('Disconnect', 'quillcrm')}
						</Button>
					</div>
				</div>
			</div>
		);
	}

	return null;
};

export default GoHighLevelOAuth;