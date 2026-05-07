import { IconProps } from '@doublescale/config';

const MyTemplatesIcon: React.FC<IconProps> = ({ width = 32, height = 32 }) => {
	return (
		<svg
			width={width}
			height={height}
			viewBox="0 0 32 32"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
		>
			<mask
				id="mask0_32002_16336"
				maskUnits="userSpaceOnUse"
				x="0"
				y="0"
				width={width}
				height={height}
			>
				<path d="M32 0H0V32H32V0Z" fill="white" />
			</mask>
			<g mask="url(#mask0_32002_16336)">
				<path
					fill-rule="evenodd"
					clip-rule="evenodd"
					d="M29.3346 2.66699H2.66797V10.5603H13.043H29.3346V2.66699ZM12.043 29.3337V19.707V12.5603H2.66797V29.3337H12.043Z"
					fill="currentColor"
				/>
				<g opacity="0.4">
					<path
						d="M29.3347 12.5598H14.043V18.7065H29.3347V12.5598Z"
						fill="currentColor"
					/>
					<path
						d="M29.3347 20.707H14.043V29.3337H29.3347V20.707Z"
						fill="currentColor"
					/>
				</g>
			</g>
		</svg>
	);
};

export default MyTemplatesIcon;
