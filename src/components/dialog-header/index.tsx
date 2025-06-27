// WordPress dependencies
import { __ } from '@wordpress/i18n';

interface PageHeaderProps {
    title: string;
    subtitle: string;
    icon: React.ReactNode;
}

const CustomDialogHeader: React.FC<PageHeaderProps> = ({
    subtitle,
    title,
    icon,
}) => {
    return (
        <div
            className='flex items-center gap-4 p-0'
        >
            {icon && <span className="bg-[#4A30CF1F] p-3 rounded-xl">{icon}</span>}

            <div>
                <p className="text-[#09090B] font-bold text-2xl">{title}</p>
                <p className="text-[#979797] text-sm font-normal">
                    {subtitle}
                </p>
            </div>
        </div>
    );
};

export default CustomDialogHeader;
