import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { __ } from '@wordpress/i18n';
import { Button } from '@/components/ui/button';
import Builder from '@/builder/index';
import AIEmailBuilder from '../../client/pages/campaign/steps/templates/ai-email-builder';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import { DialogLayerContext } from '@/components/ui/dialog-layer-context';
import { EnvelopeIcon, RepeatIcon } from '@doublescale/components';
import { Sparkles } from 'lucide-react';
import type { BuilderData } from '@/builder/index';
import EmailTemplatesPicker from '@/components/email-templates-picker';

export interface OpenBuilderProps {
	initialEmailBody?: string | object;
	onSave: (emailBodyJson: string) => void | Promise<void>;
	buttonText?: string;
	buttonVariant?:
		| 'default'
		| 'destructive'
		| 'outline'
		| 'secondary'
		| 'ghost'
		| 'link';
	buttonClassName?: string;
	builderKey?: string;
	/**
	 * When set, the builder shows "Send test email" (automation "Send Email"
	 * action). Read lazily so the popover always sees the latest sibling
	 * subject/from values.
	 */
	getTestEmailContext?: () => {
		subject?: string;
		from_name?: string;
		from_email?: string;
		reply_to?: string;
	};
}

type BuilderMode = 'scratch' | null;

const emptyBuilderData = (): BuilderData => ({
	sections: [],
	globalSettings: {},
	buttonSettings: {},
});

