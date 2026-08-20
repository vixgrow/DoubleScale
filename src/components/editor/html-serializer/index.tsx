/**
 *  External dependencies
 */
import { useEffect, useRef } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $generateHtmlFromNodes } from '@lexical/html';

const SANITIZED_MERGE_TAG_URL = /href="https?:\/\/(\{\{.*?\}\})"/g;

function restoreMergeTagHrefs(html: string): string {
  return html.replace(SANITIZED_MERGE_TAG_URL, (_match, mergeTag) => `href="${mergeTag}"`);
}

interface HtmlSerializerProps {
  onChange: (html: string) => void;
  onWordCountChange?: (count: number) => void;
}

export default function HtmlSerializer({ onChange, onWordCountChange }: HtmlSerializerProps) {
  const [editor] = useLexicalComposerContext();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastHtmlRef = useRef<string>('');
  
  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      timeoutRef.current = setTimeout(() => {
        editorState.read(() => {
          try {
            let htmlString = $generateHtmlFromNodes(editor);
            htmlString = restoreMergeTagHrefs(htmlString);
            
            if (onWordCountChange) {
              const tempDiv = document.createElement('div');
              tempDiv.innerHTML = htmlString;
              const text = tempDiv.textContent || tempDiv.innerText || '';
              const words = text.split(/\s+/).filter(word => word.length > 0);
              onWordCountChange(words.length);
            }
            
            if (htmlString !== lastHtmlRef.current) {
              const isInitialSerialize = lastHtmlRef.current === '';
              lastHtmlRef.current = htmlString;
              // Lexical emits an update while hydrating initial content. That is
              // not a user edit — skipping it keeps parent "dirty" flags accurate.
              if (isInitialSerialize) {
                return;
              }
              onChange(htmlString);
            }
          } catch (error) {
            console.error('Error serializing HTML:', error);
            onChange('<p></p>');
            if (onWordCountChange) {
              onWordCountChange(0);
            }
          }
        });
      }, 250);
    });
  }, [editor, onChange, onWordCountChange]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return null;
}