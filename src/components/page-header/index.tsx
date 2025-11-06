// WordPress dependencies
import { __ } from '@wordpress/i18n';

// Internal dependencies
import { Button } from '@quillcrm/components/ui/button';

interface ActionConfig {
	label: string;
	icon?: React.ReactNode;
	onClick: () => void;
	className?: string;
	disabled?: boolean;
	[key: string]: any;
}

interface PageHeaderProps {
	title: string;
	subtitle: string;
	actions: ActionConfig[];
	className?: string;
}

const PageHeader: React.FC<PageHeaderProps> = ({
	subtitle,
	title,
	actions,
	className,
}) => {
	return (
		<div className="flex flex-col gap-2 mb-4">
			<p>{subtitle}</p>

			<div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
				<h1 className="font-semibold text-3xl">{title}</h1>

				{actions.length > 0 && (
					<div
						className={`sales-pipeline-header-actions flex flex-col sm:flex-row items-stretch sm:items-center gap-3 ${className}`}
					>
						{actions.map((action, index) => {
							const {
								label,
								icon,
								onClick,
								className,
								disabled,
								hidden,
								...rest
							} = action;
							return (
								!hidden && (
									<Button
										key={index}
										onClick={onClick}
										className={`${className || ''} w-full sm:w-auto min-w-[120px] transition-all duration-200 hover:scale-105 hover:shadow-md`}
										disabled={disabled}
										{...rest}
									>
										{icon && (
											<span className="mr-2 btn-icon">
												{icon}
											</span>
										)}
										{__(label, '@quillcrm')}
									</Button>
								)
							);
						})}
					</div>
				)}
			</div>
		</div>
	);
};

export default PageHeader;
