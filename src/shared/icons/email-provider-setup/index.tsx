import { IconProps } from '@doublescale/config';

const EmailProviderSetupIcon: React.FC<IconProps> = ({
	width = 24,
	height = 24,
	color = 'currentColor',
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
				d="M17.727 6.30348L7.15947 16.871C6.76341 17.2671 6.0973 17.2131 5.77326 16.745C4.6571 15.1158 4 13.1895 4 11.2092V7.25762C4 6.51951 4.55808 5.68239 5.24218 5.40335L10.2559 3.35105C11.3901 2.88298 12.6503 2.88298 13.7844 3.35105L17.421 4.83626C18.0241 5.07929 18.1771 5.85341 17.727 6.30348Z"
				fill={color}
			/>
			<path
				d="M18.5729 7.53636C19.158 7.04129 20.0491 7.46434 20.0491 8.22945V11.2089C20.0491 15.6105 16.8536 19.7331 12.488 20.9393C12.191 21.0203 11.8669 21.0203 11.5609 20.9393C10.2827 20.5792 9.09452 19.9761 8.07737 19.184C7.64531 18.851 7.60031 18.2209 7.97837 17.8338C9.94065 15.8265 15.6835 9.97571 18.5729 7.53636Z"
				fill={color}
			/>
		</svg>
	);
};

export default EmailProviderSetupIcon;
