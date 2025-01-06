
import { Plate } from '@udecode/plate-common/react';

import { useCreateEditor } from './use-create-editor';
import { Editor, EditorContainer } from './components/plate-ui/editor';
import { FixedToolbar } from './components/plate-ui/fixed-toolbar';
import { FixedToolbarButtons } from './components/plate-ui/fixed-toolbar-buttons';
import { useState, useRef } from 'react';
import "./editor.scss";

const PlateEditor = () => {
    const editor = useCreateEditor();
    const [isFocused, setIsFocused] = useState(false);
    const toolbarRef = useRef(null);

    const handleFocus = () => setIsFocused(true);
    const handleBlur = (event) => {
        // Check if the click was inside the toolbar
        if (toolbarRef.current && toolbarRef.current.contains(event.relatedTarget)) {
            return;
        }
        setIsFocused(false);
    };

    return (
        <Plate editor={editor}>
            <EditorContainer>
                <Editor
                    variant="demo"
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                />
                {/* Pass the focus state to the FixedToolbarPlugin */}
                {isFocused && (
                    <div ref={toolbarRef} onMouseDown={(e) => e.stopPropagation()}>
                        <FixedToolbar>
                            <FixedToolbarButtons />
                        </FixedToolbar>
                    </div>
                )}
            </EditorContainer>
        </Plate>
    );

}

export default PlateEditor;