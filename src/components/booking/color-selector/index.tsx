import { FaCheck } from 'react-icons/fa';
import { Button } from '@/components/ui/button';

interface ColorSelectorProps {
	selectedColor: string | null;
	onColorSelect: (color: string) => void;
}

const colors = [
	'#3A3A99',
	'#0099FF',
	'#FF4F00',
	'#9b2999',
	'#337357',
	'#2F243A',
	'#942911',
	'#FFA600',
];

export default function ColorSelector({
	selectedColor = null,
	onColorSelect,
}: ColorSelectorProps) {
	return (
        <>
            {colors.map((colorOption) => (
				<Button
                    key={colorOption}
                    className={`relative w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 
                    ${selectedColor === colorOption ? 'ring ring-offset-2' : ''}`}
                    style={
						{
							backgroundColor: colorOption,
							minWidth: '25px',
							border: colorOption ? '' : '2px solid #F2EBF9',
							...(colorOption
								? { ['--tw-ring-color' as any]: colorOption }
								: {}),
						} as React.CSSProperties & Record<string, any>
					}
                    onClick={() => onColorSelect(colorOption)}
                    size='lg'>
					{selectedColor === colorOption && (
						<FaCheck className={`text-white text-md absolute`} />
					)}
				</Button>
			))}
        </>
    );
}
