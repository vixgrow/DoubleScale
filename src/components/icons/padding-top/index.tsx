import { IconProps } from '@quillcrm/config';

const PaddingTopIcon: React.FC<IconProps> = ({ width = 18, height = 19 }) => {
	return (
		<svg
			width={width}
			height={height}
			viewBox="0 0 18 19"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
		>
			<path
				d="M16.125 5.375C15.9761 4.55455 15.7127 3.95072 15.2469 3.47335C14.1751 2.375 12.4501 2.375 9 2.375C5.54993 2.375 3.8249 2.375 2.7531 3.47335C2.28727 3.95072 2.0239 4.55455 1.875 5.375"
				stroke="currentColor"
				stroke-width="1.2"
				stroke-linecap="round"
				stroke-linejoin="round"
			/>
			<path
				opacity="0.5"
				d="M15.9364 13.7672C15.7915 14.5488 15.5351 15.124 15.0816 15.5787C14.6281 16.0335 14.0544 16.2906 13.275 16.4359M16.1213 8C16.125 8.43951 16.125 8.96626 16.125 9.48059C16.125 9.99492 16.125 10.5687 16.1213 11.0082M10.425 16.6213C9.98669 16.625 9.51293 16.625 9 16.625C8.48705 16.625 8.01327 16.625 7.57494 16.6213M4.725 16.4359C3.94557 16.2906 3.37194 16.0335 2.91843 15.5787C2.46493 15.124 2.20853 14.5488 2.06357 13.7672M1.87872 8C1.875 8.43951 1.875 8.96626 1.875 9.48059C1.875 9.99486 1.875 10.5687 1.87872 11.0082"
				stroke="currentColor"
				stroke-opacity="0.7"
				stroke-width="1.2"
				stroke-linecap="round"
				stroke-linejoin="round"
			/>
		</svg>
	);
};

export default PaddingTopIcon;
