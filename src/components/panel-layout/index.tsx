import { __ } from '@wordpress/i18n';
import { Breadcrumb } from '@quillcrm/components';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import ArrowLeft from '../icons/arrow-left';
import ArrowRightWhite from '../icons/arrow-right-white';

interface PanelLayoutProps {
	items: Array<{
		label: string;
		href?: string;
	}>;
	panelbtns?: React.ReactNode[];
	totalSteps: number;
	currentStep: number;
	onNext?: () => void;
	onBack?: () => void;
	onSaveDraft?: () => void;
	nextLabel?: string;
	backLabel?: string;
	showSaveDraft?: boolean;
	isLoading?: boolean;
	children: React.ReactNode;
}

const PanelLayout: React.FC<PanelLayoutProps> = ({
	items,
	panelbtns = [],
	totalSteps,
	currentStep,
	onNext,
	onBack,
	onSaveDraft,
	nextLabel = __('Next', 'quillcrm'),
	backLabel = __('Back', 'quillcrm'),
	showSaveDraft = false,
	isLoading = false,
	children,
}) => {
	const progressValue = ((currentStep + 1) / totalSteps) * 100;

	return (
		<div className="fixed inset-0 w-full h-full bg-white z-[1700000] flex flex-col overflow-y-auto">
			{/* Header Section - Fixed */}
			<div className="flex-none p-6 bg-white px-12">
				<div className="flex justify-between items-center">
					<Breadcrumb items={items} />

					{panelbtns.map((btn, index) => (
						<div key={index} className="mx-2">
							{btn}
						</div>
					))}
				</div>
			</div>

			{/* Scrollable Content Section */}
			<div className="flex-1  bg-white px-12">
				<div className="pb-8">{children}</div>
			</div>

			{/* Footer Section - Fixed */}
			<div className="flex-none pb-6 bg-white mt-10">
				<Progress
					value={progressValue}
					className="rounded-none h-4 bg-muted [&>div]:bg-primary/15 [&>div]:from-primary/15 [&>div]:to-primary/15"
				/>
				<div className="py-6 flex justify-between items-center px-8">
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
								{__('Save as Draft', 'quillcrm')}
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
		</div>
	);
};

export default PanelLayout;
