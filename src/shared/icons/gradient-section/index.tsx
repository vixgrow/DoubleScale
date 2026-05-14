import { IconProps } from '@doublescale/config';

const GradientSectionIcon: React.FC<IconProps> = ({
	width = 24,
	height = 24,
}) => {
	return (
		<svg
			width={width}
			height={height}
			viewBox="0 0 24 24"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
		>
			<path
				d="M15.7675 18.9279H8.23266C7.60475 18.9279 7.14428 18.9028 6.75079 18.8442C3.97126 18.5428 3.4187 16.8768 3.4187 14.114V10.7651C3.4187 8.00233 3.97126 6.33629 6.77591 6.02652C7.14428 5.97629 7.60475 5.95117 8.23266 5.95117H15.7675C16.3954 5.95117 16.8559 5.97629 17.2494 6.03489C20.0373 6.34466 20.5815 8.00233 20.5815 10.7651V14.114C20.5815 16.8768 20.0289 18.5428 17.2243 18.8526C16.8559 18.9028 16.3954 18.9279 15.7675 18.9279ZM8.23266 7.20699C7.66335 7.20699 7.26149 7.2321 6.93498 7.27396C5.23545 7.46652 4.67452 7.99396 4.67452 10.7651V14.114C4.67452 16.8851 5.23545 17.4126 6.90986 17.6051C7.26149 17.6554 7.66335 17.6721 8.23266 17.6721H15.7675C16.3368 17.6721 16.7387 17.647 17.0652 17.6051C18.7647 17.4209 19.3257 16.8851 19.3257 14.114V10.7651C19.3257 7.99396 18.7647 7.46652 17.0903 7.27396C16.7387 7.22373 16.3368 7.20699 15.7675 7.20699H8.23266Z"
				fill="url(#paint0_linear_gradient_section)"
			/>
			<path
				d="M18.2789 4.69527H5.7208C5.37755 4.69527 5.0929 4.41062 5.0929 4.06736C5.0929 3.7241 5.37755 3.43945 5.7208 3.43945H18.2789C18.6222 3.43945 18.9068 3.7241 18.9068 4.06736C18.9068 4.41062 18.6222 4.69527 18.2789 4.69527Z"
				fill="url(#paint1_linear_gradient_section)"
			/>
			<path
				d="M18.698 21.4394H6.13987C5.79661 21.4394 5.51196 21.1548 5.51196 20.8115C5.51196 20.4682 5.79661 20.1836 6.13987 20.1836H18.698C19.0413 20.1836 19.3259 20.4682 19.3259 20.8115C19.3259 21.1548 19.0413 21.4394 18.698 21.4394Z"
				fill="url(#paint2_linear_gradient_section)"
			/>
			<rect
				opacity="0.4"
				x="4.46533"
				y="6.5791"
				width="15.0698"
				height="11.7209"
				rx="2.51163"
				fill="url(#paint3_linear_gradient_section)"
			/>
			<defs>
				<linearGradient
					id="paint0_linear_gradient_section"
					x1="3.4187"
					y1="12.4395"
					x2="20.5815"
					y2="12.4395"
					gradientUnits="userSpaceOnUse"
				>
					<stop stopColor="#3A3A99" />
					<stop offset="1" stopColor="#1B1145" />
				</linearGradient>
				<linearGradient
					id="paint1_linear_gradient_section"
					x1="5.0929"
					y1="4.06736"
					x2="18.9068"
					y2="4.06736"
					gradientUnits="userSpaceOnUse"
				>
					<stop stopColor="#3A3A99" />
					<stop offset="1" stopColor="#1B1145" />
				</linearGradient>
				<linearGradient
					id="paint2_linear_gradient_section"
					x1="5.51196"
					y1="20.8115"
					x2="19.3259"
					y2="20.8115"
					gradientUnits="userSpaceOnUse"
				>
					<stop stopColor="#3A3A99" />
					<stop offset="1" stopColor="#1B1145" />
				</linearGradient>
				<linearGradient
					id="paint3_linear_gradient_section"
					x1="4.46533"
					y1="12.4396"
					x2="19.5351"
					y2="12.4396"
					gradientUnits="userSpaceOnUse"
				>
					<stop stopColor="#3A3A99" />
					<stop offset="1" stopColor="#1B1145" />
				</linearGradient>
			</defs>
		</svg>
	);
};

export default GradientSectionIcon;
