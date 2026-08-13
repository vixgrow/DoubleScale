import { IconProps } from '@doublescale/config';

const GradientAddTagIcon: React.FC<IconProps> = ({
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
				fill="url(#gradient-add-tag-paint0)"
			/>
			<path
				d="M15.1609 10.6749H12.4241V7.9381C12.4241 7.59283 12.1377 7.30652 11.7925 7.30652C11.4472 7.30652 11.1609 7.59283 11.1609 7.9381V10.6749H8.42406C8.0788 10.6749 7.79248 10.9613 7.79248 11.3065C7.79248 11.6518 8.0788 11.9381 8.42406 11.9381H11.1609V14.6749C11.1609 15.0202 11.4472 15.3065 11.7925 15.3065C12.1377 15.3065 12.4241 15.0202 12.4241 14.6749V11.9381H15.1609C15.5062 11.9381 15.7925 11.6518 15.7925 11.3065C15.7925 10.9613 15.5062 10.6749 15.1609 10.6749Z"
				fill="url(#gradient-add-tag-paint1)"
			/>
			<defs>
				<linearGradient
					id="gradient-add-tag-paint0"
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
					id="gradient-add-tag-paint1"
					x1="7.79248"
					y1="11.3065"
					x2="15.7925"
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

export default GradientAddTagIcon;