const OpenBuilder: React.FC<OpenBuilderProps> = ({
	initialEmailBody,
	onSave,
	buttonText = __('Open Builder', 'doublescale'),
	buttonVariant = 'default',
	buttonClassName = 'bg-blue-600 hover:bg-blue-700 text-white px-6 py-2',
	builderKey = 'default',
	getTestEmailContext,
}) => {
	const [isBuilderOpen, setIsBuilderOpen] = useState(false);
	const [showSelection, setShowSelection] = useState(false);
	const [showEmailTemplatesStep, setShowEmailTemplatesStep] = useState(false);
	const [showAiBuilder, setShowAiBuilder] = useState(false);
	const [builderMode, setBuilderMode] = useState<BuilderMode>(null);
	const [builderInitialData, setBuilderInitialData] =
		useState<BuilderData | null>(null);
	const [templatesPortalEl, setTemplatesPortalEl] =
		useState<HTMLDivElement | null>(null);

	const hasExistingContent = (() => {
		if (!initialEmailBody) return false;
		try {
			const data =
				typeof initialEmailBody === 'string'
					? JSON.parse(initialEmailBody)
					: initialEmailBody;
			return (
				data?.type === 'builder' && data?.value?.sections?.length > 0
			);
		} catch {
			return false;
		}
	})();

	const handleOpenBuilder = () => {
		if (hasExistingContent) {
			setBuilderInitialData(null);
			setBuilderMode('scratch');
			setIsBuilderOpen(true);
		} else {
			setShowSelection(true);
		}
	};

	const openBuilderWithData = (data: BuilderData) => {
		setBuilderInitialData(data);
		setBuilderMode('scratch');
		setIsBuilderOpen(true);
	};

	const handleSelectScratch = () => {
		setShowSelection(false);
		openBuilderWithData(emptyBuilderData());
	};

	const handleSelectTemplates = () => {
		setShowSelection(false);
		setShowEmailTemplatesStep(true);
	};

	const handleTemplatesStartFromScratch = () => {
		setShowEmailTemplatesStep(false);
		openBuilderWithData(emptyBuilderData());
	};

	const handleTemplatesApply = (data: BuilderData) => {
		setShowEmailTemplatesStep(false);
		openBuilderWithData(data);
	};

	const handleTemplatesGenerateWithAi = () => {
		setShowEmailTemplatesStep(false);
		setShowAiBuilder(true);
	};

	const handleSelectAi = () => {
		setShowSelection(false);
		setShowAiBuilder(true);
	};

	const handleAiApplyTemplate = (template: any) => {
		if (!template?.value) return;
		const { sections, globalSettings, buttonSettings } = template.value;

		const preparedDataEmailBody = {
			type: 'builder',
			value: {
				sections: sections || [],
				globalSettings: globalSettings || {},
				buttonSettings: buttonSettings || {},
			},
		};
		const emailBodyJson = JSON.stringify(preparedDataEmailBody);
		onSave(emailBodyJson);

		setShowAiBuilder(false);
		openBuilderWithData({
			sections: sections || [],
			globalSettings: globalSettings || {},
			buttonSettings: buttonSettings || {},
		});
	};

	const handleBuilderSave = async (builderData: any) => {
		const preparedDataEmailBody = {
			type: 'builder',
			value: builderData,
		};
		const emailBodyJson = JSON.stringify(preparedDataEmailBody);
		await onSave(emailBodyJson);
	};

	const handleBuilderClose = () => {
		setIsBuilderOpen(false);
		setBuilderMode(null);
		setBuilderInitialData(null);
	};

	useEffect(() => {
		if (!isBuilderOpen) {
			return;
		}

		const inertElements: HTMLElement[] = [];

		const timeoutId = setTimeout(() => {
			// Only freeze the automation editor itself. Marking every
			// [role="dialog"] also traps later builder dialogs (and WP media)
			// if they happen to already be in the tree.
			const automationDialog = document.getElementById(
				'doublescale-automation-editor-dialog'
			);
			if (
				automationDialog &&
				!automationDialog.hasAttribute('inert')
			) {
				automationDialog.setAttribute('inert', '');
				inertElements.push(automationDialog);
			}

			const sidebar = document.querySelector(
				'.doublescale-workflow-sidebar'
			);
			if (sidebar && !sidebar.closest('#doublescale-email-builder')) {
				const sidebarElement = sidebar as HTMLElement;
				sidebarElement.setAttribute('inert', '');
				inertElements.push(sidebarElement);
			}

			const builderWrapper = document.getElementById(
				'builder-portal-wrapper'
			);
			if (builderWrapper) {
				builderWrapper.focus();
			}
		}, 50);

		return () => {
			clearTimeout(timeoutId);
			inertElements.forEach((element) => {
				element.removeAttribute('inert');
			});
		};
	}, [isBuilderOpen]);

	// The automation editor is a modal Radix dialog, so react-remove-scroll
	// cancels wheel events raised outside its own content — including both of
	// our body-level portals. Claim the event during capture so the native
	// scroll still happens before that listener sees it.
	useEffect(() => {
		if (!isBuilderOpen && !showEmailTemplatesStep) {
			return;
		}

		const handleWheel = (e: WheelEvent) => {
			const target = e.target as HTMLElement;
			if (
				!target.closest(
					'#builder-portal-wrapper, #email-templates-portal-wrapper'
				)
			) {
				return;
			}

			const scrollableContainers = [
				'.flex-1.overflow-auto',
				'.overflow-y-auto',
				'.overflow-auto',
			];

			for (const selector of scrollableContainers) {
				const scrollable = target.closest(selector) as HTMLElement;
				if (scrollable) {
					const canScrollVertically =
						scrollable.scrollHeight > scrollable.clientHeight;
					const canScrollHorizontally =
						scrollable.scrollWidth > scrollable.clientWidth;

					if (canScrollVertically || canScrollHorizontally) {
						e.stopPropagation();
						return;
					}
				}
			}
		};

		document.addEventListener('wheel', handleWheel, {
			capture: true,
			passive: false,
		});

		return () => {
			document.removeEventListener('wheel', handleWheel, {
				capture: true,
			});
		};
	}, [isBuilderOpen, showEmailTemplatesStep]);

	const getBuilderInitialData = () => {
		if (builderInitialData) {
			return builderInitialData;
		}

		if (!initialEmailBody) {
			return emptyBuilderData();
		}

		try {
			if (typeof initialEmailBody === 'object') {
				const value =
					(initialEmailBody as any)?.type === 'builder' &&
					(initialEmailBody as any)?.value
						? (initialEmailBody as any).value
						: initialEmailBody;
				return (
					(value as any) ?? {
						sections: [],
						globalSettings: {},
						buttonSettings: {},
					}
				);
			}

			const emailBodyJson = JSON.parse(initialEmailBody);

			if (emailBodyJson.type === 'builder' && emailBodyJson.value) {
				return emailBodyJson.value;
			}

			return (
				emailBodyJson ?? {
					sections: [],
					globalSettings: {},
					buttonSettings: {},
				}
			);
		} catch (error) {
			console.error('Failed to parse email body:', error);
			return emptyBuilderData();
		}
	};

	const getButtonText = () => {
		if (buttonText) {
			return buttonText;
		}

		return hasExistingContent
			? __('Edit Template', 'doublescale')
			: __('Open Builder', 'doublescale');
	};

	const selectionOptions = [
		{
			label: __('Start From Scratch', 'doublescale'),
			description: __(
				'Build your email from the ground up using our drag-and-drop builder with full creative control.',
				'doublescale'
			),
			type: 'blank',
			icon: <EnvelopeIcon />,
			onClick: handleSelectScratch,
		},
		{
			label: __('Choose A Pre-built Template', 'doublescale'),
			description: __(
				'Start with a professionally designed template and customize it to match your brand.',
				'doublescale'
			),
			type: 'pre-built',
			icon: <RepeatIcon />,
			onClick: handleSelectTemplates,
		},
		{
			label: __('Generate With AI', 'doublescale'),
			description: __(
				'Describe the email you want and let AI create a professional template for you to customize.',
				'doublescale'
			),
			type: 'ai',
			icon: <Sparkles className="w-5 h-5" />,
			onClick: handleSelectAi,
			beta: true,
		},
	];

	return (
		<>
			<Button
				variant={buttonVariant}
				onClick={handleOpenBuilder}
				className={buttonClassName}
			>
				{getButtonText()}
			</Button>

			<Dialog
				open={showSelection}
				onOpenChange={() => setShowSelection(false)}
			>
				<DialogContent
					overlayClassName="z-[160010]"
					className="z-[160011] w-[calc(100vw-1.5rem)] max-w-[800px] max-h-[90vh] overflow-y-auto rounded-md p-4 sm:p-6"
				>
					<DialogHeader className="mt-4 text-center sm:mt-0 sm:text-center">
						<DialogTitle className="mb-1 text-xl font-bold sm:text-2xl">
							{__(
								"Choose how you'd like to build your Email",
								'doublescale'
							)}
						</DialogTitle>
						<DialogDescription className="text-foreground">
							{__(
								'Select an option to start creating your email template',
								'doublescale'
							)}
						</DialogDescription>
					</DialogHeader>
					<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
						{selectionOptions.map((option) => (
							<div
								className="flex w-full flex-col items-center justify-between rounded-lg border border-gray-200 px-4 py-5 sm:py-6 cursor-pointer hover:bg-secondary-background hover:border-primary hover:transition-all hover:duration-300"
								key={option.type}
								onClick={option.onClick}
							>
								<div className="bg-gradient-to-r from-[#1E3A8A] to-[#3B82F6] text-primary-foreground p-3 rounded-xl">
									{option.icon}
								</div>
								<div className="flex items-center gap-2 w-full justify-center">
									<p className="font-semibold text-foreground text-sm my-2">
										{option.label}
									</p>
									{option.beta && (
										<span className="text-xs text-primary bg-secondary-background rounded-full px-2 py-1 font-semibold">
											{__('Beta', 'doublescale')}
										</span>
									)}
								</div>
								<p className="text-foreground text-sm text-center">
									{option.description}
								</p>
							</div>
						))}
					</div>
				</DialogContent>
			</Dialog>

			<AIEmailBuilder
				visible={showAiBuilder}
				setVisible={setShowAiBuilder}
				onApplyTemplate={handleAiApplyTemplate}
				stackAboveFullscreenShell
			/>

			{showEmailTemplatesStep &&
				createPortal(
					<DialogLayerContext.Provider value={templatesPortalEl}>
						<div
							ref={setTemplatesPortalEl}
							id="email-templates-portal-wrapper"
							role="dialog"
							aria-modal="true"
							aria-label={__('Email templates', 'doublescale')}
							className="fixed inset-0 z-[160025] overflow-y-auto bg-[#F7F8FA]"
						>
							<div className="mx-auto min-h-full w-full max-w-[1400px] p-4 sm:p-6 lg:p-8">
								<EmailTemplatesPicker
									requireProForTemplates={false}
									showBackButton
									onBack={() =>
										setShowEmailTemplatesStep(false)
									}
									onApplyBuilderData={handleTemplatesApply}
									onStartFromScratch={
										handleTemplatesStartFromScratch
									}
									onGenerateWithAi={
										handleTemplatesGenerateWithAi
									}
								/>
							</div>
						</div>
					</DialogLayerContext.Provider>,
					document.body
				)}

			{isBuilderOpen && (
				<>
					{createPortal(
						// eslint-disable-next-line react/forbid-dom-props
						<div
							id="builder-portal-wrapper"
							tabIndex={-1}
							data-state="open"
							data-builder-portal="true"
							role="application"
							aria-modal="true"
							aria-label="Email Template Builder"
							style={{
								position: 'fixed',
								inset: 0,
								zIndex: 160030,
								pointerEvents: 'auto',
							}}
						>
							<Builder
								key={`${builderKey}-${builderInitialData ? 'picked' : 'existing'}-${builderMode}`}
								initialData={getBuilderInitialData()}
								onSave={handleBuilderSave}
								onClose={handleBuilderClose}
								autoSave={false}
								getTestEmailContext={getTestEmailContext}
							/>
						</div>,
						document.body
					)}
				</>
			)}
		</>
	);
};

export default OpenBuilder;
