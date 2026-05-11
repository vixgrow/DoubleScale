/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * External dependencies
 */
import React, { useState, useEffect } from 'react';

/**
 * Internal dependencies
 */
import {
	DirectLinkIcon,
	EmbedCodeIcon,
	Header,
	QrIcon,
	ShareEventIcon,
	ShortCodeIcon,
} from '@/components/booking';
import DirectLink from './direct-link';
import ShortCode from './short-code';
import EmbedCode from './embed-code';
import QrCode from './qr-code';
import { Event, Service } from '@/types/booking';

import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export type ShareEntityType = 'event' | 'service' | 'services';

export interface ServiceProvider {
	calendar_id: number;
	name: string;
	slug: string;
	price: number | null;
}

export interface ShareModalProps {
	open: boolean;
	onClose: () => void;
	url: string;
	event?: Event;
	service?: Service;
	entityType?: ShareEntityType;
	providers?: ServiceProvider[];
	selectedProvider?: ServiceProvider | null;
	onProviderChange?: (provider: ServiceProvider) => void;
}

const Shimmer: React.FC = () => {
	return (
        <div className='flex gap-[30px]'>
            <Card className="w-[648px]"><CardContent>
                    <div className='flex flex-col gap-2.5'>
                        {[1, 2, 3, 4, 5].map((item) => (
                            <div
                                key={item}
                                className='flex gap-2.5 flex items-center border p-4 rounded-lg'>
                                <div className="rounded-lg p-2 w-[40px] h-[40px] animate-pulse bg-gray-200" />
                                <div className="flex flex-col gap-2 flex-1">
                                    <div className="h-[20px] w-[150px] animate-pulse bg-gray-200 rounded" />
                                    <div className="h-[16px] w-[80%] animate-pulse bg-gray-200 rounded" />
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent></Card>
            <Card className="w-[648px]"><CardContent>
                    <div className='flex flex-col gap-1 p-4'>
                        <div className="h-[24px] w-[200px] animate-pulse bg-gray-200 rounded mb-4" />
                        <div className="h-[40px] w-full animate-pulse bg-gray-200 rounded" />
                        <div className="h-[40px] w-[120px] animate-pulse bg-gray-200 rounded mt-4" />
                    </div>
                </CardContent></Card>
        </div>
    );
};

const shareOptions = [
	{
		key: 'directLink',
		icon: <DirectLinkIcon />,
		title: __('Direct Link', 'doublescale'),
		description: __(
			'Copy the form link and share it with your audience..',
			'doublescale'
		),
		component: DirectLink,
	},
	{
		key: 'shortCode',
		icon: <ShortCodeIcon />,
		title: __('Short Code', 'doublescale'),
		description: __(
			'Copy the shortcode and paste it into your post or page.',
			'doublescale'
		),
		component: ShortCode,
	},
	{
		key: 'embedCode',
		icon: <EmbedCodeIcon />,
		title: __('Embed Code', 'doublescale'),
		description: __(
			'Embed code is useful to share the form in an external web page. Copy the code and paste it into your external post or page.',
			'doublescale'
		),
		component: EmbedCode,
	},
	{
		key: 'qrCode',
		icon: <QrIcon />,
		title: __('QR Code', 'doublescale'),
		description: __(
			'Share your form with others by scanning the QR code.',
			'doublescale'
		),
		component: QrCode,
	},
];

const ShareModal: React.FC<ShareModalProps> = ({
	open,
	onClose,
	url,
	event,
	service,
	entityType = 'event',
	providers,
	selectedProvider,
	onProviderChange,
}) => {
	if (!open) return null;
	const [selectedKey, setSelectedKey] = useState('directLink');
	const [isLoading, setIsLoading] = useState(true);
	const selectedOption = shareOptions.find(
		(item) => item.key === selectedKey
	);
	const SelectedComponent = selectedOption?.component || null;

	const isService = entityType === 'service';
	const isServices = entityType === 'services';
	const headerTitle = isServices
		? __('Share Services Page', 'doublescale')
		: isService
			? __('Share Service', 'doublescale')
			: __('Share Event', 'doublescale');
	const headerSubTitle = isServices
		? __(
				'Share the Services Selection Page with Others using Multiple Options.',
				'doublescale'
			)
		: isService
			? __(
					'Share Your Service with Others using Multiple Options.',
					'doublescale'
				)
			: __(
					'Share Your Event with Others using Multiple Options.',
					'doublescale'
				);

	const hasMultipleProviders =
		isService && providers && providers.length > 1;

	useEffect(() => {
		const timer = setTimeout(() => {
			setIsLoading(false);
		}, 1000);

		return () => clearTimeout(timer);
	}, []);

	const modalTitle = (
		<div className='flex gap-2.5 items-center'>
			<ShareEventIcon />
			<div className='flex flex-col gap-1'>
				<Header header={headerTitle} subHeader={headerSubTitle} />
				{hasMultipleProviders && (
					<div className='flex gap-2 items-center mt-1'>
						<span className="text-[13px] text-[#71717A] font-[500]">
							{__('Provider:', 'doublescale')}
						</span>
						<Select
                            value={selectedProvider?.calendar_id}
                            onValueChange={(value) => {
								const provider = providers?.find(
									(p) => p.calendar_id === value
								);
								if (provider && onProviderChange) {
									onProviderChange(provider);
								}
							}} />
						{selectedProvider?.price !== null &&
							selectedProvider?.price !== undefined && (
								<span className="text-[13px] text-[#3A3A99] font-[600]">
									${selectedProvider.price.toFixed(2)}
								</span>
							)}
					</div>
				)}
			</div>
		</div>
	);

	return (
        <Dialog
            open={open}
            onOpenChange={open => {
                if (!open)
                    onClose();
            }}><DialogContent className='max-w-[1360px] z-[150300] share-modal'><DialogHeader><DialogTitle>{modalTitle}</DialogTitle></DialogHeader>
                {isLoading ? (
                    <Shimmer />
                ) : (
                    <div className='flex gap-[30px]'>
                        <Card className="w-[648px]"><CardContent>
                                <div className='flex flex-col gap-2.5'>
                                    {shareOptions.map(
                                        ({ key, icon, title, description }) => (
                                            <div
												className={`flex gap-2.5 items-center border p-4 rounded-lg cursor-pointer ${selectedKey === key ? 'border-primary bg-[#E8E2FB]' : 'border-[#E4E4E4]'}`}
                                                key={key}
                                                onClick={() => setSelectedKey(key)}>
                                                <div
													className={`rounded-lg p-2 border ${selectedKey === key ? 'border-primary' : 'border-[#E4E4E4]'}`}
                                                >
                                                    {icon}
                                                </div>
                                                <div className="flex flex-col">
                                                    <div className="flex gap-5 items-center">
                                                        <span className="text-[#3F4254] text-[16px] font-semibold">
                                                            {title}
                                                        </span>
                                                        {(key === 'popUp' ||
                                                            key === 'qrCode') && (
                                                                <span className="bg-primary text-white rounded-lg text-[11px] pt-[3px] px-2 h-[22px]">
                                                                    {__(
                                                                        'NEW',
                                                                        'doublescale'
                                                                    )}
                                                                </span>
                                                            )}
                                                    </div>
                                                    <span
                                                        className={`text-[12px] font-[400] ${selectedKey === key ? 'text-[#505255]' : 'text-[#9197A4]'}`}
                                                    >
                                                        {description}
                                                    </span>
                                                </div>
                                            </div>
                                        )
                                    )}
                                </div>
                            </CardContent></Card>

                        <Card className="w-[648px]"><CardContent>
                                {selectedOption && SelectedComponent && (
                                    <SelectedComponent
                                        url={url}
                                        event={event}
                                        service={service}
                                        entityType={entityType}
                                        icon={selectedOption.icon}
                                        title={selectedOption.title}
                                    />
                                )}
                            </CardContent></Card>
                    </div>
                )}
            </DialogContent></Dialog>
    );
};

export default ShareModal;
