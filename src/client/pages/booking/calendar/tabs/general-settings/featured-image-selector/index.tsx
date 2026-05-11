/**
 * Wordpress dependencies
 */
import { MediaUpload } from '@wordpress/media-utils';
import { addQueryArgs } from '@wordpress/url';
import { __ } from '@wordpress/i18n';

/**
 * External dependencies
 */
import React from 'react';
import { LuCloudUpload } from "react-icons/lu";

/**
 * Internal dependencies
 */
import { ImgIcon } from '@/components/booking';

const FeaturedImageSelector: React.FC<{
    value: { id: number; url: string } | null;
    onChange: (newValue: { id: number; url: string } | null) => void;
}> = ({ value, onChange }) => {
    return (
        <div className='flex flex-col w-full'>
            <div className='text-[#09090B] text-[20px] font-semibold'>{__('Featured Image', 'doublescale')}</div>
            <div className='text-[#71717A] text-base'>{__('Will be shown on landing page social share meta or profile block.', 'doublescale')}</div>
            <MediaUpload
                onSelect={(selectedMedia: { id: number; url: string }) => {
                    onChange({
                        id: selectedMedia.id,
                        url: addQueryArgs(selectedMedia.url, { size: 'large' }),
                    });
                }}
                allowedTypes={['image']}
                render={({ open }: { open: () => void }) => (
                    <div
                        style={{
                            backgroundColor: value ? 'transparent' : '#E8E2FB',
                            border: value ? 'none' : '1px solid #F7F8FA',
                        }}
                        onClick={open}
                        className='my-3 w-full h-[200px] flex justify-center items-center rounded-lg cursor-pointer overflow-hidden'
                    >
                        {value ? (
                            <img
                                src={value.url}
                                alt="Featured"
                                className='size-full object-cover'
                            />
                        ) : (
                            <div
                                className='flex flex-col justify-center items-center gap-[30px] text-primary'>
                                <ImgIcon />
                                <div className='flex flex-col gap-2.5 items-center'>
                                    <div className='flex gap-2.5'>
                                        <LuCloudUpload size={25} />
                                        <div className='text-base font-medium'>{__('Upload Image', 'doublescale')}</div>
                                    </div>
                                    <div className='flex flex-col justify-[content] items-center text-[#8B8D97]'>
                                        <span>{__('Upload a cover image for your Featured Page.', 'doublescale')}</span>
                                        <span className='text-xs'>{__('File Format jpeg, png Recommened Size 1280x600 (1:1)', 'doublescale')}</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )
                }
            />
        </div >
    );
};

export default FeaturedImageSelector;