import { __ } from '@wordpress/i18n';
import { Input } from '@/components/ui/input';

interface CommonDatepickerProps {
  label?: string;
  placeholder?: string;
  size?: 'small' | 'middle' | 'large';
  prefix?: React.ReactNode;
  value?: any;
  onChange?: (value: any) => void;
  [key: string]: any;
}

const CommonDatepicker: React.FC<CommonDatepickerProps> = ({
  label,
  placeholder,
  prefix,
  value,
  onChange,
}) => {
  const stringValue = value
    ? typeof value === 'string'
      ? value
      : value.format?.('YYYY-MM-DD') ?? ''
    : '';

  return (
    <div className="flex items-center w-full rounded-lg border border-gray-300 px-5 py-2">
      <span className="text-[#9BA7B7] font-normal text-sm pr-2 w-20 min-w-fit">
        {prefix || label}
      </span>
      <Input
        type="date"
        className="flex-1 w-full !border-none focus:!ring-0 shadow-none !rounded-r-lg !rounded-l-none"
        placeholder={placeholder || label}
        value={stringValue}
        onChange={(e) => onChange?.(e.target.value)}
      />
    </div>
  );
};

export default CommonDatepicker;
