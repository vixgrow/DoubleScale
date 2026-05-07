import { IconProps } from '@doublescale/config';

const TimerBlockIcon: React.FC<IconProps> = ({ width = 24, height = 24 }) => {
	return (
		<svg
			width={width}
			height={height}
			viewBox="0 0 28 28"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
		>
			<path
				d="M21.0007 6.41667L22.1673 5.25M5.83398 5.25L7.00065 6.41667"
				stroke="currentColor"
				stroke-width="1.5"
				stroke-linecap="round"
				stroke-linejoin="round"
			/>
			<circle
				cx="14"
				cy="15.167"
				r="10.5"
				stroke="currentColor"
				stroke-width="1.5"
				stroke-linecap="round"
			/>
			<path
				d="M14 11.084V15.7507L16.3333 18.084"
				stroke="currentColor"
				stroke-width="1.5"
				stroke-linecap="round"
				stroke-linejoin="round"
			/>
			<path
				d="M14 4.08398V2.33398"
				stroke="currentColor"
				stroke-width="1.5"
				stroke-linecap="round"
				stroke-linejoin="round"
			/>
			<path
				d="M11.666 2.33398H16.3327"
				stroke="currentColor"
				stroke-width="1.5"
				stroke-linecap="round"
				stroke-linejoin="round"
			/>
		</svg>
	);
};

export default TimerBlockIcon;
