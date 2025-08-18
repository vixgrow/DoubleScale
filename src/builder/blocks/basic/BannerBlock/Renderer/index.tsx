/**
 * wordpress dependencies
 */

/**
 * external dependencies
 */

/**
 * internal dependencies
 */

export interface BannerRendererProps {
    props: {
        content: string;
        fontSize: number;
        color: string;
        align: string;
    };
}

export const BannerRenderer = ({ props }: BannerRendererProps) => (
    <p
        style={{
            fontSize: props.fontSize,
            color: props.color,
            textAlign: props.align as 'left' | 'center' | 'right' | 'justify',
        }}
    >
        {props.content}
    </p>
);