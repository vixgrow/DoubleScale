/**
 * wordpress dependencies
 */

/**
 * external dependencies
 */
import React from 'react';
/**
 * internal dependencies
 */
import { TextBlockProps } from '..';

export interface TextRendererProps {
    props: TextBlockProps;
}

export const TextRenderer: React.FC<TextRendererProps> = ({ props }) => {
    // Determine the HTML element based on heading style
    const getElementType = () => {
        switch (props.headingStyle) {
            case 'h1':
            case 'h2':
            case 'h3':
                return props.headingStyle;
            case 'small':
                return 'small';
            default:
                return 'p';
        }
    };

    // Determine if content should be wrapped in list
    const shouldWrapInList = props.listType === 'ul' || props.listType === 'ol';

    // Get font size based on heading style
    const getFontSize = () => {
        switch (props.headingStyle) {
            case 'h1':
                return Math.max(props.fontSize * 2.5, 24);
            case 'h2':
                return Math.max(props.fontSize * 2, 20);
            case 'h3':
                return Math.max(props.fontSize * 1.5, 18);
            case 'small':
                return Math.max(props.fontSize * 0.8, 12);
            default:
                return props.fontSize;
        }
    };

    const ElementType = getElementType() as keyof JSX.IntrinsicElements;

    const content = shouldWrapInList ? (
        <ElementType
            style={{
                fontSize: getFontSize(),
                color: props.color,
                textAlign: props.textAlign as React.CSSProperties['textAlign'],
                fontFamily: props.fontFamily,
                fontWeight: props.bold ? 'bold' : 'normal',
                fontStyle: props.italic ? 'italic' : 'normal',
                textDecoration: (() => {
                    if (props.underline && props['line-through']) return 'underline line-through';
                    if (props.underline) return 'underline';
                    if (props['line-through']) return 'line-through';
                    return 'none';
                })(),
                lineHeight: props.lineHeight,
                letterSpacing: props.letterSpacing,
                borderRadius: props.borderRadius,
                borderWidth: props.borderWidth,
                backgroundColor: props.backgroundColor,
                padding: `${(props.padding?.top || 0) * 2}px ${(props.padding?.right || 0) * 4}px ${(props.padding?.bottom || 0) * 2}px ${(props.padding?.left || 0) * 4}px`,
                margin: 0,
            }}
        >
            {props.listType === 'ul' ? (
                <ul style={{ margin: 0, paddingLeft: '20px', listStyleType: 'disc' }}>
                    <li>{props.content}</li>
                </ul>
            ) : (
                <ol style={{ margin: 0, paddingLeft: '20px', listStyleType: 'decimal' }}>
                    <li>{props.content}</li>
                </ol>
            )}
        </ElementType>
    ) : (
        <ElementType
            style={{
                fontSize: getFontSize(),
                color: props.color,
                textAlign: props.textAlign as React.CSSProperties['textAlign'],
                fontFamily: props.fontFamily,
                fontWeight: props.bold ? 'bold' : 'normal',
                fontStyle: props.italic ? 'italic' : 'normal',
                textDecoration: (() => {
                    if (props.underline && props['line-through']) return 'underline line-through';
                    if (props.underline) return 'underline';
                    if (props['line-through']) return 'line-through';
                    return 'none';
                })(),
                lineHeight: props.lineHeight,
                letterSpacing: props.letterSpacing,
                borderRadius: props.borderRadius,
                borderWidth: props.borderWidth,
                backgroundColor: props.backgroundColor,
                padding: `${(props.padding?.top || 0) * 2}px ${(props.padding?.right || 0) * 4}px ${(props.padding?.bottom || 0) * 2}px ${(props.padding?.left || 0) * 4}px`,
                margin: 0,
            }}
        >
            {props.content}
        </ElementType>
    );

    return content;
};
