/**
 * wordpress dependencies
 */

/**
 * external dependencies
 */

/**
 * internal dependencies
 */

export interface ButtonRendererProps {
    props: {
        text: string;
        url: string;
        backgroundColor: string;
        textColor: string;
        borderRadius: string;
        padding: string;
        align: string;
    };
}

export const ButtonRenderer = ({ props }: ButtonRendererProps) => (
    <div style={{ textAlign: props.align as 'left' | 'center' | 'right' | 'justify' }}>
        <a
            href={props.url}
            style={{
                display: 'inline-block',
                backgroundColor: props.backgroundColor,
                color: props.textColor,
                padding: props.padding,
                borderRadius: props.borderRadius,
                textDecoration: 'none',
                fontFamily: 'Arial, sans-serif',
            }}
        >
            {props.text}
        </a>
    </div>
);