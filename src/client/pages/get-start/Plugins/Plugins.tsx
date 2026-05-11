/**
 * WordPress dependencies
 */

import { __ } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';
import { useEffect, useState } from '@wordpress/element';
import { useDispatch } from '@wordpress/data';
//@ts-ignore
import QuillForms from '@doublescale/assets/images/plugin-start/QuillForms.png';
/**
 * External dependencies
 */

import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import OptionalPluginIcon from '@doublescale/shared/icons/optional-icon';
import ButtonComponent from '../component/button';
import { Input } from '@/components/ui/input';
import { PluginsLoadingSkeleton } from './Plugin-Skeleton';

interface Plugin {
	id: string;
	name: string;
	// icon: React.ReactNode;
	icon: string;
	description: string;
	pluginFile?: string; // WordPress plugin file path (e.g., 'doublescale/doublescale.php')
	downloadUrl?: string; // WordPress.org zip URL
	isInstalled?: boolean;
	isActive?: boolean;
}

const OptionalPlugins: Plugin[] = [
	{
		id: 'quillforms',
		name: 'Quill Forms',
		icon: QuillForms,
		description: __(
			'Quill Forms lets you build powerful forms and connect submissions to your CRM.',
			'doublescale'
		),
		pluginFile: 'quillforms/quillforms.php',
		downloadUrl:
			'https://downloads.wordpress.org/plugin/quillforms.5.4.1.zip',
	},
];

interface PluginCardProps {
	readonly plugin: Plugin;
	readonly onAction: (plugin: Plugin) => void;
	readonly isProcessing: boolean;
}

function PluginCard({ plugin, onAction, isProcessing }: PluginCardProps) {
	const isInstalled = plugin.isInstalled || false;
	const isActive = plugin.isActive || false;
	let actionText = __('Install Now', 'doublescale');
	let actionType: 'install' | 'activate' | 'active' = 'install';

	if (isInstalled && !isActive) {
		actionText = __('Activate', 'doublescale');
		actionType = 'activate';
	} else if (isActive) {
		actionText = __('Activated', 'doublescale');
		actionType = 'active';
	}

	return (
		<div className="flex items-start justify-between gap-4 p-4 border border-border/60 bg-muted/50 rounded-2xl">
			<div className="flex flex-col items-start gap-3 flex-1">
				<div className="flex justify-between items-center w-full">
					<div className="flex gap-1 flex-1">
						{/* {plugin.icon} */}
						<img src={plugin.icon} alt={plugin.name} />
						<h4 className="text-xl font-medium leading-[30px] text-foreground">
							{plugin.name}
						</h4>
					</div>

					{actionType === 'active' ? (
						<span className="text-xs font-medium leading-[26px] text-[#10B981]">
							{__('Activated', 'doublescale')}
						</span>
					) : (
						<Button
							variant="outline"
							size="sm"
							onClick={() => onAction(plugin)}
							className="flex-shrink-0 border-primary text-primary hover:bg-primary/5"
							disabled={isProcessing}
						>
							{isProcessing
								? __('Processing...', 'doublescale')
								: actionText}
						</Button>
					)}
				</div>

				<p className="text-lg leading-7 text-muted-foreground mt-1">
					{plugin.description}
				</p>
			</div>
		</div>
	);
}

interface PluginCompleteProps {
	readonly onSkip: () => void;
	readonly onPrevious: () => void;
	readonly onNext: () => void;
}

