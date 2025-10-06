/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * External dependencies
 */
import { UserRound } from 'lucide-react';
/**
 * Internal dependencies
 */
import {
    BusinessIcon,
    CartIcon,
    CurrencyIcon,
    DoubleOptInIcon,
    NoEmailsIcon,
} from '@quillcrm/components';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';


interface TabsSelectionProps {
    activeTab: string;
    onTabChange: (tab: string) => void;
}

const TabsSelection: React.FC<TabsSelectionProps> = ({ activeTab, onTabChange }) => {
    return (
        <Card className="shadow-none bg-[#F8F8F8]">
            <CardContent className="p-4">
                <Tabs
                    value={activeTab}
                    onValueChange={onTabChange}
                    orientation="vertical"
                    className="w-full"
                >
                    <TabsList className="flex flex-col h-auto w-full bg-transparent p-2 gap-3">
                        <div className="text-gray-500 text-base w-full text-left">
                            {__('General', 'quillcrm')}
                        </div>
                        <TabsTrigger
                            value="business"
                            className="w-full justify-start text-base text-[#2E2C2F] gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:font-medium py-2"
                        >
                            <BusinessIcon />
                            {__('Business', 'quillcrm')}
                        </TabsTrigger>
                        <TabsTrigger
                            value="email"
                            className="w-full justify-start gap-2 text-base text-[#2E2C2F] data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:font-medium py-2"
                        >
                            <NoEmailsIcon width={20} height={17} />
                            {__('Email', 'quillcrm')}
                        </TabsTrigger>
                        <TabsTrigger
                            value="double_optin"
                            className="w-full justify-start gap-2 text-base text-[#2E2C2F] data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:font-medium py-2"
                        >
                            <DoubleOptInIcon />
                            {__('Double Opt-In', 'quillcrm')}
                        </TabsTrigger>
                        <div className="text-gray-500 text-base border-t pt-4 mt-1 w-full text-left">
                            {__('E-commerce', 'quillcrm')}
                        </div>
                        <TabsTrigger
                            value="cart"
                            className="w-full justify-start gap-2 text-base text-[#2E2C2F] data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:font-medium py-2"
                        >
                            <CartIcon />
                            {__('Cart', 'quillcrm')}
                        </TabsTrigger>
                        <div className="text-gray-500 text-base border-t pt-4 mt-1 w-full text-left">
                            {__('Money', 'quillcrm')}
                        </div>
                        <TabsTrigger
                            value="currencies"
                            className="w-full justify-start gap-2 text-base text-[#2E2C2F] data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:font-medium py-2"
                        >
                            <CurrencyIcon />
                            {__('Currencies', 'quillcrm')}
                        </TabsTrigger>
                        <TabsTrigger
                            value="managers"
                            className="w-full justify-start gap-2 text-base text-[#2E2C2F] data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:font-medium py-2"
                        >
                            <UserRound />
                            {__('Managers', 'quillcrm')}
                        </TabsTrigger>
                    </TabsList>
                </Tabs>
            </CardContent>
        </Card>
    );
};

export default TabsSelection;

