import { IconProps } from '@doublescale/config';

const ButtonsIcon: React.FC<IconProps> = ({ width = 32, height = 32 }) => {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width={width}
			height={height}
			viewBox="0 0 32 32"
			fill="none"
			aria-hidden
		>
			<path
				fillRule="evenodd"
				clipRule="evenodd"
				d="M26.3364 9.33337C26.8116 9.33337 27.2274 9.51157 27.5244 9.80857C27.8214 10.1056 28.0002 10.5214 28.0002 10.9966V19.6696C28.0002 20.0854 27.8214 20.5606 27.5244 20.8576C27.2274 21.1546 26.8116 21.3334 26.3364 21.3334H5.66344C5.18824 21.3334 4.77244 21.1552 4.47544 20.8576C4.17844 20.5606 4.00024 20.1448 4.00024 19.6696V10.9972C4.00024 10.5814 4.17784 10.1062 4.47544 9.80917C4.77244 9.51217 5.18824 9.33397 5.66344 9.33397H26.3958L26.3364 9.33337Z"
				fill="currentColor"
				fillOpacity={0.1}
				stroke="currentColor"
				strokeWidth={0.66}
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
			<path
				d="M8.80023 15.3334H23.2002"
				stroke="currentColor"
				strokeWidth={2.66667}
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</svg>
	);
};

export default ButtonsIcon;
