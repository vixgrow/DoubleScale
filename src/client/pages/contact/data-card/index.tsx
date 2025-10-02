/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * External dependencies
 */

/**
 * Internal dependencies
 */
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const DataCard: React.FC = () => {
    return (
        <Card className="w-2/3 bg-[#F8F8F8] shadow-none p-5">
            <Tabs defaultValue="emails" className='w-full'>
                <TabsList className="bg-transparent text-foreground gap-5 border-b pb-9 justify-start w-full pt-5">
                    <TabsTrigger value="emails" className="px-3 py-2 gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                        {__('Emails', 'quillcrm')}
                    </TabsTrigger>
                    <TabsTrigger value="deals" className="px-3 py-2 gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                        {__('Deals', 'quillcrm')}
                    </TabsTrigger>
                    <TabsTrigger value="notes" className="px-3 py-2 gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                        {__('Notes', 'quillcrm')}
                    </TabsTrigger>
                    <TabsTrigger value="automation" className="px-3 py-2 gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                        {__('Automation', 'quillcrm')}
                    </TabsTrigger>
                    <TabsTrigger value="purchase-history" className="px-3 py-2 gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                        {__('Purchase History', 'quillcrm')}
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="emails">
                    <CardContent className="pt-6">
                        {__('Content for Emails', 'quillcrm')}
                    </CardContent>
                </TabsContent>

                <TabsContent value="deals">
                    <CardContent className="pt-6">
                        {__('Content for Deals', 'quillcrm')}
                    </CardContent>
                </TabsContent>

                <TabsContent value="notes">
                    <CardContent className="pt-6">
                        {__('Content for Notes', 'quillcrm')}
                    </CardContent>
                </TabsContent>

                <TabsContent value="automation">
                    <CardContent className="pt-6">
                        {__('Content for Automation', 'quillcrm')}
                    </CardContent>
                </TabsContent>

                <TabsContent value="purchase-history">
                    <CardContent className="pt-6">
                        {__('Content for Purchase History', 'quillcrm')}
                    </CardContent>
                </TabsContent>
            </Tabs>
        </Card>
    );
};

export default DataCard;
