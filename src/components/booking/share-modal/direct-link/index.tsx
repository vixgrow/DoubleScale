/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * External dependencies
 */
import React from 'react';

/**
 * Internal dependencies
 */
import { CopyWhiteIcon } from '@/components/booking';
import { useCopyToClipboard, useApi } from '@/hooks/booking';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const DirectLink: React.FC<{
	url: string;
	icon: React.ReactNode;
	title: string;
	[key: string]: any;
}> = ({ url, icon, title }) => {
	const copyToClipboard = useCopyToClipboard();
	const { loading } = useApi();

	return (
        <>
            <div className='flex gap-2.5 items-start sm:items-center border-b pb-4 border-[#E4E4E4] min-w-0'>
				<div className="shrink-0 rounded-lg p-2 border border-secondary">
					{icon}
				</div>
				<div className="flex flex-col min-w-0">
					<span className="text-[#09090B] text-[16px] sm:text-[20px] font-[700]">
						{title}
					</span>
					<span className="text-[12px] font-[400] text-[#71717A]">
						{__(
							'Copy the form link and share it with your audience..',
							'doublescale'
						)}
					</span>
				</div>
			</div>
            <div className='flex flex-col pt-4'>
				<div className="pb-2 text-[#3F4254] text-[16px] font-semibold">
					{__('Generated Link', 'doublescale')}
				</div>
				<div className='flex flex-col sm:flex-row gap-2.5 min-w-0'>
					<Input
						value={url}
						readOnly
						className="h-[48px] min-w-0 flex-1 text-[#999999] rounded-lg"
					/>
					<Button
						className="bg-primary h-[48px] w-full sm:w-auto shrink-0 px-7 rounded-lg text-white"
						onClick={() =>
							copyToClipboard(
								url,
								__('Link copied', 'doublescale')
							)
						}
						disabled={loading}
					>
						<CopyWhiteIcon />
						<span className="text-white text-[16px] font-[500] self-center">
							{__('Copy', 'doublescale')}
						</span>
					</Button>
				</div>
			</div>
        </>
    );
};

export default DirectLink;
