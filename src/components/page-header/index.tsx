// WordPress dependencies
import { __ } from '@wordpress/i18n';

// Internal dependencies
import { Button } from '@doublescale/components/ui/button';
import { cn } from '@/lib/utils';

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
	subtitle?: string;
	actions?: ActionConfig[];
	className?: string;
	/** Merged onto the outer wrapper (e.g. `mb-0` when the title sits in a toolbar row). */
	wrapperClassName?: string;
}

const PageHeader: React.FC<PageHeaderProps> = ({
	subtitle,
	title,
	actions = [],
	className,
	wrapperClassName,
}) => {
	return (
		<div
			className={cn('flex flex-col gap-1 mb-6', wrapperClassName)}
		>
			{subtitle && (
				<span className="text-sm font-medium text-muted-foreground tracking-wide uppercase">
					{subtitle}
				</span>
			)}

			<div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
				<h1 className="text-2xl font-bold text-foreground tracking-tight">
					{title}
				</h1>

				{actions.length > 0 && (
					<div
						className={`flex flex-col sm:flex-row items-stretch sm:items-center gap-2 ${className || ''}`}
					>
						{actions.map((action, index) => {
							const {
								label,
								icon,
								onClick,
								className: actionClassName,
								disabled,
								hidden,
								...rest
							} = action;
							return (
								!hidden && (
									<Button
										key={index}
										onClick={onClick}
										className={actionClassName || ''}
										disabled={disabled}
										{...rest}
									>
										{icon && (
											<span className="btn-icon">
												{icon}
											</span>
										)}
										{__(label, 'doublescale')}
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
