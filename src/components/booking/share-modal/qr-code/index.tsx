/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import React, { useRef, useCallback } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { BsInfoCircleFill } from 'react-icons/bs';
import { RiDownloadCloud2Line } from 'react-icons/ri';
/**
 * Internal dependencies
 */
import { useApi } from '@/hooks/booking';
import { Button } from '@/components/ui/button';
const QrCode: React.FC<{
	url: string;
	icon: React.ReactNode;
	title: string;
	[key: string]: any;
}> = ({ url, icon, title }) => {
	const canvasRef = useRef<HTMLDivElement>(null);

	const handleDownload = useCallback(() => {
		const canvas = canvasRef.current?.querySelector('canvas');
		if (!canvas) return;
		const link = document.createElement('a');
		link.download = 'qrcode.png';
		link.href = canvas.toDataURL('image/png');
		link.click();
	}, []);

	return (
        <>
            <div
                className='flex gap-2.5 items-center border-b pb-4 border-[#E4E4E4] mb-4'>
				<div className="rounded-lg p-2 border border-secondary">
					{icon}
				</div>
				<div className="flex flex-col">
					<span className="text-[#09090B] text-[20px] font-[700]">
						{title}
					</span>
					<span className="text-[12px] font-[400] text-[#71717A]">
						{__(
							'Share your form with others by scanning the QR code.',
							'doublescale'
						)}
					</span>
				</div>
			</div>
            <span className="text-[#71717A] text-[14px] font-[500] leading-5">
				{__(
					'Simply scan the code to initiate your Quill Forms, which function seamlessly both online and offline (printer required naturally).',
					'doublescale'
				)}
			</span>
            <div className="border bg-[#FBFBFB] py-2 px-4 rounded mt-4">
				<div className="flex items-center text-[14px]">
					<BsInfoCircleFill className="text-[#727C88] mr-2" />
					<span className="text-[#727C88] font-semibold">
						{__('Notice', 'doublescale')}
					</span>
				</div>
				<span className="text-[#999999] text-[12px] font-[400]">
					{__(
						'Changing the slug of your form within the builder will result in a corresponding alteration of the QR code.',
						'doublescale'
					)}
				</span>
			</div>
            <div className='flex flex-col items-center justify-center p-4'>
				<div ref={canvasRef} className="pb-4">
					<QRCodeCanvas value={url} size={160} />
				</div>
				<Button
					className="bg-primary h-[48px] px-7 rounded-lg"
					onClick={handleDownload}
				>
					<RiDownloadCloud2Line className="text-white text-[18px]" />
					<span className="text-white text-[16px] font-[500] self-center">
						{__('Download', 'doublescale')}
					</span>
				</Button>
			</div>
        </>
    );
};

export default QrCode;
