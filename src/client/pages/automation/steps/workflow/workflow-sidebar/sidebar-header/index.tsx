/**
 * External dependencies
 */
import { X } from 'lucide-react';
/**
 * Internal dependencies
 */
import { Button } from '@/components/ui/button';

interface SidebarHeaderProps {
    title: string;
    onClose: () => void;
}

const SidebarHeader: React.FC<SidebarHeaderProps> = ({ title, onClose }) => {
    return (
        <div className="flex items-center justify-between border-b-2 px-4 pt-5 pb-4">
            <h3 className="text-base font-semibold text-[#333333]">{title}</h3>
            <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
            </Button>
        </div>
    );
};

export default SidebarHeader;

