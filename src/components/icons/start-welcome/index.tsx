import { IconProps } from '@doublescale/config';

const WelcomeStart: React.FC<IconProps> = ({ width = 21, height = 21 }) => {
	return (
		<svg xmlns="http://www.w3.org/2000/svg" width={width} height={height} viewBox="0 0 21 20" fill="none">
          <path opacity="0.4" d="M18.9999 6.01002L12.4499 0.770018C11.1699 -0.249982 9.16993 -0.259982 7.89989 0.760018L1.34988 6.01002C0.409885 6.76002 -0.160115 8.26 0.0398848 9.44L1.29988 16.98C1.58988 18.67 3.15988 20 4.86988 20H15.4699C17.1599 20 18.7599 18.64 19.0499 16.97L20.3099 9.43C20.4899 8.26 19.9199 6.76002 18.9999 6.01002Z" fill="currentColor"/>
          <path d="M10.1699 16.75C9.75992 16.75 9.41992 16.41 9.41992 16V13C9.41992 12.59 9.75992 12.25 10.1699 12.25C10.5799 12.25 10.9199 12.59 10.9199 13V16C10.9199 16.41 10.5799 16.75 10.1699 16.75Z" fill="currentColor"/>
</svg>
	);
};

export default WelcomeStart;