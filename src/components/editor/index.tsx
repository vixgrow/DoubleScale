/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * External dependencies
 */
import React, { useRef, useState } from 'react';
import { Editor as TinyMCEEditor } from '@tinymce/tinymce-react';

/**
 * Internal dependencies
 */
import MergeTagsSelector from '../merge-tags';

/**
 * Styles
 */
import './style.scss';

/**
 * TinyMCE Editor Type
 */
export type TinyMCEEditorType = any;

/**
 * WordPress media library types
 */
declare global {
    interface Window {
        wp: {
            media: (options: any) => any;
        };
    }
}

/**
 * TinyMCE Editor Props
 */
export interface TinyMCEWPEditorProps {
    /**
     * The initial or controlled value of the editor
     */
    value?: string;

    /**
     * Callback fired when the editor content changes
     */
    onChange?: (content: string, editor: TinyMCEEditorType) => void;

    /**
     * Height of the editor in pixels
     * @default 500
     */
    height?: number;

    /**
     * Whether the editor should be inline
     * @default false
     */
    inline?: boolean;

    /**
     * Custom toolbar configuration
     */
    toolbar?: string | string[];

    /**
     * Custom plugins to enable
     */
    plugins?: string | string[];

    /**
     * Additional TinyMCE configuration
     */
    init?: Record<string, any>;

    /**
     * Placeholder text
     */
    placeholder?: string;

    /**
     * Whether the editor is disabled
     * @default false
     */
    disabled?: boolean;

    /**
     * Callback fired when the editor is initialized
     */
    onInit?: (evt: any, editor: TinyMCEEditorType) => void;

    /**
     * CSS class name for the editor container
     */
    className?: string;

    /**
     * ID for the editor
     */
    id?: string;

    /**
     * Whether to show merge tags button
     * @default false
     */
    showMergeTags?: boolean;
}

/**
 * TinyMCE Editor Component with WordPress Media Library Integration
 * 
 * This component provides a rich text editor powered by TinyMCE with seamless
 * integration with WordPress media library for image and media uploads.
 * 
 * @example
 * ```tsx
 * import { TinyMCEWPEditor } from '@/components/editor';
 * 
 * function MyComponent() {
 *   const [content, setContent] = useState('');
 *   
 *   return (
 *     <TinyMCEWPEditor
 *       value={content}
 *       onChange={(content) => setContent(content)}
 *       height={400}
 *       placeholder="Start typing..."
 *     />
 *   );
 * }
 * ```
 */
