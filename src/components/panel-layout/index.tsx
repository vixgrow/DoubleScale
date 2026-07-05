import { __ } from '@wordpress/i18n';
import { X } from 'lucide-react';
import Breadcrumb from '../breadcrumb';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { getToLink, useNavigate } from '@doublescale/navigation';
import ArrowLeft from '@doublescale/shared/icons/arrow-left';
import ArrowRightWhite from '@doublescale/shared/icons/arrow-right-white';

interface PanelLayoutProps {
	items: Array<{
		label: string;
		href?: string;
	}>;
	panelbtns?: React.ReactNode[];
	totalSteps?: number;
	currentStep?: number;
	onNext?: () => void;
	onBack?: () => void;
	onSaveDraft?: () => void;
	nextLabel?: string;
	backLabel?: string;
	showSaveDraft?: boolean;
	isLoading?: boolean;
	children: React.ReactNode;
	type?: string;
	handleNavigate?: (href: string) => void;
	/** When false, footer actions stay but the step progress bar is hidden (e.g. form setup). */
	showProgressBar?: boolean;
	/** When true, the bottom nav is not rendered here (caller places it inside page content, e.g. form wizard). */
	hideFooter?: boolean;
	/** Closes the full-screen panel (defaults to campaigns list when type is campaign). */
	onClosePanel?: () => void;
	/** Show header close control; defaults to true when type is `campaign`. */
	showPanelClose?: boolean;
	/** When true, the content card fills the panel below the header (keeps shadow + rounded card). */
	fullWidth?: boolean;
}

const PanelLayout: React.FC<PanelLayoutProps> = ({
	items,
	panelbtns = [],
	totalSteps,
	currentStep,
	onNext,
	onBack,
	onSaveDraft,
	nextLabel = __('Next', 'doublescale'),
	backLabel = __('Back', 'doublescale'),
	showSaveDraft = false,
	isLoading = false,
	children,
	type,
	handleNavigate,
	showProgressBar = true,
	hideFooter = false,
	onClosePanel,
	showPanelClose,
	fullWidth = false,
}) => {
	const navigate = useNavigate();
	const progressValue =
		totalSteps && currentStep ? ((currentStep + 1) / totalSteps) * 100 : 0;
	const showBar = showProgressBar && !!totalSteps;
	const footerInnerPad = type === 'form' ? 'px-6 md:px-8' : 'px-8';
	const shouldShowPanelClose = showPanelClose ?? type === 'campaign';
	const handleClosePanel =
		onClosePanel ??
		(() => {
			if (handleNavigate) {
				handleNavigate('campaigns');
				return;
			}
			navigate(getToLink('campaigns'));
		});

	return (
		<div className="fixed inset-0 z-[150000] flex h-full w-full flex-col overflow-hidden bg-white">
			{/* Header Section - Fixed */}
			<div
				className={`shrink-0 rounded-b-md bg-white px-6 py-3 ${type === 'campaign' ? 'z-10' : ''}`}
			>
				<div className="flex items-center justify-between gap-4">
					<Breadcrumb items={items} handleNavigate={handleNavigate} />

					<div className="flex shrink-0 items-center gap-2">
						{panelbtns.map((btn, index) => (
							<div key={index}>{btn}</div>
						))}
						{shouldShowPanelClose && (
							<Button
								type="button"
								variant="ghost"
								size="icon"
								onClick={handleClosePanel}
								className="h-9 w-9 shrink-0 rounded-lg text-[#29292E] hover:bg-muted/60"
								aria-label={__('Close panel', 'doublescale')}
							>
								<X className="h-5 w-5" strokeWidth={2} />
							</Button>
						)}
					</div>
				</div>
			</div>

			{/* Scrollable Content Section */}
			{fullWidth ? (
				<div className="flex min-h-0 flex-1 flex-col bg-[#F7F8FA] p-4 md:p-6">
					<div className="min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto rounded-[20px] bg-white p-6 shadow-[0_4px_20px_0_rgba(59,130,246,0.14)]">
						{children}
					</div>
				</div>
			) : (
				<div className="w-full max-w-none overflow-y-auto bg-[#F7F8FA] p-6">
					<div className="overflow-hidden rounded-[20px] bg-white p-6 shadow-[0_4px_20px_0_rgba(59,130,246,0.14)]">
						{children}
					</div>
				</div>
			)}

			{/* Footer Section - Fixed (optional; form wizard embeds actions in the white panel) */}
			{totalSteps && !hideFooter && (
				<div
					className={`${type === 'form' ? 'mt-4' : 'mt-10'} flex-none bg-white pb-6 ${showBar ? '' : 'border-t border-border/70'}`}
				>
					{showBar && (
						<Progress
							value={progressValue}
							className="h-4 rounded-none bg-muted [&>div]:bg-primary/15 [&>div]:from-primary/15 [&>div]:to-primary/15"
						/>
					)}
					<div
						className={`flex items-center justify-between ${footerInnerPad} ${showBar ? 'py-6' : 'py-5'}`}
					>
						{onBack && (
							<Button
								variant="secondaryDeepBlue"
								onClick={onBack}
								disabled={isLoading}
								className="rounded-lg"
							>
								<ArrowLeft />
								{backLabel}
							</Button>
						)}

						<div className="flex gap-4">
							{showSaveDraft && onSaveDraft && (
								<Button
									variant="secondaryDeepBlue"
									onClick={onSaveDraft}
									disabled={isLoading}
									className="rounded-lg"
								>
									{__('Save as Draft', 'doublescale')}
								</Button>
							)}

							{onNext && (
								<Button
									variant="gradient"
									className="rounded-lg"
									onClick={onNext}
									disabled={isLoading}
								>
									{nextLabel}
									<ArrowRightWhite />
								</Button>
							)}
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

export default PanelLayout;
