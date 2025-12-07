/**
 * WordPress dependencies
 */

import { __ } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';
import { useEffect, useState } from '@wordpress/element';
import { useDispatch } from '@wordpress/data';
//@ts-ignore
import QuillBooking from '../../../../../assets/images/plugin-start/QuillBooking.png'
//@ts-ignore
import QuillForms from '../../../../../assets/images/plugin-start/QuillForms.png'
//@ts-ignore
import QuillSMTP from '../../../../../assets/images/plugin-start/QuillSMTP.png'
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
import RecommendedPluginIcon from '@quillcrm/components/icons/recommended-plugin';
import QuillBookingIcon from '@quillcrm/components/icons/quillBooking';
import OptionalPluginIcon from '@quillcrm/components/icons/optional-icon';
import ButtonComponent from '../component/button';
import { Input } from '../../../../components/ui/input';
import { PluginsLoadingSkeleton } from './Plugin-Skeleton ';

interface Plugin {
	id: string;
	name: string;
	// icon: React.ReactNode;
	icon: string;
	description: string;
	pluginFile?: string; // WordPress plugin file path (e.g., 'quill-smtp/quill-smtp.php')
	downloadUrl?: string; // WordPress.org zip URL
	isInstalled?: boolean;
	isActive?: boolean;
}

const RecommendedPlugins: Plugin[] = [
	{
		id: 'quill-smtp',
		name: 'Quill SMTP',
		icon: QuillSMTP,
		description: __(
			'Quill SMTP helps you send reliable, trackable emails directly from your CRM.',
			'quillcrm'
		),
		// Main plugin file is "quillsmtp.php" inside the "quill-smtp" folder.
		pluginFile: 'quill-smtp/quillsmtp.php',
		downloadUrl:
			'https://downloads.wordpress.org/plugin/quill-smtp.1.5.3.zip',
	},
];

