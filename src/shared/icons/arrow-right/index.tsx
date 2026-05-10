import { IconProps } from '@doublescale/config';

const ArrowRightIcon: React.FC<IconProps> = ({ width = 32, height = 32 }) => {
	return (
		<svg
			width={width}
			height={height}
			viewBox="0 0 32 32"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
		>
			<path
				d="M19.2401 25.0935C18.9867 25.0935 18.7334 25.0002 18.5334 24.8002C18.1467 24.4135 18.1467 23.7735 18.5334 23.3868L25.9201 16.0002L18.5334 8.61349C18.1467 8.22682 18.1467 7.58682 18.5334 7.20016C18.9201 6.81349 19.5601 6.81349 19.9467 7.20016L28.0401 15.2935C28.4267 15.6802 28.4267 16.3202 28.0401 16.7068L19.9467 24.8002C19.7467 25.0002 19.4934 25.0935 19.2401 25.0935Z"
				fill="url(#paint0_linear_2774_16976)"
			/>
			<path
				d="M27.1067 17H4.66675C4.12008 17 3.66675 16.5467 3.66675 16C3.66675 15.4533 4.12008 15 4.66675 15H27.1067C27.6534 15 28.1067 15.4533 28.1067 16C28.1067 16.5467 27.6534 17 27.1067 17Z"
				fill="url(#paint1_linear_2774_16976)"
			/>
			<defs>
				<linearGradient
					id="paint0_linear_2774_16976"
					x1="18.2434"
					y1="16.0018"
					x2="28.3301"
					y2="16.0018"
					gradientUnits="userSpaceOnUse"
				>
					<stop offset="0.610577" stop-color="#1E3A8A" />
					<stop offset="1" stop-color="#3B82F6" />
				</linearGradient>
				<linearGradient
					id="paint1_linear_2774_16976"
					x1="3.66675"
					y1="16"
					x2="28.1067"
					y2="16"
					gradientUnits="userSpaceOnUse"
				>
					<stop offset="0.610577" stop-color="#1E3A8A" />
					<stop offset="1" stop-color="#3B82F6" />
				</linearGradient>
			</defs>
		</svg>
	);
};

export default ArrowRightIcon;
