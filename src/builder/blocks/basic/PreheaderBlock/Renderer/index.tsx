/**
 * wordpress dependencies
 */
import { __ } from '@wordpress/i18n';
/**
 * internal dependencies
 */
import type { PreheaderBlockProps } from '../index';

interface PreheaderRendererProps {
    props: PreheaderBlockProps;
}

export const PreheaderRenderer: React.FC<PreheaderRendererProps> = ({ props }) => {
    const {
        text,
        linkText,
        linkUrl,
        fontSize,
        textColor,
        linkColor,
        textAlign,
        fontFamily,
        bold,
        italic,
        underline,
        letterSpacing,
        headingStyle,
        padding,
    } = props;

    // Handle text decoration for regular text (no underline, no strikethrough)
    const getTextDecoration = () => {
        return 'none';
    };

    // Handle link decoration (underline only, no strikethrough)
    const getLinkDecoration = () => {
        return underline ? 'underline' : 'none';
    };

    // Get font size based on heading style
    const getFontSize = () => {
        switch (headingStyle) {
            case 'h1':
                return Math.max(fontSize * 2.5, 24);
            case 'h2':
                return Math.max(fontSize * 2, 20);
            case 'h3':
                return Math.max(fontSize * 1.5, 18);
            case 'small':
                return Math.max(fontSize * 0.8, 12);
            default:
                return fontSize;
        }
    };

    const adjustedFontSize = getFontSize();

    const textStyle = {
        fontSize: `${adjustedFontSize}px`,
        color: textColor,
        fontFamily,
        fontWeight: bold ? 'bold' : 'normal',
        fontStyle: italic ? 'italic' : 'normal',
        textDecoration: getTextDecoration(),
        letterSpacing,
    };

    const linkStyle = {
        fontSize: `${adjustedFontSize}px`,
        color: linkColor,
        fontFamily,
        fontWeight: bold ? 'bold' : 'normal',
        fontStyle: italic ? 'italic' : 'normal',
        textDecoration: getLinkDecoration(),
        letterSpacing,
    };

    const containerStyle = {
        display: 'flex',
        alignItems: 'center',
        justifyContent: textAlign === 'center' ? 'center' : textAlign === 'right' ? 'flex-end' : 'flex-start',
        textAlign: textAlign as 'left' | 'center' | 'right',
        padding: padding ? `${padding.top || 0}px ${padding.right || 0}px ${padding.bottom || 0}px ${padding.left || 0}px` : '0',
        fontSize: `${adjustedFontSize}px`,
        fontFamily,
        fontWeight: bold ? 'bold' : 'normal',
        fontStyle: italic ? 'italic' : 'normal',
        letterSpacing,
    };

    // Map heading styles to appropriate HTML elements
    const getHeadingElement = () => {
        switch (headingStyle) {
            case 'h1':
                return 'h1';
            case 'h2':
                return 'h2';
            case 'h3':
                return 'h3';
            case 'p':
                return 'p';
            case 'small':
                return 'small';
            default:
                return 'div';
        }
    };

    const Tag = getHeadingElement();

    return (
        <Tag style={containerStyle}>
            <span style={textStyle}>
                {text || __('If you cannot see images, Please', 'quillcrm')}
            </span>
            <span style={{ marginLeft: '4px', marginRight: '2px' }}> </span>
            <a href={linkUrl} style={linkStyle} target="_blank" rel="noopener noreferrer">
                {linkText || __('Click here', 'quillcrm')}
            </a>
        </Tag>
    );
};
