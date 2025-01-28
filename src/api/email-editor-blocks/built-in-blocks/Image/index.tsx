import { registerBlockType } from "../../registration";
import edit from "./edit";

const ImageIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" >
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <path d="M21 15l-5-5L5 21" />
    </svg>
);

registerBlockType('image', {
    title: 'Image',
    icon: <ImageIcon />,
    edit,
    attributes: {
        src: {
            type: 'string',
            default: 'https://via.placeholder.com/300', // Default placeholder image
        },
        alt: {
            type: 'string',
            default: 'Placeholder Image',
        },
        width: {
            type: 'number',
            default: 300,
        },
        height: {
            type: 'number',
            default: 200,
        },
    }
});