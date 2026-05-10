import { IconProps } from '@doublescale/config';

const GradientViewIcon: React.FC<IconProps> = ({ width = 24, height = 24 }) => {
	return (
		<svg
			width={width}
			height={height}
			viewBox="0 0 24 24"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
		>
			<g clip-path="url(#clip0_31491_15832)">
				<mask
					id="mask0_31491_15832"
					style={{ maskType: 'luminance' }}
					maskUnits="userSpaceOnUse"
					x="0"
					y="0"
					width="24"
					height="24"
				>
					<path d="M24 0H0V24H24V0Z" fill="white" />
				</mask>
				<g mask="url(#mask0_31491_15832)">
					<path
						opacity="0.4"
						d="M21.25 9.14969C18.94 5.51969 15.56 3.42969 12 3.42969C10.22 3.42969 8.49 3.94969 6.91 4.91969C5.33 5.89969 3.91 7.32969 2.75 9.14969C1.75 10.7197 1.75 13.2697 2.75 14.8397C5.06 18.4797 8.44 20.5597 12 20.5597C13.78 20.5597 15.51 20.0397 17.09 19.0697C18.67 18.0897 20.09 16.6597 21.25 14.8397C22.25 13.2797 22.25 10.7197 21.25 9.14969ZM12 16.0397C9.76 16.0397 7.96 14.2297 7.96 11.9997C7.96 9.76969 9.76 7.95969 12 7.95969C14.24 7.95969 16.04 9.76969 16.04 11.9997C16.04 14.2297 14.24 16.0397 12 16.0397Z"
						fill="url(#paint0_linear_31491_15832)"
					/>
					<path
						d="M11.9994 9.14062C10.4294 9.14062 9.14941 10.4206 9.14941 12.0006C9.14941 13.5706 10.4294 14.8506 11.9994 14.8506C13.5694 14.8506 14.8594 13.5706 14.8594 12.0006C14.8594 10.4306 13.5694 9.14062 11.9994 9.14062Z"
						fill="url(#paint1_linear_31491_15832)"
					/>
				</g>
			</g>
			<defs>
				<linearGradient
					id="paint0_linear_31491_15832"
					x1="2"
					y1="11.9947"
					x2="22"
					y2="11.9947"
					gradientUnits="userSpaceOnUse"
				>
					<stop offset="0.610577" stop-color="#1E3A8A" />
					<stop offset="1" stop-color="#3B82F6" />
				</linearGradient>
				<linearGradient
					id="paint1_linear_31491_15832"
					x1="9.14941"
					y1="11.9956"
					x2="14.8594"
					y2="11.9956"
					gradientUnits="userSpaceOnUse"
				>
					<stop offset="0.610577" stop-color="#1E3A8A" />
					<stop offset="1" stop-color="#3B82F6" />
				</linearGradient>
				<clipPath id="clip0_31491_15832">
					<rect width="24" height="24" fill="white" />
				</clipPath>
			</defs>
		</svg>
	);
};

export default GradientViewIcon;
