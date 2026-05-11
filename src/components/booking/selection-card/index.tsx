/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState, useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { NoticeComponent } from '@/components/booking';
import type { Integration } from '@/config/booking';

import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

// Define additional properties that might be on integrations in this context
type IntegrationWithId = Integration & {
	id?: string;
	title?: string;
};

export interface SelectionCardProps {
	integrations: IntegrationWithId[];
	activeTab: string | null;
	setActiveTab: (tab: string) => void;
	isLoading?: boolean;
}

const SelectionCard: React.FC<SelectionCardProps> = ({
	integrations,
	activeTab,
	setActiveTab,
	isLoading = false,
}) => {
	const [isNoticeVisible, setNoticeVisible] = useState(true);

	// Listen for URL parameter changes
	useEffect(() => {
		const handleURLChange = () => {
			const urlParams = new URLSearchParams(window.location.search);
			const subtabParam = urlParams.get('subtab');

			if (subtabParam && subtabParam !== activeTab) {
				// Verify that the subtab exists in our integrations
				const subtabExists = integrations.some(
					(integration) =>
						getIntegrationId(integration) === subtabParam
				);

				if (subtabExists) {
					setActiveTab(subtabParam);
				}
			}
		};

		// Listen for URL changes
		window.addEventListener('popstate', handleURLChange);

		// Listen for custom tab change events
		window.addEventListener('doublescale-booking-tab-changed', handleURLChange);

		return () => {
			window.removeEventListener('popstate', handleURLChange);
			window.removeEventListener(
				'doublescale-booking-tab-changed',
				handleURLChange
			);
		};
	}, [activeTab, integrations, setActiveTab]);

	// Helper to safely get ID using a fallback approach
	const getIntegrationId = (integration: IntegrationWithId): string => {
		return (integration.id ||
        integration.name?.toLowerCase().replace(/\s+/g, '-') || '');
	};

	return (
        <Card className="rounded-lg mb-6 w-full"><CardContent>
                <div className='flex flex-col gap-[15px]'>
                    <NoticeComponent
                        isNoticeVisible={isNoticeVisible}
                        setNoticeVisible={setNoticeVisible}
                    />
                    {isLoading ? (
                        <Skeleton className='h-4 w-full' />
                    ) : (
                        integrations.map((integration) => {
                            const id = getIntegrationId(integration);
                            const isActive = activeTab === id;

                            return (
                                <Card
                                    key={id}
                                    className={`w-full cursor-pointer ${isActive ? 'bg-secondary border-primary' : ''}`}
                                    onClick={() => {
                                        if (activeTab !== id) {
                                            setActiveTab(id);
                                        }
                                    }}
                                ><CardContent>
                                        <div className='flex gap-[18px] items-center'>
                                            <img
                                                src={integration.icon}
                                                alt={`${id}.png`}
                                                className="size-12"
                                            />
                                            <div className='flex flex-col gap-0.5'>
                                                <div
                                                    className={`text-base font-semibold ${isActive ? 'text-primary' : 'text-[#3F4254]'}`}
                                                >
                                                    {integration.name ||
                                                        __(
                                                            id.charAt(0).toUpperCase() +
                                                                id.slice(1),
                                                            'doublescale'
                                                        )}
                                                </div>
                                                <div
                                                    className={`text-xs ${isActive ? 'text-primary' : 'text-[#9197A4]'}`}
                                                >
                                                    {integration.description ||
                                                        __(
                                                            'Connect your calendar for scheduling.',
                                                            'doublescale'
                                                        )}
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent></Card>
                            );
                        })
                    )}
                </div>
            </CardContent></Card>
    );
};

export default SelectionCard;
