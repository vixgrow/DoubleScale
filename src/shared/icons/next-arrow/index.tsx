import { IconProps } from '@doublescale/config';

const NextArrowIcon: React.FC<IconProps> = ({ width = 7, height = 12 }) => {
	return (
		<svg xmlns="http://www.w3.org/2000/svg" width={width} height={height} viewBox="0 0 7 12" fill="none">
  <path d="M0.75 0.75L5.75 5.75L0.75 10.75" stroke="#09090B" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
	);
};

export default NextArrowIcon;
