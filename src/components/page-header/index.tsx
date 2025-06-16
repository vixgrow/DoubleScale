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

			<div className="flex justify-between items-center">
				<h1 className="font-semibold text-3xl">{title}</h1>

				{actions.length > 0 && (
					<div className={`flex items-center gap-2 ${className}`}>
						{actions.map((action, index) => {
							const {
								label,
								icon,
								onClick,
								className,
								disabled,
								...rest
							} = action;
							return (
								<Button
									key={index}
									onClick={onClick}
									className={`${className || ''}`}
									disabled={disabled}
									{...rest}
								>
									{icon && icon}
									{__(label, '@quillcrm')}
								</Button>
							);
						})}
					</div>
				)}
			</div>
		</div>
	);
};

export default PageHeader;
