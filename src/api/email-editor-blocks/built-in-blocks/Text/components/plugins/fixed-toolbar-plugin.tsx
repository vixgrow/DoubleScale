'use client';

import { createPlatePlugin } from '@udecode/plate-common/react';

import { FixedToolbar } from '../../components/plate-ui/fixed-toolbar';
import { FixedToolbarButtons } from '../../components/plate-ui/fixed-toolbar-buttons';
import { useState } from 'react';
import { useEditorRef } from '@udecode/plate-common/react';

export const FixedToolbarPlugin = createPlatePlugin({
  key: 'fixed-toolbar',
  render: {
    beforeEditable: () => {
      const [isFocused, setIsFocused] = useState(false);
      const editor = useEditorRef();
      const handleFocus = () => setIsFocused(true);
      const handleBlur = () => {
        console.log('blur');
        setIsFocused(false);
      }
      // Attach focus/blur event handlers to the editor
      editor.onFocus = handleFocus;
      editor.onBlur = handleBlur;

      return (
        <>
          {isFocused && (
            <FixedToolbar>
              <FixedToolbarButtons />
            </FixedToolbar>
          )}
        </>
      );
    },

  },
});
