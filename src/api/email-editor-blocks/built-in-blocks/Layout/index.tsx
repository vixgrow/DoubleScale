import { registerBlockType } from "../../registration";
import edit from "./edit";

const LayoutIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <line x1="12" y1="3" x2="12" y2="21" />
        <line x1="21" y1="12" x2="3" y2="12" />
    </svg>
);

registerBlockType('layout', {
    title: 'Layout',
    icon: <LayoutIcon />,
    edit,
    attributes: {
        columns: {
            type: 'number',
            default: 1,
        },
        children: {
            type: 'array',
            default: [],
        },
    }
});

