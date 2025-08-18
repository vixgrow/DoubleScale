/**
 * wordpress dependencies
 */

/**
 * external dependencies
 */

/**
 * internal dependencies
 */

export interface DividerRendererProps {
    props: {
        height: string;
        color: string;
        style: string;
        margin: string;
    };
}

export const DividerRenderer = ({ props }: DividerRendererProps) => (
    <div style={{ margin: props.margin }}>
        <hr
            style={{
                height: props.height,
                backgroundColor: props.color,
                border: 'none',
                borderTop: `${props.height} ${props.style} ${props.color}`,
            }}
        />
    </div>
);