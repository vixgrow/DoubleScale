import { __ } from '@wordpress/i18n';
import { cn } from '../../lib/utils';
import PanelSettingsHeader from '../panel-settings-header';
import { Button } from '../ui/button';
import ArrowLeft from '../icons/arrow-left';
import ArrowRightWhite from '../icons/arrow-right-white';

interface PanelSettingsProps {
	title: string;
	description: string;
	icon: React.ReactNode;
	children: React.ReactNode;
	iconVariant?: 'default' | 'white';
	className?: string;
	// Navigation buttons
	onNext?: () => void;
	onBack?: () => void;
	nextLabel?: string;
	backLabel?: string;
	isLoading?: boolean;
	showButtons?: boolean;
}

const PanelSettings: React.FC<PanelSettingsProps> = ({
	title,
	description,
	icon,
	children,
	iconVariant = 'default',
	className,
	onNext,
	onBack,
	nextLabel = __('Next', 'quillcrm'),
	backLabel = __('Back', 'quillcrm'),
	isLoading = false,
	showButtons = false,
}) => {
	return (
		<div className={cn('rounded-lg', className)}>
			<PanelSettingsHeader
				title={title}
				description={description}
				icon={icon}
				iconVariant={iconVariant}
			/>
			<div className="rounded-b-2xl border border-t-0 border-gray-200">
				<div className={cn("bg-[#F8F8F8] px-8 py-4", !showButtons || (!onNext && !onBack) ? "rounded-b-2xl" : "")}>
					{children}
				</div>

				{/* Navigation Buttons */}
				{showButtons && (onNext || onBack) && (
					<div className="flex justify-between items-center border-t border-gray-200 bg-white rounded-b-2xl px-8 py-4">
						{onBack ? (
							<Button
								variant="secondary"
								onClick={onBack}
								disabled={isLoading}
								className="rounded-lg"
							>
								<ArrowLeft />
								{backLabel}
							</Button>
						) : (
							<div />
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
				)}
			</div>
		</div>
	);
};

export default PanelSettings;
