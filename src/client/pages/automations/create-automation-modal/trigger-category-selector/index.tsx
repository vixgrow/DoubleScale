/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * External dependencies
 */
import React, { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { map } from 'lodash';

/**
 * Internal dependencies
 */
import {
    AccordingRightIcon,
    CheckIcon,
    IntegrationsIcon,
} from '@doublescale/components/icons/index';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import type { AutomationTriggers } from '@doublescale/config';
import { cn } from '@/lib/utils';

interface TriggerCategorySelectorProps {
    triggers: AutomationTriggers;
    selectedCategory: string;
    onCategoryChange: (category: string) => void;
    data?: Record<string, { image: React.ReactNode; description: string }>;
}

const TriggerCategorySelector: React.FC<TriggerCategorySelectorProps> = ({
    triggers,
    selectedCategory,
    onCategoryChange,
    data = {},
}) => {
    const [open, setOpen] = useState(false);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const [contentWidth, setContentWidth] = useState<number>();

    useLayoutEffect(() => {
        if (open && triggerRef.current) {
            setContentWidth(triggerRef.current.offsetWidth);
        }
    }, [open]);

    const categories = useMemo(
        () =>
            map(triggers, (trigger, key) => ({
                key: String(key),
                label: trigger.label,
            })),
        [triggers]
    );

    const selectedMeta = triggers[selectedCategory];
    const selectedRow = data[selectedCategory];
    const selectedLabel = selectedMeta?.label;

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <button
                    ref={triggerRef}
                    type="button"
                    aria-expanded={open}
                    aria-haspopup="listbox"
                    className={cn(
                        // Match Field text input: h-12, white bg, border-border, 8px radius (see field/index.tsx text inputs)
                        'flex h-10 w-full cursor-pointer items-center justify-between gap-2 rounded-lg border border-border bg-white px-3 text-left text-sm text-foreground shadow-none transition-colors',
                        'focus:outline-none focus:ring-2 focus:ring-brandPrimary/20 focus:border-brandPrimary',
                        'hover:bg-white'
                    )}
                >
                    <span className="flex min-w-0 flex-1 items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-md border border-neutral-200 bg-white [&_svg]:max-h-[28px] [&_svg]:max-w-[28px]">
                            {selectedRow?.image ?? (
                                <IntegrationsIcon width={22} height={22} />
                            )}
                        </span>
                        <span
                            className={cn(
                                'truncate',
                                !selectedLabel && 'text-muted-foreground'
                            )}
                        >
                            {selectedLabel
                                ? selectedLabel
                                : __('Select a trigger', 'doublescale')}
                        </span>
                    </span>
                    <span
                        className={cn(
                            'pointer-events-none inline-flex shrink-0 opacity-70 transition-transform duration-200',
                            open ? '-rotate-90' : 'rotate-90'
                        )}
                    >
                        <AccordingRightIcon width={18} height={18} />
                    </span>
                </button>
            </PopoverTrigger>
            <PopoverContent
                className="z-[170000] min-w-[280px] max-w-[100vw] overflow-hidden rounded-lg border border-neutral-200 bg-popover p-0 shadow-lg"
                style={
                    contentWidth
                        ? { width: contentWidth }
                        : { minWidth: 280 }
                }
                align="start"
                role="listbox"
                aria-label={__('Trigger category', 'doublescale')}
            >
                <div className="max-h-[min(320px,70vh)] overflow-y-auto py-1">
                    {categories.map((category) => {
                        const isActive = selectedCategory === category.key;
                        return (
                            <button
                                key={category.key}
                                type="button"
                                role="option"
                                aria-selected={isActive}
                                className={cn(
                                    'flex w-full cursor-pointer items-center gap-3 border-b border-neutral-100 px-3 py-2.5 text-left transition-colors last:border-b-0',
                                    'hover:bg-neutral-50 focus:bg-neutral-50 focus:outline-none',
                                    isActive && 'bg-neutral-50/80'
                                )}
                                onClick={() => {
                                    onCategoryChange(category.key);
                                    setOpen(false);
                                }}
                            >
                                <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-md border border-neutral-200 bg-white [&_svg]:max-h-[28px] [&_svg]:max-w-[28px]">
                                    {data[category.key]?.image ?? (
                                        <IntegrationsIcon width={22} height={22} />
                                    )}
                                </span>
                                <span className="min-w-0 flex-1 truncate text-sm font-medium text-neutral-800">
                                    {category.label}
                                </span>
                                {isActive ? (
                                    <span className="inline-flex shrink-0">
                                        <CheckIcon width={18} height={18} />
                                    </span>
                                ) : (
                                    <span className="h-[18px] w-[18px] shrink-0" aria-hidden />
                                )}
                            </button>
                        );
                    })}
                </div>
            </PopoverContent>
        </Popover>
    );
};

export default TriggerCategorySelector;
