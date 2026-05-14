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
        <div className="flex justify-between items-center text-white">
            <label className="text-sm">{__('Rotation', 'doublescale')}</label>
            <div className="flex items-center rounded-lg p-1"
            style={{backgroundColor: 'rgba(255, 255, 255, 0.05)'}}
            >
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRotationChange('left')}
                    className="flex-1 shadow-none !bg-transparent !text-white !border-none !ring-0 !ring-offset-0 !rounded-l-lg !rounded-r-none"
                >
                    <Minus className="w-4 h-4 text-white" />
                </Button>
                <Input
                    type="text"
                    value={value}
                    onChange={(e) => onChange(parseInt(e.target.value) || 0)}
                    className="w-10 text-center !bg-transparent !text-white !border-none !ring-0 !ring-offset-0 !rounded-none placeholder:!text-white/50"
                    min="0"
                    max="360"
                />
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRotationChange('right')}
                    className="flex-1 shadow-none !bg-transparent !text-white !border-none !ring-0 !ring-offset-0 !rounded-r-lg !rounded-l-none"
                >
                    <Plus className="w-4 h-4 text-white" />
                </Button>
            </div>
        </div>
    );
};
