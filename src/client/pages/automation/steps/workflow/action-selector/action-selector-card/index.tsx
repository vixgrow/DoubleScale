/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * External dependencies
 */
import { map } from 'lodash';

/**
 * Internal dependencies
 */
import {
    Card,
    CardContent,
} from "@/components/ui/card";

interface CategoryData {
    [key: string]: {
        image: string | React.ReactNode;
        description: string;
    };
}

interface ActionSelectorCardProps {
    automationActions: Record<string, any>;
    selectedCategory: string;
    setSelectedCategory: (category: string) => void;
    categoryData: CategoryData;
}

const ActionSelectorCard: React.FC<ActionSelectorCardProps> = ({
    automationActions,
    selectedCategory,
    setSelectedCategory,
    categoryData,
}) => {
    return (
        <Card className="p-4 shadow-none">
            <CardContent className="p-0 space-y-3">
                {map(automationActions, (action, index) => {
                    const isSelected = selectedCategory === index.toString();

                    return (
                        <Card
                            key={index}
                            onClick={() => setSelectedCategory(index.toString())}
                            className={`relative p-4 transition-all shadow-none border duration-200 cursor-pointer
								${isSelected
                                    ? 'border-[#274C77] bg-[#ECF3FC]'
                                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                }`}
                        >
                            <div className="flex items-center space-x-4">
                                {categoryData[index] && categoryData[index].image && (
                                    <div className="flex-shrink-0 w-12 h-12 border rounded-md p-2">
                                        {typeof categoryData[index].image === 'string' ? (
                                            <img
                                                src={categoryData[index].image as string}
                                                alt={action.label}
                                                className="w-full h-full object-contain"
                                            />
                                        ) : (
                                            categoryData[index].image
                                        )}
                                    </div>
                                )}
                                <div className="flex-1">
                                    <h3 className="text-base font-semibold text-[#3F4254] mb-1">
                                        {action.label}
                                    </h3>
                                    {categoryData[index]?.description && (
                                        <p className="text-sm text-[#9197A4]">
                                            {categoryData[index].description}
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

export default ActionSelectorCard;