export const TinyMCEWPEditor: React.FC<TinyMCEWPEditorProps> = ({
    value = '',
    onChange,
    height = 500,
    inline = false,
    toolbar,
    plugins,
    init = {},
    placeholder,
    disabled = false,
    onInit,
    className = '',
    id,
    showMergeTags = false,
}) => {
    const editorRef = useRef<TinyMCEEditorType | null>(null);
    const [mergeTagsVisible, setMergeTagsVisible] = useState(false);

    /**
     * Opens WordPress media library for image selection
     */
    const openWordPressMediaLibrary = (callback: (url: string, attachment: any) => void) => {
        // Check if wp.media is available
        if (typeof window.wp !== 'undefined' && window.wp.media) {
            // Create the media frame (library only, no upload)
            const frame = window.wp.media({
                title: __('Select Media', 'quillcrm'),
                button: {
                    text: __('Insert into content', 'quillcrm'),
                },
                multiple: false,
                library: {
                    type: 'image'
                },
                frame: 'select'
            });

            // When an image is selected, run the callback
            frame.on('select', function () {
                const attachment = frame
                    .state()
                    .get('selection')
                    .first()
                    .toJSON();

                callback(attachment.url, attachment);
            });

            // Open the modal
            frame.open();
        } else {
            console.error('WordPress media library is not available');
            // You could implement a fallback upload mechanism here
            alert(__('WordPress media library is not available', 'quillcrm'));
        }
    };

    /**
     * Default toolbar configuration
     */
    const defaultToolbar = toolbar || [
        'undo redo | formatselect | bold italic underline strikethrough | forecolor backcolor',
        'alignleft aligncenter alignright alignjustify | bullist numlist outdent indent',
        'link image media | removeformat | code fullscreen',
    ];

    /**
     * Default plugins configuration
     */
    const defaultPlugins = plugins || [
        'advlist',
        'autolink',
        'lists',
        'link',
        'image',
        'charmap',
        'preview',
        'anchor',
        'searchreplace',
        'visualblocks',
        'code',
        'fullscreen',
        'insertdatetime',
        'media',
        'table',
        'help',
        'wordcount',
    ];

    /**
     * TinyMCE initialization configuration
     */
    const editorInit = {
        height,
        menubar: false,
        plugins: defaultPlugins,
        toolbar: Array.isArray(defaultToolbar) ? defaultToolbar.join(' | ') : defaultToolbar,
        content_style: `
            body { 
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Helvetica Neue', sans-serif; 
                font-size: 14px; 
                line-height: 0.5;
                color: #333;
                padding: 0px;
            }
            ${placeholder ? `body:empty::before { content: '${placeholder}'; color: #999; font-style: italic; }` : ''}
        `,
        skin: 'oxide',
        content_css: 'default',
        branding: false,
        promotion: false,
        statusbar: false,
        resize: true,

        // Completely disable default image upload dialog
        automatic_uploads: false,
        images_reuse_filename: false,
        paste_data_images: false,

        // Image upload configuration
        images_upload_handler: (blobInfo: any): Promise<string> => new Promise((resolve, reject) => {
            // You can implement custom upload logic here
            // For now, we'll use the WordPress media library
            const reader = new FileReader();
            reader.onload = () => {
                const result = reader.result;
                if (typeof result === 'string') {
                    resolve(result);
                } else {
                    reject('File read error: result is not a string');
                }
            };
            reader.onerror = () => {
                reject('File read error');
            };
            reader.readAsDataURL(blobInfo.blob());
        }),


        // Override the default image button behavior
        setup: (editor: TinyMCEEditorType) => {
            // Store editor reference
            editorRef.current = editor;

            // Override default image button to use WordPress media library
            editor.ui.registry.addButton('image', {
                icon: 'image',
                tooltip: __('Insert/edit image', 'quillcrm'),
                onAction: () => {
                    openWordPressMediaLibrary((url, attachment) => {
                        editor.insertContent(
                            `<img src="${url}" alt="${attachment.alt || attachment.title || ''}" 
                                width="${attachment.width || ''}" 
                                height="${attachment.height || ''}" />`
                        );
                    });
                },
            });

            // Custom media button
            editor.ui.registry.addButton('wpmedia', {
                icon: 'embed',
                tooltip: __('Insert/edit media', 'quillcrm'),
                onAction: () => {
                    openWordPressMediaLibrary((url, attachment) => {
                        if (attachment.type === 'video') {
                            editor.insertContent(
                                `<video controls width="${attachment.width || 640}">
                                    <source src="${url}" type="${attachment.mime || 'video/mp4'}">
                                </video>`
                            );
                        } else if (attachment.type === 'audio') {
                            editor.insertContent(
                                `<audio controls>
                                    <source src="${url}" type="${attachment.mime || 'audio/mpeg'}">
                                </audio>`
                            );
                        } else {
                            editor.insertContent(`<a href="${url}">${attachment.title || attachment.filename}</a>`);
                        }
                    });
                },
            });

            // Custom merge tags button
            if (showMergeTags) {
                editor.ui.registry.addButton('mergetags', {
                    icon: 'code-sample',
                    tooltip: __('Insert merge tag', 'quillcrm'),
                    onAction: () => {
                        setMergeTagsVisible(true);
                    },
                });
            }
        },

        // Merge with custom init config
        ...init,
    };

    /**
     * Handle editor initialization
     */
    const handleInit = (evt: any, editor: TinyMCEEditorType) => {
        editorRef.current = editor;

        if (onInit) {
            onInit(evt, editor);
        }
    };

    /**
     * Handle editor content changes
     */
    const handleEditorChange = (content: string, editor: TinyMCEEditorType) => {
        if (onChange) {
            onChange(content, editor);
        }
    };

    /**
     * Handle merge tag insertion
     */
    const handleInsertMergeTag = (tagValue: string) => {
        if (editorRef.current) {
            editorRef.current.insertContent(tagValue);
        }
        setMergeTagsVisible(false);
    };

    return (
        <>
            <div className={`tinymce-wp-editor ${className}`}>
                <TinyMCEEditor
                    apiKey="psa9an4lpfjn0zszaj8yeoz9aekqvug1b841ka7wp49g4wkm"
                    id={id}
                    value={value}
                    disabled={disabled}
                    inline={inline}
                    init={editorInit}
                    onInit={handleInit}
                    onEditorChange={handleEditorChange}
                />
            </div>

            {showMergeTags && (
                <MergeTagsSelector
                    visible={mergeTagsVisible}
                    onClose={() => setMergeTagsVisible(false)}
                    onInsertTag={handleInsertMergeTag}
                />
            )}
        </>
    );
};

/**
 * Default export
 */
export default TinyMCEWPEditor;

