/**
 * wordpress dependencies
 */
import { __ } from '@wordpress/i18n';
/**
 * external dependencies
 */
import React from 'react';
import { Plus, Minus } from 'lucide-react';
/**
 * internal dependencies
 */
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { DeleteIcon } from '@quillcrm/components';
import { cn } from '@/lib/utils';
import { MenuItem } from '../..';

interface MenuListProps {
    menuItems: MenuItem[];
    selectedMenuItem: string | null;
    onAddMenuItem: () => void;
    onRemoveMenuItem: (id: string) => void;
    onSelectMenuItem: (id: string) => void;
}

export const MenuList: React.FC<MenuListProps> = ({
    menuItems,
    selectedMenuItem,
    onAddMenuItem,
    onRemoveMenuItem,
    onSelectMenuItem,
}) => {
    return (
        <div>
            <div className="flex items-center justify-between mb-4">
                <label className="text-[#333333] text-sm font-medium">
                    {__('Menu Items', 'quillcrm')}
                </label>
                <div className="flex items-center gap-2 border rounded-lg p-1">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                            if (menuItems.length > 1) {
                                onRemoveMenuItem(
                                    menuItems[menuItems.length - 1].id
                                );
                            }
                        }}
                        disabled={menuItems.length <= 1}
                        className="flex-1 shadow-none"
                    >
                        <Minus className="w-4 h-4 text-[#333333]" />
                    </Button>
                    <Input
                        type="text"
                        value={menuItems.length}
                        className="w-10 text-center"
                        style={{
                            border: 'none',
                            outline: 'none',
                            backgroundColor: '#ffffff',
                        }}
                        readOnly
                    />
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onAddMenuItem}
                        className="flex-1 shadow-none"
                    >
                        <Plus className="w-4 h-4 text-[#333333]" />
                    </Button>
                </div>
            </div>

            {/* Menu Items List */}
            <div className="space-y-2">
                {menuItems.map((item, index) => (
                    <div
                        key={item.id}
                        className={cn(
                            'border rounded-lg p-3 cursor-pointer transition-colors',
                            selectedMenuItem === item.id
                                ? 'border-primary bg-[#C6DFF366]'
                                : 'border-gray-200 hover:border-gray-300'
                        )}
                        onClick={() => onSelectMenuItem(item.id)}
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <span className="text-sm font-medium text-gray-500">
                                    {index + 1}
                                </span>
                                <div className="flex-1">
                                    <div className="text-sm font-medium text-[#333333]">
                                        {item.name}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                        {item.link}
                                    </div>
                                </div>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onRemoveMenuItem(item.id);
                                }}
                                className="text-destructive hover:text-destructive"
                            >
                                <DeleteIcon />
                            </Button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
