import { IconProps } from '@doublescale/config';

const GradientLeadScoringLevelIcon: React.FC<IconProps> = ({
	width = 24,
	height = 24,
}) => {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width={width}
			height={height}
			viewBox="0 0 24 24"
			fill="none"
		>
			<defs>
				<linearGradient
					id="paint0_star"
					x1="12"
					y1="3"
					x2="22"
					y2="18"
					gradientUnits="userSpaceOnUse"
				>
					<stop stop-color="#3A3A99" />
					<stop offset="1" stop-color="#1B1145" />
				</linearGradient>
				<linearGradient
					id="paint1_star"
					x1="2"
					y1="4"
					x2="9"
					y2="6"
					gradientUnits="userSpaceOnUse"
				>
					<stop stop-color="#3A3A99" />
					<stop offset="1" stop-color="#1B1145" />
				</linearGradient>
				<linearGradient
					id="paint2_star"
					x1="2"
					y1="17"
					x2="6"
					y2="19"
					gradientUnits="userSpaceOnUse"
				>
					<stop stop-color="#3A3A99" />
					<stop offset="1" stop-color="#1B1145" />
				</linearGradient>
				<linearGradient
					id="paint3_star"
					x1="2"
					y1="10"
					x2="4"
					y2="13"
					gradientUnits="userSpaceOnUse"
				>
					<stop stop-color="#3A3A99" />
					<stop offset="1" stop-color="#1B1145" />
				</linearGradient>
			</defs>
			<g clip-path="url(#clip0_2870_90425)">
				<path
					opacity="0.4"
					d="M15.6294 5.10727L16.9885 7.82542C17.1716 8.20134 17.6632 8.55798 18.0777 8.63509L20.5356 9.03992C22.1067 9.30017 22.473 10.4376 21.3453 11.5749L19.4271 13.4931C19.109 13.8112 18.9259 14.4377 19.0319 14.8907L19.5814 17.2619C20.0151 19.1318 19.0127 19.8644 17.3644 18.8812L15.0607 17.5125C14.6463 17.2619 13.9523 17.2619 13.5378 17.5125L11.2341 18.8812C9.5859 19.8547 8.58346 19.1318 9.0172 17.2619L9.56662 14.8907C9.65337 14.428 9.47023 13.8015 9.15215 13.4834L7.23402 11.5653C6.10627 10.4376 6.47255 9.30017 8.04368 9.03028L10.5015 8.62545C10.916 8.55798 11.4076 8.1917 11.5907 7.81578L12.9498 5.09763C13.692 3.63252 14.8872 3.63252 15.6294 5.10727Z"
					fill="url(#paint0_star)"
				/>
				<path
					d="M8.50623 5.62845H2.72291C2.32772 5.62845 2 5.30072 2 4.90553C2 4.51034 2.32772 4.18262 2.72291 4.18262H8.50623C8.90142 4.18262 9.22914 4.51034 9.22914 4.90553C9.22914 5.30072 8.90142 5.62845 8.50623 5.62845Z"
					fill="url(#paint1_star)"
				/>
				<path
					d="M5.61457 19.1228H2.72291C2.32772 19.1228 2 18.7951 2 18.3999C2 18.0047 2.32772 17.677 2.72291 17.677H5.61457C6.00976 17.677 6.33748 18.0047 6.33748 18.3999C6.33748 18.7951 6.00976 19.1228 5.61457 19.1228Z"
					fill="url(#paint2_star)"
				/>
				<path
					d="M3.6868 12.3756H2.72291C2.32772 12.3756 2 12.0479 2 11.6527C2 11.2575 2.32772 10.9298 2.72291 10.9298H3.6868C4.08199 10.9298 4.40971 11.2575 4.40971 11.6527C4.40971 12.0479 4.08199 12.3756 3.6868 12.3756Z"
					fill="url(#paint3_star)"
				/>
			</g>
			<defs>
				<clipPath id="clip0_2870_90425">
					<rect width="24" height="24" fill="white" />
				</clipPath>
			</defs>
		</svg>
	);
};

export default GradientLeadScoringLevelIcon;
