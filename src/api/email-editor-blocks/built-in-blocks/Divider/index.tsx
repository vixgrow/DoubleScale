import { registerBlockType } from '../..';
import edit from "./edit";


const DividerIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" >
        <line x1="4" y1="12" x2="20" y2="12" stroke="currentColor" />
    </svg>
);

registerBlockType('divider', {
    title: 'Divider',
    icon: <DividerIcon />,
    edit,
    attributes: {
        'color': {
            type: 'string',
            default: '#000000',
        },
        'height': {
            type: 'number',
            default: 1,
        },
        'style': {
            type: 'string',
            default: 'solid',
        },
        'width': {
            type: 'number',
            default: 100,
        },
        'alignment': {
            type: 'string',
            default: 'center',
        },
        'containerPadding': {
            type: 'number',
            default: '10px',
        },

    },
});
