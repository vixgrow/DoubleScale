/**
 * wordpress dependencies
 */

/**
 * external dependencies
 */

/**
 * internal dependencies
 */
import { DividerBlockProps } from '..';

export interface DividerRendererProps {
    props: DividerBlockProps;
}

export const DividerRenderer = ({ props }: DividerRendererProps) => {
    // Calculate alignment styles
    const getAlignmentStyles = () => {
        switch (props.align) {
            case 'left':
                return { marginLeft: 0, marginRight: 'auto' };
            case 'center':
                return { marginLeft: 'auto', marginRight: 'auto' };
            case 'right':
                return { marginLeft: 'auto', marginRight: 0 };
            case 'full':
                return { width: '100%' };
            default:
                return { marginLeft: 'auto', marginRight: 'auto' };
        }
    };

    // Calculate padding styles
    const paddingStyle = {
        paddingTop: `${props.padding?.top || 0}px`,
        paddingRight: `${props.padding?.right || 0}px`,
        paddingBottom: `${props.padding?.bottom || 0}px`,
        paddingLeft: `${props.padding?.left || 0}px`,
    };

    // Get border style based on the style property
    const getBorderStyle = () => {
        const borderWidth = `${props.height}px`;
        const borderColor = props.color;

        switch (props.style) {
            case 'solid':
                return `${borderWidth} solid ${borderColor}`;
            case 'dashed':
                return `${borderWidth} dashed ${borderColor}`;
            case 'dotted':
                return `${borderWidth} dotted ${borderColor}`;
            case 'double':
                return `${borderWidth} double ${borderColor}`;
            case 'groove':
                return `${borderWidth} groove ${borderColor}`;
            case 'ridge':
                return `${borderWidth} ridge ${borderColor}`;
            case 'inset':
                return `${borderWidth} inset ${borderColor}`;
            case 'outset':
                return `${borderWidth} outset ${borderColor}`;
            default:
                return `${borderWidth} solid ${borderColor}`;
        }
    };

    return (
        <div
            style={{
                ...paddingStyle,
                backgroundColor: props.backgroundColor,
                borderRadius: `${props.borderRadius}px`,
                opacity: props.opacity,
            }}
        >
            <hr
                style={{
                    height: '0',
                    width: `${props.width}%`,
                    backgroundColor: 'transparent',
                    border: 'none',
                    borderTop: getBorderStyle(),
                    borderRadius: `${props.borderRadius}px`,
                    opacity: props.opacity,
                    ...getAlignmentStyles(),
                }}
            />
        </div>
    );
};