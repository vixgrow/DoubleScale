import { IconProps } from '@doublescale/config';

const SureCartIcon: React.FC<IconProps> = ({ width = 24, height = 24}) => {
	return (
		<svg xmlns="http://www.w3.org/2000/svg" width={width} height={height} viewBox="0 0 24 24" fill="none">
  <path d="M12 3C7.032 3 3 7.032 3 12C3 16.968 7.032 21 12 21C16.968 21 21 16.968 21 12C21 7.032 16.968 3 12 3ZM12 19.2C8.031 19.2 4.8 15.969 4.8 12C4.8 8.031 8.031 4.8 12 4.8C15.969 4.8 19.2 8.031 19.2 12C19.2 15.969 15.969 19.2 12 19.2Z" 
  fill="currentColor"/>
  <path d="M12.4496 7.5H11.0996V12.9L15.8246 15.735L16.4996 14.628L12.4496 12.225V7.5Z" fill="currentColor"/>
  <path d="M7.5 10.6499L9.75 12.8999L7.5 15.1499" stroke="#08A4A8" stroke-width="1.35" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M9.2998 12.8999H14.6998" stroke="currentColor" stroke-width="1.35" stroke-linecap="round"/>
</svg>
	);
};

export default SureCartIcon;
