/*
 * Main MultiSelect component
 */
interface Option {
	value: string;
	label: string;
}

interface MultiSelectProps extends React.ComponentPropsWithoutRef<'select'> {
	options: Option[];
	title: string;
	onChange: React.ChangeEventHandler<HTMLSelectElement>;
	Icon?: React.ComponentType<{ size: number }>;
	iconSize?: number;
	containerClassName?: string;
	selectClassName?: string;
}

const MultiSelect: React.FC<MultiSelectProps> = ({
	options,
	title,
	onChange,
	Icon,
	iconSize = 18,
	containerClassName = '',
	selectClassName = '',
	...rest
}) => {
	return (
		<div
			className={`flex h-10 min-w-0 items-center justify-center border border-border rounded-lg ${containerClassName}`}
		>
			{Icon && <Icon size={iconSize} />}
			<select
				title={title}
				className={`w-full appearance-none h-[38px] !border-none py-2 text-[#292D32] bg-white focus:outline-none ${selectClassName}`}
				onChange={onChange}
				{...rest}
			>
				{options.map((option) => (
					<option key={option.value} value={option.value}>
						{option.label}
					</option>
				))}
			</select>
		</div>
	);
};

export default MultiSelect;
