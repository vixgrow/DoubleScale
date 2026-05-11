/**
 * Wordpress dependencies
 */
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import { NotificationType } from '@/types/booking';
import { Card, CardContent } from '@/components/ui/card';

interface NotificationRowProps {
	noticationKey: string;
	changedKey: string | null;
	setEditingKey: (key: string | null) => void;
	description: string;
	notification: NotificationType;
}
const NotificationRow: React.FC<NotificationRowProps> = ({
	noticationKey,
	changedKey,
	setEditingKey,
	description,
	notification,
}) => {
	return (
        <div
			key={noticationKey}
			onClick={() =>
				setEditingKey(
					changedKey === noticationKey ? null : noticationKey
				)
			}
			className="mt-4"
		>
            <Card
				style={{
					marginBottom: 16,
					cursor: 'pointer',
				}}
				className={
					changedKey === noticationKey
						? 'border border-primary bg-secondary'
						: 'border'
				}
			><CardContent>
                    <div className='flex gap-2.5'>
                        <div className='flex flex-col'>
                            <div className='flex gap-[15px]'>
                                <h5 className="text-[#09090B] text-[20px] font-[500] m-0">
                                    {notification.label}
                                </h5>
                                {notification.default && (
                                    <span className="bg-primary text-white rounded-lg text-[11px] pt-[3px] px-2 h-[22px] mt-[7px]">
                                        {__('ENABLED', 'doublescale')}
                                    </span>
                                )}
                            </div>
                            <span className="text-[#625C68] text-[14px]">
                                {description}
                            </span>
                        </div>
                    </div>
                </CardContent></Card>
        </div>
    );
};

export default NotificationRow;
