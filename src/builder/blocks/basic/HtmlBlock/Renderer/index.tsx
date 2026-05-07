/**
 * wordpress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * internal dependencies
 */
import { generateRandomString } from '@/builder/utils/idGenerator';

export interface HtmlBlockRendererProps {
	props: {
		content: string;
		customCss: string;
		width: string;
		padding?: {
			top: number;
			right: number;
			bottom: number;
			left: number;
		};
	};
}

export const HtmlBlockRenderer: React.FC<HtmlBlockRendererProps> = ({
	props,
}) => {
	const containerStyle: React.CSSProperties = {
		width: `${props.width}%`,
		padding: props.padding
			? `${props.padding.top}px ${props.padding.right}px ${props.padding.bottom}px ${props.padding.left}px`
			: '0',
	};

	// Check if content is empty, default, or just whitespace
	const isDefaultContent =
		!props.content ||
		props.content.trim() === '' ||
		props.content === '<p>Insert your HTML here</p>' ||
		props.content.trim() === '<p>Insert your HTML here</p>';

	// Generate unique ID for this HTML block
	const uniqueId = `html-block-${generateRandomString()}`;

	// Use CSS string directly
	const cssString = props.customCss || '';

	return (
		<div style={containerStyle}>
			{/* Inject custom CSS */}
			{cssString && <style>{cssString}</style>}
			<div
				style={{
					width: '100%',
					minHeight: '50px',
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					color: '#666',
					fontSize: '14px',
					cursor: 'pointer',
				}}
				title={__('Click to edit HTML content', 'doublescale')}
			>
				{isDefaultContent ? (
					<span className="text-2xl font-semibold text-primary font-mono">
						{__('Add your own html here', 'doublescale')}
					</span>
				) : (
					<div
						id={uniqueId}
						dangerouslySetInnerHTML={{ __html: props.content }}
						style={{
							fontFamily: 'monospace',
							width: '100%',
						}}
					/>
				)}
			</div>
		</div>
	);
};
