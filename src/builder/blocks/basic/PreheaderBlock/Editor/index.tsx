/**
 * wordpress dependencies
 */
import { __ } from '@wordpress/i18n';
/**
 * external dependencies
 */
import React from 'react';
import {
    AlignLeft,
    AlignCenter,
    AlignRight,
    Bold,
    ExternalLink,
    Italic,
    Underline,
} from 'lucide-react';
/**
 * internal dependencies
 */
import {
    MergeTagsIcon,
    PaddingBottomIcon,
    PaddingLeftIcon,
    PaddingRightIcon,
    PaddingTopIcon,
} from '@quillcrm/components';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import type { PreheaderBlockProps } from '../index';
import { useDispatch } from '@wordpress/data';

interface PreheaderEditorProps {
    props: PreheaderBlockProps;
    onChange: (newProps: Partial<PreheaderBlockProps>) => void;
}

export const PreheaderEditor: React.FC<PreheaderEditorProps> = ({ props, onChange }) => {
    const { setMergeTagsVisible, setMergeTagCallback } =
        useDispatch('quillcrm/core');

    const handleMergeTagClick = () => {
        // Set the callback to insert the merge tag into the text field
        setMergeTagCallback((tagValue: string) => {
            onChange({ text: props.text + tagValue });
        });
        setMergeTagsVisible(true);
    };

    const {
        text,
        linkText,
        linkUrl,
        fontSize,
        textColor,
        linkColor,
        textAlign,
        fontFamily,
        bold,
        italic,
        underline,
        letterSpacing,
        headingStyle,
        padding,
    } = props;

    return (
        <div className="grid gap-5">
            {/* Text Content */}
            <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center text-[#333333]">
                    <div>{__('Text Content', 'quillcrm')}</div>
                    <div
                        className="cursor-pointer hover:opacity-80"
                        onClick={handleMergeTagClick}
                    >
                        <MergeTagsIcon />
                    </div>
                </div>
                <Input
                    type="text"
                    value={text}
                    onChange={(e) => onChange({ text: e.target.value })}
                    placeholder={__('Enter text content', 'quillcrm')}
                    className="pr-8 h-10"
                    style={{
                        borderColor: '#e5e5e5',
                        borderRadius: '0.5rem',
                    }}
                />
            </div>

            {/* Link Content */}
            <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center text-[#333333]">
                    <div>{__('Link Text', 'quillcrm')}</div>
                    <ExternalLink className="size-5" />
                </div>
                <Input
                    type="text"
                    value={linkText}
                    onChange={(e) => onChange({ linkText: e.target.value })}
                    placeholder={__('Enter link text', 'quillcrm')}
                    className="pr-8 h-10"
                    style={{
                        borderColor: '#e5e5e5',
                        borderRadius: '0.5rem',
                    }}
                />
            </div>

            <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center text-[#333333]">
                    <div>{__('Link URL', 'quillcrm')}</div>
                    <ExternalLink className="size-5" />
                </div>
                <Input
                    type="text"
                    value={linkUrl}
                    onChange={(e) => onChange({ linkUrl: e.target.value })}
                    placeholder={__('https://example.com', 'quillcrm')}
                    className="pr-8 h-10"
                    style={{
                        borderColor: '#e5e5e5',
                        borderRadius: '0.5rem',
                    }}
                />
            </div>

            {/* Text Formatting */}
            <div className="flex flex-col gap-2 text-[#333333]">
                <div>{__('Decoration', 'quillcrm')}</div>
                <div className="flex items-center justify-between border rounded-lg">
                    <Bold
                        className={cn(
                            'size-12 py-3 px-5 w-full cursor-pointer',
                            bold &&
                            'bg-[#C6DFF366] border border-primary rounded-l-lg'
                        )}
                        onClick={() => onChange({ bold: !bold })}
                    />
                    <Italic
                        className={cn(
                            'size-12 py-3 px-5 w-full cursor-pointer',
                            italic &&
                            'bg-[#C6DFF366] border border-primary'
                        )}
                        onClick={() => onChange({ italic: !italic })}
                    />
                    <Underline
                        className={cn(
                            'size-12 py-3 px-5 w-full cursor-pointer',
                            underline &&
                            'bg-[#C6DFF366] border border-primary rounded-r-lg'
                        )}
                        onClick={() => onChange({ underline: !underline })}
                    />
                </div>
            </div>

            {/* Text Alignment */}
            <div className="flex flex-col gap-2 text-[#333333]">
                <div>{__('Text Alignment', 'quillcrm')}</div>
                <div className="flex items-center justify-between border rounded-lg">
                    <AlignLeft
                        className={cn(
                            'size-12 py-3 px-5 w-full cursor-pointer',
                            textAlign === 'left' &&
                            'bg-[#C6DFF366] border border-primary rounded-l-lg'
                        )}
                        onClick={() => onChange({ textAlign: 'left' })}
                    />
                    <AlignCenter
                        className={cn(
                            'size-12 py-3 px-5 w-full cursor-pointer',
                            textAlign === 'center' &&
                            'bg-[#C6DFF366] border border-primary'
                        )}
                        onClick={() => onChange({ textAlign: 'center' })}
                    />
                    <AlignRight
                        className={cn(
                            'size-12 py-3 px-5 w-full cursor-pointer',
                            textAlign === 'right' &&
                            'bg-[#C6DFF366] border border-primary rounded-r-lg'
                        )}
                        onClick={() => onChange({ textAlign: 'right' })}
                    />
                </div>
            </div>

            {/* Text Style */}
            <div className="flex flex-col gap-2 text-[#333333]">
                <div>{__('Text Style', 'quillcrm')}</div>
                <Select
                    value={headingStyle}
                    onValueChange={(value) =>
                        onChange({ headingStyle: value })
                    }
                >
                    <SelectTrigger className="w-full rounded-lg border-border h-10">
                        <SelectValue
                            placeholder={__('Select heading style', 'quillcrm')}
                        />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="h1">H1 Style</SelectItem>
                        <SelectItem value="h2">H2 Style</SelectItem>
                        <SelectItem value="h3">H3 Style</SelectItem>
                        <SelectItem value="p">Paragraph Style</SelectItem>
                        <SelectItem value="small">Footnote Style</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Font and Size */}
            <div className="flex gap-3 items-center w-full">
                <div className="flex flex-col gap-2 text-[#333333] w-2/3">
                    <div>{__('Font', 'quillcrm')}</div>
                    <Select
                        value={fontFamily}
                        onValueChange={(value) =>
                            onChange({ fontFamily: value })
                        }
                    >
                        <SelectTrigger className="w-full rounded-lg border-border h-10">
                            <SelectValue
                                placeholder={__('Select font', 'quillcrm')}
                            />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Arial">Arial</SelectItem>
                            <SelectItem value="'Times New Roman', serif">
                                Times New Roman
                            </SelectItem>
                            <SelectItem value="'Courier New', monospace">
                                Courier New
                            </SelectItem>
                            <SelectItem value="Georgia, serif">
                                Georgia
                            </SelectItem>
                            <SelectItem value="'Helvetica Neue', Helvetica, sans-serif">
                                Helvetica
                            </SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="flex flex-col gap-2 text-[#333333] w-1/3">
                    <div>{__('Size', 'quillcrm')}</div>
                    <Input
                        type="number"
                        value={fontSize}
                        onChange={(e) =>
                            onChange({ fontSize: parseInt(e.target.value) || 12 })
                        }
                        min="8"
                        max="72"
                        className="pr-8 h-10"
                        style={{
                            borderColor: '#e5e5e5',
                            borderRadius: '0.5rem',
                        }}
                    />
                </div>
            </div>

            {/* Letter Spacing */}
            <div className="flex flex-col gap-2 text-[#333333]">
                <div>{__('Letter Spacing', 'quillcrm')}</div>
                <Select
                    value={letterSpacing}
                    onValueChange={(value) =>
                        onChange({ letterSpacing: value })
                    }
                >
                    <SelectTrigger className="w-full border-border h-10">
                        <SelectValue
                            placeholder={__('Select spacing', 'quillcrm')}
                        />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="-1px">-1px</SelectItem>
                        <SelectItem value="0px">Normal</SelectItem>
                        <SelectItem value="1px">1px</SelectItem>
                        <SelectItem value="2px">2px</SelectItem>
                        <SelectItem value="3px">3px</SelectItem>
                        <SelectItem value="4px">4px</SelectItem>
                        <SelectItem value="5px">5px</SelectItem>
                        <SelectItem value="6px">6px</SelectItem>
                        <SelectItem value="7px">7px</SelectItem>
                        <SelectItem value="8px">8px</SelectItem>
                        <SelectItem value="9px">9px</SelectItem>
                        <SelectItem value="10px">10px</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Text Color */}
            <div className="flex flex-col gap-2 text-[#333333]">
                <div>{__('Text Color', 'quillcrm')}</div>
                <div className="flex items-center gap-2 border rounded-lg px-2">
                    <Input
                        id="text-color"
                        type="text"
                        value={textColor}
                        onChange={(e) => onChange({ textColor: e.target.value })}
                        className="rounded-lg"
                        style={{ border: 0 }}
                    />
                    <Input
                        type="color"
                        value={textColor}
                        onChange={(e) => onChange({ textColor: e.target.value })}
                        className="w-10 h-10 p-1 rounded-lg"
                        style={{ border: 0 }}
                    />
                </div>
            </div>

            {/* Link Color */}
            <div className="flex flex-col gap-2 text-[#333333]">
                <div>{__('Link Color', 'quillcrm')}</div>
                <div className="flex items-center gap-2 border rounded-lg px-2">
                    <Input
                        id="link-color"
                        type="text"
                        value={linkColor}
                        onChange={(e) => onChange({ linkColor: e.target.value })}
                        className="rounded-lg"
                        style={{ border: 0 }}
                    />
                    <Input
                        type="color"
                        value={linkColor}
                        onChange={(e) => onChange({ linkColor: e.target.value })}
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
                            value={padding?.left || 0}
                            onChange={(e) =>
                                onChange({
                                    padding: {
                                        ...(padding || {}),
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
                            value={padding?.right || 0}
                            onChange={(e) =>
                                onChange({
                                    padding: {
                                        ...(padding || {}),
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
                            value={padding?.top || 0}
                            onChange={(e) =>
                                onChange({
                                    padding: {
                                        ...(padding || {}),
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
                            value={padding?.bottom || 0}
                            onChange={(e) =>
                                onChange({
                                    padding: {
                                        ...(padding || {}),
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
