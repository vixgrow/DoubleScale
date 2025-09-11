/**
 * wordpress dependencies
 */
import { __ } from '@wordpress/i18n';
/**
 * external dependencies
 */
import { Plus, Minus } from 'lucide-react';
/**
 * internal dependencies
 */
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export interface RotationControlProps {
    value: number;
    onChange: (rotation: number) => void;
}

export const RotationControl: React.FC<RotationControlProps> = ({
    value,
    onChange,
}) => {
    const handleRotationChange = (direction: 'left' | 'right' | 'reset') => {
        let newRotation = value;

        if (direction === 'left') {
            newRotation = (newRotation - 90) % 360;
        } else if (direction === 'right') {
            newRotation = (newRotation + 90) % 360;
        } else if (direction === 'reset') {
            newRotation = 0;
        }

        onChange(newRotation);
    };

    return (
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
                    value={value}
                    onChange={(e) => onChange(parseInt(e.target.value) || 0)}
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
    );
};
