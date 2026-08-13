import { IconProps } from '@doublescale/config';

const GradientRemoveTagIcon: React.FC<IconProps> = ({
	width = 24,
	height = 24,
}) => {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width={width}
			height={height}
			viewBox="0 0 24 24"
			fill="none"
		>
			<path
				opacity="0.4"
				d="M16.1461 3H7.47288C5.5655 3 4 4.5655 4 6.47288V19.1498C4 20.7693 5.16063 21.453 6.58217 20.6703L10.9728 18.2321C11.4406 17.9712 12.1964 17.9712 12.6552 18.2321L17.0458 20.6703C18.4673 21.462 19.628 20.7783 19.628 19.1498V6.47288C19.619 4.5655 18.0625 3 16.1461 3Z"
				fill="url(#gradient-remove-tag-paint0)"
			/>
			<path
				d="M7.62581 10.4731C7.4048 10.4731 7.19284 10.5609 7.03656 10.7172C6.88028 10.8735 6.79248 11.0855 6.79248 11.3065C6.79248 11.5275 6.88028 11.7395 7.03656 11.8957C7.19284 12.052 7.4048 12.1398 7.62581 12.1398H15.9591C16.1802 12.1398 16.3921 12.052 16.5484 11.8957C16.7047 11.7395 16.7925 11.5275 16.7925 11.3065C16.7925 11.0855 16.7047 10.8735 16.5484 10.7172C16.3921 10.5609 16.1802 10.4731 15.9591 10.4731H7.62581Z"
				fill="url(#gradient-remove-tag-paint1)"
			/>
			<defs>
				<linearGradient
					id="gradient-remove-tag-paint0"
					x1="4"
					y1="12"
					x2="19.628"
					y2="12"
					gradientUnits="userSpaceOnUse"
				>
					<stop stopColor="#3A3A99" />
					<stop offset="1" stopColor="#1B1145" />
				</linearGradient>
				<linearGradient
					id="gradient-remove-tag-paint1"
					x1="6.79248"
					y1="11.3065"
					x2="16.7925"
					y2="11.3065"
					gradientUnits="userSpaceOnUse"
				>
					<stop stopColor="#3A3A99" />
					<stop offset="1" stopColor="#1B1145" />
				</linearGradient>
			</defs>
		</svg>
	);
};

export default GradientRemoveTagIcon;
