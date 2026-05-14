import { IconProps } from '@doublescale/config';

const ButtonBlockIcon: React.FC<IconProps> = ({ width = 40, height = 40 }) => {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width={width}
			height={height}
			viewBox="0 0 40 40"
			fill="none"
		>
			<path
				fill-rule="evenodd"
				clip-rule="evenodd"
				d="M32.9206 11.6665C33.5146 11.6665 34.0344 11.8893 34.4056 12.2605C34.7769 12.6318 35.0004 13.1515 35.0004 13.7455V24.5868C35.0004 25.1065 34.7769 25.7005 34.4056 26.0718C34.0344 26.443 33.5146 26.6665 32.9206 26.6665H7.07937C6.48537 26.6665 5.96562 26.4438 5.59437 26.0718C5.22312 25.7005 5.00037 25.1808 5.00037 24.5868V13.7463C5.00037 13.2265 5.22237 12.6325 5.59437 12.2613C5.96562 11.89 6.48537 11.6673 7.07937 11.6673H32.9949L32.9206 11.6665Z"
				fill="currentColor"
				fill-opacity="0.1"
			/>
			<path
				d="M11.0004 19.1665H29.0004"
				stroke="currentColor"
				stroke-width="3.33333"
				stroke-linecap="round"
				stroke-linejoin="round"
			/>
		</svg>
	);
};

export default ButtonBlockIcon;
