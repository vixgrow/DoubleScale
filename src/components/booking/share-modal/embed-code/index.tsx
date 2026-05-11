/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

import React from 'react';
/**
 * Internal dependencies
 */
import { CopyWhiteIcon } from '@/components/booking';
import { useCopyToClipboard, useApi } from '@/hooks/booking';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const EmbedCode: React.FC<{
	url: string;
	icon: React.ReactNode;
	title: string;
	[key: string]: any;
}> = ({ url, icon, title }) => {
	const copyToClipboard = useCopyToClipboard();
	const { loading } = useApi();

	return (
        <>
            {/* static */}
            <div className='flex gap-2.5 items-center border-b pb-4 border-[#E4E4E4]'>
				<div className="rounded-lg p-2 border border-secondary">
					{icon}
				</div>
				<div className="flex flex-col">
					<span className="text-[#09090B] text-[20px] font-[700]">
						{title}
					</span>
					<span className="text-[12px] font-[400] text-[#71717A]">
						{__(
							'Copy the embed code below and insert it in your external page.',
							'doublescale'
						)}
					</span>
				</div>
			</div>
            <div className='flex flex-col pt-4'>
				<div className="pb-2 text-[#3F4254] text-[16px] font-semibold">
					{__('Embed Code', 'doublescale')}
				</div>
				<div className='flex gap-2.5'>
					<Input
						value={`<iframe src="${url}" width="100%" height="600" style="border:0;"></iframe>`}
						readOnly
						className="h-[48px] text-[#999999] rounded-lg"
					/>
					<Button
						className="bg-primary h-[48px] px-7 rounded-lg text-white"
						onClick={() =>
							copyToClipboard(
								`<iframe src="${url}" width="100%" height="600" style="border:0;"></iframe>`,
								__('Link copied', 'doublescale')
							)
						}
						disabled
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

export default EmbedCode;
