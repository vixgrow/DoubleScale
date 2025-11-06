import { IconProps } from '@quillcrm/config';

const TotalOrdersIcon: React.FC<IconProps> = ({ width = 40, height = 40 }) => {
	return (
		<svg
			width={width}
			height={height}
			viewBox="0 0 40 40"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
		>
			<g clip-path="url(#clip0_31398_167777)">
				<mask
					id="mask0_31398_167777"
					style={{ maskType: 'luminance' }}
					maskUnits="userSpaceOnUse"
					x="0"
					y="0"
					width="40"
					height="40"
				>
					<path d="M40 0H0V40H40V0Z" fill="white" />
				</mask>
				<g mask="url(#mask0_31398_167777)">
					<path
						opacity="0.4"
						d="M4.43372 11.5002L4.15039 11.3335L18.517 3.3335L32.8837 11.3335L32.517 11.5502L18.517 19.6501L4.43372 11.5002Z"
						fill="currentColor"
					/>
					<path
						opacity="0.4"
						d="M3.33398 13.7661L17.2673 21.8327V36.3327L3.33398 28.5661V13.7661Z"
						fill="currentColor"
					/>
					<path
						opacity="0.4"
						d="M24.5518 33.1827L21.9518 31.7327L24.5518 30.2827C26.7352 29.0494 28.5352 27.2661 29.7518 25.0827L31.2018 22.4827L32.6518 25.0827C32.9685 25.6494 33.3185 26.1827 33.7185 26.6827V13.7661L19.7852 21.8327V36.3327L24.9518 33.4494C24.8185 33.3661 24.6852 33.2661 24.5518 33.1827Z"
						fill="currentColor"
					/>
					<path
						d="M31.2005 37.5666C29.8339 35.1166 27.8172 33.0999 25.3672 31.7332C27.8172 30.3666 29.8339 28.3499 31.2005 25.8999C32.5672 28.3499 34.5839 30.3666 37.0339 31.7332C34.5839 33.0999 32.5672 35.1166 31.2005 37.5666Z"
						fill="currentColor"
					/>
				</g>
			</g>
		</svg>
	);
};

export default TotalOrdersIcon;
