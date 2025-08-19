/**
 * wordpress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * external dependencies
 */

/**
 * internal dependencies
 */

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

	// Parse custom CSS safely
	const customCssStyle = props.customCss
		? (() => {
				try {
					return JSON.parse(props.customCss);
				} catch {
					return {};
				}
			})()
		: {};

	// Generate unique ID for this HTML block
	const uniqueId = `html-block-${Math.random().toString(36).substr(2, 9)}`;

	// Convert CSS object to CSS string for style tag
	const cssString = props.customCss
		? (() => {
				try {
					const cssObj = JSON.parse(props.customCss);
					return Object.entries(cssObj)
						.map(([key, value]) => {
							// Convert camelCase to kebab-case
							const cssKey = key
								.replace(/([A-Z])/g, '-$1')
								.toLowerCase();
							return `${cssKey}: ${value} !important;`;
						})
						.join(' ');
				} catch {
					return '';
				}
			})()
		: '';

	return (
		<div style={containerStyle}>
			{/* Inject custom CSS with high specificity */}
			{cssString && <style>{`#${uniqueId} * { ${cssString} }`}</style>}
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
				title={__('Click to edit HTML content', 'quillcrm')}
			>
				{isDefaultContent ? (
					<span className="text-[32px] font-semibold text-primary">
						{__('Add your own html here', 'quillcrm')}
					</span>
				) : (
					<div
						id={uniqueId}
						dangerouslySetInnerHTML={{ __html: props.content }}
						style={{
							...customCssStyle,
							width: '100%',
						}}
					/>
				)}
			</div>
		</div>
	);
};