export default function PluginComplete({
	onSkip,
	onPrevious,
	onNext,
}: PluginCompleteProps) {
	const { createNotice } = useDispatch('doublescale/core');
	const [optionalPlugins, setOptionalPlugins] =
		useState<Plugin[]>(OptionalPlugins);
	const [isLoading, setIsLoading] = useState<boolean>(true);
	const [isProcessing, setIsProcessing] = useState<string | null>(null);
	const [email, setEmail] = useState('');

	// Check plugin status on mount
	useEffect(() => {
		const checkPluginStatus = async () => {
			setIsLoading(true);
			try {
				const pluginFiles = [...OptionalPlugins]
					.map((plugin) => plugin.pluginFile)
					.filter((file): file is string => Boolean(file))
					.join(',');

				if (!pluginFiles) {
					setIsLoading(false);
					return;
				}

				const response: {
					data?: Record<
						string,
						{ is_installed?: boolean; is_active?: boolean }
					>;
				} = await apiFetch({
					path: `/doublescale/v1/plugins/status?plugins=${encodeURIComponent(
						pluginFiles
					)}`,
					method: 'GET',
				});

				const statusMap = response?.data || {};

				const updatedOptional = OptionalPlugins.map((plugin) => {
					const status = plugin.pluginFile
						? statusMap[plugin.pluginFile]
						: undefined;

					return {
						...plugin,
						isInstalled: Boolean(status?.is_installed),
						isActive: Boolean(status?.is_active),
					};
				});

				setOptionalPlugins(updatedOptional);
			} catch (error: any) {
				// eslint-disable-next-line no-console
				console.error('Failed to check plugin status:', error);
				const errorMessage =
					error?.message ||
					error?.data?.message ||
					__('Failed to check plugin status', 'doublescale');
				createNotice({
					type: 'error',
					message: errorMessage,
				});
			} finally {
				setIsLoading(false);
			}
		};

		checkPluginStatus();
	}, [createNotice]);

	const handlePluginAction = async (plugin: Plugin) => {
		if (!plugin.pluginFile) {
			console.warn(`Plugin file not defined for ${plugin.name}`);
			createNotice({
				type: 'error',
				message: __('Plugin information not defined', 'doublescale'),
			});
			return;
		}

		setIsProcessing(plugin.id);
		try {
			let action: 'install' | 'activate';

			if (!plugin.isInstalled) {
				if (!plugin.downloadUrl) {
					throw new Error('Missing download URL for plugin.');
				}

				action = 'install';

				await apiFetch({
					path: '/doublescale/v1/plugins/install',
					method: 'POST',
					data: {
						download_url: plugin.downloadUrl,
						plugin_file: plugin.pluginFile,
					},
				});
			} else if (!plugin.isActive) {
				action = 'activate';

				await apiFetch({
					path: '/doublescale/v1/plugins/activate',
					method: 'POST',
					data: {
						plugin_file: plugin.pluginFile,
					},
				});
			} else {
				// Already active; nothing to do.
				setIsProcessing(null);
				return;
			}

			createNotice({
				type: 'success',
				message: __(`Plugin ${action}d successfully`, 'doublescale'),
			});

			// Refresh plugin status after action.
			const pluginFiles = [...OptionalPlugins]
				.map((p) => p.pluginFile)
				.filter((file): file is string => Boolean(file))
				.join(',');

			if (pluginFiles) {
				const response: {
					data?: Record<
						string,
						{ is_installed?: boolean; is_active?: boolean }
					>;
				} = await apiFetch({
					path: `/doublescale/v1/plugins/status?plugins=${encodeURIComponent(
						pluginFiles
					)}`,
					method: 'GET',
				});

				const statusMap = response?.data || {};

				setOptionalPlugins(
					OptionalPlugins.map((p) => {
						const status = p.pluginFile
							? statusMap[p.pluginFile]
							: undefined;
						return {
							...p,
							isInstalled: Boolean(status?.is_installed),
							isActive: Boolean(status?.is_active),
						};
					})
				);
			}
		} catch (error: any) {
			// eslint-disable-next-line no-console
			console.error(
				`Failed to ${plugin.isInstalled ? 'activate' : 'install'} plugin:`,
				error
			);
			const errorMessage =
				error?.message ||
				error?.data?.message ||
				__(
					`Failed to ${plugin.isInstalled ? 'activate' : 'install'} plugin`,
					'doublescale'
				);
			createNotice({
				type: 'error',
				message: errorMessage,
			});
		} finally {
			setIsProcessing(null);
		}
	};

	return (
		<div className="flex flex-col gap-8">
			<div>
				<h3 className="text-foreground text-2xl font-semibold mb-1">
					{__(
						'Optional Plugins',
						'doublescale'
					)}
				</h3>
				<p className="text-muted-foreground text-sm leading-relaxed">
					{__(
						'Enhance your CRM experience with optional Quill Booking and Quill Forms integrations.',
						'doublescale'
					)}
				</p>
			</div>

			{isLoading ? (
				<div className="text-center py-12">
					<p className="text-muted-foreground text-lg">
						<PluginsLoadingSkeleton />
					</p>
				</div>
			) : (
				<Accordion
					type="multiple"
					defaultValue={['optional']}
					className="grid grid-cols-1 gap-12"
				>
					<AccordionItem
						value="optional"
						className="border border-border/60 rounded-lg shadow-sm flex flex-col gap-4"
					>
						<AccordionTrigger className="px-4 py-3 bg-muted/50 hover:no-underline border-b border-border/60">
							<div className="flex items-center gap-2">
								<OptionalPluginIcon />
								<span className="text-lg font-medium leading-7 text-foreground">
									{__('Optional Plugins', 'doublescale')}
								</span>
							</div>
						</AccordionTrigger>
						<AccordionContent className="px-4 pb-3">
							<div className="flex flex-col gap-4">
								{optionalPlugins.map((plugin) => (
									<PluginCard
										key={plugin.id}
										plugin={plugin}
										onAction={handlePluginAction}
										isProcessing={
											isProcessing === plugin.id
										}
									/>
								))}
							</div>
						</AccordionContent>
					</AccordionItem>
				</Accordion>
			)}

			<div className="border-t border-border/40" />

			{/* Email Subscription */}

			{/* <div className=" !p-0 !m-0">
				<label className="text-base leading-6 text-foreground block mb-[2px]">
					{__('Email Address', 'doublescale')}
				</label>

				<Input
					type="email"
					placeholder={__('Email Address', 'doublescale')}
					value={email}
					onChange={(e) => setEmail(e.target.value)}
					className="w-full border !border-border/60 rounded-lg h-12 py-[5px] px-4 !m-0"
				/>

				<p className="text-xs text-[#CB5301] font-semibold leading-[26px] !m-0">
					{__(
						'We will send marketing tips and advanced usage of DoubleScale',
						'doublescale'
					)}
				</p>
			</div> */}

			<div className="flex justify-between pt-6">
				<div className="flex gap-2">
					<ButtonComponent onClick={onPrevious} type="">
						{__('Previous', 'doublescale')}
					</ButtonComponent>

					<ButtonComponent type="no" onClick={onSkip}>
						{__('Skip →', 'doublescale')}
					</ButtonComponent>
				</div>
				<ButtonComponent type="go" onClick={onNext}>
					{__('Next Step', 'doublescale')}
				</ButtonComponent>
			</div>
		</div>
	);
}
