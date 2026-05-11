/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { NoticeComponent } from '@/components/booking';

// @ts-ignore
import stripe from '@doublescale/assets/booking-icons/stripe/stripe.png';
import { Card, CardContent } from '@/components/ui/card';

export interface IntegrateCardProps {
	paymentGateways: Record<string, any>;
	activeTab: string | null;
	setActiveTab: (tab: string) => void;
}

const IntegrateCard: React.FC<IntegrateCardProps> = ({
	paymentGateways,
	activeTab,
	setActiveTab,
}) => {
	// Manage notice visibility state locally since it's only used in this component
	const [isNoticeVisible, setNoticeVisible] = useState(true);

	// Define gateway images mapping
	const gatewayImages: Record<string, string> = {
		stripe: stripe,
	};

	return (
        <Card className="rounded-lg mb-6 w-full"><CardContent>
                <div className='flex flex-col gap-[15px]'>
                    <NoticeComponent
                        isNoticeVisible={isNoticeVisible}
                        setNoticeVisible={setNoticeVisible}
                    />
                    {Object.entries(paymentGateways).map(([gatewayId, gateway]) => (
                        <Card
                            key={gatewayId}
                            className={`w-full cursor-pointer ${activeTab === gatewayId ? 'bg-secondary border-primary' : ''}`}
                            onClick={() => {
                                if (activeTab !== gatewayId) {
                                    setActiveTab(gatewayId);
                                }
                            }}
                        ><CardContent>
                                <div className='flex gap-[18px] items-center'>
                                    <img
                                        src={
                                            gatewayImages[
                                                gatewayId as keyof typeof gatewayImages
                                            ]
                                        }
                                        alt={`${gatewayId}.png`}
                                        className="w-16 h-8"
                                    />
                                    <div className='flex flex-col gap-0.5'>
                                        <div
                                            className={`text-base font-semibold ${activeTab === gatewayId ? 'text-primary' : 'text-[#3F4254]'}`}
                                        >
                                            {gateway.title ||
                                                __(
                                                    gatewayId.charAt(0).toUpperCase() +
                                                        gatewayId.slice(1),
                                                    'doublescale'
                                                )}
                                        </div>
                                        <div
                                            className={`text-xs ${activeTab === gatewayId ? 'text-primary' : 'text-[#9197A4]'}`}
                                        >
                                            {gateway.description ||
                                                __(
                                                    'Collect payment before the meeting.',
                                                    'doublescale'
                                                )}
                                        </div>
                                    </div>
                                </div>
                            </CardContent></Card>
                    ))}
                </div>
            </CardContent></Card>
    );
};

export default IntegrateCard;
