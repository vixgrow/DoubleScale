import { IconProps } from '@doublescale/config';

const SaveAsTemplateIcon: React.FC<IconProps> = ({
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
			<g clip-path="url(#clip0_31444_190763)">
				<mask
					id="mask0_31444_190763"
					style={{ maskType: 'luminance' }}
					maskUnits="userSpaceOnUse"
					x="0"
					y="0"
					width="24"
					height="24"
				>
					<path d="M24 0H0V24H24V0Z" fill="white" />
				</mask>
				<g mask="url(#mask0_31444_190763)">
					<path
						fill-rule="evenodd"
						clip-rule="evenodd"
						d="M22 2H2V7.92H9.78125H22V2ZM9.03125 22V14.78V9.42H2V22H9.03125Z"
						fill="url(#paint0_linear_31444_190763)"
					/>
					<g opacity="0.4">
						<path
							d="M22 9.41992H10.5312V14.0299H22V9.41992Z"
							fill="url(#paint1_linear_31444_190763)"
						/>
						<path
							d="M22 15.5303H10.5312V22.0003H22V15.5303Z"
							fill="url(#paint2_linear_31444_190763)"
						/>
					</g>
				</g>
			</g>
			<defs>
				<linearGradient
					id="paint0_linear_31444_190763"
					x1="2"
					y1="12"
					x2="22"
					y2="12"
					gradientUnits="userSpaceOnUse"
				>
					<stop offset="0.610577" stop-color="#1E3A8A" />
					<stop offset="1" stop-color="#3B82F6" />
				</linearGradient>
				<linearGradient
					id="paint1_linear_31444_190763"
					x1="10.5312"
					y1="11.7249"
					x2="22"
					y2="11.7249"
					gradientUnits="userSpaceOnUse"
				>
					<stop offset="0.610577" stop-color="#1E3A8A" />
					<stop offset="1" stop-color="#3B82F6" />
				</linearGradient>
				<linearGradient
					id="paint2_linear_31444_190763"
					x1="10.5312"
					y1="18.7653"
					x2="22"
					y2="18.7653"
					gradientUnits="userSpaceOnUse"
				>
					<stop offset="0.610577" stop-color="#1E3A8A" />
					<stop offset="1" stop-color="#3B82F6" />
				</linearGradient>
				<clipPath id="clip0_31444_190763">
					<rect width="24" height="24" fill="white" />
				</clipPath>
			</defs>
		</svg>
	);
};

export default SaveAsTemplateIcon;
