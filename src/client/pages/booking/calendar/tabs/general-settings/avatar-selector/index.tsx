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
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

const AvatarSelector: React.FC<{
    value: { id: number; url: string } | null;
    onChange: (newValue: { id: number; url: string } | null) => void;
}> = ({ value, onChange }) => {
    return (
        <div className='flex flex-col items-start justify-start gap-[15px] w-full'>
            <div className='flex flex-col'>
            <div className='text-[#09090B] text-[20px] font-semibold'>{__('Calendar Avatar', 'doublescale')}</div>
            <div className='text-[#71717A] text-base'>{__('Recommended Image Size: 600x600. Square Orientation.', 'doublescale')}</div>
            </div>
            <MediaUpload
                onSelect={(selectedMedia: { id: number; url: string }) => {
                    onChange({
                        id: selectedMedia.id,
                        url: addQueryArgs(selectedMedia.url, { size: 'thumbnail' }),
                    });
                }}
                allowedTypes={['image']}
                render={({ open }: { open: () => void }) => (
                    <div
                        onClick={open}
                        className='relative cursor-pointer w-[120px] h-[120px]'
                    >
                        <Avatar className='h-[126px] w-[126px] bg-secondary'>
                            {value && <AvatarImage src={value.url} />}
                            <AvatarFallback />
                        </Avatar>
                        {!value && (
                            <div
                                className='flex flex-col justify-center items-center gap-2.5 text-primary absolute top-[30px] left-[15px]'>
                                <ImgIcon width={30} height={30}/>
                                <div className='flex items-center gap-0.5'>
                                    <LuCloudUpload size={14} />
                                    <div className='font-medium text-xs'>{__('Upload Image', 'doublescale')}</div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            />
        </div>
    );
};

export default AvatarSelector;