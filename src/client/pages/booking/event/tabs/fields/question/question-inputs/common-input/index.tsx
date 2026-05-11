import { Input } from '@/components/ui/input';

interface CommonInputProps {
  label?: string;
  placeholder?: string;
  prefix?: React.ReactNode;
  required?: boolean;
  [key: string]: any; // for any other props like `value`, `onChange`, etc.
}

const CommonInput: React.FC<CommonInputProps> = ({
  label,
  placeholder,
  prefix,
  required = false,
  ...rest
}) => {
  const affix = prefix ?? (
    <span className="text-[#9BA7B7] font-normal text-sm px-1 whitespace-nowrap">
      {label}
      {required && <span className="text-[#EF4444]">*</span>}
    </span>
  );

  return (
    <div className="flex items-center rounded-lg border border-input bg-background pl-2 focus-within:ring-2 focus-within:ring-ring">
      {affix}
      <Input
        className="!border-0 shadow-none focus-visible:!ring-0 ml-1 focus-visible:!ring-offset-0 px-2 py-1 text-[#1E2125] font-normal text-sm !rounded-r-lg !rounded-l-none"
        placeholder={placeholder || label}
        {...rest}
      />
    </div>
  );
};

export default CommonInput;
