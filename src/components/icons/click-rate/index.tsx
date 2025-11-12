import { IconProps } from '@quillcrm/config';

const ClickRateIcon: React.FC<IconProps> = ({ width = 24, height = 24 }) => {
	return (
		<svg
			width={width}
			height={height}
			viewBox="0 0 24 24"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
		>
			<mask
				id="mask0_31914_4239"
				style={{ maskType: 'luminance' }}
				maskUnits="userSpaceOnUse"
				x="0"
				y="0"
				width="24"
				height="24"
			>
				<path d="M0 0H24V24H0V0Z" fill="white" />
			</mask>
			<g mask="url(#mask0_31914_4239)">
				<path
					d="M15.2912 16.8216L12.8424 16.3272L11.1706 18.4934C10.8645 18.8819 10.3701 19.0702 9.88737 18.9761C9.40468 18.8819 9.01618 18.5169 8.8868 18.046L6.04954 7.63885C5.92004 7.19148 6.04943 6.7088 6.37907 6.37916C6.7087 6.04952 7.19139 5.92002 7.63876 6.04952L18.046 8.88676C18.5169 9.01626 18.8819 9.40476 18.9761 9.88748C19.0702 10.3702 18.8819 10.8646 18.4934 11.1707L16.3272 12.8424L16.8216 15.2912C16.904 15.715 16.7745 16.1624 16.4684 16.4685C16.1624 16.7746 15.715 16.9041 15.2912 16.8216Z"
					fill="currentColor"
				/>
			</g>
		</svg>
	);
};

export default ClickRateIcon;
