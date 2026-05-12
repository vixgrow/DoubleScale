import { IconProps } from '@doublescale/config';

const EmailTestIcon: React.FC<IconProps> = ({ width = 48, height = 48 }) => {
	return (
		<svg xmlns="http://www.w3.org/2000/svg" width={width} height={height} viewBox="0 0 48 48" fill="none">
  <g clip-path="url(#clip0_139_32258)">
    <path opacity="0.4" d="M34 41H14C8 41 4 38 4 31V17C4 10 8 7 14 7H34C40 7 44 10 44 17V31C44 38 40 41 34 41Z" fill="#CB5301"/>
    <path d="M24 25.7399C22.32 25.7399 20.6201 25.2199 19.3201 24.1599L13.06 19.1599C12.42 18.6399 12.3001 17.6999 12.8201 17.0599C13.3401 16.4199 14.2801 16.2999 14.9201 16.8199L21.18 21.8199C22.7 23.0399 25.28 23.0399 26.8 21.8199L33.06 16.8199C33.7 16.2999 34.66 16.3999 35.16 17.0599C35.68 17.6999 35.5801 18.6599 34.9201 19.1599L28.66 24.1599C27.38 25.2199 25.68 25.7399 24 25.7399Z" fill="#CB5301"/>
  </g>
  <defs>
    <clipPath id="clip0_139_32258">
      <rect width="48" height="48" fill="white"/>
    </clipPath>
  </defs>
</svg>
	);
};

export default EmailTestIcon;