const OptionalPlugins: Plugin[] = [
	{
		id: 'quillbooking',
		name: 'Quill Booking',
		icon: QuillBooking,
		description: __(
			'Quill Booking empowers you with seamless appointment scheduling.',
			'quillcrm'
		),
		pluginFile: 'quillbooking/quillbooking.php',
		downloadUrl:
			'https://downloads.wordpress.org/plugin/quillbooking.1.2.1.zip',
	},
	{
		id: 'quillforms',
		name: 'Quill Forms',
		icon: QuillForms,
		description: __(
			'Quill Forms lets you build powerful forms and connect submissions to your CRM.',
			'quillcrm'
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
	let actionText = __('Install Now', 'quillcrm');
	let actionType: 'install' | 'activate' | 'active' = 'install';

	if (isInstalled && !isActive) {
		actionText = __('Activate', 'quillcrm');
		actionType = 'activate';
	} else if (isActive) {
		actionText = __('Activated', 'quillcrm');
		actionType = 'active';
	}

	return (
		<div className="flex items-start justify-between gap-4 p-4 border border-[#DEE1E6] bg-[#F8F8F8] rounded-2xl">
			<div className="flex flex-col items-start gap-3 flex-1">
				<div className="flex justify-between items-center w-full">
					<div className="flex gap-1 flex-1">
						{/* {plugin.icon} */}
						<img src={plugin.icon} alt={plugin.name} />
						<h4 className="text-xl font-medium leading-[30px] text-[#09090B]">
							{plugin.name}
						</h4>
					</div>

					{actionType === 'active' ? (
						<span className="text-xs font-medium leading-[26px] text-[#10B981]">
							{__('Activated', 'quillcrm')}
						</span>
					) : (
						<Button
							variant="default"
							size="sm"
							onClick={() => onAction(plugin)}
							className="flex-shrink-0 justify-end text-xs h-8 px-4 bg-transparent font-medium leading-[26px] text-base border border-[#458DC7] text-[#458DC7] hover:bg-blue-100"
							disabled={isProcessing}
						>
							{isProcessing
								? __('Processing...', 'quillcrm')
								: actionText}
						</Button>
					)}
				</div>

				<p className="text-lg leading-7 text-[#777] mt-1">
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
	const { createNotice } = useDispatch('quillcrm/core');
	const [recommendedPlugins, setRecommendedPlugins] =
		useState<Plugin[]>(RecommendedPlugins);
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
				const pluginFiles = [...RecommendedPlugins, ...OptionalPlugins]
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
					path: `/qc/v1/plugins/status?plugins=${encodeURIComponent(
						pluginFiles
					)}`,
					method: 'GET',
				});

				const statusMap = response?.data || {};

				const updatedRecommended = RecommendedPlugins.map((plugin) => {
					const status = plugin.pluginFile
						? statusMap[plugin.pluginFile]
						: undefined;

					return {
						...plugin,
						isInstalled: Boolean(status?.is_installed),
						isActive: Boolean(status?.is_active),
					};
				});

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

				setRecommendedPlugins(updatedRecommended);
				setOptionalPlugins(updatedOptional);
			} catch (error: any) {
				// eslint-disable-next-line no-console
				console.error('Failed to check plugin status:', error);
				const errorMessage =
					error?.message ||
					error?.data?.message ||
					__('Failed to check plugin status', 'quillcrm');
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
				message: __('Plugin information not defined', 'quillcrm'),
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
					path: '/qc/v1/plugins/install',
					method: 'POST',
					data: {
						download_url: plugin.downloadUrl,
						plugin_file: plugin.pluginFile,
					},
				});
			} else if (!plugin.isActive) {
				action = 'activate';

				await apiFetch({
					path: '/qc/v1/plugins/activate',
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
				message: __(`Plugin ${action}d successfully`, 'quillcrm'),
			});

			// Refresh plugin status after action.
			const pluginFiles = [...RecommendedPlugins, ...OptionalPlugins]
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
					path: `/qc/v1/plugins/status?plugins=${encodeURIComponent(
						pluginFiles
					)}`,
					method: 'GET',
				});

				const statusMap = response?.data || {};

				setRecommendedPlugins(
					RecommendedPlugins.map((p) => {
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
					'quillcrm'
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
		<div className="flex flex-col gap-10">
			<div>
				<h3 className="text-[#170F49] text-[32px] font-semibold">
					{__(
						'Complete Your Setup—Install Recommended & Optional Plugins',
						'quillcrm'
					)}
				</h3>
				<p className="text-[#777] text-lg font-normal leading-7">
					{__(
						'Enhance your CRM experience by installing Quill SMTP (recommended) and optional Quill Booking / Quill Forms integrations.',
						'quillcrm'
					)}
				</p>
			</div>

			{isLoading ? (
				<div className="text-center py-12">
					<p className="text-[#777] text-lg">
						<PluginsLoadingSkeleton />
					</p>
				</div>
			) : (
				<Accordion
					type="multiple"
					defaultValue={['recommended', 'optional']}
					className="grid grid-cols-1 md:grid-cols-2 gap-12"
				>
					{/* Recommended Plugins */}
					<AccordionItem
						value="recommended"
						className="border border-[#DEE1E6] rounded-lg shadow-sm flex flex-col gap-4"
					>
						<AccordionTrigger className="px-4 py-3 bg-[#F8F8F8] hover:no-underline border-b border-[#DEE1E6]">
							<div className="flex items-center gap-2">
								<RecommendedPluginIcon />
								<span className="text-lg font-medium leading-7 text-[#09090B]">
									{__('Recommended Plugins', 'quillcrm')}
								</span>
							</div>
						</AccordionTrigger>
						<AccordionContent className="px-4 pb-3">
							<div className="flex flex-col gap-4">
								{recommendedPlugins.map((plugin) => (
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

					{/* Optional Plugins */}
					<AccordionItem
						value="optional"
						className="border border-[#DEE1E6] rounded-lg shadow-sm flex flex-col gap-4"
					>
						<AccordionTrigger className="px-4 py-3 bg-[#F8F8F8] hover:no-underline border-b border-[#DEE1E6]">
							<div className="flex items-center gap-2">
								<OptionalPluginIcon />
								<span className="text-lg font-medium leading-7 text-[#09090B]">
									{__('Optional Plugins', 'quillcrm')}
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

			<div className=" bg-[#DEE1E6] w-full h-[1px]"></div>

			{/* Email Subscription */}

			{/* <div className=" !p-0 !m-0">
				<label className="text-base leading-6 text-[#09090B] block mb-[2px]">
					{__('Email Address', 'quillcrm')}
				</label>

				<Input
					type="email"
					placeholder={__('Email Address', 'quillcrm')}
					value={email}
					onChange={(e) => setEmail(e.target.value)}
					className="w-full border !border-[#DEE1E6] rounded-lg h-12 py-[5px] px-4 !m-0"
				/>

				<p className="text-xs text-[#CB5301] font-semibold leading-[26px] !m-0">
					{__(
						'We will send marketing tips and advanced usage of Quill CRM',
						'quillcrm'
					)}
				</p>
			</div> */}

			<div className="flex justify-between pt-8">
				<div className="flex gap-2">
					<ButtonComponent onClick={onPrevious} type="">
						{__('Previous', 'quillcrm')}
					</ButtonComponent>

					<ButtonComponent type="no" onClick={onSkip}>
						{__('Skip →', 'quillcrm')}
					</ButtonComponent>
				</div>
				<ButtonComponent type="go" onClick={onNext}>
					{__('Next Step', 'quillcrm')}
				</ButtonComponent>
			</div>
		</div>
	);
}
