/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * External dependencies
 */
import React from 'react';
import { map } from 'lodash';

/**
 * Internal dependencies
 */
import {
    Card,
    CardContent,
} from '@/components/ui/card';
import type { AutomationTriggers } from '@doublescale/config';

interface TriggerCategorySelectorProps {
    triggers: AutomationTriggers;
    selectedCategory: string;
    onCategoryChange: (category: string) => void;
    data?: Record<string, { image: React.ReactNode; description: string }>;  // Map of category data
}

const TriggerCategorySelector: React.FC<TriggerCategorySelectorProps> = ({
    triggers,
    selectedCategory,
    onCategoryChange,
    data = {},
}) => {
    const categories = map(triggers, (trigger, index) => ({
        key: index,
        label: trigger.label,
    }));

    return (
        <Card className="p-4 shadow-none">
            <CardContent className="p-0 space-y-3">
                {categories.map((category) => {
                    const isSelected = selectedCategory === category.key;
                    return (
                        <Card
                            key={category.key}
                            onClick={() => onCategoryChange(category.key)}
                            className={`relative p-4 transition-all shadow-none border duration-200 cursor-pointer
                ${isSelected
                                    ? 'border-[#274C77] bg-[#ECF3FC]'
                                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                }`}
                        >
                            <div className="flex items-center space-x-4">
                                {data[category.key] && data[category.key].image && (
                                    <div className="flex-shrink-0 w-12 h-12 border rounded-md p-2 flex items-center justify-center">
                                        {data[category.key].image}
                                    </div>
                                )}
                                <div className="flex-1">
                                    <h3 className="text-base font-semibold text-[#3F4254] mb-1">
                                        {category.label}
                                    </h3>
                                    {data[category.key]?.description && (
                                        <p className="text-sm text-[#9197A4]">
                                            {data[category.key].description}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </Card>
                    );
                })}
            </CardContent>
        </Card>
    );
};

export default TriggerCategorySelector;

