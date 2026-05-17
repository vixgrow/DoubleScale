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
import { EnvelopeIcon, RepeatIcon } from '@doublescale/components';
import { Sparkles } from 'lucide-react';

export interface OpenBuilderProps {
	initialEmailBody?: string | object;
	onSave: (emailBodyJson: string) => void;
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
}

type BuilderMode = 'scratch' | 'templates' | null;

const OpenBuilder: React.FC<OpenBuilderProps> = ({
	initialEmailBody,
	onSave,
	buttonText = __('Open Builder', 'doublescale'),
	buttonVariant = 'default',
	buttonClassName = 'bg-blue-600 hover:bg-blue-700 text-white px-6 py-2',
	builderKey = 'default',
}) => {
	const [isBuilderOpen, setIsBuilderOpen] = useState(false);
	const [showSelection, setShowSelection] = useState(false);
	const [showAiBuilder, setShowAiBuilder] = useState(false);
	const [builderMode, setBuilderMode] = useState<BuilderMode>(null);

	const hasExistingContent = (() => {
		if (!initialEmailBody) return false;
		try {
			const data =
				typeof initialEmailBody === 'string'
					? JSON.parse(initialEmailBody)
					: initialEmailBody;
			return (
				data?.type === 'builder' &&
				data?.value?.sections?.length > 0
			);
		} catch {
			return false;
		}
	})();

	const handleOpenBuilder = () => {
		if (hasExistingContent) {
			setBuilderMode('scratch');
			setIsBuilderOpen(true);
		} else {
			setShowSelection(true);
		}
	};

	const handleSelectScratch = () => {
		setShowSelection(false);
		setBuilderMode('scratch');
		setIsBuilderOpen(true);
	};

	const handleSelectTemplates = () => {
		setShowSelection(false);
		setBuilderMode('templates');
		setIsBuilderOpen(true);
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
			value: { sections: sections || [], globalSettings: globalSettings || {}, buttonSettings: buttonSettings || {} },
		};
		const emailBodyJson = JSON.stringify(preparedDataEmailBody);
		onSave(emailBodyJson);

		setShowAiBuilder(false);
		setBuilderMode('scratch');
		setIsBuilderOpen(true);
	};

	const handleBuilderSave = (builderData: any) => {
		const preparedDataEmailBody = {
			type: 'builder',
			value: builderData,
		};
		const emailBodyJson = JSON.stringify(preparedDataEmailBody);
		onSave(emailBodyJson);
		setIsBuilderOpen(false);
		setBuilderMode(null);
		return Promise.resolve();
	};

	const handleBuilderClose = () => {
		setIsBuilderOpen(false);
		setBuilderMode(null);
	};

	useEffect(() => {
		if (!isBuilderOpen) {
			return;
		}

		const inertElements: HTMLElement[] = [];

		const timeoutId = setTimeout(() => {
			const dialogContents = document.querySelectorAll('[role="dialog"]');

			dialogContents.forEach((dialog) => {
				const dialogElement = dialog as HTMLElement;
				if (
					!dialogElement.querySelector('#doublescale-email-builder') &&
					!dialogElement.closest('#doublescale-email-builder')
				) {
					const wasInert = dialogElement.hasAttribute('inert');
					if (!wasInert) {
						dialogElement.setAttribute('inert', '');
						inertElements.push(dialogElement);
					}
				}
			});

			const sidebar = document.querySelector('.doublescale-workflow-sidebar');
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

	useEffect(() => {
		if (!isBuilderOpen) {
			return;
		}

		const handleWheel = (e: WheelEvent) => {
			const target = e.target as HTMLElement;
			if (!target.closest('#builder-portal-wrapper')) {
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
	}, [isBuilderOpen]);

	const getBuilderInitialData = () => {
		if (!initialEmailBody) {
			const empty: any = {
				sections: [],
				globalSettings: {},
				buttonSettings: {},
			};
			return empty;
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
			return {
				sections: [],
				globalSettings: {},
				buttonSettings: {},
			};
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
					className="z-[160011] max-w-[840px] w-full mx-auto"
				>
					<DialogHeader className="text-center sm:text-center">
						<DialogTitle className="text-2xl font-bold mb-1">
							{__(
								'Choose how you\'d like to build your Email',
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
					<div className="flex gap-4">
						{selectionOptions.map((option) => (
							<div
								className="flex flex-1 flex-col justify-between items-center py-6 px-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-secondary-background hover:border-primary hover:transition-all hover:duration-300"
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
								zIndex: 160000,
								pointerEvents: 'auto',
							}}
						>
							<Builder
								key={`${builderKey}-${initialEmailBody || 'new-email'}-${builderMode}`}
								initialData={getBuilderInitialData()}
								onSave={handleBuilderSave}
								onClose={handleBuilderClose}
								autoSave={false}
								openTemplates={builderMode === 'templates'}
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
