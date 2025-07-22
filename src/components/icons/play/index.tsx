import { IconProps } from '@quillcrm/config';

const PlayIcon: React.FC<IconProps> = ({ width = 25, height = 25 }) => {
	return (
		<svg
			width={width}
			height={height}
			viewBox="0 0 25 25"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
		>
			<path
				opacity="0.4"
				d="M16.665 2.94531H8.28498C4.64498 2.94531 2.47498 5.11531 2.47498 8.75531V17.1253C2.47498 20.7753 4.64498 22.9453 8.28498 22.9453H16.655C20.295 22.9453 22.465 20.7753 22.465 17.1353V8.75531C22.475 5.11531 20.305 2.94531 16.665 2.94531Z"
				fill="url(#paint0_linear_3554_16115)"
			/>
			<path
				d="M9.57495 12.9458V11.4658C9.57495 9.55579 10.925 8.78579 12.575 9.73579L13.855 10.4758L15.135 11.2158C16.785 12.1658 16.785 13.7258 15.135 14.6758L13.855 15.4158L12.575 16.1558C10.925 17.1058 9.57495 16.3258 9.57495 14.4258V12.9458Z"
				fill="url(#paint1_linear_3554_16115)"
			/>
			<defs>
				<linearGradient
					id="paint0_linear_3554_16115"
					x1="2.47498"
					y1="12.9453"
					x2="22.465"
					y2="12.9453"
					gradientUnits="userSpaceOnUse"
				>
					<stop offset="0.610577" stop-color="#1E3A8A" />
					<stop offset="1" stop-color="#3B82F6" />
				</linearGradient>
				<linearGradient
					id="paint1_linear_3554_16115"
					x1="9.57495"
					y1="12.9449"
					x2="16.3725"
					y2="12.9449"
					gradientUnits="userSpaceOnUse"
				>
					<stop offset="0.610577" stop-color="#1E3A8A" />
					<stop offset="1" stop-color="#3B82F6" />
				</linearGradient>
			</defs>
		</svg>
	);
};

export default PlayIcon;
