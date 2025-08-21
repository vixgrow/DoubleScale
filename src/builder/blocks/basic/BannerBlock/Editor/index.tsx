/**
 * wordpress dependencies
 */
import { __ } from '@wordpress/i18n';
/**
 * external dependencies
 */
import React, { useState, useEffect } from 'react';
import {
    AlignLeft,
    AlignCenter,
    AlignRight,
    ExternalLinkIcon,
    Plus,
    Minus,
} from 'lucide-react';
/**
 * internal dependencies
 */
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { DeleteIcon, FileUploadIcon } from '@quillcrm/components';
import {
    PaddingBottomIcon,
    PaddingLeftIcon,
    PaddingRightIcon,
    PaddingTopIcon,
} from '@quillcrm/components';
import { cn } from '@/lib/utils';
import { BannerBlockProps } from '..';

// WordPress media library types
declare global {
    interface Window {
        wp: {
            media: (options: any) => any;
        };
    }
}

interface ImageData {
    id: number;
    name: string;
    url: string;
    size: number;
}

export interface BannerBlockEditorProps {
    props: BannerBlockProps;
    onChange: (updates: Partial<BannerBlockProps>) => void;
}

export const BannerEditor: React.FC<BannerBlockEditorProps> = ({
    props,
    onChange,
}) => {
    const [imageData, setImageData] = useState<ImageData | null>(null);

    // Check if WordPress media library is available when component mounts
    useEffect(() => {
        console.log(
            'BannerEditor mounted. Checking wp.media availability...'
        );
        console.log('window.wp:', typeof window.wp);
        console.log('window.wp?.media:', typeof window.wp?.media);
    }, []);

    const openMediaLibrary = () => {
        // Check if wp.media is available
        if (typeof window.wp !== 'undefined' && window.wp.media) {
            console.log(
                'WordPress media library is available, opening media frame...'
            );
            // Create the media frame
            const frame = window.wp.media({
                title: __('Select Image', 'quillcrm'),
                button: {
                    text: __('Use this image', 'quillcrm'),
                },
                multiple: false,
                library: {
                    type: 'image',
                },
            });

            // When an image is selected, run a callback
            frame.on('select', function () {
                // Get media attachment details from the frame state
                const attachment = frame
                    .state()
                    .get('selection')
                    .first()
                    .toJSON();

                setImageData({
                    id: attachment.id,
                    name: attachment.filename || attachment.title,
                    url: attachment.url,
                    size: attachment.filesizeInBytes || 0,
                });

                onChange({
                    src: attachment.url,
                    alt: attachment.alt || attachment.title || 'Banner',
                });
            });

            // Open the modal
            frame.open();
        } else {
            console.error(
                'WordPress media library is not available. wp object:',
                typeof window.wp,
                'wp.media:',
                typeof window.wp?.media
            );
            // Fallback to native file input if wp.media is not available
            document.getElementById('banner-upload')?.click();
        }
    };

    const handleReplaceImage = () => {
        // Same logic for replacing image
        if (typeof window.wp !== 'undefined' && window.wp.media) {
            const frame = window.wp.media({
                title: __('Replace Image', 'quillcrm'),
                button: {
                    text: __('Use this image', 'quillcrm'),
                },
                multiple: false,
                library: {
                    type: 'image',
                },
            });

            frame.on('select', function () {
                const attachment = frame
                    .state()
                    .get('selection')
                    .first()
                    .toJSON();

                setImageData({
                    id: attachment.id,
                    name: attachment.filename || attachment.title,
                    url: attachment.url,
                    size: attachment.filesizeInBytes || 0,
                });

                onChange({
                    src: attachment.url,
                    alt: attachment.alt || attachment.title || 'Banner',
                });
            });

            frame.open();
        } else {
            console.error('WordPress media library is not available');
            document.getElementById('banner-replace')?.click();
        }
    };

    // Fallback file upload handler for when wp.media is not available
    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const result = event.target?.result;
                if (typeof result === 'string') {
                    setImageData({
                        id: 0, // No ID for local files
                        name: file.name,
                        url: result,
                        size: file.size,
                    });

                    onChange({
                        src: result,
                        alt: file.name,
                    });
                }
            };
            reader.readAsDataURL(file);
        }
        // Reset the input value to allow re-uploading the same file
        e.target.value = '';
    };

    const handleDeleteImage = () => {
        setImageData(null);
        onChange({
            src: '',
            alt: 'Banner',
        });
    };

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const handleRotationChange = (direction: 'left' | 'right' | 'reset') => {
        let newRotation = props.rotation;

        if (direction === 'left') {
            newRotation = (newRotation - 90) % 360;
        } else if (direction === 'right') {
            newRotation = (newRotation + 90) % 360;
        } else if (direction === 'reset') {
            newRotation = 0;
        }

        onChange({ rotation: newRotation });
    };

    return (
        <div className="grid gap-5">
            {/* Image Upload Section */}
            <div>
                <label className="text-[#333333] mb-2 text-sm">
                    {__('Banner Image', 'quillcrm')}
                </label>
                <p className="text-xs text-[#616161] mb-4">
                    {__(
                        'You can use JPG, PNG, and GIF formats, each under 2000px in dimension.',
                        'quillcrm'
                    )}
                </p>

                {imageData || (props.src && props.src.trim() !== '') ? (
                    <div className="border rounded-lg p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <img
                                src={props.src}
                                alt={props.alt}
                                className="w-8 h-8 object-cover"
                                style={{ transform: `rotate(${props.rotation}deg)` }}
                            />
                            <div>
                                <h4 className="text-sm text-[#333333] w-16 truncate">
                                    {imageData?.name || props.alt}
                                </h4>
                                {imageData && (
                                    <p className="text-xs text-[#6D6D6D]">
                                        {formatFileSize(imageData.size)}
                                    </p>
                                )}
                            </div>
                        </div>
                        <div className="flex gap-2 mt-2">
                            {/* Hidden fallback input */}
                            <Input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                id="banner-replace"
                                onChange={handleFileUpload}
                            />
                            <Button
                                variant="outline"
                                size="sm"
                                className="text-sm text-primary shadow-none"
                                onClick={handleReplaceImage}
                            >
                                {__('Replace', 'quillcrm')}
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                className="text-destructive shadow-none"
                                onClick={handleDeleteImage}
                            >
                                <DeleteIcon width={16} height={16} />
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:border-gray-400 transition-colors">
                        {/* Hidden fallback input */}
                        <Input
                            type="file"
                            onChange={handleFileUpload}
                            accept="image/*"
                            className="hidden"
                            id="banner-upload"
                        />
                        <div
                            className="cursor-pointer"
                            onClick={openMediaLibrary}
                        >
                            <div className="flex flex-col items-center justify-center">
                                <div className="text-primary bg-accent rounded-full p-2 mb-2">
                                    <FileUploadIcon />
                                </div>
                                <div className="flex items-center gap-1">
                                    <div className="text-primary">
                                        {__('Click to Upload', 'quillcrm')}
                                    </div>
                                    <div className="text-sm text-[#353535]">
                                        {__('or drag and drop', 'quillcrm')}
                                    </div>
                                </div>
                                <div className="text-xs text-[#353535]">
                                    {__('(Max. File size: 25 MB)', 'quillcrm')}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Rotation Controls */}
            <div className="flex justify-between items-center text-[#333333]">
                <label className="text-sm">{__('Rotation', 'quillcrm')}</label>
                <div className="flex items-center gap-2 border rounded-lg p-1">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRotationChange('left')}
                        className="flex-1 shadow-none"
                    >
                        <Minus className="w-4 h-4 text-[#333333]" />
                    </Button>
                    <Input
                        type="text"
                        value={props.rotation}
                        onChange={(e) => onChange({ rotation: parseInt(e.target.value) || 0 })}
                        className="w-10 text-center"
                        min="0"
                        max="360"
                        style={{
                            border: 'none',
                            outline: 'none',
                        }}
                    />
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRotationChange('right')}
                        className="flex-1 shadow-none"
                    >
                        <Plus className="w-4 h-4 text-[#333333] " />
                    </Button>
                </div>
            </div>

            {/* Alt Text */}
            <div className="flex flex-col gap-2 text-[#333333]">
                <label className="text-sm">{__('Alt Text', 'quillcrm')}</label>
                <Input
                    type="text"
                    value={props.alt}
                    onChange={(e) => onChange({ alt: e.target.value })}
                    className="h-10"
                    style={{
                        borderColor: '#e5e5e5',
                        borderRadius: '0.5rem',
                    }}
                    placeholder="Describe the banner"
                />
            </div>

            {/* Link Input */}
            <div className="flex flex-col gap-2 text-[#333333]">
                <div className="flex items-center justify-between">
                    <label className="text-sm">{__('Link', 'quillcrm')}</label>
                    <ExternalLinkIcon className="size-5" />
                </div>
                <Input
                    type="url"
                    value={props.link}
                    onChange={(e) => onChange({ link: e.target.value })}
                    className="h-10"
                    style={{
                        borderColor: '#e5e5e5',
                        borderRadius: '0.5rem',
                    }}
                    placeholder="https://example.com"
                />
            </div>

            {/* Alignment */}
            <div className="flex flex-col gap-2 text-[#333333]">
                <label className="text-sm">{__('Alignment on desktop', 'quillcrm')}</label>
                <div className="flex items-center justify-between border rounded-lg">
                    <AlignLeft
                        className={cn(
                            'size-12 py-3 px-5 w-full cursor-pointer',
                            props.align === 'left' &&
                            'bg-[#C6DFF366] border border-primary rounded-l-lg'
                        )}
                        onClick={() => onChange({ align: 'left' })}
                    />
                    <AlignCenter
                        className={cn(
                            'size-12 py-3 px-5 w-full cursor-pointer',
                            props.align === 'center' &&
                            'bg-[#C6DFF366] border border-primary'
                        )}
                        onClick={() => onChange({ align: 'center' })}
                    />
                    <AlignRight
                        className={cn(
                            'size-12 py-3 px-5 w-full cursor-pointer',
                            props.align === 'right' &&
                            'bg-[#C6DFF366] border border-primary rounded-r-lg'
                        )}
                        onClick={() => onChange({ align: 'right' })}
                    />
                </div>
            </div>

            {/* Shape and Border Radius */}
            <div className="flex gap-3 items-end w-full">
                <div className="flex flex-col gap-2 text-[#333333] w-2/3">
                    <label className="text-sm">{__('Shape', 'quillcrm')}</label>
                    <div className="flex items-center justify-between border rounded-lg">
                        <div
                            className={cn(
                                'py-2 px-2 w-full text-center cursor-pointer',
                                props.borderRadius === '0' &&
                                'bg-[#C6DFF366] border border-primary rounded-lg'
                            )}
                            onClick={() =>
                                onChange({
                                    borderRadius: '0',
                                    shape: 'rectangle',
                                })
                            }
                        >
                            <div className="bg-accent py-3 px-5"></div>
                        </div>
                        <div
                            className={cn(
                                'py-2 px-2 w-full text-center cursor-pointer',
                                props.borderRadius === '8' &&
                                'bg-[#C6DFF366] border border-primary rounded-lg'
                            )}
                            onClick={() =>
                                onChange({
                                    borderRadius: '8',
                                    shape: 'rounded',
                                })
                            }
                        >
                            <div className="bg-accent py-3 px-5 rounded-lg"></div>
                        </div>
                        <div
                            className={cn(
                                'py-2 px-2 w-full text-center cursor-pointer',
                                props.borderRadius === '9999' &&
                                'bg-[#C6DFF366] border border-primary rounded-lg'
                            )}
                            onClick={() =>
                                onChange({
                                    borderRadius: '9999',
                                    shape: 'circle',
                                })
                            }
                        >
                            <div className="bg-accent py-3 px-5 rounded-full"></div>
                        </div>
                    </div>
                </div>
                <div className="w-1/3">
                    <div className="relative flex items-center">
                        <Input
                            type="text"
                            value={props.borderRadius}
                            onChange={(e) =>
                                onChange({ borderRadius: e.target.value })
                            }
                            className="pr-8 h-[43.2px]"
                            style={{
                                borderColor: '#e5e5e5',
                                borderRadius: '0.5rem',
                            }}
                        />
                        <span className="absolute right-3 text-gray-400">
                            px
                        </span>
                    </div>
                </div>
            </div>

            {/* Background Color */}
            <div className="flex flex-col gap-2 text-[#333333]">
                <label className="text-sm">{__('Background Color', 'quillcrm')}</label>
                <div className="flex items-center gap-2 border rounded-lg px-2">
                    <Input
                        id="bg-color"
                        type="text"
                        value={props.backgroundColor}
                        onChange={(e) =>
                            onChange({ backgroundColor: e.target.value })
                        }
                        className="rounded-lg"
                        style={{ border: 0 }}
                    />
                    <Input
                        type="color"
                        value={props.backgroundColor}
                        onChange={(e) =>
                            onChange({ backgroundColor: e.target.value })
                        }
                        className="w-10 h-10 p-1 rounded-lg"
                        style={{ border: 0 }}
                    />
                </div>
            </div>

            {/* Padding */}
            <div>
                <label className="text-sm text-[#333333] mb-2 block">
                    {__('Padding', 'quillcrm')}
                </label>
                <div className="flex gap-2">
                    <div className="relative flex items-center">
                        <div className="absolute left-2 text-[#333333]">
                            <PaddingLeftIcon />
                        </div>
                        <Input
                            type="number"
                            value={props.padding?.left || 0}
                            onChange={(e) =>
                                onChange({
                                    padding: {
                                        ...(props.padding || {}),
                                        left: parseInt(e.target.value),
                                    },
                                })
                            }
                            className="h-10"
                            style={{
                                borderColor: '#e5e5e5',
                                borderRadius: '0.5rem',
                                paddingLeft: '32px',
                            }}
                        />
                    </div>
                    <div className="relative flex items-center">
                        <div className="absolute left-2 text-[#333333]">
                            <PaddingRightIcon />
                        </div>
                        <Input
                            type="number"
                            value={props.padding?.right || 0}
                            onChange={(e) =>
                                onChange({
                                    padding: {
                                        ...(props.padding || {}),
                                        right: parseInt(e.target.value),
                                    },
                                })
                            }
                            className="h-10"
                            style={{
                                borderColor: '#e5e5e5',
                                borderRadius: '0.5rem',
                                paddingLeft: '32px',
                            }}
                        />
                    </div>
                    <div className="relative flex items-center">
                        <div className="absolute left-2 text-[#333333]">
                            <PaddingTopIcon />
                        </div>
                        <Input
                            type="number"
                            value={props.padding?.top || 0}
                            onChange={(e) =>
                                onChange({
                                    padding: {
                                        ...(props.padding || {}),
                                        top: parseInt(e.target.value),
                                    },
                                })
                            }
                            className="h-10"
                            style={{
                                borderColor: '#e5e5e5',
                                borderRadius: '0.5rem',
                                paddingLeft: '32px',
                            }}
                        />
                    </div>
                    <div className="relative flex items-center">
                        <div className="absolute left-2 text-[#333333]">
                            <PaddingBottomIcon />
                        </div>
                        <Input
                            type="number"
                            value={props.padding?.bottom || 0}
                            onChange={(e) =>
                                onChange({
                                    padding: {
                                        ...(props.padding || {}),
                                        bottom: parseInt(e.target.value),
                                    },
                                })
                            }
                            className="h-10"
                            style={{
                                borderColor: '#e5e5e5',
                                borderRadius: '0.5rem',
                                paddingLeft: '32px',
                            }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};