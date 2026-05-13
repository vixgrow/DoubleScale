import { __ } from '@wordpress/i18n';
import { Breadcrumb } from '@doublescale/components';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
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
}) => {
	const progressValue =
		totalSteps && currentStep ? ((currentStep + 1) / totalSteps) * 100 : 0;
	const showBar = showProgressBar && !!totalSteps;
	const footerInnerPad =
		type === 'form' ? 'px-6 md:px-8' : 'px-8';

	return (
		<div className="fixed inset-0 z-[150000] flex h-full w-full flex-col overflow-y-auto bg-white">
			{/* Header Section - Fixed */}
			<div
				className={`flex-none bg-white p-4 px-6 md:px-8 ${type === 'campaign' ? 'z-10' : ''}`}
			>
				<div className="flex justify-between items-center">
					<Breadcrumb items={items} handleNavigate={handleNavigate} />

					{panelbtns.map((btn, index) => (
						<div key={index} className="mx-2">
							{btn}
						</div>
					))}
				</div>
			</div>

			{/* Scrollable Content Section */}
			<div
				className='w-full max-w-none bg-[#F7F8FA] p-6'
			>
				<div
					className='overflow-hidden rounded-[20px] bg-white p-6
							shadow-[0_4px_20px_0_rgba(59,130,246,0.14)]'
				>
					{children}
				</div>
			</div>

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
