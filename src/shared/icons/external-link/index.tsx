import { IconProps } from '@doublescale/config';

const ExternalLinkIcon: React.FC<IconProps> = ({ width = 24, height = 24 }) => {
	return (
		<svg xmlns="http://www.w3.org/2000/svg" width={width} height={height} viewBox="0 0 24 24" fill="none">
  <g clipPath="url(#clip0_31_10286)">
    <path d="M17.0272 6.05414L9.83673 6.05413C9.35066 6.05413 8.94839 6.45639 8.94839 6.94247C8.94839 7.42854 9.35066 7.8308 9.83673 7.8308L14.8818 7.83081L6.34206 16.3706C5.99846 16.7142 5.99846 17.284 6.34206 17.6276C6.68566 17.9712 7.25554 17.9712 7.59914 17.6276L16.1389 9.08789L16.1389 14.133C16.1389 14.619 16.5412 15.0213 17.0272 15.0213C17.2786 15.0213 17.4965 14.9207 17.6558 14.7615C17.815 14.6023 17.9156 14.3844 17.9156 14.133L17.9156 6.94247C17.9156 6.70782 17.8234 6.48154 17.6558 6.31393C17.4882 6.14632 17.2619 6.05414 17.0272 6.05414Z" fill="#6549CA"/>
  </g>
  <defs>
    <clipPath id="clip0_31_10286">
      <rect width="24" height="24" fill="white"/>
    </clipPath>
  </defs>
</svg>
	);
};

export default ExternalLinkIcon;
