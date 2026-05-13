/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';
import { useEffect, useState } from '@wordpress/element';
import { useDispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
//@ts-ignore
import QuillForms from '@doublescale/assets/images/plugin-start/QuillForms.png';
//@ts-ignore
import pluginMarketingIllustration from '@doublescale/assets/images/plugin-ass.png';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PluginGridSkeleton } from './Plugin-Skeleton';

interface Plugin {
	id: string;
	name: string;
	icon: string;
	description: string;
	pluginFile?: string;
	downloadUrl?: string;
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
		<div
			className="group flex w-full flex-col gap-2 items-center rounded-xl border border-border bg-white p-6 text-center shadow-sm transition-all hover:border-brandPrimary hover:text-brandPrimary"
		>
			
			<img
				src={plugin.icon}
				alt=""
				className="h-12 w-12 object-contain"
				width={48}
				height={48}
			/>
			<h4 className="text-lg font-semibold leading-[30px] text-foreground">
				{plugin.name}
			</h4>
			<p className=" text-base font-medium leading-7 text-muted-foreground">
				{plugin.description}
			</p>
			<div className="mt-2 w-full pt-2">
				{actionType === 'active' ? (
					<span className="text-sm font-medium text-[#16A34A]">
						{__('Activated', 'doublescale')}
					</span>
				) : (
					<Button
						type="button"
						variant="outline"
						className="w-full border-brandPrimary text-brandPrimary hover:bg-brandPrimary/5"
						onClick={() => onAction(plugin)}
						disabled={isProcessing}
					>
						{isProcessing
							? __('Processing...', 'doublescale')
							: actionText}
					</Button>
				)}
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
	onSkip: _onSkip,
	onPrevious,
	onNext,
}: PluginCompleteProps) {
	const { createNotice } = useDispatch('doublescale/core');
	const [optionalPlugins, setOptionalPlugins] =
		useState<Plugin[]>(OptionalPlugins);
	const [isLoading, setIsLoading] = useState<boolean>(true);
	const [isProcessing, setIsProcessing] = useState<string | null>(null);
	const [email, setEmail] = useState('');

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
			// eslint-disable-next-line no-console
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
				setIsProcessing(null);
				return;
			}

			createNotice({
				type: 'success',
				message: sprintf(
					/* translators: %s: "installed" or "activated" */
					__('Plugin %s successfully', 'doublescale'),
					action === 'install'
						? __('installed', 'doublescale')
						: __('activated', 'doublescale')
				),
			});

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

	const isBusy = Boolean(isProcessing) || isLoading;

	return (
		<div className="flex min-h-0 flex-1 flex-col ">
			<div className="shrink-0 pb-6">
				<h3 className="mb-2.5 text-2xl font-bold leading-9 text-foreground">
					{__(
						'Install CRM Plugins—Power Up Your Workflow with Smart Tools',
						'doublescale'
					)}
				</h3>
				<p className="text-base font-medium leading-7 text-muted-foreground">
					{__(
						'Add complementary plugins to extend forms, bookings, and automation—so your CRM works seamlessly with the rest of your marketing stack.',
						'doublescale'
					)}
				</p>
			</div>

			<div className="min-h-0 flex-1 overflow-y-auto pr-0.5">
				{isLoading ? (
					<PluginGridSkeleton />
				) : (
					<div className="grid w-full grid-cols-1 gap-6 md:grid-cols-3 mb-6">
						{optionalPlugins.map((plugin) => (
							<PluginCard
								key={plugin.id}
								plugin={plugin}
								onAction={handlePluginAction}
								isProcessing={isProcessing === plugin.id}
							/>
						))}
					</div>
				)}

				<div className="flex w-full flex-col gap-4 rounded-xl border-2 border-dashed border-[#0D9DFC] bg-[rgba(217,233,243,0.7)] p-6">
					<div className="flex flex-wrap items-center justify-center gap-2">
						<img
							src={pluginMarketingIllustration}
							alt=""
							
							className=" shrink-0 object-contain"
							decoding="async"
						/>
						<p className=" text-center text-lg font-semibold leading-[30px] text-foreground">
							{__(
								'We will send marketing tips and advanced usage of Quill CRM',
								'doublescale'
							)}
						</p>
						<img
							src={pluginMarketingIllustration}
							alt=""
							
							className=" shrink-0 object-contain"
							decoding="async"
						/>
					</div>
					<div className="w-full">
						<Label
							htmlFor="plugin-opt-in-email"
							className="mb-2  block py-0 text-left text-sm font-medium leading-6"
						>
							{__('Email', 'doublescale')}
							<span className="text-destructive">*</span>
						</Label>
						<Input
							id="plugin-opt-in-email"
							type="email"
							autoComplete="email"
							placeholder={__('Email', 'doublescale')}
							value={email}
							onChange={(event) => setEmail(event.target.value)}
							className="w-full !rounded-lg border !border-border bg-white p-3 focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:border-brandPrimary focus-visible:ring-brandPrimary"
						/>
					</div>
				</div>
			</div>

			<div className="z-20 -mx-6 -mb-6 mt-6 shrink-0 bg-white px-6 py-4 shadow-[0_-8px_28px_rgba(15,23,42,0.07)] rounded-b-[20px]">
				<div className="flex flex-wrap items-center justify-end gap-6">
					<Button
						type="button"
						size="lg"
						variant="secondaryDeepBlue"
						onClick={onPrevious}
						disabled={isBusy}
					>
						{__('Back', 'doublescale')}
					</Button>
					<Button
						type="button"
						size="lg"
						variant="default"
						onClick={onNext}
						disabled={isBusy}
					>
						{__('Complete installation', 'doublescale')}
					</Button>
				</div>
			</div>
		</div>
	);
}
