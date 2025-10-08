/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { PlusIcon } from '@quillcrm/components';
import { Card, CardContent } from '@quillcrm/components/ui/card';
import { Button } from '@quillcrm/components/ui/button';
import { Skeleton } from '@quillcrm/components/ui/skeleton';
import { Check } from 'lucide-react';

/**
 * Helper function to get button text based on state
 */
const getButtonText = (isLoading: boolean, isConnected: boolean) => {
    if (isLoading && isConnected) {
        return __('Updating...', 'quillcrm');
    }
    if (isConnected) {
        return __('Settings', 'quillcrm');
    }
    if (isLoading) {
        return __('Connecting...', 'quillcrm');
    }
    return null; // Will show "Connect Now" with icon
};

/**
 * Integration Card Component Props
 */
export interface IntegrationCardProps {
    integrationKey: string;
    integration: any;
    imageUrl: string;
    isLoading: boolean;
    onNavigate: () => void;
    onDisconnect: () => void;
}

export const IntegrationCard: React.FC<IntegrationCardProps> = ({
    integrationKey,
    integration,
    imageUrl,
    isLoading,
    onNavigate,
    onDisconnect,
}) => {
    const buttonText = getButtonText(isLoading, integration.is_connected);

    return (
        <Card className="shadow-none max-w-md relative overflow-hidden">
            {isLoading && (
                <div className="absolute inset-0 z-10 pointer-events-none">
                    <Skeleton className="w-full h-full rounded-lg" />
                </div>
            )}
            <CardContent className={`p-4 ${isLoading ? 'opacity-50' : ''}`}>
                {/* Header with logo and connection status */}
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-4">
                        {imageUrl && (
                            <img
                                src={imageUrl}
                                alt={integration.label}
                                className="max-w-[100px] h-auto"
                            />
                        )}
                        <div className="font-semibold text-xl">{integration.label}</div>
                    </div>
                    {integration.is_connected && (
                        <div className="text-white bg-[#16A34A] rounded-full p-1">
                            <Check className="w-4 h-4" />
                        </div>
                    )}
                </div>

                {/* Description */}
                <div className="text-base text-gray-500 border-b pb-3">
                    {integration.description}
                </div>

                {/* Action buttons */}
                <div className="flex items-center justify-end gap-3 mt-4">
                    <Button
                        onClick={onNavigate}
                        variant="secondary"
                        className="rounded-lg"
                        disabled={isLoading}
                    >
                        {buttonText || (
                            <>
                                {__('Connect Now', 'quillcrm')}
                                <PlusIcon />
                            </>
                        )}
                    </Button>
                    {integration.is_connected && (
                        <Button
                            variant="destructive"
                            className="rounded-lg"
                            onClick={onDisconnect}
                            disabled={isLoading}
                        >
                            {isLoading ? __('Disconnecting...', 'quillcrm') : __('Disconnect', 'quillcrm')}
                        </Button>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};

