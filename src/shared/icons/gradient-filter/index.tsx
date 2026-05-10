import { IconProps } from '@doublescale/config';

const GradientFilterIcon: React.FC<IconProps> = ({
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
				opacity="0.4"
				d="M20.6001 4.09961V6.29961C20.6001 7.09961 20.1001 8.09961 19.6001 8.59961L15.3001 12.3996C14.7001 12.8996 14.3001 13.8996 14.3001 14.6996V18.9996C14.3001 19.5996 13.9001 20.3996 13.4001 20.6996L12.0001 21.5996C10.7001 22.3996 8.9001 21.4996 8.9001 19.8996V14.5996C8.9001 13.8996 8.5001 12.9996 8.1001 12.4996L7.1001 11.4496L12.9201 2.09961H18.6001C19.7001 2.09961 20.6001 2.99961 20.6001 4.09961Z"
				fill="url(#paint0_linear_3532_7720)"
			/>
			<path
				d="M11.2999 2.09961L6.1199 10.4096L4.2999 8.49961C3.7999 7.99961 3.3999 7.09961 3.3999 6.49961V4.19961C3.3999 2.99961 4.2999 2.09961 5.3999 2.09961H11.2999Z"
				fill="url(#paint1_linear_3532_7720)"
			/>
			<defs>
				<linearGradient
					id="paint0_linear_3532_7720"
					x1="7.1001"
					y1="11.9981"
					x2="20.6001"
					y2="11.9981"
					gradientUnits="userSpaceOnUse"
				>
					<stop offset="0.610577" stop-color="#1E3A8A" />
					<stop offset="1" stop-color="#3B82F6" />
				</linearGradient>
				<linearGradient
					id="paint1_linear_3532_7720"
					x1="3.3999"
					y1="6.25461"
					x2="11.2999"
					y2="6.25461"
					gradientUnits="userSpaceOnUse"
				>
					<stop offset="0.610577" stop-color="#1E3A8A" />
					<stop offset="1" stop-color="#3B82F6" />
				</linearGradient>
			</defs>
		</svg>
	);
};

export default GradientFilterIcon;
