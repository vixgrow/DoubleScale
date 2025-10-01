/**
 * wordpress dependencies
 */
import { __ } from '@wordpress/i18n';
/**
 * external dependencies
 */
import React, { useState, useEffect } from 'react';
/**
 * internal dependencies
 */
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { DeleteIcon, FileUploadIcon } from '@quillcrm/components';

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

export interface ImageUploadControlProps {
    label: string;
    description?: string;
    value: string;
    alt: string;
    onChange: (updates: { src: string; alt: string }) => void;
    uploadId: string;
    placeholder?: string;
    showRotation?: boolean;
    rotation?: number;
    onRotationChange?: (rotation: number) => void;
}

export const ImageUploadControl: React.FC<ImageUploadControlProps> = ({
    label,
    description,
    value,
    alt,
    onChange,
    uploadId,
    placeholder = "Describe the image",
    showRotation = false,
    rotation = 0,
    onRotationChange,
}) => {
    const [imageData, setImageData] = useState<ImageData | null>(null);
    const [uniqueUploadId] = useState(() => `${uploadId}-${Math.random().toString(36).substr(2, 9)}`);

    // Reset imageData when value becomes empty
    useEffect(() => {
        if (!value || value.trim() === '') {
            setImageData(null);
        }
    }, [value]);

    // Check if WordPress media library is available when component mounts
    useEffect(() => {
        console.log(
            `${uniqueUploadId} mounted. Checking wp.media availability...`
        );
        console.log('window.wp:', typeof window.wp);
        console.log('window.wp?.media:', typeof window.wp?.media);
    }, [uniqueUploadId]);

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
                    alt: attachment.alt || attachment.title || label,
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
            document.getElementById(`${uniqueUploadId}-upload`)?.click();
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
                    alt: attachment.alt || attachment.title || label,
                });
            });

            frame.open();
        } else {
            console.error('WordPress media library is not available');
            document.getElementById(`${uniqueUploadId}-replace`)?.click();
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
            alt: label,
        });
    };

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    return (
        <div>
            <label className="text-[#333333] mb-2 text-sm">
                {label}
            </label>
            {description && (
                <p className="text-xs text-[#616161] mb-4">
                    {description}
                </p>
            )}

            {imageData || (value && value.trim() !== '') ? (
                <div className="border rounded-lg p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <img
                            src={value}
                            alt={alt}
                            className="w-8 h-8 object-cover"
                            {...(showRotation && { style: { transform: `rotate(${rotation}deg)` } })}
                        />
                        <div>
                            <h4 className="text-sm text-[#333333] w-16 truncate">
                                {imageData?.name || alt}
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
                            id={`${uniqueUploadId}-replace`}
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
                        id={`${uniqueUploadId}-upload`}
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
    );
};
