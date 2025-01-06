import { registerBlockType } from "../../registration";
import edit from "./edit";
const ButtonIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="2" y="8" width="20" height="8" rx="4" fill="currentColor" />
        <path d="M2 8h20v8H2z" fill="none" stroke="currentColor" />
    </svg>
);
registerBlockType('button', {
    title: 'Button',
    icon: <ButtonIcon />,
    edit,
    attributes: {
        label: {
            type: 'string',
            default: 'Click Me',
        },
        url: {
            type: 'string',
            default: 'https://example.com',
        },
        color: {
            type: 'string',
            default: '#000000',
        },
        backgroundColor: {
            type: 'string',
            default: '#ffffff',
        },
        borderRadius: {
            type: 'number',
            default: 4,
        },
        padding: {
            type: 'number',
            default: 8,
        },
        fontSize: {
            type: 'number',
            default: 16,
        },
        borderWidth: {
            type: 'number',
            default: 1,
        },
        borderColor: {
            type: 'string',
            default: '#000000',
        },
    }
});
