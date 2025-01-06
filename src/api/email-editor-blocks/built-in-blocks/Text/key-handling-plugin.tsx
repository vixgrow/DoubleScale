import { createPlatePlugin } from '@udecode/plate-common/react';

import { dispatch } from '@wordpress/data';
export const KeyHandlingPlugin = createPlatePlugin({
    key: 'keyHandling',
    handlers: {
        onKeyDown: (event, editor) => {
            console.log('Key down event:', event.event.code); // Log the key event

            if (event.event.code === 'Enter') {
                event.event.preventDefault();
                console.log('Enter key pressed');
                dispatch('quillcrm/email-editor').__experimentalInsertBlock({
                    id: Math.random().toString(36).substr(2, 9),
                    name: 'text',
                    attributes: {
                        content: ""
                    }
                }, 2);
                return true;
            }
        },
    }
});