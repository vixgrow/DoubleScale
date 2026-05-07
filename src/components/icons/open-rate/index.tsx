import { IconProps } from '@doublescale/config';

const OpenRateIcon: React.FC<IconProps> = ({ width = 24, height = 24 }) => {
	return (
		<svg
			width={width}
			height={height}
			viewBox="0 0 24 24"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
		>
			<mask
				id="mask0_31914_4228"
				style={{ maskType: 'luminance' }}
				maskUnits="userSpaceOnUse"
				x="0"
				y="0"
				width="24"
				height="24"
			>
				<path d="M24 0H0V24H24V0Z" fill="white" />
			</mask>
			<g mask="url(#mask0_31914_4228)">
				<path
					opacity="0.4"
					d="M22 10.4398V10.8698C22 11.5698 21.63 12.2198 21.03 12.5798L13.54 17.0698C12.59 17.6398 11.41 17.6398 10.46 17.0698L2.97 12.5798C2.37 12.2198 2 11.5698 2 10.8698V10.4398C2 9.52984 2.41 8.66984 3.13 8.09984L10.13 2.49984C11.22 1.61984 12.78 1.61984 13.87 2.49984L20.87 8.09984C21.59 8.66984 22 9.52984 22 10.4398Z"
					fill="currentColor"
				/>
				<path
					d="M22 10.8691V18.9991C22 20.6591 20.66 21.9991 19 21.9991H5C3.34 21.9991 2 20.6591 2 18.9991V10.8691C2 11.5691 2.37 12.2191 2.97 12.5791L10.46 17.0691C11.41 17.6391 12.59 17.6391 13.54 17.0691L21.03 12.5791C21.63 12.2191 22 11.5691 22 10.8691Z"
					fill="currentColor"
				/>
			</g>
		</svg>
	);
};

export default OpenRateIcon;
