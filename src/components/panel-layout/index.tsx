import { __ } from '@wordpress/i18n';
import { Breadcrumb } from '@doublescale/components';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import ArrowLeft from '@/components/icons/arrow-left';
import ArrowRightWhite from '@/components/icons/arrow-right-white';

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
}) => {
	const progressValue =
		totalSteps && currentStep ? ((currentStep + 1) / totalSteps) * 100 : 0;
	const showBar = showProgressBar && !!totalSteps;

	return (
		<div className="fixed inset-0 z-[150000] flex h-full w-full flex-col overflow-y-auto bg-white">
			{/* Header Section - Fixed */}
			<div
				className={`flex-none p-4 bg-white px-12 ${type === 'campaign' ? 'z-10' : ''}`}
				style={
					type === 'campaign'
						? { boxShadow: '0 4px 20px 0 rgba(59, 130, 246, 0.14)' }
						: undefined
				}
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
				className={`flex-1 px-12 ${type === 'campaign' ? 'pt-4' : ''} ${type === 'form' ? 'bg-muted/25' : 'bg-white'}`}
			>
				<div className="h-full pb-8">{children}</div>
			</div>

			{/* Footer Section - Fixed */}
			{totalSteps && (
				<div
					className={`mt-10 flex-none bg-white pb-6 ${showBar ? '' : 'border-t border-border/70'}`}
				>
					{showBar && (
						<Progress
							value={progressValue}
							className="h-4 rounded-none bg-muted [&>div]:bg-primary/15 [&>div]:from-primary/15 [&>div]:to-primary/15"
						/>
					)}
					<div
						className={`flex items-center justify-between px-8 ${showBar ? 'py-6' : 'py-5'}`}
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
