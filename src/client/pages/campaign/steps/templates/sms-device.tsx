import { __ } from '@wordpress/i18n';
//@ts-ignore
import device from '../../../../../../assets/images/message-device.png';
import { cn } from '@/lib/utils';

const SMSDevice: React.FC<{
    body?: string;
    className?: string;
}> = ({ body, className }) => {
    const displayBody = body?.trim() || __('Message Here...', 'quillcrm');

    return (
        <div className={cn("flex flex-col items-center justify-center border border-gray-200 rounded-2xl bg-[#F8F8F8] w-full lg:w-1/3 py-8 sm:py-10", className)}>
            <div className="relative w-full flex items-center justify-center">
                <img
                    src={device}
                    alt={__('Mobile preview', 'quillcrm')}
                    className="w-full max-w-[260px] sm:max-w-[300px] select-none pointer-events-none"
                />

                <div className="absolute top-[18%] left-[53%] -translate-x-1/2 w-[75%] sm:w-[65%] max-w-[220px]">
                    <p className="text-[10px] sm:text-xs leading-5 text-white whitespace-pre-wrap break-words max-h-[93px] overflow-hidden text-ellipsis line-clamp-6">
                        {displayBody}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default SMSDevice;
