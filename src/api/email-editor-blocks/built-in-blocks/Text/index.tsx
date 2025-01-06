import { registerBlockType } from "../../registration";
import edit from "./edit"
// SVG Icons
const TextIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 24" fill="none" stroke="currentColor" strokeWidth="2">
        <text x="8" y="18" fontSize="22" fill="currentColor" fontWeight="normal">T</text>
    </svg>
);


// Registering each block
registerBlockType('text', {
    title: 'Text',
    edit,
    icon: <TextIcon />,
    attributes: {
        content: {
            type: 'string',
            default: 'This is a paragraph block',
        },
    }
});


