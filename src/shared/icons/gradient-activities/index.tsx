import { IconProps } from '@doublescale/config';

const GradientActivitiesIcon: React.FC<IconProps> = ({
	width = 100,
	height = 100,
}) => {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width={width}
			height={height}
			viewBox="0 0 100 100"
			fill="none"
		>
			<mask
				id="mask0_35116_19681"
				style={{ maskType: 'luminance' }}
				maskUnits="userSpaceOnUse"
				x="0"
				y="0"
				width="100"
				height="100"
			>
				<path d="M100 0H0V100H100V0Z" fill="white" />
			</mask>
			<g mask="url(#mask0_35116_19681)">
				<path
					opacity="0.4"
					d="M67.457 8.3335H32.5404C17.3737 8.3335 8.33203 17.3752 8.33203 32.5418V67.4168C8.33203 82.6252 17.3737 91.6668 32.5404 91.6668H67.4154C82.582 91.6668 91.6237 82.6252 91.6237 67.4585V32.5418C91.6654 17.3752 82.6237 8.3335 67.457 8.3335Z"
					fill="url(#paint0_linear_35116_19681)"
				/>
				<path
					d="M30.5399 63.5C29.8732 63.5 29.2065 63.2917 28.6232 62.8333C27.2482 61.7917 26.9982 59.8333 28.0399 58.4583L37.9565 45.5833C39.1649 44.0417 40.8732 43.0417 42.8315 42.7917C44.7481 42.5417 46.7065 43.0833 48.2481 44.2917L55.8731 50.2917C56.1648 50.5417 56.4565 50.5417 56.6648 50.5C56.8315 50.5 57.1231 50.4167 57.3731 50.0833L66.9981 37.6667C68.0398 36.2917 70.0398 36.0417 71.3731 37.125C72.7481 38.1667 72.9981 40.125 71.9148 41.5L62.2898 53.9167C61.0815 55.4583 59.3731 56.4583 57.4148 56.6667C55.4565 56.9167 53.5398 56.375 51.9981 55.1667L44.3731 49.1667C44.0815 48.9167 43.7481 48.9167 43.5815 48.9583C43.4148 48.9583 43.1231 49.0417 42.8731 49.375L32.9565 62.25C32.4149 63.0833 31.4982 63.5 30.5399 63.5Z"
					fill="url(#paint1_linear_35116_19681)"
				/>
			</g>
			<defs>
				<linearGradient
					id="paint0_linear_35116_19681"
					x1="8.33203"
					y1="50.0002"
					x2="91.6238"
					y2="50.0002"
					gradientUnits="userSpaceOnUse"
				>
					<stop offset="0.610577" stop-color="#3A3A99" />
					<stop offset="1" stop-color="#1B1145" />
				</linearGradient>
				<linearGradient
					id="paint1_linear_35116_19681"
					x1="27.3984"
					y1="49.9751"
					x2="72.5896"
					y2="49.9751"
					gradientUnits="userSpaceOnUse"
				>
					<stop offset="0.610577" stop-color="#3A3A99" />
					<stop offset="1" stop-color="#1B1145" />
				</linearGradient>
			</defs>
		</svg>
	);
};

export default GradientActivitiesIcon;
